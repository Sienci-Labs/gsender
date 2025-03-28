import React from 'react';

interface MultiInputBlockProps {
    label?: string;
    firstComponent: React.ReactNode;
    secondComponent: React.ReactNode;
    divider?: string | React.ReactNode;
}

const MultiInputBlock: React.FC<MultiInputBlockProps> = ({
    label,
    firstComponent,
    secondComponent,
    divider,
}) => {
    return (
        <div className="grid gap-4 grid-cols-[1fr_2fr] w-full items-center ">
            {label && (
                <label className="text-lg self-center font-light dark:text-white">
                    {label}
                </label>
            )}

            <div
                className={`grid ${divider ? 'grid-cols-[4fr_1fr_5fr]' : 'grid-cols-2 gap-2'} w-full items-center mb-4`}
            >
                {firstComponent}

                {divider && typeof divider === 'string' ? (
                    <span className="text-center text-xl font-light dark:text-white">
                        {divider}
                    </span>
                ) : (
                    divider
                )}

                {secondComponent}
            </div>
        </div>
    );
};

export default MultiInputBlock;
