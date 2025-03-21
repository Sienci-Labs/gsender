import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const DarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Initialize state based on current theme
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
        setIsDarkMode(!isDarkMode);
    };

    return (
        <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label={
                isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
            }
        >
            {isDarkMode ? (
                <FiSun className="w-5 h-5 text-yellow-400" />
            ) : (
                <FiMoon className="w-5 h-5 text-gray-600" />
            )}
        </button>
    );
};

export default DarkMode;
