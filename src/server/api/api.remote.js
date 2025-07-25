import config from '../services/configstore';
import {
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const CONFIG_KEY = 'remoteSettings';

const getRemoteSettings = () => {
    const headlessSettings = config.get(CONFIG_KEY, { ip: '', port: 8000, headlessStatus: false });
    return headlessSettings;
};

export const fetch = (req, res) => {
    const headlessSettings = getRemoteSettings();
    res.send(headlessSettings);
};

export const update = (req, res) => {
    const headlessSettings = req.body;
    console.log(headlessSettings);
    try {
        config.set(CONFIG_KEY, headlessSettings);
        res.send({ message: 'headless settings saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save settings' + JSON.stringify(headlessSettings.rcfile)
        });
    }
};
