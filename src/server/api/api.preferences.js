import logger from '../lib/logger';

const log = logger('api:preferences');

let preferencesObj = {};

export const fetch = (req, res) => {
    res.send(preferencesObj);
};

export const replace = (req, res) => {
    const prefs = req.body;

    try {
        preferencesObj = prefs;
        res.send({ message: 'gSender preferences saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save gSender preferences'
        });
    }
};