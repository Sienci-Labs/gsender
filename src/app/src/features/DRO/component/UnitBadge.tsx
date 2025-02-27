import store from "app/store";

export function UnitBadge() {
    const units = store.get('workspace.units', 'mm');
    return (
        <div className="absolute -top-2 -left-2 px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-300 text-sm rounded-tl rounded-br-lg">
            <span>Units: {units}</span>
        </div>
    )
}
