import { i18n, useAppTranslation } from 'app/i18n';
import store from 'app/store';
import pubsub from 'pubsub-js';
import { useEffect } from 'react';
import PlaceholderImage from './images/placeholder.png';

export function VisualizerPlaceholder() {
    const { t } = useAppTranslation();
    useEffect(() => {
        const token = pubsub.subscribe(
            'placeholder:invalidLines',
            (
                _msg: string,
                { lines, count }: { lines: string[]; count: number },
            ) => {
                const showWarningsOnLoad = store.get(
                    'widgets.visualizer.showWarning',
                    false,
                );
                if (showWarningsOnLoad && count > 0) {
                    const lineSample = lines.slice(0, 5);
                    const description = (
                        <div className={'flex flex-col gap-2'}>
                            <p>
                                {i18n.t(
                                    'notifications:visualizer.invalidLines.description',
                                    { count },
                                )}
                            </p>
                            <p>
                                {i18n.t(
                                    'notifications:visualizer.invalidLines.sample',
                                )}
                            </p>
                            <ol>
                                {lineSample.map((line, i) => (
                                    <li className="text-xs" key={i}>
                                        -<b> {line}</b>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    );
                    pubsub.publish('helper:info', {
                        kind: 'error',
                        title: i18n.t(
                            'notifications:visualizer.invalidLines.title',
                        ),
                        description,
                    });
                }
            },
        );

        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);
    return (
        <div className="bg-transparent w-full h-full flex items-center justify-center ">
            <img
                src={PlaceholderImage}
                alt={t('workspace:visualizer.placeholderAlt')}
            />
        </div>
    );
}
