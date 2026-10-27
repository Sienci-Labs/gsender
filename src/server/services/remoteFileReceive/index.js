/*
 * Copyright (C) 2026 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

// Lets a desktop gSender push a g-code file straight to a pendant (Android or
// Electron) over the LAN, without the operator copying it onto the tablet's
// storage first.
//
// This is deliberately a second, narrowly-scoped HTTP server - not a route
// added to the main app (src/server/app.js). The main app's existing auth
// layers (authorizeIPAddress, the JWT middleware) are both no-ops today, so
// binding it to 0.0.0.0 would open every /api/* route to the LAN
// unauthenticated. This listener only exists while the feature is toggled on,
// only exposes a handful of routes, and gates uploads on a paired desktop's
// key (or the legacy on-screen code).
import cors from "cors";
import crypto from "crypto";
import express from "express";
import fs from "fs";
import multer from "multer";
import os from "os";
import path from "path";
import logger from "../../lib/logger";
import CNCEngine from "../cncengine";
import config from "../configstore";
import advertiser from "./advertiser";
import { PairingStore } from "./pairing";

const log = logger("service:remoteFileReceive");

const CONFIG_KEY = "remoteFileReceive";
const DEFAULT_PORT = 8010;
const GCODE_EXTENSIONS = /\.(gcode|nc|tap|cnc|g|gc)$/i;
const MAX_FILE_SIZE = 200 * 1024 * 1024;

const generateToken = () =>
	String(crypto.randomInt(0, 1000000)).padStart(6, "0");

class RemoteFileReceive {
	server = null;

	token = null;

	port = null;

	pairing = new PairingStore(config, CONFIG_KEY);

	getDeviceId() {
		return this.pairing.getDeviceId();
	}

	getDeviceName() {
		return process.env.GSENDER_DEVICE_NAME || os.hostname();
	}

	getSettings() {
		return config.get(CONFIG_KEY, { enabled: false, port: DEFAULT_PORT });
	}

	isRunning() {
		return this.server !== null;
	}

	getToken() {
		return this.token;
	}

	regenerateToken() {
		this.token = generateToken();
		return this.token;
	}

	getIncomingDir() {
		const base =
			process.env.GSENDER_USER_DATA ||
			(config.file ? path.dirname(config.file) : process.cwd());
		const dir = path.join(base, "incoming");
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		return dir;
	}

	// Maps a disk filename (uniquified with a suffix, see the POST handler)
	// back to the original name the sender used, since listIncomingFiles()
	// only ever sees what's actually on disk.
	getManifestPath() {
		return path.join(this.getIncomingDir(), ".manifest.json");
	}

	readManifest() {
		try {
			return JSON.parse(fs.readFileSync(this.getManifestPath(), "utf8"));
		} catch {
			return {};
		}
	}

	writeManifest(manifest) {
		fs.writeFileSync(
			this.getManifestPath(),
			JSON.stringify(manifest, null, 2),
		);
	}

	setOriginalName(savedName, originalName) {
		const manifest = this.readManifest();
		manifest[savedName] = originalName;
		this.writeManifest(manifest);
	}

	listIncomingFiles() {
		const dir = this.getIncomingDir();
		const manifest = this.readManifest();
		return fs
			.readdirSync(dir)
			.filter((name) => GCODE_EXTENSIONS.test(name))
			.map((name) => {
				const stat = fs.statSync(path.join(dir, name));
				return {
					name: manifest[name] || name,
					savedName: name,
					size: stat.size,
					receivedAt: stat.mtimeMs,
				};
			})
			.sort((a, b) => b.receivedAt - a.receivedAt);
	}

	readIncomingFile(name) {
		// path.basename strips any directory component, so a crafted name like
		// "../../etc/passwd" can't escape the incoming directory.
		const safeName = path.basename(name);
		const filePath = path.join(this.getIncomingDir(), safeName);
		if (!fs.existsSync(filePath)) {
			return null;
		}
		return fs.readFileSync(filePath, "latin1");
	}

	deleteIncomingFiles(names) {
		const dir = this.getIncomingDir();
		const deleted = [];
		for (const rawName of names) {
			const safeName = path.basename(rawName);
			const filePath = path.join(dir, safeName);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
				deleted.push(safeName);
			}
		}
		if (deleted.length > 0) {
			const manifest = this.readManifest();
			for (const name of deleted) {
				delete manifest[name];
			}
			this.writeManifest(manifest);
		}
		return deleted;
	}

	start(port = DEFAULT_PORT) {
		if (this.isRunning()) {
			this.stop();
		}

		if (!this.token) {
			this.regenerateToken();
		}

		const app = express();
		app.use(cors());
		app.disable("x-powered-by");

		const upload = multer({
			storage: multer.memoryStorage(),
			limits: { fileSize: MAX_FILE_SIZE },
		});

		// Paired desktops send their key as a bearer token alongside their id;
		// older desktops still send the on-screen code.
		const requireToken = (req, res, next) => {
			const auth = req.header("Authorization") || "";
			const desktopId = req.header("X-Pendant-Desktop-Id");
			if (auth.startsWith("Bearer ")) {
				if (this.pairing.verify(desktopId, auth.slice(7))) {
					next();
					return;
				}
				res.status(401).send({ msg: "This desktop is no longer paired" });
				return;
			}
			const provided = req.header("X-Pendant-Token");
			if (!provided || provided !== this.token) {
				res.status(401).send({ msg: "Invalid or missing pairing code" });
				return;
			}
			next();
		};

		// Reports upload progress before multer has parsed the multipart body -
		// the whole file is still just bytes on the raw request stream at this
		// point. The sender provides the filename up front via a header since
		// it otherwise lives inside the (not yet parsed) multipart body.
		const PROGRESS_THROTTLE_MS = 150;
		const trackProgress = (req, res, next) => {
			const total = Number(req.header("Content-Length")) || 0;
			let name = "file";
			try {
				const rawName = req.header("X-Pendant-Filename");
				if (rawName) name = decodeURIComponent(rawName);
			} catch {
				// Malformed header - fall back to the generic name.
			}

			CNCEngine.emit("remote:file-incoming:start", { name, size: total });

			let received = 0;
			let lastEmit = 0;
			req.on("data", (chunk) => {
				received += chunk.length;
				const now = Date.now();
				if (now - lastEmit < PROGRESS_THROTTLE_MS && received < total) {
					return;
				}
				lastEmit = now;
				const percent =
					total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;
				CNCEngine.emit("remote:file-incoming:progress", percent);
			});
			req.on("aborted", () => {
				CNCEngine.emit(
					"remote:file-incoming:error",
					"Transfer aborted by the sender.",
				);
			});

			next();
		};

		app.get("/pendant/status", (req, res) => {
			res.send({
				status: "ready",
				deviceId: this.getDeviceId(),
				deviceName: this.getDeviceName(),
			});
		});

		// Unauthenticated by design - this is how a desktop earns its key.
		// Desktops poll this with a QR nonce while their pairing QR is open,
		// which is unguessable, so only the brute-forceable 6-digit code path
		// is rate limited.
		app.post("/pendant/pair/claim", express.json(), (req, res) => {
			const body = req.body || {};
			if (!body.nonce && !this.pairing.recordClaimAttempt(req.ip)) {
				res.status(429).send({ msg: "Too many pairing attempts" });
				return;
			}
			const result = this.pairing.claim(body, this.token);
			if (!result) {
				res.status(404).send({ msg: "No matching pairing request" });
				return;
			}
			CNCEngine.emit("remote:pair-complete", {
				desktopId: result.desktopId,
				desktopName: result.desktopName,
			});
			res.send({
				key: result.key,
				deviceId: this.getDeviceId(),
				deviceName: this.getDeviceName(),
			});
		});

		app.post(
			"/pendant/file",
			requireToken,
			trackProgress,
			upload.single("gcode"),
			(req, res) => {
				const { file } = req;
				const { mode = "library" } = req.body;

				if (!file) {
					CNCEngine.emit(
						"remote:file-incoming:error",
						"No file attached",
					);
					res.status(400).send({ msg: "No file attached" });
					return;
				}

				const gcode = file.buffer.toString("latin1");

				if (mode === "active") {
					CNCEngine.load({
						gcode,
						name: file.originalname,
						size: file.size,
					});
					CNCEngine.emit("remote:file-incoming:complete", {
						name: file.originalname,
						size: file.size,
						mode,
					});
					res.send({ msg: "Loaded as the active job", mode });
					return;
				}

				const ext = path.extname(file.originalname);
				const base = path.basename(file.originalname, ext);
				const savedName = `${base}_${Date.now().toString(36)}${ext}`;
				fs.writeFileSync(
					path.join(this.getIncomingDir(), savedName),
					file.buffer,
				);
				this.setOriginalName(savedName, file.originalname);

				CNCEngine.emit("remote:file-received", {
					name: file.originalname,
					savedName,
					size: file.size,
				});
				CNCEngine.emit("remote:file-incoming:complete", {
					name: file.originalname,
					size: file.size,
					mode,
				});

				res.send({ msg: "Added to the pendant's file library", mode });
			},
		);

		// Catches multer errors (e.g. a file over MAX_FILE_SIZE) so the
		// incoming-transfer UI resolves to an error state instead of hanging
		// indefinitely at "receiving".
		app.use("/pendant/file", (err, req, res, next) => {
			if (!err) {
				next();
				return;
			}
			const message =
				err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
					? "File is too large to send to this pendant."
					: err.message || "Failed to receive the file.";
			CNCEngine.emit("remote:file-incoming:error", message);
			res.status(err.status || 400).send({ msg: message });
		});

		this.server = app.listen(port, "0.0.0.0", () => {
			log.info(`Remote file receive listening on 0.0.0.0:${port}`);
		});
		this.server.on("error", (err) => {
			// An unhandled 'error' event on an http.Server throws and takes the
			// whole process down with it (e.g. EADDRINUSE from a stale listener
			// that hasn't released the port yet) - log and fall back to
			// "disabled" instead.
			log.error(`Remote file receive failed to start: ${err.message}`);
			this.server = null;
			this.port = null;
			config.set(`${CONFIG_KEY}.enabled`, false);
		});
		this.server.on("listening", () => {
			advertiser.publish({
				port,
				id: this.getDeviceId(),
				name: this.getDeviceName(),
			});
		});
		this.port = port;

		config.set(`${CONFIG_KEY}.enabled`, true);
		config.set(`${CONFIG_KEY}.port`, port);

		return { port, token: this.token };
	}

	stop() {
		advertiser.unpublish();
		if (this.server) {
			this.server.close();
			this.server = null;
			this.port = null;
		}
		config.set(`${CONFIG_KEY}.enabled`, false);
	}
}

const remoteFileReceive = new RemoteFileReceive();

export default remoteFileReceive;
