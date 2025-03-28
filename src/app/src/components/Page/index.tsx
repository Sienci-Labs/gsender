import cn from 'classnames';
import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import Button from 'app/components/Button';

type PageProps = {
    children: React.ReactNode;
    title: string;
    description?: string;
    withBorder?: boolean;
    withPadding?: boolean;
    withGoBackButton?: boolean;
};

const Page = ({
    children,
    title,
    description,
    withBorder,
    withPadding = true,
    withGoBackButton,
}: PageProps) => {
    const navigate = useNavigate();
    const canGoBack = window.history.length > 1;

    return (
        <div
            className={cn(
                withBorder && 'border',
                withPadding && 'p-4',
                'w-full flex flex-col h-full',
            )}
        >
            <div className="flex items-center justify-between mb-4 pb-4 min-h-20 border-b border-gray-200 rounded-b-lg">
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
