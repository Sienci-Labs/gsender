import React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const buttonStyle = tv({
    base: 'border rounded hover:opacity-90 px-3 shadow',
    variants: {
        color: {
            primary: 'border-blue-500 text-white bg-blue-500',
            secondary:
                'border-robin-500 hover:bg-gray-200 text-gray-600 bg-white',
            alt: 'bg-robin-500 text-white border-robin-500',
            disabled: 'border-gray-300 bg-gray-100 text-gray-400',
        },
        disabled: {
            true: 'bg-gray-300 border-gray-400 text-gray-500 hover:bg-gray-300',
        },
    },

    defaultVariants: {
        color: 'secondary',
    },
});

export type ButtonVariants = VariantProps<typeof buttonStyle>;

export interface ButtonProps extends ButtonVariants {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export function Button(props: ButtonProps) {
    return (
        <button
            onClick={props.onClick}
            className={buttonStyle(props)}
            disabled={props.disabled}
        >
            {props.children}
        </button>
    );
}

export function ButtonGroup() {
    return <div></div>;
}

export default Button;
