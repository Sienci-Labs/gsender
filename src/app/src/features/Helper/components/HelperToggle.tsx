import cn from 'classnames';
import React from 'react';
import { RiSpeakLine } from 'react-icons/ri';
import { toggleHelperVisibility } from 'app/store/redux/slices/helper.slice';
import { RootState } from 'app/store/redux';
import { useSelector } from 'react-redux';
import reduxStore from 'app/store/redux';

interface HelperToggleProps {
    minimized: boolean;
}

export function HelperToggle({ active, title, minimized }: HelperToggleProps) {
    const helperTitle = useSelector((state: RootState) => state.helper.title);
    const helperMinimized = useSelector(
        (state: RootState) => state.helper.minimized,
    );

    const handleToggle = () => {
        console.log('called');
        reduxStore.dispatch(toggleHelperVisibility());
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            className={cn(
                'flex w-full flex-col gap-0.5 content-center items-center text-sm text-gray-500 group rounded-xl p-1 m-2 transition-all duration-1000 opacity-100 border border-transparent',
                {
                    'border bg-blue-200 bg-opacity-10': active,
                    'border-transparent bg-transparent bg-opacity-100':
                        minimized,
                },
            )}
        >
            <RiSpeakLine
                className={`text-4xl ${active ? 'text-blue-600' : 'text-gray-600'}`}
            />
            <span className={cn('', { 'opacity-0': minimized })}>
                {helperTitle}
            </span>
        </button>
    );
}
