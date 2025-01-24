import React from 'react';
import throttle from 'lodash/throttle';
import uniqueId from 'lodash/uniqueId';

import Button from 'app/components/Button';

import Line from './Line';
import { toast } from 'app/lib/toaster';

interface GcodeViewerProps {
    gcode: string;
}

const GcodeViewer: React.FC<GcodeViewerProps> = ({ gcode }) => {
    const handleCopy = throttle(
        async () => {
            await navigator.clipboard?.writeText(gcode);

            toast.info('Copied G-code to Clipboard');
        },
        2000,
        { trailing: false },
    );

    if (!gcode) {
        return null;
    }

    return (
        <div className="flex flex-col">
            <div className="overflow-auto">
                {gcode.split('\n').map((line: string, i: number) => (
                    <Line
                        key={`${uniqueId()}-${line}`}
                        number={i + 1}
                        text={line}
                    />
                ))}
            </div>
            <Button className="mt-4" onClick={handleCopy}>
                <i className="fas fa-copy mr-2" /> Copy to Clipboard
            </Button>
        </div>
    );
};

export default GcodeViewer;
