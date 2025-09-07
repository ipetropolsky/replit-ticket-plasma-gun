import { apiRequest } from './queryClient';
import type {
    JiraTask,
    DecompositionBlock,
    CreateTaskRequest,
    TaskCreationResponse
} from 'shared/schema';
import { Estimation } from 'shared/types.ts';
import { ProviderInfo } from 'src/components/TaskInputForm.tsx';

interface FetchJiraTaskResponse {
    success: boolean;
    task: JiraTask;
    decompositionText: string;
    message?: string;
    example?: string;
}

export interface ParseDecompositionResponse {
    success: boolean;
    sessionId: string;
    blocks: DecompositionBlock[];
    estimation: Estimation;
    mapping: Record<string, number>;
    availableProviders?: ProviderInfo[];
}

interface EstimationConfigResponse {
    success: boolean;
    mapping: Record<string, number>;
}

export const api = {
    async fetchJiraTask(input: string): Promise<FetchJiraTaskResponse> {
        const response = await apiRequest('POST', '/api/jira/task', { input });
        return await response.json();
    },

    async parseDecomposition(decompositionText: string, jiraKey: string, provider?: string): Promise<ParseDecompositionResponse> {
        const response = await apiRequest('POST', '/api/decomposition/parse', {
            decompositionText,
            jiraKey,
            provider,
        });
        return await response.json();
    },

    async createTasks(request: CreateTaskRequest): Promise<TaskCreationResponse> {
        const response = await apiRequest('POST', '/api/jira/create-tasks', request);
        return await response.json();
    },

    async getEstimationConfig(): Promise<EstimationConfigResponse> {
        const response = await apiRequest('GET', '/api/estimation/config');
        return await response.json();
    },
};
