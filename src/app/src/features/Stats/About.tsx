import Markdown from 'react-markdown';
import { ReactMarkdownProps } from 'react-markdown/lib/ast-to-react';
import { FaExternalLinkAlt } from 'react-icons/fa';

import releases from 'app/features/Preferences/About/releases.json';

import { version } from 'app-root/package.json';

const About = () => {
    const team = [
        { name: 'Chris T.', title: 'Project Lead' },
        { name: 'Kevin G.', title: 'Lead Dev' },
        { name: 'Walid K.', title: 'Dev Manager' },
        { name: 'Sophia B.', title: 'Dev' },
        { name: 'Stephen C.', title: 'Docs' },
        { name: 'Kelly Z.', title: 'Icon Design' },
    ];

    const gSenderLogo = new URL(
        '../../../images/icon-square.png',
        import.meta.url,
    );
    const canadaFlag = new URL(
        '../../../images/canada-flag-icon.png',
        import.meta.url,
    );

    return (
        <div className="w-full flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <img
                        src={gSenderLogo.href}
                        alt="gSender Logo"
                        width={125}
                        height={125}
                    />
                    <div>
                        <h1 className="text-3xl font-bold">gSender</h1>
                        <p className="text-sm text-gray-500">By Sienci Labs</p>
                        <p className="text-sm text-gray-500">
                            Version {version}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                    <p className=" text-gray-500">
                        Copyright © {new Date().getFullYear()} Sienci Labs Inc.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            Made in Canada
                        </span>
                        <img src={canadaFlag.href} alt="Canada Flag" />
                    </div>
                    <p>
                        <a
                            href="https://github.com/Sienci-Labs/gsender/blob/master/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                        >
                            GNU GPLv3 License
                        </a>
                    </p>
                </div>
            </div>

            <div>
                gSender is a free and feature-packed CNC control software,
                designed to be clean and easy to learn while retaining a depth
                of capabilities for advanced users. Many thousands of people
                trust gSender to control their grbl and grblHAL-based CNCs every
                day, and they keep coming back for its ease of use, engaged
                community, and reliability.
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-2">gSender Team</h2>
                <div>
                    {team.map((member, index) => (
                        <span key={member.name}>
                            <strong>{member.name}</strong> ({member.title})
                            {index < team.length - 1 ? ', ' : ''}
                        </span>
                    ))}
                </div>
            </div>

            <div className="h-full flex flex-col gap-2">
                <div className="flex gap-2 items-center justify-between">
                    <h2 className="text-2xl font-bold">Release Notes</h2>

                    <a
                        className="text-sm text-blue-500 underline"
                        href="https://github.com/Sienci-Labs/gsender"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <div className="flex items-center gap-1">
                            <span>See all latest updates made</span>
                            <FaExternalLinkAlt />
                        </div>
                    </a>
                </div>

                <div className="relative h-full">
                    <div className="absolute top-0 left-0 w-full h-full overflow-y-auto border border-gray-300 rounded-md px-4 pb-2">
                        {releases.map((element) => {
                            return (
                                <Markdown
                                    key={element}
                                    components={{
                                        h3: (props: ReactMarkdownProps) => (
                                            <h3 className="text-xl font-bold mt-4 underline">
                                                {props.children}
                                            </h3>
                                        ),
                                        ul: (props: ReactMarkdownProps) => (
                                            <ul className="ml-4 list-disc [&>li]:mt-2 ">
                                                {props.children}
                                            </ul>
                                        ),
                                        li: (props: ReactMarkdownProps) => (
                                            <li className="leading-7">
                                                {props.children}
                                            </li>
                                        ),
                                    }}
                                >
                                    {element}
                                </Markdown>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
