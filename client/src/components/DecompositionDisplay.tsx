import { useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { DecompositionBlock } from '@shared/schema';

interface DecompositionDisplayProps {
    decompositionText: string;
    jiraKey: string;
    provider?: string;
    onParsingComplete: (
        blocks: DecompositionBlock[],
        estimation: any,
        sessionId: string,
        mapping: Record<string, number>,
        availableProviders?: Array<{ name: string; available: boolean }>
    ) => void;
    onParsingFunctionReady: (parseFn: () => void) => void;
    blocks: DecompositionBlock[];
}

export const DecompositionDisplay = ({
    decompositionText,
    jiraKey,
    provider,
    onParsingComplete,
    onParsingFunctionReady,
    blocks,
}: DecompositionDisplayProps) => {
    const { toast } = useToast();

    const parseMutation = useMutation({
        mutationFn: () => api.parseDecomposition(decompositionText, jiraKey, provider),
        onSuccess: (data) => {
            if (data.success) {
                onParsingComplete(data.blocks, data.estimation, data.sessionId, data.mapping, data.availableProviders);
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
    const triggerParsing = useCallback(() => {
        if (!decompositionText.trim()) {
            console.warn('[DecompositionDisplay] No text to parse');
            return;
        }
        console.log('[DecompositionDisplay] Manual parsing triggered');
        parseMutation.mutate();
    }, [decompositionText, parseMutation]);

    // Pass parsing function to parent when ready
    useEffect(() => {
        onParsingFunctionReady(triggerParsing);
    }, [decompositionText, provider]);

    // Repository to category mapping - теперь можно выносить в конфигурацию
    const repositoryCategories = {
        'Frontend': {
            repos: ['frontend', 'xhh', 'docs', 'magritte', 'bloko', 'front-packages'],
            bg: 'bg-yellow-200',
            text: 'text-yellow-900'
        },
        'Configs': {
            repos: ['configs', 'deploy', 'deploy-dev-secure'],
            bg: 'bg-green-100',
            text: 'text-green-800'
        },
        'DB': {
            repos: ['db', 'dbscripts'],
            bg: 'bg-purple-100',
            text: 'text-purple-800'
        },
        'Backend': {
            repos: ['backend', 'hh.ru', 'hhru', 'xmlback', 'billing', 'billing-price', 'mm', 'monetization-manager', 'vacancy-creation', 'vc'],
            bg: 'bg-blue-500',
            text: 'text-white'
        }
    };

    const getRepositoryCategory = (repository: string | null): { label: string; bg: string; text: string } => {
        if (!repository) return { label: 'Задача', bg: 'bg-gray-100', text: 'text-gray-800' };
        
        for (const [category, config] of Object.entries(repositoryCategories)) {
            if (config.repos.includes(repository.toLowerCase())) {
                return { label: category, bg: config.bg, text: config.text };
            }
        }
        
        return { label: 'Задача', bg: 'bg-gray-100', text: 'text-gray-800' };
    };

    const getEstimationBgColor = (estimation: string | null): string => {
        if (!estimation || estimation === '?') return 'bg-gray-100';
        
        switch (estimation) {
            case 'XS': return 'bg-blue-100';
            case 'S': return 'bg-green-100';
            case 'M': return 'bg-orange-100';
            case 'L': return 'bg-red-100';
            case 'XL': return 'bg-purple-100';
            default: return 'bg-gray-100';
        }
    };

    const getRiskBgColor = (risk: string | null): string => {
        if (!risk) return 'bg-gray-100';
        
        switch (risk) {
            case 'XS': return 'bg-orange-100';
            case 'S': return 'bg-red-100';
            case 'M': return 'bg-red-200';
            default: return 'bg-gray-100';
        }
    };

    // Показываем блок только если идет парсинг или есть результаты
    if (!parseMutation.isPending && blocks.length === 0) {
        return null;
    }

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                        Результат анализа декомпозиции
                    </CardTitle>
                    {!parseMutation.isPending && blocks.length > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                            Завершено
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                {/* Processing indicator */}
                {parseMutation.isPending && (
                    <div 
                        className="flex items-center p-4 bg-muted/30 rounded-lg"
                        style={{ borderRadius: '12px' }}
                    >
                        <Loader2 className="w-5 h-5 animate-spin text-primary mr-3" />
                        <span className="text-sm font-medium">
                            Обработка текста декомпозиции с помощью LLM
                        </span>
                    </div>
                )}

                {/* Parsed Blocks */}
                {blocks.length > 0 && (
                    <div className="space-y-3">
                        {blocks.map((block, index) => (
                            <div
                                key={index}
                                className={`rounded-lg p-4 ${
                                    block.type === 'text' 
                                        ? 'bg-white border border-dashed border-border' 
                                        : 'border border-border bg-background'
                                }`}
                                style={{ borderRadius: '12px' }}
                                data-testid={`block-${block.type}-${index}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            {block.type === 'task' ? (
                                                <>
                                                    {(() => {
                                                        const category = getRepositoryCategory(block.taskInfo?.repository);
                                                        return (
                                                            <Badge 
                                                                className={`text-xs ${category.bg} ${category.text} border-0`}
                                                            >
                                                                {category.label}
                                                            </Badge>
                                                        );
                                                    })()}
                                                    {block.taskInfo && (
                                                        <span className="text-base font-semibold text-foreground">
                                                            {block.taskInfo.title}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <Badge className="text-xs bg-gray-100 text-gray-600 border-0">
                                                    Текст
                                                </Badge>
                                            )}
                                        </div>

                                        {block.taskInfo && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                                <div 
                                                    className={`text-center p-2 ${getEstimationBgColor(block.taskInfo.estimation)}`}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    <div className="text-sm font-medium text-muted-foreground">
                                                        Оценка
                                                    </div>
                                                    <div className="text-lg font-bold text-foreground">
                                                        {block.taskInfo.estimation ? (
                                                            `${block.taskInfo.estimation} (${block.taskInfo.estimationSP} SP)`
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`text-center p-2 ${getRiskBgColor(block.taskInfo.risk)}`}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    <div className="text-sm font-medium text-muted-foreground">
                                                        Риск
                                                    </div>
                                                    <div className="text-lg font-bold text-foreground">
                                                        {block.taskInfo.risk ? (
                                                            `${block.taskInfo.risk} (${block.taskInfo.riskSP} SP)`
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </div>
                                                </div>
                                                <div 
                                                    className="text-center p-2 bg-gray-100"
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    <div className="text-sm font-medium text-muted-foreground">
                                                        Репозиторий
                                                    </div>
                                                    <div className="text-lg font-bold text-foreground">
                                                        {block.taskInfo.repository ? `[${block.taskInfo.repository}]` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {block.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {parseMutation.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                            {parseMutation.error.message}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
