import cn from 'classnames';
import { useRouter, useCanGoBack } from '@tanstack/react-router';
import { LuArrowLeft } from 'react-icons/lu';

import { Button } from 'app/components/shadcn/Button';

type PageProps = {
    children: React.ReactNode;
    title: string;
    withBorder?: boolean;
    withPadding?: boolean;
    withGoBackButton?: boolean;
};

const Page = ({
    children,
    title,
    withBorder,
    withPadding = true,
    withGoBackButton,
}: PageProps) => {
    const navigate = useRouter();
    const canGoBack = useCanGoBack();

    return (
        <div
            className={cn(
                withBorder && 'border',
                withPadding && 'p-4',
                'w-full',
            )}
        >
            <div className="flex items-center justify-between mb-4 pb-4 min-h-12 border-b border-gray-200 rounded-b-lg">
                <h1 className="text-3xl font-bold">{title}</h1>

                {withGoBackButton && (
                    <Button
                        variant="outline"
                        onClick={() =>
                            canGoBack
                                ? navigate.history.back()
                                : navigate({ to: '/' })
                        }
                        size="lg"
                        className="flex items-center justify-center"
                    >
                        <LuArrowLeft className="w-6 h-6 mr-1" />
                        Go Back
                    </Button>
                )}
            </div>
            {children}
        </div>
    );
};

export default Page;
