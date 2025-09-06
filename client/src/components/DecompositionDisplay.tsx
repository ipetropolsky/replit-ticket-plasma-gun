import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from 'src/hooks/use-toast';
import { api } from 'src/lib/api';
import type { DecompositionBlock } from 'shared/schema';

interface DecompositionDisplayProps {
    decompositionText: string;
    jiraKey: string;
    onParsingComplete: (
        blocks: DecompositionBlock[],
        estimation: any,
        sessionId: string,
        mapping: Record<string, number>
    ) => void;
    blocks: DecompositionBlock[];
}

export default function DecompositionDisplay({
    decompositionText,
    jiraKey,
    onParsingComplete,
    blocks,
}: DecompositionDisplayProps) {
    const { toast } = useToast();

    const parseMutation = useMutation({
        mutationFn: () => api.parseDecomposition(decompositionText, jiraKey),
        onSuccess: (data) => {
            if (data.success) {
                onParsingComplete(data.blocks, data.estimation, data.sessionId, data.mapping);
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

    useEffect(() => {
        if (decompositionText && blocks.length === 0) {
            parseMutation.mutate();
        }
    }, [decompositionText, blocks.length]);

    const getEstimationColor = (estimation: string | null): string => {
        if (!estimation) return 'text-muted-foreground';
        
        switch (estimation) {
            case 'XS': return 'text-blue-600';
            case 'S': return 'text-green-600';
            case 'M': return 'text-orange-600';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-semibold">
                    Результат парсинга декомпозиции
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                {/* Parsing Status */}
                <div 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    style={{ borderRadius: '12px' }}
                >
                    <div className="flex items-center space-x-3">
                        {parseMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        <span className="text-sm font-medium">
                            {parseMutation.isPending 
                                ? 'Обработка текста декомпозиции с помощью LLM'
                                : 'Обработка завершена'
                            }
                        </span>
                    </div>
                    <Badge 
                        variant={parseMutation.isPending ? 'secondary' : 'default'}
                        className={parseMutation.isPending ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}
                    >
                        {parseMutation.isPending ? 'В процессе' : 'Завершено'}
                    </Badge>
                </div>

                {/* Parsed Blocks */}
                {blocks.length > 0 && (
                    <div className="space-y-3">
                        {blocks.map((block, index) => (
                            <div
                                key={index}
                                className="border border-border rounded-lg p-4 bg-background"
                                style={{ borderRadius: '12px' }}
                                data-testid={`block-${block.type}-${index}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Badge 
                                                variant={block.type === 'task' ? 'default' : 'secondary'}
                                                className={`text-xs ${
                                                    block.type === 'task' 
                                                        ? 'bg-orange-100 text-orange-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {block.type === 'task' ? 'Задача' : 'Текст'}
                                            </Badge>
                                            {block.taskInfo && (
                                                <span className="text-xs text-muted-foreground">
                                                    {block.taskInfo.title}
                                                </span>
                                            )}
                                        </div>

                                        {block.taskInfo && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                                <div className="text-center p-2 bg-accent rounded">
                                                    <div className="text-sm font-medium text-accent-foreground">
                                                        Оценка
                                                    </div>
                                                    <div className={`text-lg font-bold ${getEstimationColor(block.taskInfo.estimation)}`}>
                                                        {block.taskInfo.estimation ? (
                                                            `${block.taskInfo.estimation} (${block.taskInfo.estimationSP} SP)`
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-center p-2 bg-accent rounded">
                                                    <div className="text-sm font-medium text-accent-foreground">
                                                        Риск
                                                    </div>
                                                    <div className={`text-lg font-bold ${
                                                        block.taskInfo.risk 
                                                            ? 'text-red-600' 
                                                            : 'text-muted-foreground'
                                                    }`}>
                                                        {block.taskInfo.risk ? (
                                                            `${block.taskInfo.risk} (${block.taskInfo.riskSP} SP)`
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-center p-2 bg-accent rounded">
                                                    <div className="text-sm font-medium text-accent-foreground">
                                                        Репозиторий
                                                    </div>
                                                    <div className="text-lg font-bold text-primary">
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
