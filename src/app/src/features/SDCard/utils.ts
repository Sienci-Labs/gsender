import controller from 'app/lib/controller';
import { updateSDCardMountStatus } from 'app/store/redux/slices/controller.slice';
import reduxStore from 'app/store/redux';

export const handleSDCardMount = () => {
    controller.command('sdcard:mount');

    controller.addListener('serialport:read', (payload: string) => {
        if (payload.includes('ok')) {
            reduxStore.dispatch(updateSDCardMountStatus({ isMounted: true }));
        }
    });
};
