import { CheckCircle } from 'lucide-react';

export function ATCCompletion() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle size={80} className="text-green-500 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Setup Complete!
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Your ATC has been successfully configured and is ready to use.
                All calibration steps have been completed.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
                <h3 className="font-semibold text-gray-900 mb-2">
                    Next Steps:
                </h3>
                <ul className="text-left text-gray-700 space-y-2">
                    <li>• Test your ATC with a sample tool change</li>
                    <li>• Review the configuration settings if needed</li>
                    <li>• Refer to the documentation for advanced features</li>
                </ul>
            </div>
        </div>
    );
}
