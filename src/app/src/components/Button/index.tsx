import React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const buttonStyle = tv({
    base: 'border rounded hover:opacity-90 py-1 px-3 shadow',
    variants: {
        color: {
            primary: 'border-blue-500 text-white bg-blue-500',
            secondary: 'border-robin-500 hover:bg-gray-200 text-gray-500',
            alt: 'bg-robin-500 text-white border-robin-500',
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
}

export function Button(props: ButtonProps) {
    return (
        <button onClick={props.onClick} className={buttonStyle(props)}>
            {props.children}
        </button>
    );
}

export function ButtonGroup(props: ButtonProps) {
    return <div></div>;
}
