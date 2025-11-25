import controller from 'app/lib/controller.ts';
import { updateSDCardMountStatus } from 'app/store/redux/slices/controller.slice.ts';
import reduxStore from 'app/store/redux';

export const handleSDCardMount = () => {
    controller.command('sdcard:mount');

    controller.addListener('serialport:read', (payload: string) => {
        if (payload.includes('ok')) {
            reduxStore.dispatch(updateSDCardMountStatus({ isMounted: true }));
        }
    });
};

export function mountSDCard() {
    controller.command('sdcard:mount');
}

export function refreshSDCardFiles() {
    controller.command('sdcard:list');
}
