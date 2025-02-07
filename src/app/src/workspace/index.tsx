import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type Props = {
    children: React.ReactNode;
};

const Workspace = ({ children }: Props) => {
    return (
        <div className="flex flex-col h-full ">
            <TopBar />

            <div className="flex h-full no-scrollbar">
                <Sidebar />

                <div className="w-full">{children}</div>
            </div>
        </div>
    );
};

export default Workspace;
