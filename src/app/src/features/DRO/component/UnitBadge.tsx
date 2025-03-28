import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

export function UnitBadge() {
    const { units } = useWorkspaceState();
    return (
        <div className="absolute -top-2 -left-2 px-2 py-1.5 text-xs font-semibold text-gray-600 bg-gray-300 rounded-tl rounded-br-lg  dark:bg-gray-700 dark:text-gray-400">
            <span>Units: {units}</span>
        </div>
    );
}
