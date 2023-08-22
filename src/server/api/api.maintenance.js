import config from '../services/configstore';
import {
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const CONFIG_KEY = 'maintenance';

const getMaintenance = () => {
    const maintenance = config.get(CONFIG_KEY, { tasks: [] });
    return maintenance;
};

export const fetch = (req, res) => {
    const maintenance = getMaintenance();
    res.send(maintenance);
};

export const update = (req, res) => {
    const maintenance = req.body;
    try {
        config.set(CONFIG_KEY, maintenance);
        res.send({ message: 'maintenance tasks saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save settings' + JSON.stringify(maintenance.rcfile)
        });
    }
};
