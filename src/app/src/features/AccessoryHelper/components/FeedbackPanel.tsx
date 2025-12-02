import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { FeedbackMessage } from '../types/wizard';

interface FeedbackPanelProps {
    messages: FeedbackMessage[];
    onClearMessage: (id: string) => void;
}

export function FeedbackPanel({
    messages,
    onClearMessage,
}: FeedbackPanelProps) {
    const latestMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;

    const getIcon = (type: FeedbackMessage['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="text-green-600" />;
            case 'error':
                return <XCircle size={20} className="text-red-600" />;
            case 'warning':
                return <AlertCircle size={20} className="text-orange-600" />;
            case 'info':
                return <Info size={20} className="text-blue-600" />;
        }
    };

    const getStyles = (type: FeedbackMessage['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div className="h-16 mb-6">
            {latestMessage ? (
                <div
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 ${getStyles(latestMessage.type)}`}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(latestMessage.type)}
                    </div>
                    <p className="flex-1 text-sm font-medium">
                        {latestMessage.message}
                    </p>
                    <button
                        onClick={() => onClearMessage(latestMessage.id)}
                        className="flex-shrink-0 hover:opacity-70 transition-opacity"
                        aria-label="Clear message"
                    >
                        <X size={18} />
                    </button>
                </div>
            ) : null}
        </div>
    );
}
