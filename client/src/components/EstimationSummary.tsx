import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EstimationSummaryProps {
    estimation: {
        baseEstimation: number;
        risks: number;
        taskCount: number;
        tasksWithoutEstimation: number;
        formula: string;
        riskFormula: string;
    } | null;
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
        
        const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
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
                    {estimation.risks > 0 && (
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
                    )}
                </div>

                {/* Additional Risks and Parallelization Configuration */}
                <div 
                    className="border border-border rounded-lg p-4"
                    style={{ borderRadius: '12px' }}
                >
                    <h3 className="font-medium text-foreground mb-3">Дополнительные риски</h3>
                    <div className="flex items-center space-x-4 mb-4">
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
                    
                    <h3 className="font-medium text-foreground mb-3">Распараллеливание</h3>
                    <div className="flex items-center space-x-4">
                        <Label className="text-sm text-muted-foreground whitespace-nowrap">
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
                        <span className="text-xs text-muted-foreground ml-4">
                            Ускорение от работы в несколько рук
                        </span>
                    </div>
                </div>

                {/* Total and Delivery Date - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total with Risks Card */}
                    <Card className="border border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Итого с рисками</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-center">
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
                        </CardContent>
                    </Card>
                    
                    {/* Delivery Date Card */}
                    <Card className="border border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex items-center space-x-2">
                                <span>Дата поставки</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="font-mono text-sm">
                                                (SP × 2) ÷ {parallelizationCoefficient} = {workingDays} дней
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-center">
                                <div 
                                    className="text-lg font-semibold text-primary"
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
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Дополнительные риски:</span>
                        <span className="font-medium">{additionalRisks} SP</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Количество рабочих дней:</span>
                        <span className="font-medium">{workingDays}</span>
                    </div>
                    {estimation.tasksWithoutEstimation > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Задачи без оценки:</span>
                            <span className="font-medium text-orange-600">{estimation.tasksWithoutEstimation}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
