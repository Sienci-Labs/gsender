import controller from 'app/lib/controller';
import { updateSDCardMountStatus } from 'app/store/redux/slices/controller.slice';
import reduxStore from 'app/store/redux';

export const handleSDCardMount = () => {
    controller.command('sdcard:mount');

    const onSDCardMount = (response: string) => {
        if (response.includes('ok')) {
            reduxStore.dispatch(updateSDCardMountStatus({ isMounted: true }));
        }
    };

    controller.addListener('error', (error: any, other: any) => {
        console.log(error, other);
    });

    controller.addListener('serialport:read', onSDCardMount);

    setTimeout(() => {
        controller.removeListener('serialport:read', onSDCardMount);
    }, 3000);
};
