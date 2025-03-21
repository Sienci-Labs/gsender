import { Link } from 'react-router';
import { IconType } from 'react-icons';

import { Card, CardTitle, CardDescription } from 'app/components/shadcn/Card';

type ToolCardProps = {
    title: string;
    description: string;
    icon: IconType;
    link: string;
};

const ToolCard = ({ title, description, icon: Icon, link }: ToolCardProps) => {
    return (
        <Link to={link}>
            <Card
                className="hover:bg-gray-300 bg-gray-100 cursor-pointer p-4 
                flex flex-col items-center justify-between text-center gap-4 min-h-48 
                transition-all duration-300 ease-in-out hover:scale-[1.02] h-full dark:bg-dark"
            >
                <CardTitle className="dark:text-white">{title}</CardTitle>

                <CardDescription className="text-sm text-gray-500">
                    {description}
                </CardDescription>

                <Icon className="w-14 h-14 dark:text-white" />
            </Card>
        </Link>
    );
};

export default ToolCard;
