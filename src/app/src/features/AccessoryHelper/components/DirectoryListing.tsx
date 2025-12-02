import { Package, Wrench } from 'lucide-react';
import { Wizard } from '../types/wizard';
//import { getAllProgress } from '../utils/storage';
import WizardCard from './WizardCard';

interface WizardSelectionProps {
    wizards: Wizard[];
    onSelectWizard: (wizard: Wizard) => void;
}

export function DirectoryListing({
    wizards = [],
    onSelectWizard,
}: WizardSelectionProps) {
    //const allProgress = getAllProgress();

    return (
        <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Wrench size={40} className="text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">
                            CNC Accessory Setup Wizards
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Select a wizard to configure your CNC machine
                        accessories step-by-step
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wizards.map((wizard) => (
                        <WizardCard
                            key={wizard.id}
                            wizard={wizard}
                            isCompleted={false}
                            onSelect={() => onSelectWizard(wizard)}
                        />
                    ))}
                </div>

                {wizards.length === 0 && (
                    <div className="text-center py-20">
                        <Package
                            size={64}
                            className="text-gray-300 mx-auto mb-4"
                        />
                        <p className="text-gray-500 text-lg">
                            No wizards available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
