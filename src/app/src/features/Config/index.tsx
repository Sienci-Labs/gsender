import React from 'react';
import { Menu } from './components/Menu';

export function Config() {
    const menu = [
        'Basics',
        'Safety',
        'Motors',
        'Probe',
        'Limit Switches',
        'Spindle/Laser',
        'Tool Changing',
        'Rotary',
        'Automations',
        'Shortcuts',
        'Customize UI',
        'About',
    ];
    return (
        <div className="h-full w-4/5 m-auto border border-gray-600 mt-6 mb-6 rounded flex flex-col items-stretch justify-stretch content-stretch">
            <div className="min-h-10">top</div>
            <div className="flex flex-row items-stretch justify-stretch content-stretch">
                <Menu menu={menu} />
                <div>Main</div>
            </div>
        </div>
    );
}
