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
            const { decompositionText, jiraKey } = req.body;

            if (!decompositionText) {
                return res.status(400).json({
                    message: 'Текст декомпозиции обязателен'
                });
            }

            // Parse using LLM
            const { llmService, estimationService } = getServices();
            const blocks = await llmService.parseDecomposition(decompositionText);

            // Calculate estimations
            const estimation = estimationService.calculateTotalEstimation(blocks);

            // Create session in memory (no database)
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            res.json({
                success: true,
                sessionId,
                blocks,
                estimation,
                mapping: estimationService.getEstimationMapping()
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
            const { sessionId, additionalRiskPercent } = requestData;

            // No session storage - return error for now
            // In real implementation, would store session data in memory or cache
            return res.status(501).json({
                message: 'Создание задач временно недоступно - база данных отключена'
            });

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
