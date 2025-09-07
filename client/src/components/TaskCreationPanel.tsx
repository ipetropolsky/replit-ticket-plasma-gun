import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Plus, Eye, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from 'src/hooks/use-toast';
import { api } from 'src/lib/api';
import type { TaskCreationResponse } from 'shared/schema';
import { Estimation } from 'shared/types.ts';

interface TaskCreationPanelProps {
    sessionId: string;
    estimation: Estimation;
    additionalRiskPercent: number;
    blocks?: any[]; // DecompositionBlocks for task creation
    parentJiraKey?: string; // For linking created tasks
}

export const TaskCreationPanel = ({
    sessionId,
    estimation,
    additionalRiskPercent,
    blocks = [],
    parentJiraKey,
}: TaskCreationPanelProps) => {
    const [createdTasks, setCreatedTasks] = useState<TaskCreationResponse['createdTasks']>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const { toast } = useToast();

    const createTasksMutation = useMutation({
        mutationFn: () => {
            // Extract tasks from blocks
            const tasks = blocks
                .filter(block =>
                    block.type === 'task' &&
                    block.taskInfo &&
                    block.taskInfo.estimation &&
                    block.taskInfo.estimationSP !== null
                )
                .map(block => ({
                    title: block.taskInfo!.title,
                    summary: `${block.taskInfo!.repository ? `[${block.taskInfo!.repository}] ` : ''}${block.taskInfo!.title}`,
                    content: block.content,
                    description: block.content,
                    estimation: block.taskInfo!.estimation!,
                    storyPoints: block.taskInfo!.estimationSP!
                }));

            return api.createTasks({
                sessionId,
                additionalRiskPercent,
                tasks,
                parentJiraKey
            });
        },
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



    const handleCreateTasks = () => {
        createTasksMutation.mutate();
    };

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Создание задач в JIRA</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1 px-6 py-3"
                        onClick={handleCreateTasks}
                        disabled={createTasksMutation.isPending}
                        style={{
                            backgroundColor: '#0070ff',
                            color: 'white',
                            height: '48px',
                            borderRadius: '12px',
                            fontSize: '16px'
                        }}
                        data-testid="button-create-tasks"
                    >
                        <Plus className="w-4 h-4" style={{ marginRight: '10px' }} />
                        {createTasksMutation.isPending ? 'Создание...' : 'Завести задачи в JIRA'}
                    </Button>
                    <Button
                        variant="secondary"
                        className="px-6 py-3"
                        style={{
                            borderRadius: '12px',
                            height: '48px',
                            fontSize: '16px'
                        }}
                        disabled={createTasksMutation.isPending}
                        data-testid="button-preview-tasks"
                    >
                        <Eye className="w-4 h-4" style={{ marginRight: '10px' }} />
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
