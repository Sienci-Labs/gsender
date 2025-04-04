import { LuTrash } from 'react-icons/lu';

import reduxStore from 'app/store/redux';
import { clearNotifications } from 'app/store/redux/slices/preferences.slice';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

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
