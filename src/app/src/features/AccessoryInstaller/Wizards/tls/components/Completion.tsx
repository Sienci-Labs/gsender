import { CheckCircle } from 'lucide-react';

export function TLSCompletion() {
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
        </div>
    );
}
