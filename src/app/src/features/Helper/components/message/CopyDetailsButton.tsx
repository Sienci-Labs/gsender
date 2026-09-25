import Button from 'app/components/Button';
import { toast } from 'app/lib/toaster';
import reduxStore from 'app/store/redux';
import get from 'lodash/get';
import { Copy } from 'lucide-react';
import { formatHelperDetails } from '../../messages/normalize';
import type { NormalizedHelperMessage } from '../../messages/types';

export function CopyDetailsButton({
    message,
}: {
    message: NormalizedHelperMessage;
}) {
    const handleCopy = async () => {
        const controllerType = get(
            reduxStore.getState(),
            'controller.type',
            'Unknown',
        );
        try {
            await navigator.clipboard.writeText(
                formatHelperDetails(message, controllerType),
            );
            toast.success('Copied');
        } catch {
            toast.error('Unable to copy details');
        }
    };

    return (
        <Button
            variant="ghost"
            size="custom"
            className="min-h-11 gap-2 px-3 text-base"
            onClick={handleCopy}
        >
            <Copy size={18} />
            Copy details
        </Button>
    );
}
