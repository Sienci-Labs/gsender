import { SerialPort } from 'serialport';
import delay from '../../delay';

export class STM32Loader {
    BAUD_RATE = 115200;

    constructor(path) {
        this.path = path;
    }

    open() {
        this.port = new SerialPort({
            path: this.path,
            baudRate: this.BAUD_RATE,
            parity: 'even'
        }, async (err) => {
            if (err) {
                console.log(err);
            }
            this.port.on('data', (data) => {
                console.log(`read: ${data}`);
                this.onData(data);
            });
            await delay(100);
            this.initChip();
        });
    }

    onData(data) {
        console.log(data);
        if (data) {
            console.log(data);
            this.buffer.push(data);
            this.size += data.length;
        }
        if (this._reading && this._reading.size <= this.size) {
            let { resolve, size } = this._reading;
            this._reading = undefined;
            data =
                this.buffer.length > 1
                    ? Buffer.concat(this.buffer)
                    : this.buffer[0];
            if (data.length === size) {
                this.buffer = [];
                this.size = 0;
            } else {
                this.buffer = [data.slice(size)];
                this.size -= size;
                data = data.slice(0, size);
            }
            resolve(data);
        }
    }

    write(data) {
        if (typeof data === 'number') {
            data = [data];
        }
        console.log(`write: ${data}`);
        this.port.write(data);
    }

    async waitForAck(timeout) {
        let data = await this.read(1);
        if (data[0] !== 0x79) {
            throw new Error('nack');
        }
    }

    read(size) {
        return new Promise((resolve, reject) => {
            this._reading = { resolve, reject, size };
            if (this.buffer.length > 0) {
                this.onData();
            }
        });
    }

    initChip() {
        this.buffer = [];
        this.setRTS(false);
        this.reset().then(async () => {
            this.write(0x7F);
            await this.waitForAck(5);
        });
    }

    releaseChip() {
        this.setRTS(true);
        this.reset();
    }

    async reset() {
        this.setDTR(false);
        await delay(100);
        this.setDTR(true);
        await delay(50);
    }

    setDTR(value) {
        this.port.set({
            dtr: value
        });
    }

    setRTS(value) {
        this.port.set({
            rts: value
        });
    }
}
