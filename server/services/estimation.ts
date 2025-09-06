import fs from 'fs';
import path from 'path';
import { EstimationMapping, DecompositionBlock } from 'shared/schema';

export class EstimationService {
    private mapping: EstimationMapping;

    constructor() {
        this.loadMapping();
    }

    private loadMapping(): void {
        try {
            const configPath = path.resolve(process.cwd(), 'config', 'estimation-mapping.json');
            const configFile = fs.readFileSync(configPath, 'utf8');
            this.mapping = JSON.parse(configFile);
        } catch (error) {
            // Default mapping if config file is not found
            this.mapping = {
                XS: 0.5,
                S: 1,
                M: 2,
            };
        }
    }

    calculateTotalEstimation(blocks: DecompositionBlock[]): {
        baseEstimation: number;
        risks: number;
        taskCount: number;
        formula: string;
        riskFormula: string;
    } {
        const taskBlocks = blocks.filter(block => block.type === 'task' && block.taskInfo);
        
        let baseEstimation = 0;
        let risks = 0;
        let taskCount = 0;
        const estimations: string[] = [];
        const riskItems: string[] = [];

        for (const block of taskBlocks) {
            if (!block.taskInfo) continue;
            
            taskCount++;
            
            if (block.taskInfo.estimation && block.taskInfo.estimationSP) {
                baseEstimation += block.taskInfo.estimationSP;
                estimations.push(block.taskInfo.estimation);
            }
            
            if (block.taskInfo.risk && block.taskInfo.riskSP) {
                risks += block.taskInfo.riskSP;
                riskItems.push(block.taskInfo.risk);
            }
        }

        // Create formula strings
        const estimationCounts = this.countItems(estimations);
        const riskCounts = this.countItems(riskItems);

        const formula = this.createFormula(estimationCounts, baseEstimation);
        const riskFormula = this.createFormula(riskCounts, risks);

        return {
            baseEstimation,
            risks,
            taskCount,
            formula,
            riskFormula,
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

    private countItems(items: string[]): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const item of items) {
            counts[item] = (counts[item] || 0) + 1;
        }
        return counts;
    }

    private createFormula(counts: Record<string, number>, total: number): string {
        if (Object.keys(counts).length === 0) return `0 SP`;

        const parts = Object.entries(counts)
            .sort(([a], [b]) => {
                const order = { M: 3, S: 2, XS: 1 };
                return (order[b as keyof typeof order] || 0) - (order[a as keyof typeof order] || 0);
            })
            .map(([size, count]) => count === 1 ? size : `${count}${size}`);

        return `${parts.join(' + ')} = ${total} SP`;
    }

    getEstimationMapping(): EstimationMapping {
        return { ...this.mapping };
    }
}
