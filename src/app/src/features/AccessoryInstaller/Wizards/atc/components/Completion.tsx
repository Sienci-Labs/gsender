import { CheckCircle } from 'lucide-react';

export function ATCCompletion() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <CheckCircle size={80} className="text-green-500 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Setup Complete!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Reconnect to your CNC to start using your ATC.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Suggested Next Steps:
                </h3>
                <ul className="text-left text-gray-700 dark:text-white space-y-2">
                    <li>• Test your ATC with a tool change</li>
                    <li>• Perform spindle warm up</li>
                </ul>
            </div>
        </div>
    );
}
