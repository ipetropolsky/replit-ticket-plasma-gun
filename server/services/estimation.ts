import fs from 'fs';
import path from 'path';
import { EstimationMapping, DecompositionBlock } from 'shared/schema';
import { Estimation } from 'shared/types.ts';

const defaultMapping: EstimationMapping = {
    XS: 0.5,
    S: 1,
    M: 2,
    L: 3,
    XL: 5,
};

export class EstimationService {
    private mapping: EstimationMapping = defaultMapping;

    constructor() {
        this.loadMapping();
    }

    private loadMapping(): void {
        try {
            const configPath = path.resolve(process.cwd(), 'config', 'estimation-mapping.json');
            const configFile = fs.readFileSync(configPath, 'utf8');
            this.mapping = JSON.parse(configFile);
        } catch (error) {
            this.mapping = defaultMapping;
        }
    }

    calculateTotalEstimation(blocks: DecompositionBlock[]): Estimation {
        const taskBlocks = blocks.filter(block => block.type === 'task' && block.taskInfo);

        let baseEstimation = 0;
        let risks = 0;
        let taskCount = 0;
        let tasksWithoutEstimation = 0;
        const estimations: string[] = [];
        const riskItems: (string | null)[] = [];

        let baseLLMEstimation = 0;
        let llmRisks = 0;
        let tasksWithLLMEstimation = 0;
        const llmEstimations: string[] = [];
        const llmRiskItems: (string | null)[] = [];

        for (const block of taskBlocks) {
            if (!block.taskInfo) continue;

            taskCount++;

            let hasHumanEstimation = false;
            let hasLLMEstimation = false;

            if (block.taskInfo.estimation && block.taskInfo.estimationSP) {
                baseEstimation += block.taskInfo.estimationSP;
                estimations.push(block.taskInfo.estimation);
                if (block.taskInfo.risk && block.taskInfo.riskSP) {
                    risks += block.taskInfo.riskSP;
                    riskItems.push(block.taskInfo.risk);
                }
                hasHumanEstimation = true;
            }

            if (block.taskInfo.estimationByLLM?.estimation) {
                const llmEstimation = block.taskInfo.estimationByLLM.estimation;
                const llmSP = this.mapping?.[llmEstimation] || 0;
                baseLLMEstimation += llmSP;
                llmEstimations.push(llmEstimation);
                // Если оценка есть только от LLM, добавляем её в общую оценку
                if (!hasHumanEstimation) {
                    baseEstimation += llmSP;
                    estimations.push(llmEstimation);
                }
                hasLLMEstimation = true;
            }

            if (block.taskInfo.estimationByLLM?.risk) {
                const llmRisk = block.taskInfo.estimationByLLM.risk;
                const llmRiskSP = llmRisk ? this.mapping[llmRisk] || 0 : 0;
                llmRisks += llmRiskSP;
                llmRiskItems.push(llmRisk);
                // Если оценка есть только от LLM, добавляем её в общую оценку
                if (!hasHumanEstimation) {
                    risks += llmRiskSP;
                    riskItems.push(llmRisk);
                }
            }

            if (!hasHumanEstimation && hasLLMEstimation) {
                tasksWithLLMEstimation++;
            }

            if (!hasHumanEstimation && !hasLLMEstimation) {
                tasksWithoutEstimation++;
            }
        }

        // Create formula strings
        const estimationCounts = this.countItems(estimations);
        const riskCounts = this.countItems(riskItems);

        const formula = this.createFormula(estimationCounts, baseEstimation);
        const riskFormula = this.createFormula(riskCounts, risks);

        const llmEstimationCounts = this.countItems(llmEstimations);
        const llmRiskCounts = this.countItems(llmRiskItems);
        const llmFormula = this.createFormula(llmEstimationCounts, baseLLMEstimation);
        const llmRiskFormula = this.createFormula(llmRiskCounts, llmRisks);

        return {
            baseEstimation,
            risks,
            taskCount,
            tasksWithoutEstimation,
            tasksWithLLMEstimation,
            formula,
            riskFormula,
            llm: baseLLMEstimation
                ? {
                    baseEstimation: baseLLMEstimation,
                    risks: llmRisks,
                    formula: llmFormula,
                    riskFormula: llmRiskFormula,
                }
                : null
        };
    }

    calculateAdditionalRisks(baseEstimation: number, riskPercent: number): number {
        const additional = (baseEstimation * riskPercent) / 100;
        return Math.round(additional * 2) / 2; // Round to nearest 0.5
    }

    calculateWorkingDays(totalSP: number): number {
        return Math.ceil(totalSP * 2); // 1 SP = 2 working days
    }

    calculateDeliveryDate(workingDays: number): Date {
        const currentDate = new Date();
        let deliveryDate = new Date(currentDate);
        let daysAdded = 0;

        while (daysAdded < workingDays) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);

            // Skip weekends (Saturday = 6, Sunday = 0)
            if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
                daysAdded++;
            }
        }

        return deliveryDate;
    }

    private countItems(items: (string | null)[]): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const item of items) {
            counts[item || 'null'] = (counts[item || 'null'] || 0) + 1;
        }
        return counts;
    }

    private createFormula(counts: Record<string, number>, total: number): string {
        if (Object.keys(counts).length === 0) return `0 SP`;

        const parts = Object.entries(counts)
            .sort(([a], [b]) => {
                const order = { XL: 5, L: 4, M: 3, S: 2, XS: 1 };
                return (order[b as keyof typeof order] || 0) - (order[a as keyof typeof order] || 0);
            })
            .map(([size, count]) => count === 1 ? size : `${count}${size}`);

        return `${parts.join(' + ')} = ${total} SP`;
    }

    getEstimationMapping(): EstimationMapping {
        return { ...this.mapping };
    }
}
