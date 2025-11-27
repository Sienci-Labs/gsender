import { Progress } from 'app/components/shadcn/Progress.tsx';

interface ProgressBarProps {
    sent: number;
    total: number;
}

export function ProgressBar({ sent, total }: ProgressBarProps) {
    const now =
        sent === 0 && total === 0
            ? 0
            : Number(((sent / total) * 100).toFixed(1));

    return (
        <div>
            <Progress value={now} className="bg-gray-300" />
        </div>
    );
}
