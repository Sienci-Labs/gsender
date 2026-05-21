import { Zap, Wrench, Settings } from 'lucide-react';

type NavTab = 'carve' | 'tools' | 'config';

const TABS: { id: NavTab; label: string; Icon: typeof Zap }[] = [
    { id: 'carve',  label: 'Carve',  Icon: Zap },
    { id: 'tools',  label: 'Tools',  Icon: Wrench },
    { id: 'config', label: 'Config', Icon: Settings },
];

interface BottomNavProps {
    active: NavTab;
    onChange: (tab: NavTab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
    return (
        <nav className="grid grid-cols-3 h-16 bg-gray-100 border-t border-gray-200 dark:bg-dark-darker dark:border-dark-lighter shrink-0">
            {TABS.map(({ id, label, Icon }) => {
                const isActive = active === id;
                return (
                    <button
                        key={id}
                        onClick={() => onChange(id)}
                        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                            isActive
                                ? 'bg-robin-100 text-robin-700 border-t-2 border-robin-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.07)] dark:bg-robin-600/20 dark:text-robin-400 dark:border-robin-400 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.22)]'
                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                        }`}
                    >
                        <Icon size={22} />
                        <span className="text-xs font-medium">{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
