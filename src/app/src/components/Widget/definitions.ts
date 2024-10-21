import { ForwardedRef } from 'react';

export interface WidgetProps {
    [key: string]: any;
    className?: string;
    active?: boolean;
    inverted?: boolean;
    disabled?: boolean;
    btnSize?: 'lg' | 'md' | 'sm' | 'xs';
    btnStyle?: 'default' | 'primary' | 'emphasis' | 'flat' | 'link';
    toggle?: React.ReactElement;
    pullRight?: boolean;
    noCaret?: boolean;
    reference?: ForwardedRef<unknown>;
    children?: React.ReactElement | React.ReactElement[];
}
