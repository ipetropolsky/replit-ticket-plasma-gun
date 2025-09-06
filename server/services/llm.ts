import { DecompositionBlock } from 'shared/schema';

export class LLMService {
    private useTestMode: boolean;

    constructor() {
        // Check if we have API keys for external LLM services
        const openAIKey = process.env.OPENAI_TOKEN || process.env.OPENAI_API_KEY;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        
        // Use test mode if no API keys are available
        this.useTestMode = !openAIKey && !anthropicKey;
        
        if (this.useTestMode) {
            console.log('Using test mode for LLM service (no API keys found)');
        }
    }

    async parseDecomposition(decompositionText: string): Promise<DecompositionBlock[]> {
        if (this.useTestMode) {
            return this.parseDecompositionTest(decompositionText);
        }
        
        // TODO: Add real LLM implementation when API keys are available
        throw new Error('LLM service not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    }

    private parseDecompositionTest(decompositionText: string): DecompositionBlock[] {
        // Simple test parser that identifies task-like lines
        const lines = decompositionText.split('\n');
        const blocks: DecompositionBlock[] = [];
        let currentText = '';
        
        // Patterns for different task formats:
        // M [repo] Task name
        // *S+ [xhh] Sidebar*
        // S [frontend] Create component
        const taskPattern = /^(\s*\*?\s*)(XS|S|M|L|XL)(\+)?\s*(\[([^\]]+)\])?\s*(.+?)(\*?\s*)$/i;
        
        for (const line of lines) {
            const taskMatch = line.match(taskPattern);
            
            if (taskMatch) {
                // Add accumulated text as text block if any
                if (currentText.trim()) {
                    blocks.push({
                        type: 'text',
                        content: currentText.trimEnd()
                    });
                    currentText = '';
                }
                
                const [, prefix, estimation, hasRisk, , repository, title, suffix] = taskMatch;
                const estimationSP = this.getEstimationSP(estimation.toUpperCase());
                const riskSP = hasRisk ? this.getEstimationSP('XS') : null;
                
                // Add task block
                blocks.push({
                    type: 'task',
                    content: line,
                    taskInfo: {
                        title: title.trim(),
                        repository: repository || null,
                        estimation: estimation.toUpperCase(),
                        risk: hasRisk ? 'XS' : null,
                        estimationSP,
                        riskSP
                    }
                });
            } else {
                currentText += line + '\n';
            }
        }
        
        // Add remaining text if any
        if (currentText.trim()) {
            blocks.push({
                type: 'text',
                content: currentText.trimEnd()
            });
        }
        
        return blocks;
    }
    
    private getEstimationSP(size: string): number {
        const mapping: Record<string, number> = {
            'XS': 1,
            'S': 2, 
            'M': 3,
            'L': 5,
            'XL': 8
        };
        return mapping[size] || 0;
    }
}