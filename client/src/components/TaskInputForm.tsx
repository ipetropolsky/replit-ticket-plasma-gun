import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Download, FileText, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { JiraTask } from '@shared/schema';

type LLMProvider = 'openai' | 'anthropic' | 'regexp';

interface ProviderInfo {
  name: LLMProvider;
  available: boolean;
}

interface TaskInputFormProps {
    onTaskLoaded: (task: JiraTask, decompositionText: string) => void;
    onTextProvided: (decompositionText: string, parentJiraKey?: string, provider?: LLMProvider) => void;
    currentTask: JiraTask | null;
    onRefresh: () => void;
    availableProviders?: ProviderInfo[];
}

export const TaskInputForm = ({ 
    onTaskLoaded, 
    onTextProvided,
    currentTask, 
    onRefresh,
    availableProviders 
}: TaskInputFormProps) => {
    const [jiraInput, setJiraInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('regexp');
    const { toast } = useToast();

    const fetchTaskMutation = useMutation({
        mutationFn: (input: string) => api.fetchJiraTask(input),
        onSuccess: (data) => {
            if (data.success) {
                onTaskLoaded(data.task, data.decompositionText);
                setTextInput(data.decompositionText); // Заполняем textarea
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

    const handleJiraLoad = (e: React.FormEvent) => {
        e.preventDefault();
        if (!jiraInput.trim()) {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Введите ключ задачи или ссылку на JIRA',
            });
            return;
        }

        // Проверяем, есть ли текст в textarea
        if (textInput.trim()) {
            const confirmed = window.confirm(
                'В поле ввода уже есть текст. Он будет заменён на содержимое поля "Декомпозиция" из JIRA. Продолжить?'
            );
            if (!confirmed) {
                return;
            }
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
        onTextProvided(textInput.trim(), jiraInput.trim() || undefined, selectedProvider);
    };

    const handleProviderChange = (provider: LLMProvider) => {
        setSelectedProvider(provider);
    };

    const getProviderLabel = (provider: LLMProvider): string => {
        switch (provider) {
            case 'openai': return 'OpenAI';
            case 'anthropic': return 'Anthropic';
            case 'regexp': return 'RegExp';
            default: return provider;
        }
    };

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                        Источник декомпозиции
                    </CardTitle>
                    {currentTask && (
                        <Button
                            onClick={onRefresh}
                            variant="outline"
                            size="sm"
                            className="h-8"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Сбросить
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
                {/* JIRA Input Section */}
                <div className="space-y-3">
                    <Label htmlFor="jira-input">Загрузка из JIRA</Label>
                    <div className="flex gap-3">
                        <Input
                            id="jira-input"
                            value={jiraInput}
                            onChange={(e) => setJiraInput(e.target.value)}
                            placeholder="PORTFOLIO-12345 или ссылка на JIRA"
                            className="flex-1"
                            style={{ height: '48px' }}
                        />
                        <Button
                            onClick={handleJiraLoad}
                            disabled={fetchTaskMutation.isPending}
                            style={{
                                backgroundColor: '#0070ff',
                                color: 'white',
                                height: '48px',
                                minWidth: '160px'
                            }}
                        >
                            {fetchTaskMutation.isPending ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Загрузка...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Загрузить из JIRA
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Text Input Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="text-input">Текст декомпозиции</Label>
                        
                        {/* Provider Selection */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Анализатор:</span>
                            <div className="flex rounded-lg border p-1" style={{ backgroundColor: '#f8f9fa' }}>
                                {['openai', 'anthropic', 'regexp'].map((provider) => {
                                    const providerTyped = provider as LLMProvider;
                                    const isAvailable = availableProviders?.find(p => p.name === provider)?.available ?? (provider === 'regexp');
                                    const isSelected = selectedProvider === provider;
                                    
                                    return (
                                        <Button
                                            key={provider}
                                            variant="ghost"
                                            size="sm"
                                            disabled={!isAvailable}
                                            onClick={() => handleProviderChange(providerTyped)}
                                            className={`h-8 px-3 text-xs ${
                                                isSelected 
                                                    ? 'bg-white shadow-sm' 
                                                    : 'hover:bg-white/50'
                                            }`}
                                            style={isSelected ? {
                                                backgroundColor: '#ffffff',
                                                color: '#0070ff',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                            } : {}}
                                        >
                                            {getProviderLabel(providerTyped)}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    <Textarea
                        id="text-input"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Вставьте текст декомпозиции или загрузите его из JIRA"
                        className="min-h-[200px] resize-y"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim()}
                        style={{
                            backgroundColor: textInput.trim() ? '#0070ff' : undefined,
                            color: textInput.trim() ? 'white' : undefined,
                            height: '48px',
                            minWidth: '180px'
                        }}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Разбить на задачи
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Мы попытаемся выделить задачи из текста. Создать задачи в JIRA можно будет позже.
                    </div>
                </div>

                {/* Current Task Display */}
                {currentTask && (
                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                            <Link className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{currentTask.key}: {currentTask.summary}</div>
                                <div className="text-sm text-muted-foreground">
                                    Статус: {currentTask.status} • Исполнитель: {currentTask.assignee || 'Не назначен'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};