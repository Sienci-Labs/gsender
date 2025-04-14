import React from 'react';
import { Label } from '../shadcn/Label';

const InputArea = ({
    children,
    label,
}: {
    children: React.ReactNode;
    label: string;
}) => {
    return (
        <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor={label} className="col-span-2">
                {label}
            </Label>
            {children}
        </div>
    );
};

export default InputArea;
