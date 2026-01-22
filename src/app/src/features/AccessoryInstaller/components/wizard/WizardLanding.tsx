import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import { SubWizard, ValidationResult } from '../../types/wizard';
import { ValidationBanner } from 'app/features/AccessoryInstaller/components/wizard/ValidationBanner.tsx';
import PlaceholderImage from '../../Wizards/assets/placeholder.png';

interface WizardLandingProps {
    title: string;
    subWizards: SubWizard[];
    onSelectSubWizard: (subWizard: SubWizard) => void;
    onBack?: () => void;
    validations?: (() => ValidationResult)[];
}

export function WizardLanding({
    title,
    subWizards,
    onSelectSubWizard,
    onBack,
    validations,
}: WizardLandingProps) {
    const activeSubWizard = subWizards.find(
        (sw) => sw.id === subWizards[0]?.id,
    );

    const hasValidationFailures = () => {
        if (!validations || validations.length === 0) return false;

        for (const validation of validations) {
            const result = validation();
            if (!result.success) {
                return true;
            }
        }
        return false;
    };

    const validationsFailed = hasValidationFailures();

    return (
        <div className="h-full bg-gray-50 flex portrait:flex-col portrait:w-full">
            <div className="w-3/5 portrait:w-full portrait:h-3/5 p-12 flex flex-col">
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
                    <ValidationBanner validations={validations} />
                    <div className="flex flex-col gap-3 mt-12 max-w-md">
                        {subWizards.map((subWizard, index) => {
                            const isActive = index === 0;
                            const isDisabledBySequence = index > 0;
                            const isDisabled =
                                validationsFailed || isDisabledBySequence;

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
                        isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isActive
                              ? 'bg-gray-900 text-white hover:bg-gray-800'
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

            <div className="w-2/5 portrait:w-full portrait:h-2/5 bg-gray-200 p-12 flex flex-col justify-between">
                <div className="flex items-center justify-center flex-1">
                    <img
                        alt="Placeholder starter image"
                        src={PlaceholderImage}
                        className="w-[500px]"
                    />
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
                                Follow along in our{' '}
                                <a href="#" className="text-blue-500 font-bold">
                                    online resources
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
