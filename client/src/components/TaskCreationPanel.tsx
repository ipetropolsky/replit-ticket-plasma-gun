import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { TaskCreationResponse } from '@shared/schema';

interface TaskCreationPanelProps {
    sessionId: string;
    estimation: {
        baseEstimation: number;
        risks: number;
        taskCount: number;
        formula: string;
        riskFormula: string;
    };
    additionalRiskPercent: number;
    onAdditionalRiskChange: (percent: number) => void;
}

export const TaskCreationPanel = ({
    sessionId,
    estimation,
    additionalRiskPercent,
    onAdditionalRiskChange,
}: TaskCreationPanelProps) => {
    const [createdTasks, setCreatedTasks] = useState<TaskCreationResponse['createdTasks']>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const { toast } = useToast();

    const createTasksMutation = useMutation({
        mutationFn: () => api.createTasks({ sessionId, additionalRiskPercent }),
        onSuccess: (data) => {
            setCreatedTasks(data.createdTasks);
            setErrors(data.errors);
            
            if (data.success) {
                toast({
                    title: 'Задачи созданы!',
                    description: `Успешно создано ${data.createdTasks.length} задач в JIRA`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Частичная ошибка',
                    description: `Создано ${data.createdTasks.length} из ${estimation.taskCount} задач`,
                });
            }
        },
        onError: (error: any) => {
            setErrors([error.message || 'Ошибка при создании задач']);
            toast({
                variant: 'destructive',
                title: 'Ошибка создания',
                description: error.message || 'Не удалось создать задачи',
            });
        },
    });

    const calculateAdditionalRisks = () => {
        const additional = (estimation.baseEstimation * additionalRiskPercent) / 100;
        return Math.round(additional * 2) / 2;
    };

    const calculateTotal = () => {
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

    const handleCreateTasks = () => {
        createTasksMutation.mutate();
    };

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-6">
                <CardTitle className="text-lg font-semibold">Создание задач в JIRA</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
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
                            data-testid="input-additional-risk-percent"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <span className="text-sm font-medium text-foreground ml-4">
                            = {calculateAdditionalRisks()} SP
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        className="flex-1 px-6 py-3"
                        style={{ borderRadius: '12px', fontWeight: '600' }}
                        onClick={handleCreateTasks}
                        disabled={createTasksMutation.isPending}
                        data-testid="button-create-tasks"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {createTasksMutation.isPending ? 'Создание...' : 'Завести задачи в JIRA'}
                    </Button>
                    <Button
                        variant="secondary"
                        className="px-6 py-3"
                        style={{ borderRadius: '12px' }}
                        disabled={createTasksMutation.isPending}
                        data-testid="button-preview-tasks"
                    >
                        <Eye className="w-5 h-5 mr-2" />
                        Предварительный просмотр
                    </Button>
                </div>

                {/* Success State */}
                {createdTasks.length > 0 && (
                    <div 
                        className="border border-green-200 bg-green-50 rounded-lg p-4"
                        style={{ borderRadius: '12px' }}
                        data-testid="success-state"
                    >
                        <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">Задачи успешно созданы!</span>
                        </div>
                        <div className="text-sm text-green-700">
                            <p className="mb-2">Создано задач: {createdTasks.length}</p>
                            <ul className="space-y-1">
                                {createdTasks.map((task) => (
                                    <li key={task.id}>
                                        <a 
                                            href={task.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline inline-flex items-center"
                                            data-testid={`link-created-task-${task.key}`}
                                        >
                                            {task.key}: {task.summary}
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {errors.length > 0 && (
                    <div 
                        className="border border-red-200 bg-red-50 rounded-lg p-4"
                        style={{ borderRadius: '12px' }}
                        data-testid="error-state"
                    >
                        <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="destructive">Ошибки</Badge>
                        </div>
                        <div className="text-sm text-red-700">
                            <ul className="space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-red-500 mr-2">•</span>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
