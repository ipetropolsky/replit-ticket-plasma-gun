import type { Express } from "express";
import { createServer, type Server } from "http";
import { JiraService } from "./services/jira";
import { LLMService } from "./services/llm";
import { EstimationService } from "./services/estimation";
import { 
    JiraTaskSchema, 
    CreateTaskRequestSchema,
    TaskCreationResponseSchema 
} from "../shared/schema";

// Lazy initialization to avoid credential errors at startup
let jiraService: JiraService | null = null;
let llmService: LLMService | null = null;
let estimationService: EstimationService | null = null;

function getServices() {
    if (!jiraService) jiraService = new JiraService();
    if (!llmService) llmService = new LLMService();
    if (!estimationService) estimationService = new EstimationService();
    
    return { jiraService, llmService, estimationService };
}

export async function registerRoutes(app: Express): Promise<Server> {

    // Get JIRA task by key or URL
    app.post('/api/jira/task', async (req, res) => {
        try {
            const { input } = req.body;
            
            if (!input) {
                return res.status(400).json({ 
                    message: 'JIRA task key or URL is required' 
                });
            }

            const { jiraService } = getServices();
            const jiraKey = JiraService.extractKeyFromUrl(input);
            const jiraTask = await jiraService.getIssue(jiraKey);

            // Validate the response
            const validatedTask = JiraTaskSchema.parse(jiraTask);

            // Check if decomposition field exists
            if (!validatedTask.fields.customfield_36836) {
                return res.status(400).json({
                    message: 'Поле "Декомпозиция" (customfield_36836) не заполнено в задаче. Пожалуйста, заполните это поле для продолжения.',
                    example: 'Пример заполнения:\n\nh2. Общее описание\nОписание задачи...\n\nh2. M [repo] Название подзадачи\n- Требование 1\n- Требование 2'
                });
            }

            res.json({
                success: true,
                task: validatedTask,
                decompositionText: validatedTask.fields.customfield_36836
            });

        } catch (error) {
            console.error('JIRA task fetch error:', error);
            res.status(500).json({
                message: error.message || 'Ошибка при получении задачи из JIRA'
            });
        }
    });

    // Parse decomposition text using LLM
    app.post('/api/decomposition/parse', async (req, res) => {
        try {
            const { decompositionText, jiraKey } = req.body;

            if (!decompositionText) {
                return res.status(400).json({
                    message: 'Текст декомпозиции обязателен'
                });
            }

            // Parse using LLM
            const blocks = await llmService.parseDecomposition(decompositionText);

            // Calculate estimations
            const estimation = estimationService.calculateTotalEstimation(blocks);

            // Create session record
            const session = await storage.createDecompositionSession({
                jiraKey: jiraKey || '',
                decompositionText,
                parsedBlocks: blocks,
                totalEstimation: Math.round((estimation.baseEstimation + estimation.risks) * 10),
                additionalRiskPercent: 20,
                status: 'completed'
            });

            res.json({
                success: true,
                sessionId: session.id,
                blocks,
                estimation,
                mapping: estimationService.getEstimationMapping()
            });

        } catch (error) {
            console.error('Decomposition parsing error:', error);
            res.status(500).json({
                message: error.message || 'Ошибка при разборе декомпозиции'
            });
        }
    });

    // Create JIRA tasks
    app.post('/api/jira/create-tasks', async (req, res) => {
        try {
            const requestData = CreateTaskRequestSchema.parse(req.body);
            const { sessionId, additionalRiskPercent } = requestData;

            const session = await storage.getDecompositionSession(sessionId);
            if (!session || !session.parsedBlocks) {
                return res.status(404).json({
                    message: 'Сессия декомпозиции не найдена'
                });
            }

            const blocks = session.parsedBlocks as any[];
            const taskBlocks = blocks.filter(block => block.type === 'task' && block.taskInfo);

            const createdTasks = [];
            const errors = [];

            for (const block of taskBlocks) {
                try {
                    const taskInfo = block.taskInfo;
                    const repository = taskInfo.repository ? `[${taskInfo.repository}] ` : '';
                    const summary = `${repository}${taskInfo.title}`;

                    const createdTask = await jiraService.createIssue({
                        summary,
                        description: block.content,
                        estimation: taskInfo.estimation,
                        storyPoints: taskInfo.estimationSP
                    });

                    // Link to parent task if we have the original JIRA key
                    if (session.jiraKey) {
                        try {
                            await jiraService.linkIssues(session.jiraKey, createdTask.key);
                        } catch (linkError) {
                            console.warn(`Failed to link ${createdTask.key} to ${session.jiraKey}:`, linkError);
                        }
                    }

                    createdTasks.push({
                        key: createdTask.key,
                        id: createdTask.id,
                        summary,
                        url: `${process.env.JIRA_HOST}/browse/${createdTask.key}`
                    });

                } catch (error) {
                    console.error(`Failed to create task:`, error);
                    errors.push(`Ошибка создания задачи "${block.taskInfo.title}": ${error.message}`);
                }
            }

            // Update session with created tasks
            await storage.updateDecompositionSession(sessionId, {
                createdTasks,
                additionalRiskPercent,
                status: errors.length > 0 ? 'partial_error' : 'completed'
            });

            const response: TaskCreationResponseSchema['_type'] = {
                success: errors.length === 0,
                createdTasks,
                errors
            };

            res.json(response);

        } catch (error) {
            console.error('Task creation error:', error);
            res.status(500).json({
                message: error.message || 'Ошибка при создании задач'
            });
        }
    });

    // Get estimation configuration
    app.get('/api/estimation/config', (req, res) => {
        try {
            const mapping = estimationService.getEstimationMapping();
            res.json({
                success: true,
                mapping
            });
        } catch (error) {
            res.status(500).json({
                message: error.message || 'Ошибка получения конфигурации'
            });
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}
