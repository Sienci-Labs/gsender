import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Button } from 'app/components/Button';
import { Badge } from 'app/components/shadcn/Badge';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    CircleHelp,
} from 'lucide-react';
import cn from 'classnames';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import {
    ATCIMacroConfig,
    Macro,
} from 'app/features/ATC/assets/defaultATCIMacros.ts';
import GcodeViewer from 'app/components/GcodeViewer';
import store from 'app/store';

type TemplateUploadData = Pick<ATCIMacroConfig, 'version' | 'macros'> &
    Partial<ATCIMacroConfig>;

interface TemplateManagerContextValue {
    defaultVersion: number;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUploadClick: () => void;
    selectedTemplate: Macro | null;
    selectTemplate: (template: Macro) => void;
    sortedTemplates: Macro[];
    templates: ATCIMacroConfig | undefined;
    uploadError: string;
}

const TemplateManagerContext = createContext<
    TemplateManagerContextValue | undefined
>(undefined);

function useTemplateManagerContext() {
    const context = useContext(TemplateManagerContext);
    if (!context) {
        throw new Error(
            'Template manager components must be used within TemplateManagerProvider',
        );
    }
    return context;
}

export function TemplateManagerProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { templates, setTemplates } = useConfigContext();
    const [selectedTemplateName, setSelectedTemplateName] = useState<
        string | null
    >(null);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultVersion = store.get('widgets.atc.templates.version', 20250909);

    const sortedTemplates = useMemo(() => {
        if (!templates?.macros) {
            return [];
        }
        return [...templates.macros].sort((a, b) => a.name.localeCompare(b.name));
    }, [templates]);

    useEffect(() => {
        if (!sortedTemplates.length) {
            setSelectedTemplateName(null);
            return;
        }

        if (
            !selectedTemplateName ||
            !sortedTemplates.some(
                (template) => template.name === selectedTemplateName,
            )
        ) {
            setSelectedTemplateName(sortedTemplates[0].name);
        }
    }, [selectedTemplateName, sortedTemplates]);

    const selectedTemplate = useMemo(() => {
        if (!selectedTemplateName) {
            return null;
        }

        return (
            sortedTemplates.find(
                (template) => template.name === selectedTemplateName,
            ) || null
        );
    }, [selectedTemplateName, sortedTemplates]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            setUploadError('Please select a valid JSON file');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const content = loadEvent.target?.result;
                if (typeof content !== 'string') {
                    throw new Error('Invalid file content');
                }

                const data = JSON.parse(content) as TemplateUploadData;
                if (!data.version || !Array.isArray(data.macros)) {
                    throw new Error('Invalid template file structure');
                }

                const nextTemplates = {
                    ...(templates || store.get('widgets.atc.templates', {})),
                    ...data,
                    sdVersion: templates?.sdVersion ?? defaultVersion,
                } as ATCIMacroConfig;

                setTemplates(nextTemplates);
                store.replace('widgets.atc.templates', nextTemplates);
                setSelectedTemplateName(nextTemplates.macros[0]?.name ?? null);
                setUploadError('');
            } catch {
                setUploadError('Invalid JSON file or incorrect structure');
            } finally {
                input.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const value: TemplateManagerContextValue = {
        defaultVersion,
        fileInputRef,
        handleFileUpload,
        handleUploadClick,
        selectedTemplate,
        selectTemplate: (template) => setSelectedTemplateName(template.name),
        sortedTemplates,
        templates,
        uploadError,
    };

    return (
        <TemplateManagerContext.Provider value={value}>
            {children}
        </TemplateManagerContext.Provider>
    );
}

function TemplateManagerVersionInfo() {
    const { defaultVersion, templates } = useTemplateManagerContext();
    const localTemplateVersion = templates?.version ?? defaultVersion;
    const controllerTemplateVersion = templates?.sdVersion;
    const hasControllerTemplateVersion =
        typeof controllerTemplateVersion === 'number' &&
        Number.isFinite(controllerTemplateVersion);

    type VersionSyncState =
        | 'in_sync'
        | 'controller_outdated'
        | 'local_outdated'
        | 'unknown';

    let versionSyncState: VersionSyncState = 'unknown';

    if (hasControllerTemplateVersion) {
        if (localTemplateVersion > controllerTemplateVersion) {
            versionSyncState = 'controller_outdated';
        } else if (localTemplateVersion < controllerTemplateVersion) {
            versionSyncState = 'local_outdated';
        } else {
            versionSyncState = 'in_sync';
        }
    }

    const baseVersionBadgeClass =
        'text-sm border-2 font-bold px-3 py-1 bg-white dark:bg-slate-900';
    const neutralBadgeClass =
        'border-slate-500 text-slate-700 dark:border-slate-500 dark:text-slate-200';
    const upToDateBadgeClass =
        'border-emerald-600 bg-emerald-100/70 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200';
    const controllerOutdatedBadgeClass =
        'border-amber-600 bg-amber-100/70 text-amber-800 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-200';
    const localOutdatedBadgeClass =
        'border-sky-600 bg-sky-100/70 text-sky-800 dark:border-sky-400 dark:bg-sky-900/30 dark:text-sky-200';

    const localVersionBadgeClass = cn(baseVersionBadgeClass, {
        [neutralBadgeClass]:
            versionSyncState === 'unknown' || versionSyncState === 'in_sync',
        [upToDateBadgeClass]: versionSyncState === 'controller_outdated',
        [localOutdatedBadgeClass]: versionSyncState === 'local_outdated',
    });
    const controllerVersionBadgeClass = cn(baseVersionBadgeClass, {
        [neutralBadgeClass]:
            versionSyncState === 'unknown' || versionSyncState === 'in_sync',
        [controllerOutdatedBadgeClass]:
            versionSyncState === 'controller_outdated',
        [upToDateBadgeClass]: versionSyncState === 'local_outdated',
    });

    const syncStatusLabel =
        versionSyncState === 'controller_outdated'
            ? 'Controller outdated'
            : versionSyncState === 'local_outdated'
              ? 'Local outdated'
              : versionSyncState === 'in_sync'
                ? 'In sync'
                : 'Controller version unavailable';
    const syncStatusBadgeClass = cn(
        'h-6 min-w-[11rem] justify-center gap-1.5 border px-2.5 py-0 text-xs font-semibold shadow-sm',
        {
            'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-white':
                versionSyncState === 'in_sync',
            'border-amber-500 bg-amber-500 text-black dark:border-amber-400 dark:bg-amber-400 dark:text-black':
                versionSyncState === 'controller_outdated',
            'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500 dark:text-white':
                versionSyncState === 'local_outdated',
            'border-slate-600 bg-slate-600 text-white dark:border-slate-500 dark:bg-slate-500 dark:text-white':
                versionSyncState === 'unknown',
        },
    );
    const SyncStatusIcon =
        versionSyncState === 'in_sync'
            ? CheckCircle2
            : versionSyncState === 'unknown'
              ? CircleHelp
              : AlertTriangle;

    return (
        <div className="border border-border bg-white dark:border-slate-700 dark:bg-dark-darker px-4 py-3">
            <div className="flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-2 min-w-[16rem]">
                    <span className="text-sm font-semibold dark:text-white">
                        Local Templates:
                    </span>
                    <Badge variant="secondary" className={localVersionBadgeClass}>
                        v{localTemplateVersion}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 min-w-[16rem]">
                    <span className="text-sm font-semibold dark:text-white">
                        Controller Templates:
                    </span>
                    <Badge
                        variant="secondary"
                        className={controllerVersionBadgeClass}
                    >
                        {hasControllerTemplateVersion
                            ? `v${controllerTemplateVersion}`
                            : '--'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 min-w-[14rem]">
                    <span className="text-sm font-semibold dark:text-white">
                        Status:
                    </span>
                    <Badge variant="secondary" className={syncStatusBadgeClass}>
                        <SyncStatusIcon className="h-3.5 w-3.5" />
                        {syncStatusLabel}
                    </Badge>
                </div>
            </div>
        </div>
    );
}

function TemplateManagerUploadSection() {
    const { handleUploadClick, uploadError } = useTemplateManagerContext();

    return (
        <div className="border border-border bg-white dark:border-slate-700 dark:bg-dark-darker p-3">
            <Button
                onClick={handleUploadClick}
                className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
                <Upload className="h-4 w-4" />
                Upload JSON Template File
            </Button>
            {uploadError && (
                <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                </div>
            )}
        </div>
    );
}

function TemplateViewer({
    className = '',
}: {
    className?: string;
}) {
    const { selectedTemplate } = useTemplateManagerContext();

    return (
        <div
            className={cn(
                'border border-border bg-white dark:border-slate-700 dark:bg-dark-darker flex flex-col min-h-0 overflow-hidden',
                className,
            )}
        >
            <h1 className="text-sm font-semibold p-2 text-blue-500">
                {selectedTemplate ? selectedTemplate.name : 'Content'}
            </h1>
            <div className="flex-1 min-h-0 p-2 overflow-hidden">
                <div className="border rounded h-full min-h-0 overflow-hidden dark:border-slate-700 dark:bg-slate-900/50">
                    {selectedTemplate ? (
                        <div className="h-full min-h-0 overflow-auto overscroll-contain p-2">
                            <GcodeViewer
                                gcode={selectedTemplate.content}
                                className="dark:text-white"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            Select a macro to view its contents
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TemplateManagerListContent({
    className = '',
    showUploadButton = false,
}: {
    className?: string;
    showUploadButton?: boolean;
}) {
    const { selectedTemplate, selectTemplate, sortedTemplates } =
        useTemplateManagerContext();

    return (
        <div
            className={cn(
                'flex flex-col min-h-0 h-full gap-3',
                className,
            )}
        >
            {showUploadButton && <TemplateManagerUploadSection />}

            <div className="border border-border bg-white dark:border-slate-700 dark:bg-dark-darker flex flex-col min-h-0 flex-1 overflow-hidden">
                <h1 className="text-sm font-semibold text-blue-500 p-2">
                    Macros ({sortedTemplates.length})
                </h1>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    {sortedTemplates.map((template) => (
                        <button
                            key={template.name}
                            onClick={() => selectTemplate(template)}
                            className={cn(
                                'w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2 transition-colors',
                                selectedTemplate?.name === template.name &&
                                    'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50',
                            )}
                        >
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                            <span className="font-medium dark:text-white">
                                {template.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TemplateManagerFileInput() {
    const { fileInputRef, handleFileUpload } = useTemplateManagerContext();

    return (
        <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
        />
    );
}

export function TemplateManagerMainContent({
    className = '',
}: {
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex h-full flex-col gap-4 min-h-0 overflow-hidden portrait:text-base',
                className,
            )}
        >
            <TemplateManagerVersionInfo />
            <TemplateViewer className="flex-1" />
            <TemplateManagerFileInput />
        </div>
    );
}

function TemplatesTabContent() {
    return (
        <div className="flex h-full flex-col gap-4 min-h-0 overflow-hidden">
            <TemplateManagerVersionInfo />
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1 min-h-0">
                <TemplateManagerListContent
                    className="md:col-span-2"
                    showUploadButton
                />
                <TemplateViewer className="md:col-span-4" />
            </div>
            <TemplateManagerFileInput />
        </div>
    );
}

export const TemplatesTab: React.FC = () => {
    return (
        <TemplateManagerProvider>
            <TemplatesTabContent />
        </TemplateManagerProvider>
    );
};
