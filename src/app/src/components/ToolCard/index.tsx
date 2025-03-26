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
    const cardContent = (
        <Card
            className="hover:bg-gray-300 bg-gray-100 cursor-pointer p-4 
            flex flex-col items-center justify-center text-center gap-4 min-h-48 
            transition-all duration-300 ease-in-out hover:scale-[1.02] h-full"
            onClick={onClick}
        >
            <CardTitle>{title}</CardTitle>

            {description && (
                <CardDescription className="text-sm text-gray-500">
                    {description}
                </CardDescription>
            )}

            {Icon && <Icon className="w-14 h-14" />}
        </Card>
    );

    if (link) {
        return <Link to={link}>{cardContent}</Link>;
    }

    return cardContent;
};

export default ToolCard;
