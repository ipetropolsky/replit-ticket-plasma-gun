import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Estimation } from 'shared/types.ts';

interface EstimationSummaryProps {
    estimation: Estimation | null;
    mapping: Record<string, number>;
    additionalRiskPercent: number;
    onAdditionalRiskChange: (percent: number) => void;
    parallelizationCoefficient: number;
    onParallelizationCoefficientChange: (coefficient: number) => void;
}

export const EstimationSummary = ({
    estimation,
    mapping,
    additionalRiskPercent,
    onAdditionalRiskChange,
    parallelizationCoefficient,
    onParallelizationCoefficientChange,
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
        const rawDays = calculateTotal() * 2;
        const acceleratedDays = rawDays / parallelizationCoefficient;
        return Math.ceil(acceleratedDays);
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

        const dateString = deliveryDate.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
        const dayName = dayNames[deliveryDate.getDay()];

        return { dateString, dayName };
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
                {/* Warning for tasks without estimation */}
                {estimation.tasksWithoutEstimation > 0 && (
                    <div
                        className="border border-orange-200 bg-orange-50 rounded-lg p-3"
                        style={{ borderRadius: '12px' }}
                        data-testid="warning-tasks-without-estimation"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm text-orange-800 font-medium">
                                Внимание: {estimation.tasksWithoutEstimation} {estimation.tasksWithoutEstimation === 1 ? 'задача' : 'задач'} без оценки (отмечены "?")
                            </span>
                        </div>
                        <div className="text-xs text-orange-700 mt-1">
                            Эти задачи не учитываются в расчётах и не будут иметь Story Points в JIRA
                        </div>
                    </div>
                )}

                {/* T-shirt Size Formulas - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground mb-2">Оценка:</div>
                        <div
                            className="bg-muted p-3 rounded text-sm font-mono"
                            style={{ borderRadius: '8px' }}
                            data-testid="estimation-formula"
                        >
                            {estimation.formula}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground mb-2">Риски:</div>
                        <div
                            className="bg-muted p-3 rounded text-sm font-mono"
                            style={{ borderRadius: '8px' }}
                            data-testid="risk-formula"
                        >
                            {estimation.riskFormula}
                        </div>
                    </div>
                </div>

                {/* Additional Risks and Parallelization Configuration - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Дополнительные риски */}
                    <Card className="border border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Дополнительные риски</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center space-x-2">
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
                                <span className="text-md text-muted-foreground">% = {additionalRisks} SP</span>
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-nowrap mt-2">
                                Процент от общей оценки
                            </div>
                            <div className="text-sm font-medium text-foreground mt-3">
                            </div>
                        </CardContent>
                    </Card>

                    {/* Распараллеливание */}
                    <Card className="border border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Распараллеливание</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center space-x-4">
                                <Label className="text-md text-muted-foreground whitespace-nowrap">
                                    Коэффициент:
                                </Label>
                                <Input
                                    type="number"
                                    className="w-20 text-center"
                                    value={parallelizationCoefficient}
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    onChange={(e) => onParallelizationCoefficientChange(parseFloat(e.target.value) || 1.0)}
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '16px'
                                    }}
                                    data-testid="input-parallelization-coefficient"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                                Ускорение от работы в несколько рук
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Total and Delivery Date - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total with Risks Card */}
                    <Card className="border border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Итого с рисками</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-left">
                                <div
                                    className="text-3xl font-bold text-primary"
                                    data-testid="total-estimation"
                                >
                                    {total} SP
                                </div>
                                <div className="text-sm text-muted-foreground font-normal mt-1">
                                    (SP × 2) ÷ {parallelizationCoefficient} ≈ {workingDays} рабочих дней
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Date Card */}
                    <Card className="border border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Дата поставки</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-left">
                                <div
                                    className="text-3xl font-bold text-primary"
                                    data-testid="estimated-delivery-date"
                                >
                                    {(() => {
                                        const { dateString, dayName } = calculateDeliveryDate();
                                        return (
                                            <>
                                                {dateString}
                                                <div className="text-sm text-muted-foreground font-normal mt-1">
                                                    {dayName}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Task Statistics */}
                <div className="border-t border-border pt-4 text-base space-y-1">
                    <div className="text-muted-foreground">
                        Всего задач: <span className="font-medium text-foreground">{estimation.taskCount}</span>
                    </div>
                    <div className="text-muted-foreground">
                        Базовая оценка: <span className="font-medium text-foreground">{estimation.baseEstimation} SP</span>
                    </div>
                    <div className="text-muted-foreground">
                        Встроенные риски: <span className="font-medium text-foreground">{estimation.risks} SP</span>
                    </div>
                    <div className="text-muted-foreground">
                        Дополнительные риски: <span className="font-medium text-foreground">{additionalRisks} SP</span>
                    </div>
                    <div className="text-muted-foreground">
                        Количество рабочих дней: <span className="font-medium text-foreground">{workingDays}</span>
                    </div>
                    {estimation.tasksWithoutEstimation > 0 && (
                        <div className="text-orange-600">
                            Задачи без оценки: <span className="font-medium">{estimation.tasksWithoutEstimation}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
