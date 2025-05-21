import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

export function UnitBadge() {
    const { units } = useWorkspaceState();
    return (
        <div className="absolute -top-2 -left-2 max-xl:-top-1 max-xl:-left-1 px-2 max-xl:px-1 py-1.5 max-xl:py-1 text-xs font-semibold text-gray-600 bg-gray-300 rounded-tl items-center text-center rounded-br-lg  dark:bg-gray-700 dark:text-gray-400">
            <span>
                Units:
                <br /> {units}
            </span>
        </div>
    );
}
