import { JiraTask } from 'shared/schema';

interface JiraConfig {
    host: string;
    user: string;
    token: string;
}

export class JiraService {
    private config: JiraConfig;

    constructor() {
        this.config = {
            host: process.env.JIRA_HOST || '',
            user: process.env.JIRA_USER || '',
            token: process.env.JIRA_TOKEN || '',
        };

        if (!this.config.host || !this.config.user || !this.config.token) {
            console.error('[JIRA] Configuration check failed:');
            console.error(`[JIRA] JIRA_HOST: ${this.config.host ? '✓ set' : '✗ missing'}`);
            console.error(`[JIRA] JIRA_USER: ${this.config.user ? '✓ set' : '✗ missing'}`);
            console.error(`[JIRA] JIRA_TOKEN: ${this.config.token ? '✓ set' : '✗ missing'}`);
            throw new Error('JIRA configuration is incomplete. Please check JIRA_HOST, JIRA_USER, and JIRA_TOKEN environment variables.');
        }
        
        console.log(`[JIRA] Initialized with host: ${this.config.host}`);
        console.log(`[JIRA] User: ${this.config.user}`);
        console.log(`[JIRA] Token: ${'*'.repeat(Math.min(this.config.token.length, 10))}`);
    }

    private getAuthHeader(): string {
        const credentials = Buffer.from(`${this.config.user}:${this.config.token}`).toString('base64');
        return `Basic ${credentials}`;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${this.config.host}${endpoint}`;
        const method = options.method || 'GET';
        
        console.log(`[JIRA] ${method} ${url}`);
        if (options.body) {
            console.log(`[JIRA] Request body:`, JSON.parse(options.body as string));
        }
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': this.getAuthHeader(),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        console.log(`[JIRA] Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[JIRA] Error response:`, errorText);
            throw new Error(`JIRA API error (${response.status}): ${errorText}`);
        }

        return response;
    }

    async getIssue(issueKey: string): Promise<JiraTask> {
        console.log(`[JIRA] Fetching issue: ${issueKey}`);
        
        const fields = [
            'summary',
            'description', 
            'customfield_36836', // Декомпозиция
            'customfield_24213', // Ссылки на макеты
            'status',
            'assignee',
            'priority'
        ].join(',');

        const response = await this.makeRequest(`/rest/api/2/issue/${issueKey}?fields=${fields}`);
        const data = await response.json();

        console.log(`[JIRA] Successfully fetched issue ${issueKey}: ${data.fields?.summary || 'No summary'}`);
        return data as JiraTask;
    }

    async createIssue(taskData: {
        summary: string;
        description: string;
        estimation?: string; // customfield_23911
        storyPoints?: number; // customfield_11212
    }): Promise<{ id: string; key: string; self: string }> {
        console.log(`[JIRA] Creating single issue: ${taskData.summary}`);
        
        const payload: any = {
            fields: {
                project: { key: 'HH' },
                issuetype: { id: '3' }, // Task type
                summary: taskData.summary,
                description: taskData.description,
            }
        };

        // Add custom fields if provided
        if (taskData.estimation) {
            payload.fields.customfield_23911 = taskData.estimation;
            console.log(`[JIRA] Adding estimation: ${taskData.estimation}`);
        }
        if (taskData.storyPoints !== undefined) {
            payload.fields.customfield_11212 = taskData.storyPoints;
            console.log(`[JIRA] Adding story points: ${taskData.storyPoints}`);
        }

        const response = await this.makeRequest('/rest/api/2/issue', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log(`[JIRA] Successfully created issue: ${result.key}`);
        return result;
    }

    async createBulkIssues(tasks: Array<{
        summary: string;
        description: string;
        estimation?: string;
        storyPoints?: number;
    }>): Promise<{
        issues: Array<{ id: string; key: string; self: string }>;
        errors: Array<{ status: number; elementErrors: any; failedElementNumber: number }>;
    }> {
        console.log(`[JIRA] Creating ${tasks.length} issues in bulk`);
        tasks.forEach((task, i) => {
            console.log(`[JIRA] Task ${i + 1}: ${task.summary} (${task.estimation || 'no estimation'}, ${task.storyPoints || 'no SP'} SP)`);
        });
        
        const issueUpdates = tasks.map((taskData) => {
            const fields: any = {
                project: { key: 'HH' },
                issuetype: { id: '3' }, // Task type
                summary: taskData.summary,
                description: taskData.description,
            };

            // Add custom fields if provided
            if (taskData.estimation) {
                fields.customfield_23911 = taskData.estimation;
            }
            if (taskData.storyPoints !== undefined) {
                fields.customfield_11212 = taskData.storyPoints;
            }

            return {
                update: {},
                fields
            };
        });

        const payload = { issueUpdates };

        const response = await this.makeRequest('/rest/api/2/issue/bulk', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.issues) {
            console.log(`[JIRA] Successfully created ${result.issues.length} issues`);
            result.issues.forEach((issue: any) => {
                console.log(`[JIRA] Created: ${issue.key}`);
            });
        }
        
        if (result.errors && result.errors.length > 0) {
            console.error(`[JIRA] ${result.errors.length} errors during bulk creation:`, result.errors);
        }
        
        return result;
    }

    async linkIssues(parentKey: string, childKey: string): Promise<void> {
        console.log(`[JIRA] Linking issues: ${parentKey} -> ${childKey}`);
        
        const payload = {
            type: { name: 'Inclusion' },
            inwardIssue: { key: parentKey },
            outwardIssue: { key: childKey },
        };

        await this.makeRequest('/rest/api/2/issueLink', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        
        console.log(`[JIRA] Successfully linked ${parentKey} -> ${childKey}`);
    }

    static extractKeyFromUrl(input: string): string {
        // If it's already a key format (PROJECT-123), return as is
        if (/^[A-Z]+-\d+$/.test(input.trim())) {
            return input.trim();
        }

        // Extract from URL format
        const urlMatch = input.match(/\/browse\/([A-Z]+-\d+)/);
        if (urlMatch) {
            return urlMatch[1];
        }

        // If no match, assume it's a malformed key and return the input
        return input.trim();
    }
}
