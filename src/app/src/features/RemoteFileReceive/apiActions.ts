import api from 'app/api';

export interface IncomingFile {
    name: string;
    size: number;
    receivedAt: number;
}

export interface RemoteFileReceiveSettings {
    enabled: boolean;
    running: boolean;
    port: number;
    token: string | null;
    files: IncomingFile[];
}

export const actions = {
    fetchSettings: async (
        onSuccess: (settings: RemoteFileReceiveSettings) => void,
    ) => {
        try {
            const res = await api.remoteFileReceive.fetch();
            onSuccess(res.data);
        } catch (error) {
            console.log(error);
        }
    },

    setEnabled: async (
        enabled: boolean,
        port: number,
        onSuccess: (settings: RemoteFileReceiveSettings) => void,
        onError: (error: unknown) => void,
    ) => {
        try {
            const res = await api.remoteFileReceive.update({ enabled, port });
            onSuccess(res.data);
        } catch (error) {
            onError(error);
        }
    },

    regenerateToken: async (
        onSuccess: (token: string) => void,
        onError: (error: unknown) => void,
    ) => {
        try {
            const res = await api.remoteFileReceive.regenerateToken();
            onSuccess(res.data.token);
        } catch (error) {
            onError(error);
        }
    },

    readFile: async (
        name: string,
    ): Promise<{ name: string; gcode: string } | null> => {
        try {
            const res = await api.remoteFileReceive.readFile(name);
            return res.data;
        } catch (error) {
            console.log(error);
            return null;
        }
    },
};

export default actions;
