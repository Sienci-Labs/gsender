import { Client } from "basic-ftp";
import * as events from "events";
import { Readable } from "stream";

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

		this.client.trackProgress((info) => {
			console.log("File", info.name);
			console.log("Type", info.type);
			console.log("Transferred", info.bytes);
			console.log("Transferred Overall", info.bytesOverall);
			const progress = (info.bytesOverall / info.bytes) * 100;
			this.logger(`Progress: ${progress.toFixed(1)}`);
			this.emit("progress", progress);
		});
	}

	async sendFile(fileData) {
		const { name } = fileData;
		let { data } = fileData;

		// Convert content to data Buffer if needed (matches YModemUSB pattern)
		if (!data) {
			if (typeof fileData.content === "string") {
				console.log(
					`sendFile: converting content string to Buffer for "${name}"`,
				);
				data = Buffer.from(fileData.content, "utf8");
			} else {
				data = Buffer.alloc(0);
			}
		} else if (!Buffer.isBuffer(data)) {
			if (typeof fileData.content === "string") {
				console.log(
					`sendFile: converting content string to Buffer for "${name}"`,
				);
				data = Buffer.from(fileData.content, "utf8");
			} else if (typeof data === "string") {
				console.log(`sendFile: converting data string to Buffer for "${name}"`);
				data = Buffer.from(data, "utf8");
			} else {
				data = Buffer.from(data);
			}
		}

		const dataStream = Readable.from(data);
		this.emit("start");
		await this.client.uploadFrom(dataStream, name);
		this.client.close();
		this.client = null;
		this.emit("complete");
	}

	async sendFiles(files = []) {
		this.emit("start");
		for (const fileData of files) {
			const { name } = fileData;
			let { data } = fileData;

			// Convert content to data Buffer if needed (matches YModemUSB pattern)
			if (!data) {
				if (typeof fileData.content === "string") {
					console.log(
						`sendFiles: converting content string to Buffer for "${name}"`,
					);
					data = Buffer.from(fileData.content, "utf8");
				} else {
					data = Buffer.alloc(0);
				}
			} else if (!Buffer.isBuffer(data)) {
				if (typeof fileData.content === "string") {
					console.log(
						`sendFiles: converting content string to Buffer for "${name}"`,
					);
					data = Buffer.from(fileData.content, "utf8");
				} else if (typeof data === "string") {
					console.log(
						`sendFiles: converting data string to Buffer for "${name}"`,
					);
					data = Buffer.from(data, "utf8");
				} else {
					data = Buffer.from(data);
				}
			}

			const dataStream = Readable.from(data);
			// eslint-disable-next-line no-await-in-loop
			await this.client.uploadFrom(dataStream, name);
		}
		this.client.close();
		this.client = null;
		this.emit("complete");
	}
}
