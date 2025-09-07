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

function getServices(options: { needJira?: boolean; needLLM?: boolean; needEstimation?: boolean } = {}) {
    const services: any = {};

    if (options.needJira !== false) {
        if (!jiraService) jiraService = new JiraService();
        services.jiraService = jiraService;
    }

    if (options.needLLM !== false) {
        if (!llmService) llmService = new LLMService();
        services.llmService = llmService;
    }

    if (options.needEstimation !== false) {
        if (!estimationService) estimationService = new EstimationService();
        services.estimationService = estimationService;
    }

    return services;
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

            // Нормализуем текст декомпозиции: убираем %0D и другие проблемные символы
            const rawText = validatedTask.fields.customfield_36836 || '';
            const normalizedText = rawText
                .replace(/%0D/g, '') // Убираем URL-encoded \r
                .replace(/\r\n/g, '\n') // Windows line endings → Unix
                .replace(/\r/g, '\n') // Lone \r → \n
                .replace(/&nbsp;/g, ' ') // HTML entities → пробелы
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .trim();

            console.log('[JIRA] Text normalization:', {
                originalLength: rawText.length,
                normalizedLength: normalizedText.length,
                hasPercent0D: rawText.includes('%0D'),
                hasCarriageReturn: rawText.includes('\r')
            });

            res.json({
                success: true,
                task: validatedTask,
                decompositionText: normalizedText
            });

        } catch (error: any) {
            console.error('JIRA task fetch error:', error);
            res.status(500).json({
                message: error.message || 'Ошибка при получении задачи из JIRA'
            });
        }
    });

    // Parse decomposition text using LLM
    app.post('/api/decomposition/parse', async (req, res) => {
        try {
            const { decompositionText, jiraKey, provider } = req.body;

            if (!decompositionText) {
                return res.status(400).json({
                    message: 'Текст декомпозиции обязателен'
                });
            }

            // Parse using LLM (no JIRA needed for text parsing)
            const { llmService, estimationService } = getServices({ needJira: false });
            const blocks = await llmService.parseDecomposition(decompositionText, provider);

            // Calculate estimations
            const estimation = estimationService.calculateTotalEstimation(blocks);

            // Create session in memory (no database)
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            res.json({
                success: true,
                sessionId,
                blocks,
                estimation,
                mapping: estimationService.getEstimationMapping(),
                availableProviders: llmService.getAvailableProviders()
            });

        } catch (error: any) {
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
            const { sessionId, additionalRiskPercent, tasks, parentJiraKey } = requestData;

            if (!tasks || tasks.length === 0) {
                return res.status(400).json({
                    message: 'Нет задач для создания'
                });
            }

            const { jiraService } = getServices();

            // Prepare tasks for JIRA creation
            const jiraTasks = tasks.map((task: any) => ({
                summary: task.summary || task.title,
                description: task.description || task.content || '',
                estimation: task.estimation,
                storyPoints: task.storyPoints
            }));

            let createdTasks: Array<{ key: string; id: string; summary: string; url: string }> = [];
            const errors: string[] = [];

            try {
                if (jiraTasks.length === 1) {
                    // Single task creation
                    const result = await jiraService.createIssue(jiraTasks[0]);
                    createdTasks.push({
                        key: result.key,
                        id: result.id,
                        summary: jiraTasks[0].summary,
                        url: `${process.env.JIRA_HOST}/browse/${result.key}`
                    });
                } else {
                    // Bulk creation
                    const bulkResult = await jiraService.createBulkIssues(jiraTasks);

                    // Process successful creations
                    createdTasks = bulkResult.issues.map((issue, index) => ({
                        key: issue.key,
                        id: issue.id,
                        summary: jiraTasks[index].summary,
                        url: `${process.env.JIRA_HOST}/browse/${issue.key}`
                    }));

                    // Process errors
                    bulkResult.errors.forEach((error) => {
                        const taskIndex = error.failedElementNumber;
                        const taskTitle = jiraTasks[taskIndex]?.summary || `Задача ${taskIndex + 1}`;
                        errors.push(`Ошибка создания "${taskTitle}": ${JSON.stringify(error.elementErrors)}`);
                    });
                }

                // Link created tasks to parent if provided
                if (parentJiraKey && createdTasks.length > 0) {
                    for (const task of createdTasks) {
                        try {
                            await jiraService.linkIssues(parentJiraKey, task.key);
                        } catch (linkError) {
                            console.warn(`Failed to link ${task.key} to ${parentJiraKey}:`, linkError);
                        }
                    }
                }

            } catch (creationError: any) {
                console.error('JIRA creation error:', creationError);
                errors.push(`Ошибка при создании задач: ${creationError.message}`);
            }

            const response = {
                success: errors.length === 0 && createdTasks.length > 0,
                createdTasks,
                errors
            };

            res.json(response);

        } catch (error: any) {
            console.error('Task creation error:', error);
            res.status(500).json({
                message: error.message || 'Ошибка при создании задач'
            });
        }
    });

    // Get estimation configuration
    app.get('/api/estimation/config', (req, res) => {
        try {
            const { estimationService } = getServices();
            const mapping = estimationService.getEstimationMapping();
            res.json({
                success: true,
                mapping
            });
        } catch (error: any) {
            res.status(500).json({
                message: error.message || 'Ошибка получения конфигурации'
            });
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}
