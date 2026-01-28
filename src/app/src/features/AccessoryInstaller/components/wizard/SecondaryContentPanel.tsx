import { ExternalLink, QrCode } from 'lucide-react';
import QRCodeComponent from 'react-qr-code';
import { SecondaryContent } from '../../types/wizard';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';

interface SecondaryContentPanelProps {
    content: SecondaryContent[];
}

export function SecondaryContentPanel({ content }: SecondaryContentPanelProps) {
    if (!content || content.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-full aspect-video bg-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <div className="w-32 h-32 mx-auto border-4 border-gray-400 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-16 h-16"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            {content.map((item, index) => {
                if (item.type === 'image') {
                    return (
                        <div key={index} className="flex-shrink-0">
                            {item.title && (
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    {item.title}
                                </h3>
                            )}
                            <img
                                src={item.content as string}
                                alt={item.title || 'Secondary content'}
                                className="w-full rounded-lg shadow-sm"
                            />
                        </div>
                    );
                }

                if (item.type === 'component') {
                    const Component = item.content as React.ComponentType<any>;
                    return (
                        <div key={index} className="flex-shrink-0">
                            {item.title && (
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    {item.title}
                                </h3>
                            )}
                            <Component {...item.props}/>
                        </div>
                    );
                }

                if (item.type === 'link') {
                    return (
                        <div key={index} className="flex-shrink-0">
                            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <ExternalLink
                                        className="text-blue-500 flex-shrink-0 mt-0.5"
                                        size={18}
                                    />
                                    <div className="flex-1 min-w-0">
                                        {item.title && (
                                            <div className="font-semibold text-gray-900 text-sm mb-1">
                                                {item.title}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-600 mb-2">
                                            {item.content as string}
                                        </div>
                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline break-all"
                                            >
                                                {item.url}
                                            </a>
                                        )}
                                    </div>
                                    {item.url && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                                    <QrCode
                                                        className="text-gray-600"
                                                        size={18}
                                                    />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-4 mr-14"
                                                sideOffset={10}
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        Scan QR Code
                                                    </div>
                                                    <div className="bg-white p-2 rounded border border-gray-100">
                                                        <QRCodeComponent
                                                            value={item.url}
                                                            size={180}
                                                            level="H"
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
