import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { JiraTask } from '@shared/schema';

interface TaskInputFormProps {
    onTaskLoaded: (task: JiraTask, decompositionText: string) => void;
    currentTask: JiraTask | null;
    onRefresh: () => void;
}

export const TaskInputForm = ({ 
    onTaskLoaded, 
    currentTask, 
    onRefresh 
}: TaskInputFormProps) => {
    const [input, setInput] = useState('');
    const { toast } = useToast();

    const fetchTaskMutation = useMutation({
        mutationFn: (input: string) => api.fetchJiraTask(input),
        onSuccess: (data) => {
            if (data.success) {
                onTaskLoaded(data.task, data.decompositionText);
                toast({
                    title: 'Задача загружена',
                    description: `Успешно загружена задача ${data.task.key}`,
                });
            }
        },
        onError: (error: any) => {
            const errorMessage = error.message || 'Ошибка при загрузке задачи';
            toast({
                variant: 'destructive',
                title: 'Ошибка загрузки',
                description: errorMessage,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Введите ключ задачи или ссылку на JIRA',
            });
            return;
        }
        fetchTaskMutation.mutate(input.trim());
    };

    const handleRefresh = () => {
        if (currentTask) {
            fetchTaskMutation.mutate(currentTask.key);
        } else {
            onRefresh();
        }
    };

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Исходная задача</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium mb-2 block">
                                Ключ задачи или ссылка на JIRA
                            </Label>
                            <div className="flex gap-3">
                                <Input
                                    type="text"
                                    className="flex-1"
                                    style={{ padding: '16px', borderRadius: '12px', fontSize: '16px' }}
                                    placeholder="PORTFOLIO-987654321 или https://jira.hh.ru/browse/PORTFOLIO-987654321"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={fetchTaskMutation.isPending}
                                    data-testid="input-jira-key"
                                />
                                <Button
                                    type="submit"
                                    className="px-6 py-3"
                                    style={{ borderRadius: '12px', fontWeight: '600' }}
                                    disabled={fetchTaskMutation.isPending}
                                    data-testid="button-load-task"
                                >
                                    {fetchTaskMutation.isPending ? (
                                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Download className="w-5 h-5 mr-2" />
                                    )}
                                    Загрузить
                                </Button>
                            </div>
                            <p className="text-muted-foreground text-sm mt-2">
                                Введите ключ задачи или полную ссылку из JIRA
                            </p>
                        </div>

                        {/* Task Info Display */}
                        {currentTask && (
                            <div 
                                className="border border-border rounded-lg p-4 bg-muted/30"
                                style={{ borderRadius: '12px' }}
                                data-testid="task-info"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {currentTask.key}: {currentTask.fields.summary}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            {currentTask.fields.status.name}
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={fetchTaskMutation.isPending}
                                        data-testid="button-refresh-task"
                                    >
                                        <RefreshCw 
                                            className={`w-4 h-4 mr-1 ${fetchTaskMutation.isPending ? 'animate-spin' : ''}`} 
                                        />
                                        Обновить
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>
                                        Исполнитель: {' '}
                                        <span className="text-foreground">
                                            {currentTask.fields.assignee?.displayName || 'Не назначен'}
                                        </span>
                                    </span>
                                    <span>
                                        Приоритет: {' '}
                                        <Badge variant="outline" className="text-xs">
                                            {currentTask.fields.priority?.name || 'Не установлен'}
                                        </Badge>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
