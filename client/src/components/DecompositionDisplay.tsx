import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { DecompositionBlock } from 'shared/schema';
import { UseMutationResult } from '@tanstack/react-query';
import { stripJiraMarkup } from 'src/lib/jira-markup';
import { getEstimationBgColor, getRepositoryCategory, getRiskBgColor, fixJiraLists } from 'src/lib/utils.ts';
// @ts-ignore TS7016
import JiraToMd from 'jira2md';
import { Segmented } from './ui/segmented';

interface DecompositionDisplayProps {
    blocks: DecompositionBlock[];
    parseMutation: UseMutationResult<any, any, string, unknown>;
}

type RenderingMode = 'html' | 'text';

export const DecompositionDisplay = ({
    blocks,
    parseMutation,
}: DecompositionDisplayProps) => {
    const [renderMode, setRenderMode] = useState<RenderingMode>('html');

    // Показываем блок только если идет парсинг или есть результаты
    if (!parseMutation.isPending && blocks.length === 0) {
        return null;
    }

    const renderingModes: RenderingMode[] = ['html', 'text'];
    const renderingVariants = renderingModes.map((value) => ({
        value,
        label: value,
    }))

    return (
        <Card style={{ borderRadius: '24px', padding: '24px' }}>
            <CardHeader className="p-0 mb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex space-x-2">
                        {blocks.length > 0 && (
                            parseMutation.isPending
                                ? <Loader2 className="w-5 h-5 animate-spin text-blue-400 mt-1" />
                                : <CheckCircle className="w-5 h-5 text-green-600 mt-1" />

                        )}
                        <span>
                            Результат анализа декомпозиции
                        </span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        {!parseMutation.isPending && blocks.length > 0 && (
                            <Segmented variants={renderingVariants} value={renderMode} onChange={setRenderMode}/>
                        )}
                    </div>
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
                                            <span className="space-x-1">
                                                <a id={`block-${index + 1}`} href={`#block-${index + 1}`} className="text-primary hover:underline font-semibold">#{index + 1}</a>
                                                {block.type === 'task' ? (
                                                    <>
                                                        {(() => {
                                                            const category = getRepositoryCategory(block.taskInfo?.repository || null);
                                                            return (
                                                                <Badge
                                                                    className={`text-sm ${category.bg} ${category.text} border-0`}
                                                                >
                                                                    {category.label}
                                                                </Badge>
                                                            );
                                                        })()}
                                                    </>
                                                ) : (
                                                    <Badge className="text-xs bg-gray-100 text-gray-600 border-0">
                                                        Текст
                                                    </Badge>
                                                )}
                                            </span>
                                            {block.type === 'task' && block.taskInfo && (
                                                <span className="text-base font-semibold text-foreground">
                                                    {stripJiraMarkup(block.taskInfo.title)}
                                                </span>
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

                                        {block.type !== 'text' && <div className="font-semibold mb-1">Описание задачи:</div>}
                                        <div className="border-l-4 px-4 py-2 bg-gray-50">
                                            {renderMode === 'html' ? (
                                                <div>
                                                    <div
                                                        className="jira-content text-md text-foreground"
                                                        dangerouslySetInnerHTML={{__html: fixJiraLists(JiraToMd.jira_to_html(block.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')))}}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-md text-foreground whitespace-pre-wrap">
                                                    {block.content}
                                                </div>
                                            )}
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
