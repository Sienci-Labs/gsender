import { CheckCircle } from 'lucide-react';

export function SpindleCompletion() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle size={80} className="text-green-500 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Setup Complete!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Your spindle has been successfully configured and is ready to use.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Next Steps:
                </h3>
                <ul className="text-left text-gray-700 dark:text-white space-y-2">
                    <li>• Restart your controller using the power switch</li>
                    <li>• Ensure the VFD is turned on before restarting the controller</li>
                    <li>• Reconnect in gSender and verify your spindle is working as expected.</li>
                </ul>
            </div>
        </div>
    );
}
