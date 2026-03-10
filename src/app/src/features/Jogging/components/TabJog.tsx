import cn from 'classnames';

export interface TabJogProps {
    topHandlers: object;
    bottomHandlers: object;
    canClick?: boolean;
    idForTest: string;
    topLabel?: string;
    bottomLabel?: string;
    onTopKeyDown?: (e: React.KeyboardEvent) => void;
    onBottomKeyDown?: (e: React.KeyboardEvent) => void;
}

const TabJog = (props: TabJogProps) => {
    const standardColourClass =
        'hover:fill-blue-600 fill-blue-500 active:fill-blue-700';
    const disabledColorClass =
        'fill-gray-400 hover:fill-gray-400 dark:fill-gray-700 dark:hover:fill-gray-600 pointer-events-none';

    return (
        <svg
            viewBox="0 0 50 187"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('w-[45px] portrait:w-[52px] h-[168px] portrait:h-[195px]', {
                'cursor-pointer': props.canClick,
                'cursor-not-allowed': !props.canClick,
            })}
        >
            <path
                role="button"
                tabIndex={props.canClick ? 0 : -1}
                aria-label={props.topLabel}
                d="M0.5 10C0.5 4.75329 4.75329 0.5 10 0.5H40C45.2467 0.5 49.5 4.7533 49.5 10V88.5H0.5V10Z"
                fill="#3F85C7"
                className={cn(
                    props.canClick ? standardColourClass : disabledColorClass,
                )}
                onKeyDown={props.onTopKeyDown}
                {...props.topHandlers}
                testId={props.idForTest + '+'}
            />
            <path
                role="button"
                tabIndex={props.canClick ? 0 : -1}
                aria-label={props.bottomLabel}
                d="M0.5 98.5H49.5V177C49.5 182.247 45.2467 186.5 40 186.5H10C4.75329 186.5 0.5 182.247 0.5 177V98.5Z"
                fill="#3F85C7"
                className={cn(
                    props.canClick ? standardColourClass : disabledColorClass,
                )}
                onKeyDown={props.onBottomKeyDown}
                {...props.bottomHandlers}
                testId={props.idForTest + '-'}
            />
            <line y1={93.5} x2={49} y2={93.5} stroke="#CECECE" />
        </svg>
    );
};
export default TabJog;
