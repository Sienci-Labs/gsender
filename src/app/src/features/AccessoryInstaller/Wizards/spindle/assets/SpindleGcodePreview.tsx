import { firmwarePastVersion } from 'app/lib/firmwareSemver.ts';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { grblCoreGcode, sienciHalGcode } from './SpindleConfig.tsx';

export function SpindleGcodePreview() {
    const isGrblCore = firmwarePastVersion(ATCI_SUPPORTED_VERSION);
    const lines = isGrblCore ? grblCoreGcode : sienciHalGcode;
    const label = isGrblCore ? 'grblCore' : 'sienciHAL';

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {label}
                </span>
            </div>
            <div className="relative flex-1">
                <div className="rounded-md absolute top-0 left-0 right-0 bottom-0 overflow-auto">
                    <pre className="font-mono text-sm">
                        {lines.map((line, index) => (
                            <div
                                key={index}
                                className={`py-1 px-2 rounded-sm ${
                                    index % 2 === 0
                                        ? 'bg-gray-200 dark:bg-dark-lighter'
                                        : ''
                                }`}
                            >
                                <span className="text-muted-foreground mr-4">
                                    {index + 1}
                                </span>
                                {line}
                            </div>
                        ))}
                    </pre>
                </div>
            </div>
        </div>
    );
}
