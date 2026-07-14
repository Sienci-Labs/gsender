import { CheckCircle } from 'lucide-react';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { firmwareSemver } from 'app/lib/firmwareSemver.ts';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';

export function TLSCompletion() {
    const reportedFirmwareSemver = useTypedSelector(
        (state: RootState) => state.controller.settings.version?.semver,
    );
    const needsReboot = !firmwareSemver(
        Number(reportedFirmwareSemver) || 0,
        ATCI_SUPPORTED_VERSION,
    );

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle size={80} className="text-green-500 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Setup Complete!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Your Tool Length Sensor and tool change behaviour have been
                configured.
            </p>
            {needsReboot && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Next Steps:
                    </h3>
                    <ul className="text-left text-gray-700 dark:text-white space-y-2">
                        <li>
                            • Restart your controller using the power switch
                            (power cycle)
                        </li>
                        <li>
                            • Reconnect in gSender to finish setting up your
                            Tool Length Sensor.
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
