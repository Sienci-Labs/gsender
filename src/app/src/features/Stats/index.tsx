import { StatCard } from 'app/features/Stats/components/StatCard';
import { Diagnostic } from 'app/features/Stats/components/Diagnostic.tsx';
import { ExternalLink } from 'app/features/Stats/components/ExternalLink.tsx';
import { FaBookBookmark } from 'react-icons/fa6';
import { ImBubbles4 } from 'react-icons/im';
import { FaGithub } from 'react-icons/fa';

export function Stats() {
    return (
        <div className="p-4 h-full w-full">
            <div className="w-full flex flex-row items-center justify-center mt-2">
                I am a menu
            </div>
            <div className="grid grid-cols-6 grid-rows-6 gap-4">
                <div id="mainStats" className="col-span-4 row-span-6  px-8">
                    <h1 className="text-5xl">Your Machine</h1>
                </div>
                <div
                    id="secondaryStats"
                    className="col-span-2 row-span-6 col-start-5 px-8 flex flex-col gap-4"
                >
                    <h1 className="text-5xl">Get Help</h1>
                    <StatCard>
                        <Diagnostic />
                    </StatCard>
                    <ExternalLink
                        title={'Resources'}
                        link={''}
                        icon={<FaBookBookmark />}
                    >
                        Learn about starting with gSender and how to use
                        specific features
                    </ExternalLink>
                    <ExternalLink
                        title={'Community'}
                        link={''}
                        icon={<ImBubbles4 />}
                    >
                        Have conversations with our friendly and helpful
                        community
                    </ExternalLink>
                    <ExternalLink
                        title={'Github'}
                        link={''}
                        icon={<FaGithub />}
                    >
                        Submit issues or grab the latest version of gSender
                    </ExternalLink>
                </div>
            </div>
        </div>
    );
}
