import { z } from "zod";

// API Types
export const JiraTaskSchema = z.object({
    key: z.string(),
    id: z.string(),
    fields: z.object({
        summary: z.string(),
        description: z.string().nullable().optional(),
        customfield_36836: z.string().nullable().optional(), // Декомпозиция
        customfield_24213: z.string().nullable().optional(), // Ссылки на макеты
        customfield_23613: z.string().nullable().optional(), // Оценка в майках PORTFOLIO
        customfield_23911: z.object({ id: z.string() }).nullable().optional(), // Оценка в майках HH
        customfield_11212: z.number().nullable().optional(), // Story Points
        project: z.object({
            key: z.string(),
        }).optional(),
        issuetype: z.object({
            id: z.string(),
        }).optional(),
        status: z.object({
            name: z.string(),
        }).optional(),
        assignee: z.object({
            displayName: z.string(),
        }).optional(),
        priority: z.object({
            name: z.string(),
        }).optional(),
    }),
    renderedFields: z.object({
        description: z.string().nullable().optional(), // Rendered decomposition
        customfield_36836: z.string().nullable().optional(), // Rendered decomposition
    })
});

export const DecompositionBlockSchema = z.object({
    type: z.enum(["text", "task"]),
    content: z.string(),
    taskInfo: z.object({
        title: z.string(),
        repository: z.string().nullable(),
        estimation: z.string().nullable(), // XS, S, M, L, XL
        risk: z.string().nullable(), // XS, S, M, L
        estimationSP: z.number().nullable(),
        riskSP: z.number().nullable(),
    }).nullable(),
});

export const EstimationMappingSchema = z.record(z.string(), z.number());

export const CreateTaskRequestSchema = z.object({
    sessionId: z.string(),
    additionalRiskPercent: z.number().min(0).max(100),
    tasks: z.array(z.object({
        summary: z.string(),
        description: z.string(),
        estimation: z.string().optional(),
        storyPoints: z.number().optional(),
    })),
    parentJiraKey: z.string().optional(),
});

export const TaskCreationResponseSchema = z.object({
    success: z.boolean(),
    createdTasks: z.array(z.object({
        key: z.string(),
        id: z.string(),
        summary: z.string(),
        url: z.string(),
    })),
    errors: z.array(z.string()),
});

export type JiraTask = z.infer<typeof JiraTaskSchema>;
export type DecompositionBlock = z.infer<typeof DecompositionBlockSchema>;
export type EstimationMapping = z.infer<typeof EstimationMappingSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type TaskCreationResponse = z.infer<typeof TaskCreationResponseSchema>;
