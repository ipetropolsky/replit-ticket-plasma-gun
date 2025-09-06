import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
});

export const decompositionSessions = pgTable("decomposition_sessions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    jiraKey: text("jira_key").notNull(),
    jiraTaskData: jsonb("jira_task_data"),
    decompositionText: text("decomposition_text"),
    parsedBlocks: jsonb("parsed_blocks"),
    totalEstimation: integer("total_estimation"), // in story points * 10 (to avoid decimals)
    additionalRiskPercent: integer("additional_risk_percent").default(20),
    createdTasks: jsonb("created_tasks"),
    status: text("status").notNull().default("pending"), // pending, processing, completed, error
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
});

export const insertDecompositionSessionSchema = createInsertSchema(decompositionSessions).pick({
    jiraKey: true,
    jiraTaskData: true,
    decompositionText: true,
    parsedBlocks: true,
    totalEstimation: true,
    additionalRiskPercent: true,
    createdTasks: true,
    status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DecompositionSession = typeof decompositionSessions.$inferSelect;
export type InsertDecompositionSession = z.infer<typeof insertDecompositionSessionSchema>;

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
