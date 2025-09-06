import OpenAI from 'openai';
import { DecompositionBlock } from '@shared/schema';

export class LLMService {
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_TOKEN || process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_HOST;

        if (!apiKey) {
            throw new Error('OpenAI API key is required. Please set OPENAI_TOKEN or OPENAI_API_KEY environment variable.');
        }

        this.openai = new OpenAI({
            apiKey,
            baseURL: baseURL || undefined,
        });
    }

    async parseDecomposition(decompositionText: string): Promise<DecompositionBlock[]> {
        const prompt = `
Analyze the following JIRA decomposition text and split it into blocks. Each block should be either "text" or "task".

Rules:
1. Task blocks start with a task title in format like "M [repo] Task name" or "*S+ [xhh] Sidebar*"
2. Task titles may include JIRA markdown links like "[base|https://example.com]"
3. Extract estimation (XS, S, M) and risk from the title
4. For combined estimations like "S+" or "M+S", the base is the main estimation, risk is the extra part
5. Repository name is in square brackets [repo]
6. Everything else is text blocks
7. Preserve ALL original content - when blocks are joined, they should recreate the original text exactly

Text to analyze:
${decompositionText}

Respond with JSON in this format:
{
  "blocks": [
    {
      "type": "text|task",
      "content": "exact text from original",
      "taskInfo": {
        "title": "cleaned task name without markdown",
        "repository": "repo name or null",
        "estimation": "XS|S|M or null",
        "risk": "XS|S|M or null",
        "estimationSP": number_or_null,
        "riskSP": number_or_null
      }
    }
  ]
}
`;

        try {
            // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            const response = await this.openai.chat.completions.create({
                model: 'gpt-5',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at parsing JIRA task decomposition text. Always respond with valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0,
            });

            const result = JSON.parse(response.choices[0].message.content || '{"blocks": []}');
            return this.processBlocks(result.blocks);
        } catch (error) {
            throw new Error(`LLM parsing failed: ${error.message}`);
        }
    }

    private processBlocks(blocks: any[]): DecompositionBlock[] {
        const mapping: Record<string, number> = { XS: 0.5, S: 1, M: 2 };

        return blocks.map((block: any) => {
            if (block.type === 'task' && block.taskInfo) {
                // Calculate story points from estimations
                block.taskInfo.estimationSP = block.taskInfo.estimation ? mapping[block.taskInfo.estimation] : null;
                block.taskInfo.riskSP = block.taskInfo.risk ? mapping[block.taskInfo.risk] : null;
            }

            return {
                type: block.type,
                content: block.content,
                taskInfo: block.type === 'task' ? block.taskInfo : null,
            };
        });
    }
}
