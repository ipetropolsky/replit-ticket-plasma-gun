export interface Estimation {
    baseEstimation: number;
    risks: number;
    taskCount: number;
    tasksWithoutEstimation: number;
    tasksWithLLMEstimation: number;
    formula: string;
    riskFormula: string;
}

export type LLMProvider = 'openai' | 'anthropic' | 'regexp';

export type TShirt = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const TShirtValues: TShirt[] = ['XS', 'S', 'M', 'L', 'XL'];

export type TShirtsToSPMapping = Record<TShirt, number>;
