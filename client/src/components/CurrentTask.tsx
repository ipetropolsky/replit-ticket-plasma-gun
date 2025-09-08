import type { JiraTask } from 'shared/schema.ts';
import { Link } from 'lucide-react';

interface CurrentTaskProps {
    currentTask: JiraTask | null;
    jiraHost?: string;
}

export const CurrentTask = ({ currentTask, jiraHost }: CurrentTaskProps) => {
    if (!currentTask) {
        return <div className="text-sm text-gray-500">Портфель не загружен</div>;
    }

    const currentTaskUrl = `${jiraHost || 'https://jira.hh.ru'}/browse/${currentTask.key}`;

    return (
        <div className="flex items-center gap-3">
            <a
                href={currentTaskUrl}
                target="_blank"
            >
                <Link className="h-4 w-4 text-muted-foreground" />
            </a>
            <div>
                <div className="font-medium">
                    <a
                        href={currentTaskUrl}
                        target="_blank"
                        className="hover:text-primary hover:underline"
                    >
                        {currentTask.key}: {currentTask.fields.summary || 'Неизвестно'}
                    </a>
                </div>
                <div className="text-sm text-muted-foreground">
                    {currentTask.fields.assignee?.displayName || 'Исполнитель неизвестен'} • {currentTask.fields.status?.name || 'Статус неизвестен'}
                </div>
            </div>
        </div>
    );
}
