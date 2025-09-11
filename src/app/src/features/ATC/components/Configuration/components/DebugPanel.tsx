import React, { useContext } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'app/components/shadcn/card';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';

export const DebugPanel: React.FC = () => {
    const { config } = useConfigContext();

    return (
        <div
            className="w-80 space-y-4 bg-white"
            onClick={(e) => e.stopPropagation()}
        >
            <Card className="border border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                        Debug - Current Values
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs bg-gray-50 p-3 rounded border overflow-y-scroll">
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(config, null, 2)}
                        </pre>
                    </div>
                </CardContent>
            </Card>
            <Card className="border border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                        Generated File
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded border min-h-32 max-h-96 overflow-y-scroll">
                        Generated configuration file will appear here...
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
