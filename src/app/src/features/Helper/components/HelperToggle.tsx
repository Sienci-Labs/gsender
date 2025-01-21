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
    const helperEnabled = useSelector(
        (state: RootState) => state.helper.active,
    );
    const helperMinimized = useSelector(
        (state: RootState) => state.helper.minimized,
    );

    // Direct user to ongoing action
    const bringAttention = helperEnabled && helperMinimized;

    const handleToggle = () => {
        reduxStore.dispatch(toggleHelperVisibility());
    };

    return (
        <button
            type="button"
            disabled={!helperEnabled}
            onClick={handleToggle}
            className={cn(
                'animate-bounce flex w-full flex-col gap-0.5 content-center items-center text-sm text-gray-500 group rounded-xl transition-all duration-1000 opacity-100 border border-transparent',
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
