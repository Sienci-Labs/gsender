import { LoaderIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppTranslation } from 'app/i18n';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
    const { t } = useAppTranslation();
    return (
        <LoaderIcon
            role="status"
            aria-label={t('common:status.loading')}
            className={cn('size-4 animate-spin', className)}
            {...props}
        />
    );
}

export { Spinner };
