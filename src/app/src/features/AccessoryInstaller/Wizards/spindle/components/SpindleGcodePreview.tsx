import { firmwarePastVersion } from 'app/lib/firmwareSemver.ts';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { grblCoreGcode, sienciHalGcode } from './SpindleConfig.tsx';

export function SpindleGcodePreview() {
    const isGrblCore = firmwarePastVersion(ATCI_SUPPORTED_VERSION);
    const lines = isGrblCore ? grblCoreGcode : sienciHalGcode;
    const label = isGrblCore ? `grblHAL (>${ATCI_SUPPORTED_VERSION})` : `sienciHAL (< ${ATCI_SUPPORTED_VERSION})`;

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {label}
                </span>
            </div>
            <div>
                <div className="rounded-md bg-white dark:bg-dark-lighter">
                    <div className="font-mono text-sm">
                        {lines.map((line, index) => (
                            <div
                                key={index}
                                className={`py-1 px-2 text-gray-900 dark:text-gray-100 ${
                                    index % 2 === 0
                                        ? 'bg-gray-100 dark:bg-dark'
                                        : ''
                                }`}
                            >
                                <span className="text-gray-500 dark:text-gray-400 mr-4">
                                    {index + 1}
                                </span>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
