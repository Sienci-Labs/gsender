import { Link } from 'react-router';
import { IconType } from 'react-icons';

import { Card, CardTitle, CardDescription } from 'app/components/shadcn/Card';

type ToolCardProps = {
    title: string;
    description?: string;
    icon?: IconType;
    link?: string;
    onClick?: () => void;
};

const ToolCard = ({
    title,
    description,
    icon: Icon,
    link,
    onClick,
}: ToolCardProps) => {
    const CardContent = (
        <Card
            className="hover:bg-gray-300 bg-gray-100 cursor-pointer p-4 
            flex flex-col items-center justify-between text-center gap-4 min-h-48 
            transition-all duration-300 ease-in-out hover:scale-[1.02] h-full dark:bg-dark"
            onClick={onClick}
        >
            <CardTitle className="dark:text-white">{title}</CardTitle>

            {description && (
                <CardDescription className="text-sm text-gray-500">
                    {description}
                </CardDescription>
            )}

            {Icon && <Icon className="w-14 h-14 dark:text-white" />}
        </Card>
    );

    if (link) {
        return <Link to={link}>{CardContent}</Link>;
    }

    return CardContent;
};

export default ToolCard;
