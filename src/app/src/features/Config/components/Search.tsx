import React, { useRef } from 'react';
import { useSettings } from 'app/features/Config/utils/SettingsContext.tsx';

export function Search() {
    const { searchTerm, setSearchTerm } = useSettings();
    const inputRef = useRef<HTMLInputElement>(null);

    function onSearchChange() {
        setSearchTerm(inputRef.current.value);
    }

    function onSearchClear(e) {
        e.preventDefault();
        setSearchTerm('');
    }

    return (
        <form className="flex items-center min-w-80">
            <label htmlFor="simple-search" className="sr-only">
                Search
            </label>
            <div className="relative w-full">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg
                        className="w-4 h-4 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                    </svg>
                </div>
                <input
                    type="text"
                    id="simple-search"
                    className="bg-gray-50 focus:outline-none border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                    placeholder="Search Config"
                    value={searchTerm}
                    onChange={onSearchChange}
                    onSubmit={(e) => e.preventDefault()}
                    ref={inputRef}
                />
            </div>
            <button
                onClick={onSearchClear}
                type="button"
                className="p-2.5 ms-2 text-sm font-medium text-white bg-robin-400 rounded-lg border border-blue-400 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
            >
                Clear
            </button>
        </form>
    );
}
