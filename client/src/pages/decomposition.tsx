import { useState } from 'react';
import TaskInputForm from '@/components/TaskInputForm';
import DecompositionDisplay from '@/components/DecompositionDisplay';
import EstimationSummary from '@/components/EstimationSummary';
import TaskCreationPanel from '@/components/TaskCreationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import type { 
    JiraTask, 
    DecompositionBlock 
} from '@shared/schema';

interface EstimationData {
    baseEstimation: number;
    risks: number;
    taskCount: number;
    formula: string;
    riskFormula: string;
}

export default function DecompositionPage() {
    const [currentTask, setCurrentTask] = useState<JiraTask | null>(null);
    const [decompositionText, setDecompositionText] = useState<string>('');
    const [blocks, setBlocks] = useState<DecompositionBlock[]>([]);
    const [estimation, setEstimation] = useState<EstimationData | null>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [additionalRiskPercent, setAdditionalRiskPercent] = useState(20);

    const handleTaskLoaded = (task: JiraTask, text: string) => {
        setCurrentTask(task);
        setDecompositionText(text);
        // Reset parsing results when new task is loaded
        setBlocks([]);
        setEstimation(null);
        setSessionId('');
    };

    const handleParsingComplete = (
        parsedBlocks: DecompositionBlock[],
        estimationData: EstimationData,
        sessionId: string,
        mappingData: Record<string, number>
    ) => {
        setBlocks(parsedBlocks);
        setEstimation(estimationData);
        setSessionId(sessionId);
        setMapping(mappingData);
    };

    const handleRefresh = () => {
        setCurrentTask(null);
        setDecompositionText('');
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
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">JIRA Task Decomposition Tool</h1>
                                <p className="text-muted-foreground text-sm">Автоматическое создание подзадач</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                                HH.ru
                            </Badge>
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
                            currentTask={currentTask}
                            onRefresh={handleRefresh}
                        />

                        {decompositionText && (
                            <DecompositionDisplay
                                decompositionText={decompositionText}
                                jiraKey={currentTask?.key || ''}
                                onParsingComplete={handleParsingComplete}
                                blocks={blocks}
                            />
                        )}

                        {blocks.length > 0 && estimation && (
                            <TaskCreationPanel
                                sessionId={sessionId}
                                estimation={estimation}
                                additionalRiskPercent={additionalRiskPercent}
                                onAdditionalRiskChange={setAdditionalRiskPercent}
                            />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <EstimationSummary
                            estimation={estimation}
                            mapping={mapping}
                            additionalRiskPercent={additionalRiskPercent}
                        />

                        {/* Configuration Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Конфигурация</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                {/* Size Mapping */}
                                <div>
                                    <div className="text-muted-foreground mb-2">Маппинг размеров:</div>
                                    <div className="space-y-1">
                                        {Object.entries(mapping).map(([size, sp]) => (
                                            <div key={size} className="flex justify-between">
                                                <span>{size}</span>
                                                <span className="font-medium">{sp} SP</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Connection Status */}
                                <div className="border-t border-border pt-4">
                                    <div className="text-muted-foreground mb-2">Статус подключения:</div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-green-600 font-medium">JIRA API подключен</span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-green-600 font-medium">LLM API подключен</span>
                                    </div>
                                </div>

                                {/* Help */}
                                <div className="border-t border-border pt-4">
                                    <div className="text-muted-foreground mb-2">Помощь:</div>
                                    <div className="text-xs space-y-1">
                                        <p>• M+ означает M оценка + S риск</p>
                                        <p>• S+ означает S оценка + XS риск</p>
                                        <p>• Названия задач: [репозиторий] Название</p>
                                        <p>• 1 SP = 2 рабочих дня</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
