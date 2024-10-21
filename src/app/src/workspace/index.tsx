import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type Props = {
    children: React.ReactNode;
};

const Workspace = ({ children }: Props) => {
    return (
        <div className="flex flex-col h-full">
            <TopBar />

            <div className="flex h-full">
                <Sidebar />

                <div className="h-full w-full">{children}</div>
            </div>
        </div>
    );
};

export default Workspace;
