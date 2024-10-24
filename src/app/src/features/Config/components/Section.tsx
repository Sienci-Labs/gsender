import React from 'react';

interface SectionProps {
    title: string;
    children?: React.ReactNode;
    activeSection?: number;
}

export function Section(props: SectionProps) {
    return (
        <div>
            <h1 className="mb-2 text-3xl ml-4 font-sans">{props.title}</h1>
            <div className="bg-white rounded-xl shadow p-6">
                {props.children}
            </div>
        </div>
    );
}
