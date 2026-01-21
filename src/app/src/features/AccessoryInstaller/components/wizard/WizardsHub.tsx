import { ArrowRight, Settings } from 'lucide-react';
import { Wizard } from '../../types/wizard';

interface WizardsHubProps {
    wizards: Wizard[];
    onSelectWizard: (wizard: Wizard) => void;
    title?: string;
    description?: string;
}

export function WizardsHub({
    wizards,
    onSelectWizard,
    title,
    description,
}: WizardsHubProps) {
    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-6xl mx-auto px-8 py-16">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Settings size={40} className="text-gray-700" />
                        <h1 className="text-5xl font-bold text-gray-900">
                            {title || 'CNC Accessory Wizards'}
                        </h1>
                    </div>
                    {description && (
                        <p className="text-xl text-gray-600 max-w-3xl">
                            {description}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wizards.map((wizard) => {
                        const totalSteps = wizard.subWizards.reduce(
                            (acc, sw) => acc + sw.steps.length,
                            0,
                        );
                        const estimatedTime =
                            wizard.subWizards[0]?.estimatedTime;

                        return (
                            <button
                                key={wizard.id}
                                onClick={() => onSelectWizard(wizard)}
                                className="group bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 text-left border-2 border-gray-100 hover:border-blue-400 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-300" />

                                <div className="relative">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                        {wizard.title}
                                    </h2>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                />
                                            </svg>
                                            <span>
                                                {wizard.subWizards.length}{' '}
                                                configuration
                                                {wizard.subWizards.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                            <span>
                                                {totalSteps} total steps
                                            </span>
                                        </div>

                                        {estimatedTime && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <span>{estimatedTime}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                        <span>Start Wizard</span>
                                        <ArrowRight
                                            size={20}
                                            className="group-hover:translate-x-1 transition-transform"
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {wizards.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                            <Settings size={32} className="text-gray-400" />
                        </div>
                        <p className="text-xl text-gray-500">
                            No wizards available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
