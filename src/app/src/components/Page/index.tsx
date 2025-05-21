import cn from 'classnames';
import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import Button from 'app/components/Button';
import { cx } from 'class-variance-authority';

type PageProps = {
    children: React.ReactNode;
    title: string;
    description?: string;
    withBorder?: boolean;
    withPadding?: boolean;
    withFullPadding?: boolean;
    withFixedArea?: boolean;
    withGoBackButton?: boolean;
};

const Page = ({
    children,
    title,
    description,
    withBorder,
    withPadding = true,
    withFullPadding,
    withFixedArea,
    withGoBackButton,
}: PageProps) => {
    const navigate = useNavigate();
    const canGoBack = window.history.length > 1;

    return (
        <div
            className={cn(
                withBorder && 'border',
                withPadding && !withFullPadding && 'p-4 pb-0', // it helps fitting on small screens a lot if there isnt padding on the bottom
                withFullPadding && 'p-4',
                withFixedArea && 'fixed-content-area',
                'w-full h-full flex flex-col',
            )}
        >
            <div className="flex items-center justify-between mb-2 pb-2 min-h-14 border-b border-gray-200 rounded-b-lg">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-500">{description}</p>
                    )}
                </div>

                {withGoBackButton && (
                    <Button
                        variant="outline"
                        onClick={() =>
                            canGoBack ? navigate(-1) : navigate('/')
                        }
                        size="md"
                        className="flex items-center justify-center"
                    >
                        <LuArrowLeft className="w-6 h-6 mr-1" />
                        Go Back
                    </Button>
                )}
            </div>
            <div
                className={cx(
                    'w-full h-full',
                    withFixedArea && 'overflow-y-auto overflow-x-hidden',
                )}
            >
                {children}
            </div>
        </div>
    );
};

export default Page;
