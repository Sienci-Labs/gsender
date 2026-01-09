import config from '../services/configstore';
import logger from '../lib/logger';

const log = logger('api:preferences');
const CONFIG_KEY = 'preferences';

export const fetch = (req, res) => {
    const prefs = config.get(CONFIG_KEY, {});
    res.send(prefs);
};

export const replace = (req, res) => {
    const prefs = req.body;

    try {
        config.set(CONFIG_KEY, prefs);
        res.send({ message: 'gSender preferences saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save gSender preferences'
        });
    }
};