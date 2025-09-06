import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    onAdditionalRiskChange: (percent: number) => void;
}

export const EstimationSummary = ({
    estimation,
    mapping,
    additionalRiskPercent,
    onAdditionalRiskChange,
}: EstimationSummaryProps) => {
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

    const calculateDeliveryDate = () => {
        const workingDays = calculateWorkingDays();
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

        return deliveryDate.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!estimation) {
        return (
            <Card style={{ borderRadius: '24px', padding: '24px' }}>
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-lg font-semibold">Суммарная оценка</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-left text-muted-foreground">
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

                {/* Additional Risks Configuration */}
                <div 
                    className="border border-border rounded-lg p-4"
                    style={{ borderRadius: '12px' }}
                >
                    <h3 className="font-medium text-foreground mb-3">Дополнительные риски</h3>
                    <div className="flex items-center space-x-4">
                        <Label className="text-sm text-muted-foreground whitespace-nowrap">
                            Процент от общей оценки:
                        </Label>
                        <Input
                            type="number"
                            className="w-20 text-center"
                            value={additionalRiskPercent}
                            min={0}
                            max={100}
                            onChange={(e) => onAdditionalRiskChange(parseInt(e.target.value) || 0)}
                            style={{
                                borderRadius: '12px',
                                fontSize: '16px'
                            }}
                            data-testid="input-additional-risk-percent"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <span className="text-sm font-medium text-foreground ml-4">
                            = {additionalRisks} SP
                        </span>
                    </div>
                </div>

                {/* Delivery Date Estimation */}
                <div 
                    className="border border-border rounded-lg p-4 bg-muted/30"
                    style={{ borderRadius: '12px' }}
                >
                    <h3 className="font-medium text-foreground mb-3">Расчет сроков поставки</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-sm">
                            <span className="text-muted-foreground">Формула расчета:</span>
                            <div 
                                className="font-mono text-sm bg-background p-2 rounded mt-1"
                                style={{ borderRadius: '8px' }}
                            >
                                1 SP = 2 рабочих дня
                            </div>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Ориентировочная дата поставки:</span>
                            <div 
                                className="text-lg font-semibold text-primary mt-1"
                                data-testid="estimated-delivery-date"
                            >
                                {calculateDeliveryDate()}
                            </div>
                        </div>
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
