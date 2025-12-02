import { CheckCircle2, Clock, Package } from 'lucide-react';
import { Wizard } from '../types/wizard';

interface WizardCardProps {
    wizard: Wizard;
    isCompleted: boolean;
    onSelect: () => void;
}

export default function WizardCard({
    wizard,
    isCompleted,
    onSelect,
}: WizardCardProps) {
    return (
        <div
            onClick={onSelect}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-200 hover:border-blue-400 overflow-hidden"
        >
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                {wizard.thumbnail ? (
                    <img
                        src={wizard.thumbnail}
                        alt={wizard.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package size={64} className="text-gray-400" />
                )}
                {isCompleted && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2">
                        <CheckCircle2 size={24} />
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                        {wizard.name}
                    </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {wizard.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {wizard.estimatedTime && (
                        <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>{wizard.estimatedTime}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="font-medium">
                            {wizard.steps.length}
                        </span>
                        <span>steps</span>
                    </div>
                </div>

                {wizard.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {wizard.category}
                    </span>
                )}
            </div>
        </div>
    );
}
