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
            throw new Error('JIRA configuration is incomplete. Please check JIRA_HOST, JIRA_USER, and JIRA_TOKEN environment variables.');
        }
    }

    private getAuthHeader(): string {
        const credentials = Buffer.from(`${this.config.user}:${this.config.token}`).toString('base64');
        return `Basic ${credentials}`;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${this.config.host}${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': this.getAuthHeader(),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`JIRA API error (${response.status}): ${errorText}`);
        }

        return response;
    }

    async getIssue(issueKey: string): Promise<JiraTask> {
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

        return data as JiraTask;
    }

    async createIssue(taskData: {
        summary: string;
        description: string;
        estimation?: string; // customfield_23911
        storyPoints?: number; // customfield_11212
    }): Promise<{ id: string; key: string; self: string }> {
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
        }
        if (taskData.storyPoints !== undefined) {
            payload.fields.customfield_11212 = taskData.storyPoints;
        }

        const response = await this.makeRequest('/rest/api/2/issue', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        return result;
    }

    async linkIssues(parentKey: string, childKey: string): Promise<void> {
        const payload = {
            type: { name: 'Inclusion' },
            inwardIssue: { key: parentKey },
            outwardIssue: { key: childKey },
        };

        await this.makeRequest('/rest/api/2/issueLink', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
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
