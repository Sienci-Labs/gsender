import { LuTrash } from 'react-icons/lu';

import store from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

const Header = () => {
    const { notifications = [] } = useWorkspaceState();

    const handleClearNotifications = () => {
        if (notifications?.length === 0) {
            return;
        }

        store.replace('workspace.notifications', []);
    };

    return (
        <div className="flex justify-between mb-4">
            <h2>Notifications</h2>

            <button
                onClick={handleClearNotifications}
                disabled={notifications?.length === 0}
            >
                <LuTrash className="w-6 h-6" />
            </button>
        </div>
    );
};

export default Header;
