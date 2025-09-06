import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EstimationSummaryProps {
    estimation: {
        baseEstimation: number;
        risks: number;
        taskCount: number;
        formula: string;
        riskFormula: string;
    } | null;
    mapping: Record<string, number>;
    additionalRiskPercent: number;
}

export default function EstimationSummary({
    estimation,
    mapping,
    additionalRiskPercent,
}: EstimationSummaryProps) {
    const calculateAdditionalRisks = () => {
        if (!estimation) return 0;
        const additional = (estimation.baseEstimation * additionalRiskPercent) / 100;
        return Math.round(additional * 2) / 2; // Round to nearest 0.5
    };

    const calculateTotal = () => {
        if (!estimation) return 0;
        return estimation.baseEstimation + estimation.risks + calculateAdditionalRisks();
    };

    const calculateWorkingDays = () => {
        return Math.ceil(calculateTotal() * 2);
    };

    if (!estimation) {
        return (
            <Card style={{ borderRadius: '24px', padding: '24px' }}>
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-lg font-semibold">Суммарная оценка</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-center text-muted-foreground">
                        <p>Загрузите и обработайте задачу для отображения оценок</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const additionalRisks = calculateAdditionalRisks();
    const total = calculateTotal();
    const workingDays = calculateWorkingDays();

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Суммарная оценка</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                {/* T-shirt Size Formula */}
                <div>
                    <div className="text-sm text-muted-foreground mb-2">Оценка в майках:</div>
                    <div 
                        className="bg-muted p-3 rounded text-sm font-mono"
                        style={{ borderRadius: '8px' }}
                        data-testid="estimation-formula"
                    >
                        {estimation.formula}
                    </div>
                </div>

                {/* Risk Formula */}
                {estimation.risks > 0 && (
                    <div>
                        <div className="text-sm text-muted-foreground mb-2">Риски в майках:</div>
                        <div 
                            className="bg-muted p-3 rounded text-sm font-mono"
                            style={{ borderRadius: '8px' }}
                            data-testid="risk-formula"
                        >
                            {estimation.riskFormula}
                        </div>
                    </div>
                )}

                {/* Additional Risks */}
                <div>
                    <div className="text-sm text-muted-foreground mb-2">Дополнительные риски:</div>
                    <div className="text-sm font-medium text-orange-600" data-testid="additional-risks">
                        {additionalRisks} SP ({additionalRiskPercent}% от общей оценки)
                    </div>
                </div>

                {/* Total */}
                <div className="border-t border-border pt-4">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground">Итого с рисками</div>
                        <div 
                            className="text-3xl font-bold text-primary"
                            data-testid="total-estimation"
                        >
                            {total} SP
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            ≈ {workingDays} рабочих дней
                        </div>
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="border-t border-border pt-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Всего задач:</span>
                        <span className="font-medium">{estimation.taskCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Базовая оценка:</span>
                        <span className="font-medium">{estimation.baseEstimation} SP</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Встроенные риски:</span>
                        <span className="font-medium">{estimation.risks} SP</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
