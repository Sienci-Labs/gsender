import React, { forwardRef } from 'react';

type SpiralIconProps = {
    checked?: boolean;
    className?: string;
    onClick?: () => void;
};

const SpiralIcon = forwardRef<SVGSVGElement, SpiralIconProps>((props, ref) => {
    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="3 3 25 24"
            {...props}
        >
            <rect
                width="100%"
                height="100%"
                x="0"
                y="0"
                fill="none"
                stroke="none"
            />
            <g className="currentLayer">
                <g>
                    <g
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                        <path d="M4 3L3 3 3 4 3 26 3 27 4 27 23 27 24 27 24 26 24 8 24 7 23 7 8 7 7 7 7 8 7 22 7 23 8 23 19 23 20 23 20 22 20 12 20 11 19 11 12 11 11 11 11 12 11 18 11 19 12 19 15 19 16 19 16 18 16 15 15 15 14 15 14 16 15 16 15 18 12 18 12 12 19 12 19 22 8 22 8 8 23 8 23 26 4 26 4 4 27 4 27 27 28 27 28 3 27 3z" />
                    </g>
                </g>
            </g>
        </svg>
    );
});

SpiralIcon.displayName = 'SpiralIcon';

export default SpiralIcon;
