import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Download, FileText, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { JiraTask } from '@shared/schema';

interface TaskInputFormProps {
    onTaskLoaded: (task: JiraTask, decompositionText: string) => void;
    onTextProvided: (decompositionText: string, parentJiraKey?: string) => void;
    currentTask: JiraTask | null;
    onRefresh: () => void;
}

type InputMode = 'jira' | 'text';

export const TaskInputForm = ({ 
    onTaskLoaded, 
    onTextProvided,
    currentTask, 
    onRefresh 
}: TaskInputFormProps) => {
    const [mode, setMode] = useState<InputMode>('jira');
    const [jiraInput, setJiraInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [parentJiraKey, setParentJiraKey] = useState('');
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

    const handleJiraSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!jiraInput.trim()) {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Введите ключ задачи или ссылку на JIRA',
            });
            return;
        }
        fetchTaskMutation.mutate(jiraInput.trim());
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Введите текст декомпозиции',
            });
            return;
        }
        onTextProvided(textInput.trim(), parentJiraKey.trim() || undefined);
        toast({
            title: 'Текст обработан',
            description: 'Декомпозиция готова к разбору',
        });
    };

    const handleRefresh = () => {
        if (currentTask) {
            fetchTaskMutation.mutate(currentTask.key);
        } else {
            onRefresh();
        }
    };

    const TabButton = ({ 
        isActive, 
        onClick, 
        icon: Icon, 
        children 
    }: { 
        isActive: boolean; 
        onClick: () => void; 
        icon: any; 
        children: React.ReactNode; 
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            data-testid={`tab-${isActive ? 'active' : 'inactive'}`}
        >
            <Icon className="w-4 h-4" />
            {children}
        </button>
    );

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">Источник декомпозиции</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                {/* Табы */}
                <div className="flex gap-2 mb-6">
                    <TabButton
                        isActive={mode === 'jira'}
                        onClick={() => setMode('jira')}
                        icon={Link}
                    >
                        Из JIRA
                    </TabButton>
                    <TabButton
                        isActive={mode === 'text'}
                        onClick={() => setMode('text')}
                        icon={FileText}
                    >
                        Ввести текст
                    </TabButton>
                </div>

                {/* Контент вкладки JIRA */}
                {mode === 'jira' && (
                    <form onSubmit={handleJiraSubmit}>
                        <div className="space-y-4">
                            <div>
                                <div className="flex gap-3">
                                    <Input
                                        type="text"
                                        className="flex-1"
                                        style={{ padding: '16px', borderRadius: '12px', fontSize: '16px', height: '48px' }}
                                        placeholder="PORTFOLIO-12345 или ссылка на JIRA"
                                        value={jiraInput}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJiraInput(e.target.value)}
                                        disabled={fetchTaskMutation.isPending}
                                        data-testid="input-jira-key"
                                    />
                                    <Button
                                        type="submit"
                                        className="btn-custom px-6 py-3"
                                        disabled={fetchTaskMutation.isPending}
                                        data-testid="button-load-task"
                                    >
                                        {fetchTaskMutation.isPending ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        Загрузить
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* Контент вкладки ручного ввода */}
                {mode === 'text' && (
                    <form onSubmit={handleTextSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Родительская задача (необязательно)
                                </Label>
                                <Input
                                    type="text"
                                    style={{ padding: '16px', borderRadius: '12px', fontSize: '16px', height: '48px' }}
                                    placeholder="PORTFOLIO-12345 или ссылка на JIRA"
                                    value={parentJiraKey}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParentJiraKey(e.target.value)}
                                    data-testid="input-parent-jira-key"
                                />
                            </div>
                            
                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    Текст декомпозиции
                                </Label>
                                <Textarea
                                    className="min-h-[200px]"
                                    style={{ padding: '16px', borderRadius: '12px', fontSize: '16px' }}
                                    placeholder="Вставьте текст декомпозиции для разбора на задачи"
                                    value={textInput}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
                                    data-testid="textarea-decomposition"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="btn-custom w-full px-6 py-3"
                                data-testid="button-process-text"
                            >
                                <FileText className="w-4 h-4" />
                                Обработать текст
                            </Button>
                        </div>
                    </form>
                )}

                {/* Task Info Display */}
                {currentTask && mode === 'jira' && (
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
            </CardContent>
        </Card>
    );
}
