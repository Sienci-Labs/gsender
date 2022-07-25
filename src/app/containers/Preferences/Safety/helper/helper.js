import controller from 'app/lib/controller';
import store from 'app/store';

const helper = () => {
    controller.command('electronErrors:fetch');
    return store.get('electron-error-list');
};

export default helper;
