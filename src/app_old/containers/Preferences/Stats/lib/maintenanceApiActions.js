import api from 'app/api';

const actions = {
    fetch: async (setTasks) => {
        try {
            let res = await api.maintenance.fetch();
            setTasks(res.body);
            return res.body;
        } catch (error) {
            console.log(error);
        }
        return null;
    },
    update: async (newTasks) => {
        try {
            let res = await api.maintenance.update(newTasks);
            return res;
        } catch (error) {
            console.log(error);
        }
        return null;
    },
};

export default actions;
