import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import { SubWizard } from '../../types/wizard';

interface WizardLandingProps {
    title: string;
    subWizards: SubWizard[];
    onSelectSubWizard: (subWizard: SubWizard) => void;
    onBack?: () => void;
}

export function WizardLanding({
    title,
    subWizards,
    onSelectSubWizard,
    onBack,
}: WizardLandingProps) {
    const activeSubWizard = subWizards.find(
        (sw) => sw.id === subWizards[0]?.id,
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <div className="w-3/5 p-12 flex flex-col">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 self-start"
                    >
                        <ArrowLeft size={20} />
                        Back to Wizards
                    </button>
                )}

                <div className="flex-1">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        {title}
                    </h1>

                    {activeSubWizard?.estimatedTime && (
                        <p className="text-gray-700 mb-1">
                            <span className="font-semibold">
                                Estimated time:
                            </span>{' '}
                            {activeSubWizard.estimatedTime}
                        </p>
                    )}

                    {activeSubWizard?.configVersion && (
                        <p className="text-gray-700 mb-8">
                            Configuration File Version:{' '}
                            {activeSubWizard.configVersion}
                        </p>
                    )}

                    <div className="flex flex-col gap-3 mt-12 max-w-md">
                        {subWizards.map((subWizard, index) => {
                            const isActive = index === 0;
                            const isDisabled = index > 0;

                            return (
                                <button
                                    key={subWizard.id}
                                    onClick={() =>
                                        !isDisabled &&
                                        onSelectSubWizard(subWizard)
                                    }
                                    disabled={isDisabled}
                                    className={`
                    flex items-center justify-between px-6 py-4 rounded-lg text-left
                    transition-all duration-200 font-medium text-lg
                    ${
                        isActive
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : isDisabled
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                                >
                                    <span>{subWizard.title}</span>
                                    <ArrowRight size={20} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="w-2/5 bg-gray-200 p-12 flex flex-col justify-between">
                <div className="flex items-center justify-center flex-1">
                    <div className="w-full aspect-video bg-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <div className="w-32 h-32 mx-auto mb-4 border-4 border-gray-400 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-16 h-16"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-2 border-blue-400 rounded-lg p-6 bg-white">
                    <div className="flex items-start gap-3">
                        <HelpCircle
                            className="text-blue-500 flex-shrink-0"
                            size={24}
                        />
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                Need Help?
                            </h3>
                            <p className="text-gray-600">
                                Follow along in our online resources
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
