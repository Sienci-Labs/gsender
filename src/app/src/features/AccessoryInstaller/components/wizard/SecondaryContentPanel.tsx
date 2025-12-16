import { useState } from 'react';
import { ExternalLink, QrCode } from 'lucide-react';
import { SecondaryContent } from '../../types/wizard';

interface SecondaryContentPanelProps {
    content: SecondaryContent[];
}

export function SecondaryContentPanel({ content }: SecondaryContentPanelProps) {
    const [expandedQR, setExpandedQR] = useState<number | null>(null);
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
        <div className="flex flex-col gap-6 h-full justify-around">
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
                            <Component />
                        </div>
                    );
                }

                if (item.type === 'link') {
                    const isQRExpanded = expandedQR === index;

                    return (
                        <div key={index} className="flex-shrink-0">
                            {isQRExpanded && item.url && (
                                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-400 flex flex-col items-center">
                                    <div className="text-sm font-semibold text-gray-700 mb-3">
                                        Scan QR Code
                                    </div>
                                    <QRCodeSVG
                                        value={item.url}
                                        size={180}
                                        level="H"
                                        includeMargin={true}
                                        className="border-4 border-white shadow-sm"
                                    />
                                    <div className="text-xs text-gray-500 mt-3 text-center break-all px-2">
                                        {item.url}
                                    </div>
                                </div>
                            )}

                            <div className="border-2 border-blue-400 bg-white rounded-lg overflow-hidden">
                                <button
                                    onClick={() =>
                                        setExpandedQR(
                                            isQRExpanded ? null : index,
                                        )
                                    }
                                    className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 transition-colors text-left"
                                >
                                    <div className="flex-1">
                                        {item.title && (
                                            <div className="font-semibold text-gray-900">
                                                {item.title}
                                            </div>
                                        )}
                                        <div className="text-sm text-gray-600">
                                            {item.content as string}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {isQRExpanded ? 'Hide QR' : 'Show QR'}
                                    </div>
                                </button>

                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center gap-3 p-4 border-t-2 border-blue-400 hover:bg-blue-50 transition-colors group"
                                >
                                    <ExternalLink
                                        className="text-blue-500 flex-shrink-0"
                                        size={20}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                                            Open in browser
                                        </div>
                                    </div>
                                    <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
                                        →
                                    </div>
                                </a>
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
