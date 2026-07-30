import { LuTrash } from 'react-icons/lu';

import reduxStore from '@gsender/controller-client/store/redux';
import { clearNotifications } from '@gsender/controller-client/store/redux/slices/preferences.slice';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';

const Header = () => {
    const notifications = useTypedSelector(
        (state) => state.preferences.notifications,
    );

    const handleClearNotifications = () => {
        if (notifications?.length === 0) {
            return;
        }

        reduxStore.dispatch(clearNotifications());
    };

    return (
        <div className="flex justify-between mb-4">
            <h2>Notifications</h2>

            <button
                onClick={handleClearNotifications}
                disabled={notifications?.length === 0}
                aria-label="Clear all notifications"
            >
                <LuTrash
                    className={`w-6 h-6 text-gray-500 ${
                        notifications?.length === 0
                            ? 'cursor-not-allowed'
                            : 'hover:text-gray-700'
                    }`}
                />
            </button>
        </div>
    );
};

export default Header;
