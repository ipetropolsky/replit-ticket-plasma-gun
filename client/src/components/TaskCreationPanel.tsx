import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { BriefcaseBusiness, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from 'src/hooks/use-toast';
import { api } from 'src/lib/api';
import { stripJiraMarkup } from '../lib/jira-markup';
import type { DecompositionBlock, JiraTask, TaskCreationResponse } from 'shared/schema';
import { Estimation } from 'shared/types.ts';
import { CurrentTask } from 'src/components/CurrentTask.tsx';
import { getEstimationBgColor, getRepositoryCategory } from 'src/lib/utils.ts';

interface TaskCreationPanelProps {
    sessionId: string;
    estimation: Estimation;
    additionalRiskPercent: number;
    blocks?: DecompositionBlock[]; // DecompositionBlocks for task creation
    parentJiraTask: JiraTask | null; // For linking created tasks
}

const getTaskSummary = (task: DecompositionBlock) => `${task.taskInfo!.repository ? `[${task.taskInfo!.repository}] ` : ''}${stripJiraMarkup(task.taskInfo!.title)}`

export const TaskCreationPanel = ({
    sessionId,
    estimation,
    additionalRiskPercent,
    blocks = [],
                                      parentJiraTask,
}: TaskCreationPanelProps) => {
    const [createdTasks, setCreatedTasks] = useState<TaskCreationResponse['createdTasks']>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const { toast } = useToast();

    // Extract tasks from blocks
    const tasks = blocks
        .filter((block) => block.type === 'task');

    const createTasksMutation = useMutation({
        mutationFn: (parentJiraKey: string) => {
            return api.createTasks({
                sessionId,
                additionalRiskPercent,
                tasks: tasks.map((block) => ({
                    summary: getTaskSummary(block),
                    description: block.content,
                    estimation: block.taskInfo?.estimation || undefined,
                    storyPoints: block.taskInfo?.estimationSP || undefined
                })),
                parentJiraKey,
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
        if (parentJiraTask) {
            createTasksMutation.mutate(parentJiraTask.key);
        } else {
            toast({
                variant: 'destructive',
                title: 'Ахтунг!',
                description: `Нужно указать родительскую задачу JIRA для создания подзадач.`,
            })
        }
    };

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Создание задач в JIRA</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
                <div className="p-0 space-y-2">
                    {tasks.map((task, index) => {
                        const category = getRepositoryCategory(task.taskInfo?.repository || null);
                        return (
                            <div key={index} className="font-medium space-x-2">
                                <span
                                    className={`${getEstimationBgColor(task.taskInfo?.estimation || null)} text-black px-1 py-0 rounded text-md text-center w-8 inline-block border-gray-200 border`}>
                                    {task.taskInfo?.estimation || '?'}
                                </span>
                                <Badge
                                    className={`text-sm ${category.bg} ${category.text} border-0`}
                                >
                                    {category.label}
                                </Badge>
                                <span>
                                    {getTaskSummary(task)}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Action Buttons */}
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            className="px-6 py-3"
                            onClick={handleCreateTasks}
                            disabled={!parentJiraTask || createTasksMutation.isPending}
                            style={{
                                backgroundColor: '#0070ff',
                                color: 'white',
                                height: '48px',
                                borderRadius: '12px',
                                fontSize: '16px'
                            }}
                            data-testid="button-create-tasks"
                        >
                            <BriefcaseBusiness className="w-4 h-4" />
                            {createTasksMutation.isPending ? 'Создание...' : 'Завести задачи в JIRA'}
                        </Button>
                    </div>
                    {!parentJiraTask && (
                        <div className="text-sm mt-0 text-red-600">
                            Укажите родительскую задачу JIRA для создания подзадач.
                        </div>
                    )}
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
                        <div className="text-md text-green-700">
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
                {parentJiraTask && (
                    <div className="pt-4 border-t border-border">
                        <CurrentTask currentTask={parentJiraTask} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
