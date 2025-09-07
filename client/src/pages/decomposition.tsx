import { useState } from 'react';
import { ProviderInfo, TaskInputForm } from 'src/components/TaskInputForm';
import { DecompositionDisplay } from 'src/components/DecompositionDisplay';
import { EstimationSummary } from 'src/components/EstimationSummary';
import { TaskCreationPanel } from 'src/components/TaskCreationPanel';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import type {
    JiraTask,
    DecompositionBlock
} from 'shared/schema';
import { useMutation } from '@tanstack/react-query';
import { useToast } from 'src/hooks/use-toast.ts';
import { api } from 'src/lib/api.ts';
import { Estimation } from 'shared/types.ts';

export const DecompositionPage = () => {
    const [currentTask, setCurrentTask] = useState<JiraTask | null>(null);
    const [decompositionText, setDecompositionText] = useState<string>('');
    const [blocks, setBlocks] = useState<DecompositionBlock[]>([]);
    const [estimation, setEstimation] = useState<Estimation | null>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [additionalRiskPercent, setAdditionalRiskPercent] = useState(20);
    const [parallelizationCoefficient, setParallelizationCoefficient] = useState(1.0);
    const [parentJiraKey, setParentJiraKey] = useState<string>('');
    const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('regexp');
    const jiraKey = currentTask?.key || parentJiraKey;

    const { toast } = useToast();

    const parseMutation = useMutation({
        mutationFn: (text: string) => api.parseDecomposition(text, jiraKey, selectedProvider),
        onSuccess: (data) => {
            if (data.success) {
                handleParsingComplete(data.blocks, data.estimation, data.sessionId, data.mapping, data.availableProviders);
                toast({
                    title: 'Декомпозиция обработана',
                    description: `Найдено ${data.blocks.filter(b => b.type === 'task').length} задач`,
                });
            }
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Ошибка парсинга',
                description: error.message || 'Не удалось разобрать декомпозицию',
            });
        },
    });

    // Expose parsing function for manual triggering
    const parseText = (text: string) => {
        if (!text.trim()) {
            console.warn('[DecompositionDisplay] No text to parse');
            return;
        }
        console.log('[DecompositionDisplay] Manual parsing triggered');
        parseMutation.mutate(text);
    };

    const handleTaskLoaded = (task: JiraTask, text: string) => {
        // Reset parsing results FIRST
        setBlocks([]);
        setEstimation(null);
        setSessionId('');

        // Then set new data
        setCurrentTask(task);
        setDecompositionText(text);
        setParentJiraKey(task.key);
    };

    const handleTextProvided = (text: string, parentKey?: string, provider?: string) => {
        // НЕ сбрасываем currentTask - пусть блок "Источник" остается
        setDecompositionText(text);
        setParentJiraKey(parentKey || ''); // Optional parent key
        if (provider) {
            setSelectedProvider(provider);
        }
        // Reset parsing results when new text is provided
        setBlocks([]);
        setEstimation(null);
        setSessionId('');
        parseText(text);
    };

    const handleParsingComplete = (
        parsedBlocks: DecompositionBlock[],
        estimationData: Estimation,
        sessionId: string,
        mappingData: Record<string, number>,
        providersData?: ProviderInfo[],
    ) => {
        setBlocks(parsedBlocks);
        setEstimation(estimationData);
        setSessionId(sessionId);
        setMapping(mappingData);
        if (providersData) {
            setAvailableProviders(providersData);
        }
    };

    const handleRefresh = () => {
        setCurrentTask(null);
        setDecompositionText('');
        setParentJiraKey('');
        setBlocks([]);
        setEstimation(null);
        setSessionId('');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card shadow-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <img
                                src="https://i.hh.ru/styles/images/logos/hh.ru__min_.svg?v=23122024"
                                alt="HH.ru"
                                className="h-12"
                            />
                            <div>
                                <h1 className="text-xl font-bold text-foreground">JIRA Task Decomposition Tool</h1>
                                <p className="text-muted-foreground text-sm">Автоматическое создание подзадач</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <TaskInputForm
                            onTaskLoaded={handleTaskLoaded}
                            onTextProvided={handleTextProvided}
                            currentTask={currentTask}
                            onRefresh={handleRefresh}
                            availableProviders={availableProviders}
                        />

                        {decompositionText && (
                            <DecompositionDisplay blocks={blocks} parseMutation={parseMutation} />
                        )}

                        {blocks.length > 0 && estimation && (
                            <EstimationSummary
                                estimation={estimation}
                                additionalRiskPercent={additionalRiskPercent}
                                onAdditionalRiskChange={setAdditionalRiskPercent}
                                parallelizationCoefficient={parallelizationCoefficient}
                                onParallelizationCoefficientChange={setParallelizationCoefficient}
                                mapping={mapping}
                            />
                        )}

                        {blocks.length > 0 && estimation && (
                            <TaskCreationPanel
                                sessionId={sessionId}
                                estimation={estimation}
                                additionalRiskPercent={additionalRiskPercent}
                                blocks={blocks}
                                parentJiraKey={parentJiraKey}
                            />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Configuration Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Конфигурация</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Size Mapping */}
                                <div>
                                    <div className="text-base text-muted-foreground mb-2">Майки и SP:</div>
                                    <div className="space-y-1">
                                        {Object.entries(mapping).length > 0 ? (
                                            Object.entries(mapping).map(([size, sp]) => (
                                                <div key={size} className="text-sm text-muted-foreground">
                                                    {size}: <span className="font-medium text-foreground">{sp} SP</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">XS: <span className="font-medium text-foreground">0.5 SP</span></div>
                                                <div className="text-sm text-muted-foreground">S: <span className="font-medium text-foreground">1 SP</span></div>
                                                <div className="text-sm text-muted-foreground">M: <span className="font-medium text-foreground">2 SP</span></div>
                                                <div className="text-sm text-muted-foreground">L: <span className="font-medium text-foreground">3 SP</span></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Connection Status */}
                                <div className="border-t border-border pt-4">
                                    <div className="text-base text-muted-foreground mb-2">Статус подключения:</div>
                                    <div className="space-y-1">
                                        {/* JIRA Status */}
                                        <div className="text-sm text-muted-foreground">
                                            JIRA API:{' '}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex items-center space-x-1">
                                                            <span className="font-medium text-orange-600">Токен не найден</span>
                                                            <Info className="h-4 w-4 text-orange-600" style={{ marginTop: '2px' }} />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Необходимо настроить JIRA_HOST, JIRA_USER и JIRA_TOKEN</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        {/* OpenAI Status */}
                                        <div className="text-sm text-muted-foreground">
                                            OpenAI API:{' '}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex items-center space-x-1">
                                                            <span className="font-medium text-orange-600">Токен не найден</span>
                                                            <Info className="h-4 w-4 text-orange-600" style={{ marginTop: '2px' }} />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Необходимо настроить OPENAI_API_KEY</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        {/* Anthropic Status */}
                                        <div className="text-sm text-muted-foreground">
                                            Anthropic API:{' '}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex items-center space-x-1">
                                                            <span className="font-medium text-orange-600">Токен не найден</span>
                                                            <Info className="h-4 w-4 text-orange-600" style={{ marginTop: '2px' }} />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Необходимо настроить ANTHROPIC_API_KEY</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>

                                {/* Help */}
                                <div className="border-t border-border pt-4">
                                    <div className="text-base text-muted-foreground mb-2">Помощь:</div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground">M+ означает: <span className="font-medium text-foreground">M оценка + S риск</span></div>
                                        <div className="text-sm text-muted-foreground">S+ означает: <span className="font-medium text-foreground">S оценка + XS риск</span></div>
                                        <div className="text-sm text-muted-foreground">Формат задач: <span className="font-medium text-foreground">[репозиторий] Название</span></div>
                                        <div className="text-sm text-muted-foreground">1 SP: <span className="font-medium text-foreground">2 рабочих дня</span></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
