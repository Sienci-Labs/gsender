import { Card, CardDescription, CardTitle } from 'app/components/shadcn/Card';
import cx from 'classnames';
import type { IconType } from 'react-icons';
import { Link } from 'react-router';
import PinButton from './PinButton';

type ToolCardProps = {
    title: string;
    description?: string;
    icon?: IconType;
    link?: string;
    onClick?: () => void;
    pinned?: boolean;
    onTogglePin?: () => void;
};

const ToolCard = ({
    title,
    description,
    icon: Icon,
    link,
    onClick,
    pinned = false,
    onTogglePin,
}: ToolCardProps) => {
    const CardContent = (
        <Card
            className={cx(
                'relative hover:bg-gray-300 bg-gray-100 cursor-pointer p-4',
                'flex flex-col items-center justify-between text-center gap-4',
                'transition-all duration-300 ease-in-out h-full dark:bg-surface-raised min-h-56',
            )}
            onClick={onClick}
        >
            <CardTitle className="dark:text-content-primary">{title}</CardTitle>

            {description && (
                <CardDescription className="text-sm text-gray-600">
                    {description}
                </CardDescription>
            )}

            {Icon && <Icon className="w-14 h-14 dark:text-content-primary" />}

            {onTogglePin && (
                <PinButton
                    pinned={pinned}
                    onToggle={onTogglePin}
                    className="absolute top-1.5 left-1.5"
                />
            )}
        </Card>
    );

    if (link) {
        return <Link to={link}>{CardContent}</Link>;
    }

    return CardContent;
};

export default ToolCard;
