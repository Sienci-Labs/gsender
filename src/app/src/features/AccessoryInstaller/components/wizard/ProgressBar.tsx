interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    onExit: () => void;
    isCompleted?: boolean;
}

export function ProgressBar({
    currentStep,
    totalSteps,
    onExit,
    isCompleted = false,
}: ProgressBarProps) {
    const progressPercentage = isCompleted
        ? 100
        : Math.round(((currentStep - 1) / totalSteps) * 100);
    const displayStep = isCompleted ? totalSteps : currentStep;

    return (
        <div className="bg-white dark:bg-dark-darker border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {isCompleted
                            ? 'All Steps Complete'
                            : `Step ${displayStep} of ${totalSteps}`}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {progressPercentage}% Complete
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ease-out ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            <button
                onClick={onExit}
                className="ml-8 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Exit
            </button>
        </div>
    );
}
