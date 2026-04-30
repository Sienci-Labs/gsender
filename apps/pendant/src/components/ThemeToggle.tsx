import { Sun, Moon } from 'lucide-react';
import store from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

export default function ThemeToggle() {
    const { enableDarkMode = false } = useWorkspaceState();

    const toggle = () => {
        store.set('workspace.enableDarkMode', !enableDarkMode);
    };

    return (
        <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            title={enableDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {enableDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
