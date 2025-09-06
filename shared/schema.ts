import { z } from "zod";

// API Types
export const JiraTaskSchema = z.object({
    key: z.string(),
    id: z.string(),
    fields: z.object({
        summary: z.string(),
        description: z.string().nullable(),
        customfield_36836: z.string().nullable(), // Декомпозиция
        customfield_24213: z.string().nullable(), // Ссылки на макеты
        status: z.object({
            name: z.string(),
        }),
        assignee: z.object({
            displayName: z.string(),
        }).nullable(),
        priority: z.object({
            name: z.string(),
        }).nullable(),
    }),
});

export const DecompositionBlockSchema = z.object({
    type: z.enum(["text", "task"]),
    content: z.string(),
    taskInfo: z.object({
        title: z.string(),
        repository: z.string().nullable(),
        estimation: z.string().nullable(), // XS, S, M
        risk: z.string().nullable(), // XS, S, M
        estimationSP: z.number().nullable(),
        riskSP: z.number().nullable(),
    }).nullable(),
});

export const EstimationMappingSchema = z.record(z.string(), z.number());

export const CreateTaskRequestSchema = z.object({
    sessionId: z.string(),
    additionalRiskPercent: z.number().min(0).max(100),
    tasks: z.array(z.object({
        title: z.string(),
        content: z.string(),
        estimation: z.string().optional(),
        storyPoints: z.number().optional(),
        summary: z.string().optional(),
        description: z.string().optional(),
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
