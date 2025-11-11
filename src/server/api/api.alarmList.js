import config from '../services/configstore';
import {
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';
import { get } from 'lodash';
// import logger from '../lib/logger';

// const log = logger('api:alarmList');
const CONFIG_KEY = 'alarmList';

const getAlarmList = () => {
    const alarmList = config.get(CONFIG_KEY, { list: [] });

    if (!alarmList.list || !Array.isArray(alarmList.list)) {
        return { list: [] };
    }

    const list = alarmList.list.sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);

        return dateB - dateA; // Compare in descending order
    });

    return { list };
};

export const fetch = (req, res) => {
    const alarmList = getAlarmList();
    res.send(alarmList);
};

export const fetchRecent = (req, res) => {
    const alarmList = getAlarmList();
    const list = get(alarmList, 'list', []);
    let cutoff = new Date();
    cutoff = cutoff.setDate(cutoff.getDate() - 21);

    const recentIssues = list.filter((item) => {
        const itemDate = new Date(item.time);
        return itemDate > cutoff;
    });
    res.send({
        list: recentIssues
    });
};

export const update = (req, res) => {
    const alarmError = req.body;
    let alarmList = getAlarmList();
    alarmList.list.push(alarmError);

    try {
        config.set(CONFIG_KEY, alarmList);
        res.send({ message: 'alarms/errors saved' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to save settings' + JSON.stringify(alarmList.rcfile)
        });
    }
};

export const clearAll = (req, res) => {
    let alarmList = getAlarmList();

    try {
        alarmList.list = [];
        config.set(CONFIG_KEY, alarmList);

        res.send({ msg: 'Successfully deleted alarms/errors' });
    } catch (err) {
        res.status(ERR_INTERNAL_SERVER_ERROR).send({
            msg: 'Failed to delete alarms/errors: \n' + err
        });
    }
};
