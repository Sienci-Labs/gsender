import * as events from 'events';
import { Client } from 'basic-ftp';
import { Readable } from 'stream';

export class GrblHALFTP extends events.EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.logger = console.log;
    }

    async openConnection(address, port, user, pass, secure = false) {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        this.logger(`Connecting to ${address}:${port}`);

        this.client = new Client();
        this.client.ftp.verbose = true;
        await this.client.access({
            host: address,
            port: port,
            user: user,
            password: pass,
            secure: secure,
        });

        this.client.trackProgress(info => {
            console.log('File', info.name);
            console.log('Type', info.type);
            console.log('Transferred', info.bytes);
            console.log('Transferred Overall', info.bytesOverall);
            const progress = (info.bytesOverall / info.bytes) * 100;
            this.logger(`Progress: ${progress.toFixed(1)}`);
            this.emit('progress', progress);
        });
    }

    async sendFile(fileData) {
        const { name, data } = fileData;
        const dataStream = Readable.from(data);
        this.emit('start');
        await this.client.uploadFrom(dataStream, name);
        this.client.close();
        this.client = null;
        this.emit('complete');
    }

    async sendFiles(files = []) {
        this.emit('start');
        for (const fileData of files) {
            const { name, data } = fileData;
            const dataStream = Readable.from(data);
            // eslint-disable-next-line no-await-in-loop
            await this.client.uploadFrom(dataStream, name);
        }
        this.client.close();
        this.client = null;
        this.emit('complete');
    }
}
