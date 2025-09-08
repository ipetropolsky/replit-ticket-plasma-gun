import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card.tsx';
import { Button } from 'src/components/ui/button.tsx';
import { XIcon } from 'lucide-react';
import { FC, useCallback } from 'react';

interface HelpModalProps {
    showHelpModal: boolean;
    setShowHelpModal: (show: boolean) => void;
}
export const HelpModal: FC<HelpModalProps> = ({ showHelpModal, setShowHelpModal }) => {
    const closeModal = useCallback(() => {
        setShowHelpModal(false);
    }, []);

    return (
        <div
            className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-all duration-200 ease-in-out ${
                showHelpModal
                    ? 'bg-opacity-50'
                    : 'bg-opacity-0 pointer-events-none'
            }`}
            onClick={(e) => {
                if (showHelpModal && e.target === e.currentTarget) {
                    closeModal()
                }
            }}
        >
            <Card className={`max-w-2xl w-full max-h-[80vh] overflow-y-auto transition-all duration-200 ease-in-out transform ${
                showHelpModal
                    ? 'scale-100 opacity-100'
                    : 'scale-95 opacity-0'
            }`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Как пользоваться инструментом</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeModal}
                            data-testid="button-close-help"
                        >
                            <XIcon className="h-6 w-6" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">📝 Источник данных</h3>
                        <p className="text-sm text-muted-foreground">
                            Текст декомпозиции можно получить двумя способами:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                            <li>Загрузить из JIRA по ключу задачи (например, PORTFOLIO-12345)</li>
                            <li>Ввести вручную в текстовое поле</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">🎯 Формат задач</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            Инструмент распознает задачи в следующих форматах:
                        </p>
                        <div className="bg-muted p-3 rounded text-sm font-mono space-y-1">
                            <div>M [backend] Создать API для аутентификации</div>
                            <div>S+ [frontend] Добавить форму регистрации</div>
                            <div>L+M [db] Настроить индексы базы данных</div>
                            <div>* XS [config] Обновить настройки</div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            <strong>Оценки:</strong> XS, S, M, L, XL (+ риск: S+, M+XS, L+S)
                        </p>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">⚙️ Процесс работы</h3>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                            <li>Загрузите задачу из JIRA или введите текст декомпозиции</li>
                            <li>Нажмите кнопку «Разбить на задачи» для анализа</li>
                            <li>Проверьте найденные задачи и их оценки</li>
                            <li>Настройте дополнительные риски и коэффициент параллелизации</li>
                            <li>Создайте задачи в JIRA кнопкой «Создать задачи»</li>
                        </ol>
                    </div>

                    <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-blue-800">
                            <strong>🛡️ Безопасность:</strong> Задачи создаются в JIRA только после нажатия кнопки «Создать задачи».
                            До этого все операции выполняются локально без изменений в JIRA.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">📊 Категории задач</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs">Frontend</span>
                                <span className="text-muted-foreground">frontend, xhh, docs, magritte</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Backend</span>
                                <span className="text-muted-foreground">backend, hh.ru, xmlback</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Configs</span>
                                <span className="text-muted-foreground">configs, deploy</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">DB</span>
                                <span className="text-muted-foreground">db, dbscripts</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
