/*
 * Copyright (C) 2021 Sienci Labs Inc.
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

import * as Sentry from "@sentry/electron/main";
import chalk from "chalk";
import {
	app,
	clipboard,
	dialog,
	ipcMain,
	powerMonitor,
	powerSaveBlocker,
	screen,
	session,
} from "electron";
import log from "electron-log";
import Store from "electron-store";
import { autoUpdater } from "electron-updater";
import fs from "fs";
import isOnline from "is-online";
import mkdirp from "mkdirp";
import path from "path";
import WinReg from "winreg";
import { asyncCallWithTimeout } from "./electron-app/AsyncTimeout";
import { getGRBLLog } from "./electron-app/grblLogs";
import { createPendantWindow } from "./electron-app/pendant-window";
import { parseAndReturnGCode } from "./electron-app/RecentFiles";
import WindowManager from "./electron-app/WindowManager";
import pkg from "./package.json";
import launchServer from "./server-cli";

// Reads the renderer's persisted settings directly, since the main process
// needs to know "use pendant view as default UI" before any window exists.
const readUsePendantViewSetting = () => {
	try {
		const configPath = path.join(app.getPath("userData"), "gsender-0.5.6.json");
		if (!fs.existsSync(configPath)) return false;
		const raw = JSON.parse(fs.readFileSync(configPath, "utf8") || "{}");
		return !!raw?.state?.workspace?.usePendantViewAsDefault;
	} catch (err) {
		log.error(`Failed to read pendant-view setting: ${err}`);
		return false;
	}
};

// Hot reload in development
if (process.env.NODE_ENV === "development") {
	try {
		require("electron-reloader")(module, {
			debug: false,
			watchRenderer: false, // Vite handles frontend
			ignore: [/node_modules/, /output\/app/, /\.map$/],
		});
	} catch (err) {
		// electron-reloader not available, continue without it
	}
}

let windowManager = null;
let hostInformation = {};
const grblLog = log.create("grbl");
let logPath;
let pluginPath;
let powerBlockerNum = 0;
const externalRendererUrl =
	process.env.NODE_ENV === "development"
		? process.env.ELECTRON_RENDERER_URL
		: "";

if (process.env.NODE_ENV === "production") {
	Sentry.init({
		dsn: "https://eeb4899f0415aa6bc9de477a7faeb720@o558751.ingest.us.sentry.io/4509479105986560",
		release: pkg.version,
	});
}

const main = () => {
	// https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
	const gotSingleInstanceLock = app.requestSingleInstanceLock();
	const shouldQuitImmediately = !gotSingleInstanceLock;

	// Initialize remote main
	require("@electron/remote/main").initialize();

	let prevDirectory = "";
	let pendingFileToOpen = null;
	let isRendererReady = false;

	if (shouldQuitImmediately) {
		app.quit();
		return;
	}

	app.on("second-instance", (event, commandLine, workingDirectory) => {
		// Someone tried to run a second instance, we should focus our window.
		if (!windowManager) {
			return;
		}

		const window = windowManager.getWindow();
		if (window) {
			if (window.isMinimized()) {
				window.restore();
			}
			window.focus();
			const filePath = commandLine.find((arg) =>
				/\.(gcode|gc|nc|tap|cnc)$/i.test(arg),
			);
			if (filePath) {
				loadFileAssociation(filePath, window);
			}
		}
	});

	app.on("open-file", (event, filePath) => {
		event.preventDefault();
		const window = windowManager?.getWindow();
		if (window && isRendererReady) {
			loadFileAssociation(filePath, window);
		} else {
			pendingFileToOpen = filePath;
		}
	});

	const store = new Store();

	// Increase V8 heap size of the main process
	if (process.arch === "x64") {
		const memoryLimit = 1024 * 8; // 8GB
		app.commandLine.appendSwitch(
			"--js-flags",
			`--max-old-space-size=${memoryLimit}`,
		);
	}

	if (process.platform === "linux") {
		app.commandLine.appendSwitch("--no-sandbox");
	}

	// Create the user data directory if it does not exist
	const userData = app.getPath("userData");
	mkdirp.sync(userData);
	// Extra logging
	logPath = path.join(app.getPath("userData"), "logs/grbl.log");
	grblLog.transports.file.resolvePath = () => logPath;
	pluginPath = path.join(app.getPath("userData"), "plugins");

	const loadFileAssociation = async (filePath, window) => {
		try {
			const fileMetadata = await parseAndReturnGCode({ filePath });
			window.webContents.send("returned-upload-dialog-data", {
				data: fileMetadata.result,
				size: fileMetadata.size,
				name: fileMetadata.name,
				path: fileMetadata.fullPath,
			});
		} catch (err) {
			log.error(`Error loading file association: ${err}`);
		}
	};

	const openDirectoryDialog = async () => {
		try {
			const gSenderWindow = windowManager.getWindow();
			const directory = await dialog.showOpenDialog(gSenderWindow, {
				properties: ["openDirectory"],
			});

			if (!directory) {
				return;
			}
			if (directory.canceled) {
				return;
			}

			const FULL_PATH = directory.filePaths[0];

			return FULL_PATH;
		} catch (e) {
			log.error(`Caught error in listener - ${e}`);
		}
	};

	app.whenReady().then(async () => {
		try {
			await session.defaultSession.clearCache();

			// Plugin iframes are same-origin with the app, so a single app-wide
			// grant is enough — per-plugin scoping happens at the iframe's
			// `allow="local-fonts"` attribute (see PluginPanel.tsx), which is only
			// set for plugins that declare "local-fonts" in their manifest.
			// Clipboard write permission is required for navigator.clipboard.writeText()
			// call sites throughout the renderer (Console copy history, gcode editor, etc).
			const ALLOWED_SESSION_PERMISSIONS = ["local-fonts", "clipboard-sanitized-write"];

			session.defaultSession.setPermissionCheckHandler(
				(_webContents, permission) =>
					ALLOWED_SESSION_PERMISSIONS.includes(permission),
			);
			session.defaultSession.setPermissionRequestHandler(
				(_webContents, permission, callback) => {
					callback(ALLOWED_SESSION_PERMISSIONS.includes(permission));
				},
			);

			windowManager = new WindowManager();
			// Create and show splash before server starts
			const splashScreen = windowManager.createSplashScreen({
				width: 600,
				height: 400,
				show: false,
				frame: false,
				transparent: true,
				backgroundColor: "#00000000",
			});
			splashScreen.loadFile(
				path.join(__dirname, "app/assets/Splashscreen.webp"),
			);
			splashScreen.webContents.on("did-finish-load", () => {
				splashScreen.show();
			});

			splashScreen.on("show", () => {
				splashScreen.focus();
			});

			let url = "";
			let kiosk = false;

			let usePendantView = readUsePendantViewSetting();
			if (usePendantView && externalRendererUrl) {
				log.warn(
					"Pendant-as-default-UI is not supported under electron:dev; falling back to the normal dev window.",
				);
				usePendantView = false;
			}

			if (externalRendererUrl) {
				url = externalRendererUrl;
				try {
					const parsedUrl = new URL(url);
					hostInformation = {
						address: parsedUrl.hostname,
						port:
							Number(parsedUrl.port) ||
							(parsedUrl.protocol === "https:" ? 443 : 80),
					};
				} catch (error) {
					hostInformation = {};
				}
				log.info(`Using external renderer URL in development: ${url}`);
			} else if (process.env.NODE_ENV === "development") {
				const errorMessage =
					"ELECTRON_RENDERER_URL is required in development mode";
				log.error(errorMessage);
				await dialog.showMessageBox({
					type: "error",
					title: "Development Startup Error",
					message: errorMessage,
				});
				app.exit(1);
				return;
			} else {
				let res;
				try {
					res = await launchServer();
				} catch (error) {
					const isBindingError =
						error.errData?.bindingErr ||
						/EADDR|address not available|address already in use/i.test(
							error.message,
						);

					if (isBindingError) {
						log.warn(
							"Remote mode binding failed — remote config has been reset.",
						);
						dialog.showMessageBoxSync(null, {
							title: "Remote Mode Configuration Error",
							message:
								"gSender could not connect to the configured remote address.",
							detail:
								"Remote mode has been disabled and the configuration has been reset. Please restart gSender.",
						});
					} else {
						log.error("Unexpected server startup error:", error);
						dialog.showMessageBoxSync(null, {
							title: "Server Startup Error",
							message:
								"gSender encountered an unexpected error while starting.",
							detail: String(error.message),
						});
					}
					app.exit(-1);
					return;
				}

				const { address, port, kiosk: resolvedKiosk } = { ...res };
				kiosk = resolvedKiosk;

				if (res.configRestored) {
					log.warn(
						`Corrupt settings file recovered — backup at ${res.configBackupPath}`,
					);
					dialog.showMessageBoxSync(null, {
						title: "Settings File Recovered",
						message:
							"Your gSender settings file was corrupted and has been reset to defaults.",
						detail: `A backup of the corrupted file was saved to:\n${res.configBackupPath}`,
					});
				}

				log.info(`Returned - http://${address}:${port}`);
				hostInformation = {
					address,
					port,
				};
				if (!(address && port)) {
					log.error(
						"Unable to start the server at " +
							chalk.cyan(`http://${address}:${port}`),
					);
					return;
				}

				url = `http://${address}:${port}`;
			}
			// The bounds is a rectangle object with the following properties:
			// * `x` Number - The x coordinate of the origin of the rectangle.
			// * `y` Number - The y coordinate of the origin of the rectangle.
			// * `width` Number - The width of the rectangle.
			// * `height` Number - The height of the rectangle.
			// resolution used to be 1024x768
			const bounds = {
				minWidth: 1044,
				minHeight: 768,
				...store.get("bounds"),
			};
			if (usePendantView) {
				const pendantAssetsPath = path.join(__dirname, "pendant");
				if (!fs.existsSync(pendantAssetsPath)) {
					log.error(
						`Pendant view was requested but no pendant assets were found at ${pendantAssetsPath}; falling back to the standard UI.`,
					);
					dialog.showMessageBoxSync(null, {
						type: "warning",
						title: "Pendant View Unavailable",
						message:
							"gSender could not find the pendant interface in this build.",
						detail: "Falling back to the standard desktop UI.",
					});
					usePendantView = false;
				}
			}

			let window;
			if (usePendantView) {
				// Registered before loadURL below: the pendant SPA (src/pendant/)
				// invokes "pendant:get-host" as soon as its bootstrap script runs,
				// which can happen before loadURL's promise resolves. Mirrors the
				// standalone pendant binary's handlers in src/pendant-main.js.
				ipcMain.handle("pendant:get-host", () => {
					if (!hostInformation.address || !hostInformation.port) {
						return undefined;
					}
					return `${hostInformation.address}:${hostInformation.port}`;
				});

				ipcMain.handle("pendant:pick-gcode-file", async () => {
					const result = await dialog.showOpenDialog(window ?? undefined, {
						properties: ["openFile"],
						filters: [
							{
								name: "G-Code Files",
								extensions: ["gcode", "gc", "nc", "tap", "cnc", "g"],
							},
							{ name: "All Files", extensions: ["*"] },
						],
					});

					if (result.canceled || !result.filePaths.length) return undefined;

					const filePath = result.filePaths[0];
					const content = await fs.promises.readFile(filePath, "utf8");
					const { size } = await fs.promises.stat(filePath);
					return {
						path: filePath,
						name: path.basename(filePath),
						size,
						content,
					};
				});

				ipcMain.handle("pendant:read-gcode-file", async (_event, filePath) => {
					if (typeof filePath !== "string" || !filePath) return undefined;
					const content = await fs.promises.readFile(filePath, "utf8");
					const { size } = await fs.promises.stat(filePath);
					return {
						path: filePath,
						name: path.basename(filePath),
						size,
						content,
					};
				});

				kiosk = true;
				const pendantUrl = `${url}/pendant`;
				window = createPendantWindow(
					false,
					path.join(__dirname, "preload-pendant.js"),
				);
				window.once("ready-to-show", () => {
					splashScreen.close();
					splashScreen.destroy();
				});
				await window.loadURL(pendantUrl);
			} else {
				const options = {
					...bounds,
					title: `gSender ${pkg.version}`,
					kiosk,
				};
				window = await windowManager.openWindow(url, options, splashScreen);
			}

			window.on("ready-to-show", () => {
				const savedScaleFactor = Number(store.get("displayScaleFactor", 1.0));

				window.webContents.setZoomFactor(savedScaleFactor);
			});

			// Check argv for file path on Windows/Linux cold start
			if (process.platform !== "darwin") {
				const filePath = process.argv.find((arg) =>
					/\.(gcode|gc|nc|tap|cnc)$/i.test(arg),
				);
				if (filePath) {
					pendingFileToOpen = filePath;
				}
			}

			ipcMain.on("file-association-ready", () => {
				isRendererReady = true;
				if (pendingFileToOpen) {
					loadFileAssociation(pendingFileToOpen, window);
					pendingFileToOpen = null;
				}
			});

			ipcMain.on("change-power-saving", (_msg, enabled) => {
				if (!enabled) {
					// Power saver - display sleep higher precedence over app suspension
					powerBlockerNum = powerSaveBlocker.start("prevent-display-sleep");
					powerMonitor.on("lock-screen", () => {
						powerSaveBlocker.start("prevent-display-sleep");
					}),
						powerMonitor.on("suspend", () => {
							powerSaveBlocker.start("prevent-app-suspension");
							log.info("Prevented suspension");
						});
				} else {
					if (powerSaveBlocker.isStarted(powerBlockerNum)) {
						powerSaveBlocker.stop(powerBlockerNum);
						powerMonitor.removeAllListeners();
					}
				}
			});

			// Save window size and position
			window.on("close", () => {
				store.set("bounds", window.getBounds());
			});

			// Include release notes
			//autoUpdater.fullChangelog = true;

			if (process.platform === "win32") {
				autoUpdater.on("update-available", (info) => {
					setTimeout(() => {
						window.webContents.send("update_available", info);
					}, 8000);
				});

				autoUpdater.on("error", (err) => {
					window.webContents.send("updated_error", err);
					log.error(err);
				});

				autoUpdater.on("download-progress", (info) => {
					window.webContents.send("update_download_progress", info.percent);
				});

				ipcMain.once("restart_app", async () => {
					await autoUpdater.downloadUpdate();
					autoUpdater.quitAndInstall(false, false);
				});
			}

			ipcMain.on("load-recent-file", async (msg, recentFile) => {
				try {
					const fileMetadata = await parseAndReturnGCode(recentFile);
					window.webContents.send("loaded-recent-file", fileMetadata);
				} catch (err) {
					log.error(err);
					window.webContents.send("remove-recent-file", {
						err: err.message,
						path: recentFile.filePath,
					});
				}
			});

			ipcMain.on("logError:electron", (channel, error) => {
				if ("type" in error) {
					log.transports.file.level = "error";
				}

				if (error.type.includes("GRBL_HAL")) {
					error.type === "GRBL_HAL_ERROR"
						? grblLog.error(
								`GRBL_HAL_ERROR:Error ${error.code} - ${error.description} Line ${error.lineNumber}: "${error.line.trim()}" Origin- ${error.origin.trim()}`,
							)
						: grblLog.error(
								`GRBL_HAL_ALARM:Alarm ${error.code} - ${error.description}`,
							);
				} else {
					error.type === "GRBL_ERROR"
						? grblLog.error(
								`GRBL_ERROR:Error ${error.code} - ${error.description} Line ${error.lineNumber}: "${error.line.trim()}" Origin- ${error.origin.trim()}`,
							)
						: grblLog.error(
								`GRBL_ALARM:Alarm ${error.code} - ${error.description}`,
							);
				}
			});

			ipcMain.handle("copy-to-clipboard", (_channel, text) => {
				if (!text) {
					return { success: false, error: "No text to copy" };
				}

				clipboard.writeText(text);

				return { success: true };
			});

			ipcMain.handle("grblLog:fetch", async (channel) => {
				const data = await getGRBLLog(logPath);
				return data;
			});

			ipcMain.handle("check-remote-status", (channel) => {
				log.debug(hostInformation);
				return hostInformation;
			});

			ipcMain.handle("get-windows-registry", async (channel) => {
				if (process.platform !== "win32") {
					return false;
				}

				try {
					const registry = new WinReg({
						hive: WinReg.HKLM,
						key: "\\Software\\SienciLabs\\gSender",
					});

					const isBundledValue = await new Promise((resolve, reject) => {
						registry.get("IsBundled", (err, item) => {
							if (err) {
								reject(err);
								return;
							}
							resolve(item.value);
						});
					});

					const isBundled = isBundledValue === "0x1";

					return isBundled;
				} catch (error) {
					console.error(error);
					return false;
				}
			});

			/**
			 * gSender config events - move electron store changes out of renderer process
			 */
			ipcMain.on("open-upload-dialog", async () => {
				try {
					const additionalOptions = {};
					const gSenderWindow = windowManager.getWindow();

					if (prevDirectory) {
						additionalOptions.defaultPath = prevDirectory;
					}
					const file = await dialog.showOpenDialog(gSenderWindow, {
						properties: ["openFile"],
						filters: [
							{
								name: "G-Code Files",
								extensions: ["gcode", "gc", "nc", "tap", "cnc"],
							},
							{ name: "All Files", extensions: ["*"] },
						],
					});

					if (!file) {
						return;
					}
					if (file.canceled) {
						return;
					}

					const FULL_FILE_PATH = file.filePaths[0];
					const getFileInformation = (file) => {
						const { base, dir } = path.parse(file);
						return [dir, base];
					};

					const [filePath, fileName] = getFileInformation(FULL_FILE_PATH);

					prevDirectory = filePath; // set previous directory

					fs.readFile(FULL_FILE_PATH, "latin1", (err, data) => {
						if (err) {
							log.error(`Error in readFile: ${err}`);
							return;
						}

						const { size } = fs.statSync(FULL_FILE_PATH);
						window.webContents.send("returned-upload-dialog-data", {
							data,
							size,
							name: fileName,
							path: FULL_FILE_PATH,
						});
					});
				} catch (e) {
					log.error(`Caught error in listener - ${e}`);
				}
			});

			ipcMain.on("open-directory-dialog", async () => {
				try {
					const FULL_PATH = await openDirectoryDialog();
					window.webContents.send("returned-directory-dialog-data", FULL_PATH);
				} catch (e) {
					log.error(`Caught error in open-directory-dialog - ${e}`);
				}
			});

			// Pick a plugin to install: either a folder or a .zip. Windows and
			// Linux cannot offer both in one native dialog, hence the mode.
			// Always replies, so a cancel or failure never leaves the install
			// wizard waiting on a message that never comes.
			ipcMain.on("open-plugin-source-dialog", async (_event, mode) => {
				const reply = (payload) =>
					window.webContents.send("returned-plugin-source", payload);

				try {
					const gSenderWindow = windowManager.getWindow();
					const isZip = mode === "zip";
					const result = await dialog.showOpenDialog(gSenderWindow, {
						title: isZip
							? "Select a plugin .zip file"
							: "Select a plugin folder",
						properties: [isZip ? "openFile" : "openDirectory"],
						filters: isZip
							? [{ name: "Plugin Archives", extensions: ["zip"] }]
							: undefined,
					});

					if (!result || result.canceled || result.filePaths.length === 0) {
						reply({ canceled: true });
						return;
					}

					reply({ path: result.filePaths[0] });
				} catch (e) {
					log.error(`Caught error in open-plugin-source-dialog - ${e}`);
					reply({ error: String(e?.message || e) });
				}
			});

			ipcMain.on("open-new-window", (msg, route) => {
				const factor = screen.getPrimaryDisplay().scaleFactor;
				const childOptions = {
					width: 550 / factor,
					height: 460 / factor,
					minWidth: 550 / factor,
					minHeight: 460 / factor,
					useContentSize: true,
					title: "gSender",
					parent: window,
				};
				// Hash router URL should look like '{url}/#/widget/:id'
				const address = `${url}/#${route}`;
				const shouldMaximize = false;
				const isChild = true;

				windowManager.openWindow(
					address,
					childOptions,
					null,
					shouldMaximize,
					isChild,
				);
			});

			ipcMain.on("reconnect-main", (event, options) => {
				let shouldReconnect = false;
				try {
					if (event && event.sender && event.sender.browserWindowOptions) {
						shouldReconnect =
							!event.sender.browserWindowOptions.parent &&
							windowManager.childWindows.length > 0;
					}
				} catch (err) {
					log.error(err);
				}
				if (shouldReconnect) {
					windowManager.childWindows.forEach((window) => {
						window.webContents.send("reconnect", options);
					});
				}
			});

			ipcMain.on("get-data", (event, widget) => {
				window.webContents.send("get-data-" + widget);
			});

			ipcMain.on("receive-data", (event, msg) => {
				const { widget, data } = msg;
				windowManager.childWindows.forEach((window) => {
					window.webContents.send("recieve-data-" + widget, data);
				});
			});

			ipcMain.on("save-display-scale", (_event, scaleFactor) => {
				const value = Number(scaleFactor) || 1.0;

				store.set("displayScaleFactor", value);
				window.webContents.setZoomFactor(value);
			});

			// Relaunch the app. Shared by remote-mode changes and by the plugin
			// install wizard, which needs a restart for the new mount routes.
			const restartApp = () => {
				let didRestart = false;
				const finishRestart = () => {
					if (didRestart) return;
					didRestart = true;
					app.relaunch(); // flags are handled in server/index.js
					app.exit(0);
				};

				// The pendant view runs in native kiosk/fullscreen mode, which can
				// block the process from exiting cleanly (macOS in particular) unless
				// we leave fullscreen first. Schedule the fallback timeout before
				// touching kiosk/fullscreen state so a native exception there can't
				// prevent the restart from ever happening.
				if (
					window &&
					!window.isDestroyed() &&
					(window.isKiosk() || window.isFullScreen())
				) {
					window.once("leave-full-screen", finishRestart);
					setTimeout(finishRestart, 1000);
					try {
						window.setKiosk(false);
						window.setFullScreen(false);
					} catch (err) {
						log.error(
							`Failed to leave kiosk/fullscreen before restart: ${err}`,
						);
					}
				} else {
					finishRestart();
				}
			};

			//Handle app restart with remote settings
			ipcMain.on("remoteMode-restart", () => {
				restartApp();
			});

			ipcMain.on("app-restart", () => {
				restartApp();
			});
		} catch (err) {
			log.error(err);
			log.err(err.name);
			await dialog.showMessageBox({
				message: err,
			});
		}
		//Check for available updates at end to avoid try-catch failing to load events
		if (process.platform === "win32") {
			const internetConnectivity = await isOnline();
			if (internetConnectivity) {
				autoUpdater.autoDownload = false; // We don't want to force update but will prompt until it is updated
				// There may be situations where something is blocking the update check outside of internet connectivity
				// This sets a 4 second timeout on the await.
				try {
					asyncCallWithTimeout(autoUpdater.checkForUpdates(), 5000);
				} catch (e) {
					log.info(
						"Unable to check for app updates, likely no internet connection.",
					);
				}
			}
		}
	});
};

main();
