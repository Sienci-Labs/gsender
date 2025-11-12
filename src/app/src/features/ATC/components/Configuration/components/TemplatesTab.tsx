import React, { useState, useRef } from 'react';
import { Button } from 'app/components/Button';
import { Badge } from 'app/components/shadcn/Badge';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import cn from 'classnames';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import GcodeViewer from 'app/components/GcodeViewer';
import store from 'app/store';

interface Template {
    name: string;
    content: string;
}

interface TemplateData {
    version: string;
    macros: Template[];
}

export const TemplatesTab: React.FC = () => {
    const { templates, setTemplates } = useConfigContext();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        templates?.macros[0] || null,
    );
    const [uploadError, setUploadError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultVersion = store.get('widgets.atc.templates.version', 20250909);
    const versionMismatch =
        templates && templates?.sdVersion !== defaultVersion;

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setUploadError('Please select a valid JSON file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content) as TemplateData;

                // Validate the structure
                if (!data.version || !Array.isArray(data.macros)) {
                    throw new Error('Invalid template file structure');
                }

                data.sdVersion = templates.sdVersion;
                setTemplates(data);
                store.replace('widgets.atc.templates', data);
                setSelectedTemplate(data.macros[0] || null);
                setUploadError('');
            } catch (error) {
                setUploadError('Invalid JSON file or incorrect structure');
            }
        };
        reader.readAsText(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const renderLineNumbers = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, index) => (
            <div key={index} className="flex whitespace-nowrap">
                <span className="text-gray-400 text-xs mr-3 select-none w-8 text-right">
                    {index + 1}
                </span>
                <span className="text-xs whitespace-pre">{line}</span>
            </div>
        ));
    };

    return (
        <div className="space-y-4 flex flex-col h-full">
            <div className="grid grid-cols-2 gap-2">
                <div className="border border-border">
                    <div className="py-2 flex items-center justify-center h-full">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                    Template Version:
                                </span>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'text-sm font-bold border px-3 py-1 bg-white text-blue-800',
                                    )}
                                >
                                    {templates.version || defaultVersion}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                    Reported Version:
                                </span>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        'text-sm border-2 border font-bold px-3 py-1',
                                        versionMismatch
                                            ? 'border-red-600 bg-red-600/20 text-red-600'
                                            : '',
                                    )}
                                >
                                    {templates?.sdVersion}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Import Button - Right Half */}
                <div className="border border-border">
                    <div className="py-2 flex items-center justify-center h-full">
                        <Button
                            onClick={handleUploadClick}
                            className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            <Upload className="h-4 w-4" />
                            Upload JSON Template File
                        </Button>

                        {/* Error Message */}
                        {uploadError && (
                            <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
                                <AlertCircle className="h-4 w-4" />
                                {uploadError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1 min-h-0 h-0">
                {/* Macro Listing */}
                <div className="border border-border md:col-span-2 flex flex-col h-full">
                    <h1 className="text-sm font-semibold text-blue-500 p-2">
                        Macros ({templates?.macros.length || 0})
                    </h1>

                    <div className="p-0 flex-1 min-h-0">
                        <div className="h-full overflow-y-auto">
                            {templates?.macros.map((template, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        setSelectedTemplate(template)
                                    }
                                    className={cn(
                                        'w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2 transition-colors',
                                        selectedTemplate?.name ===
                                            template.name &&
                                            'bg-blue-50 border-blue-200',
                                    )}
                                >
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">
                                        {template.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contents */}
                <div className="border border-border md:col-span-4 flex flex-col h-full">
                    <h1 className="text-sm font-semibold p-2 text-blue-500">
                        {selectedTemplate ? selectedTemplate.name : 'Content'}
                    </h1>

                    <div className="flex-1">
                        <div className="border rounded m-2 h-full overflow-auto">
                            {selectedTemplate ? (
                                <GcodeViewer gcode={selectedTemplate.content} />
                            ) : (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    Select a macro to view its contents
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
            />
        </div>
    );
};
