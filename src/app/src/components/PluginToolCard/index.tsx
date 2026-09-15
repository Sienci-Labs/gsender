import cx from 'classnames';
import type { IconType } from 'react-icons';
import { TbPlug, TbShieldCheck, TbUsers } from 'react-icons/tb';
import { Link } from 'react-router';

type PluginToolCardProps = {
    title: string;
    description?: string;
    blurb?: string;
    icon?: IconType;
    link?: string;
    onClick?: () => void;
    official: boolean;
};

const PluginToolCard = ({
    title,
    description,
    blurb,
    icon: Icon,
    link,
    onClick,
    official,
}: PluginToolCardProps) => {
    const CardContent = (
        <div
            onClick={onClick}
            className={cx(
                'relative cursor-pointer rounded-lg shadow-sm p-4 pt-5',
                'flex flex-col items-center justify-between text-center gap-4',
                'transition-all duration-300 ease-in-out h-full min-h-56',
                'hover:bg-gray-300 bg-gray-100 dark:bg-surface-raised',
                'border border-t-[3px]',
                official ? 'border-teal-600' : 'border-purple-400',
            )}
        >
            <div className="absolute top-2.5 left-3 flex items-center gap-1">
                <TbPlug
                    className={cx(
                        'w-4 h-4',
                        official ? 'text-teal-200' : 'text-purple-200',
                    )}
                />
                <span
                    className={cx(
                        'text-xs tracking-wider font-medium uppercase',
                        official ? 'text-teal-200' : 'text-purple-200',
                    )}
                >
                    Plugin
                </span>
            </div>

            <div
                className={cx(
                    'absolute top-2 right-2 flex items-center gap-1 rounded-full pl-2 pr-2.5 py-1',
                    official
                        ? 'bg-teal-600'
                        : 'bg-[#2a2440] border-[0.5px] border-purple-600',
                )}
            >
                {official ? (
                    <TbShieldCheck className="w-4 h-4 text-teal-50" />
                ) : (
                    <TbUsers className="w-4 h-4 text-purple-100" />
                )}
                <span
                    className={cx(
                        'text-xs font-medium',
                        official ? 'text-teal-50' : 'text-purple-100',
                    )}
                >
                    {official ? 'Official' : 'Community'}
                </span>
            </div>

            <p className="text-blue-500 dark:text-content-primary text-lg font-bold leading-none tracking-tight m-0">
                {title}
            </p>

            {blurb ? (
                <p className="text-sm text-muted-foreground m-0">{blurb}</p>
            ) : (
                description && (
                    <p className="text-sm text-muted-foreground m-0">
                        {description}
                    </p>
                )
            )}

            {Icon && (
                <div
                    className={cx(
                        'w-11 h-11 rounded-[10px] flex items-center justify-center',
                        official
                            ? 'bg-teal-600/15 dark:bg-teal-600/25'
                            : 'bg-purple-400/15 dark:bg-purple-400/25',
                    )}
                >
                    <Icon
                        className={cx(
                            'w-6 h-6',
                            official
                                ? 'text-teal-600 dark:text-teal-200'
                                : 'text-purple-600 dark:text-purple-200',
                        )}
                    />
                </div>
            )}
        </div>
    );

    if (link) {
        return <Link to={link}>{CardContent}</Link>;
    }

    return CardContent;
};

export default PluginToolCard;
