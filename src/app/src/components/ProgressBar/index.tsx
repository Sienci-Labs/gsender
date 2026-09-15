import { Progress } from 'app/components/shadcn/Progress.tsx';

export function ProgressBar({ sent, total }) {
    const now = sent === 0 && total === 0 ? 0 : (sent / total).toFixed(1) * 100;
    return (
        <div>
            <Progress value={now} className="bg-gray-300" />
        </div>
    );
}
