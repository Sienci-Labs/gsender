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

import { app } from "electron";
import ensureArray from "ensure-array";
import fs from "fs";
import noop from "lodash/noop";
import partition from "lodash/partition";
import path from "path";
import { SerialPort } from "serialport";
import socketIO from "socket.io";
import { VISUALIZER_SECONDARY } from "../../../app/src/constants";
import { authorizeIPAddress } from "../../access-control";
import { GrblController, GrblHalController } from "../../controllers";
import { GRBL } from "../../controllers/Grbl/constants";
import { GRBLHAL } from "../../controllers/Grblhal/constants";
import Connection from "../../lib/Connection";
import delay from "../../lib/delay";
import EventTrigger from "../../lib/EventTrigger";
import DFUFlasher from "../../lib/Firmware/Flashing/DFUFlasher";
import FlashingFirmware from "../../lib/Firmware/Flashing/firmwareflashing";
import UF2Flasher from "../../lib/Firmware/Flashing/UF2Flasher";
import logger from "../../lib/logger";
import { listNetworkAddresses } from "../../lib/network-interfaces";
import store from "../../store";
import config from "../configstore";
import taskRunner from "../taskrunner";

const log = logger("service:cncengine");

// Case-insensitive equality checker.
// @param {string} str1 First string to check.
// @param {string} str2 Second string to check.
// @return {boolean} True if str1 and str2 are the same string, ignoring case.
const caseInsensitiveEquals = (str1, str2) => {
	str1 = str1 ? (str1 + "").toUpperCase() : "";
	str2 = str2 ? (str2 + "").toUpperCase() : "";
	return str1 === str2;
};

// Case insensitive includes.
// @param {array} arr Array to check.
// @param {string} val Value to check for in the array.
// @return {boolean} True if val is in arr, ignoring case.
const caseInsensitiveIncludes = (arr, val) => {
	return arr.some((arrVal) => caseInsensitiveEquals(arrVal, val));
};

const isValidController = (controller) =>
	// Standard GRBL
	caseInsensitiveEquals(GRBL, controller) ||
	// GrblHal
	caseInsensitiveEquals(GRBLHAL, controller);

class CNCEngine {
	controllerClass = {};

	connection = null;

	listener = {
		taskStart: (...args) => {
			if (this.io) {
				this.io.emit("task:start", ...args);
			}
		},
		taskFinish: (...args) => {
			if (this.io) {
				this.io.emit("task:finish", ...args);
			}
		},
		taskError: (...args) => {
			if (this.io) {
				this.io.emit("task:error", ...args);
			}
		},
		configChange: (...args) => {
			if (this.io) {
				this.io.emit("config:change", ...args);
			}
		},
	};

	server = null;

	io = null;

	sockets = [];

	// File content and metadata
	gcode = null;

	meta = null;

	networkDevices = [];

	// Event Trigger
	event = new EventTrigger((event, trigger, commands) => {
		log.debug(
			`EventTrigger: event="${event}", trigger="${trigger}", commands="${commands}"`,
		);
		if (trigger === "system") {
			taskRunner.run(commands);
		}
	});

	// @param {object} server The HTTP server instance.
	// @param {string} controller Specify CNC controller.
	start(server, controller = "") {
		// Fallback to an empty string if the controller is not valid
		log.debug(controller);
		if (!isValidController(controller)) {
			controller = "";
		}

		// Grbl
		if (!controller || caseInsensitiveEquals(GRBL, controller)) {
			this.controllerClass[GRBL] = GrblController;
		}
		if (!controller || caseInsensitiveEquals(GRBLHAL, controller)) {
			this.controllerClass[GRBLHAL] = GrblHalController;
		}

		if (Object.keys(this.controllerClass).length === 0) {
			throw new Error(`No valid CNC controller specified (${controller})`);
		}

		const loadedControllers = Object.keys(this.controllerClass);
		log.debug(`Loaded controllers: ${loadedControllers}`);

		this.stop();

		taskRunner.on("start", this.listener.taskStart);
		taskRunner.on("finish", this.listener.taskFinish);
		taskRunner.on("error", this.listener.taskError);
		config.on("change", this.listener.configChange);

		// System Trigger: Startup
		this.event.trigger("startup");

		this.server = server;
		this.io = socketIO(this.server, {
			serveClient: true,
			path: "/socket.io",
			pingTimeout: 60000,
			pingInterval: 25000,
			maxHttpBufferSize: 40e6,
		});

		this.io.use(async (socket, next) => {
			try {
				// IP Address Access Control
				const ipaddr = socket.handshake.address;
				await authorizeIPAddress(ipaddr);
			} catch (err) {
				log.warn(err);
				next(err);
				return;
			}

			next();
		});

		this.io.on("connection", (socket) => {
			this.networkDevices = [];
			const address = socket.handshake.address;
			const user = socket.decoded_token || {};
			log.debug(
				`New connection from ${address}: id=${socket.id}, user.id=${user.id}, user.name=${user.name}`,
			);

			// Joins targetSocket to an already-open connection without touching the
			// serial port: registers it with Connection/Controller so it receives
			// ongoing status pushes, then acks the join so its UI flips to
			// "connected". The ack must fire *before* controller.addConnection
			// populates fresh state — MachineStatus.tsx resets its "fresh state"
			// flag on serialport:open, so a reset arriving after the fresh state
			// would clobber it.
			const joinSocketToConnection = (targetSocket, port, controller) => {
				targetSocket.join(port);
				targetSocket.emit("serialport:open", {
					port,
					baudrate: controller.options.baudrate,
					controllerType: controller.type,
					inuse: true,
				});
				targetSocket.emit("serialport:openController", controller.type);
				this.connection.addConnection(targetSocket);
				controller.addConnection(targetSocket);
			};

			const connectionListeners = {
				"serialport:open": (port, baudrate, controllerType, inuse) => {
					this.emit("serialport:open", port, baudrate, controllerType, inuse);
				},
				"serialport:close": (options, received) => {
					this.connection = null;
					this.emit("serialport:close", options, received);
				},
				firmwareFound: (
					controllerType = GRBL,
					options,
					callback = noop,
					refresh = false,
				) => {
					let { port, baudrate, rtscts, network } = { ...options };
					log.debug("firmwareFound event fired");
					if (typeof callback !== "function") {
						callback = noop;
					}

					// Connection may have been closed before delayed firmware detection resolves.
					if (!this.connection) {
						const err = `Cannot initialize controller "${controllerType}" on "${port}" because the connection is no longer available`;
						log.warn(err);
						callback(new Error(err));
						return;
					}

					let controller = store.get(`controllers["${port}"]`);
					if (!controller) {
						log.debug("making new controller");
						const Controller = this.controllerClass[controllerType];
						if (!Controller) {
							const err = `Not supported controller: ${controllerType}`;
							log.error(err);
							callback(new Error(err));
							return;
						}

						controller = new Controller(this, this.connection, {
							port: port,
							baudrate: baudrate,
							rtscts: !!rtscts,
							network,
						});
					}

					controller.addConnection(socket);

					// Load file to controller if it exists
					if (this.hasFileLoaded()) {
						controller.loadFile(this.gcode, this.meta, refresh);
						socket.emit(
							"file:load",
							this.gcode,
							this.meta.size,
							this.meta.name,
						);
					} else {
						log.debug("No file in CNCEngine to load to sender");
					}

					this.connection.addController(controller);

					controller.open(port, baudrate, refresh, (err = null) => {
						if (err) {
							callback(err);
							return;
						}

						// Throw error if port is used and it's not a second client connecting
						if (!refresh && store.get(`controllers["${port}"]`)) {
							log.error(`Serial port "${port}" was not properly closed`);
						}
						store.set(`controllers[${JSON.stringify(port)}]`, controller);

						// This is a brand-new connection (not a second client joining
						// one that already existed) — auto-join every other socket
						// already on the server (desktop, other remote tabs, Console
						// popouts) so they show connected without anyone clicking
						// Connect on their end too.
						if (!refresh) {
							this.sockets
								.filter((otherSocket) => otherSocket !== socket)
								.forEach((otherSocket) => {
									joinSocketToConnection(otherSocket, port, controller);
								});
						}

						callback(null);
					});

					socket.emit("serialport:openController", controllerType);
				},
			};

			const addConnectionListeners = () => {
				Object.keys(connectionListeners).forEach((eventName) => {
					const callback = connectionListeners[eventName];
					this.connection.on(eventName, callback);
				});
			};

			const removeConnectionListeners = () => {
				Object.keys(connectionListeners).forEach((eventName) => {
					this.connection.removeAllListeners(eventName);
				});
			};

			// Add to the socket pool
			this.sockets.push(socket);

			socket.emit("startup", {
				loadedControllers: Object.keys(this.controllerClass),

				// User-defined baud rates and ports
				baudrates: ensureArray(config.get("baudrates", [])),
				ports: ensureArray(config.get("ports", [])),
				socketsLength: this.sockets.length,

				// Lets a freshly-loaded client (e.g. a remote/tablet browser) know
				// there's already a live connection it can join, without needing
				// to open a port itself.
				activeConnection:
					this.connection && this.connection.isOpen()
						? {
								port: this.connection.options.port,
								baudrate: this.connection.options.baudrate,
								controllerType: this.connection.controllerType,
							}
						: null,
			});

			socket.on("newConnection", () => {
				// if the sockets include more than the original desktop client
				// check if electron app is defined
				if (this.sockets.length > 1 && app) {
					const userDataPath = path.join(
						app.getPath("userData"),
						"preferences.json",
					);

					if (fs.existsSync(userDataPath)) {
						const content = fs.readFileSync(userDataPath, "utf8") || "{}";
						socket.emit("connection:new", content);
					}
				}
			});

			socket.on("disconnect", () => {
				log.debug(
					`Disconnected from ${address}: id=${socket.id}, user.id=${user.id}, user.name=${user.name}`,
				);

				if (!this.connection) {
					return;
				}
				this.connection.removeConnection(socket);

				// Remove from socket pool
				this.sockets.splice(this.sockets.indexOf(socket), 1);
			});

			socket.on("reconnect", (port) => {
				if (!this.connection) {
					const message = "No connection object found to reconnect to";
					log.info(message);
					this.io.emit("task:error", message);
					return;
				}

				const controller = store.get(`controllers["${port}"]`);
				if (!controller) {
					const message = `No controller found on port ${port} to reconnect to`;
					log.info(message);
					this.io.emit("task:error", message);
					return;
				}

				log.info(
					`Reconnecting to open controller on port ${port} with socket ID ${socket.id}`,
				);

				if (this.connection.isOpen()) {
					log.info("Joining port room on socket");
					joinSocketToConnection(socket, port, controller);
				} else {
					log.info("Connection no longer open");
				}
			});

			socket.on("addclient", (port) => {
				if (!this.connection) {
					log.info("No connection object found to reconnect to");
					return;
				}

				const controller = store.get(`controllers["${port}"]`);
				if (!controller) {
					log.info(`No controller found on port ${port} to reconnect to`);
					return;
				}

				log.info(
					`Adding new client to connection on port ${port} with socket ID ${socket.id}`,
				);

				if (this.connection.isOpen()) {
					joinSocketToConnection(socket, port, controller);
				}
			});

			// List the available serial ports
			socket.on("list", () => {
				log.debug(`socket.list(): id=${socket.id}`);

				SerialPort.list()
					.then((ports) => {
						ports = ports.concat(ensureArray(config.get("ports", [])));

						const controllers = store.get("controllers", {});
						const portsInUse = Object.keys(controllers).filter((port) => {
							const controller = controllers[port];
							return controller && controller.isOpen();
						});

						// Filter ports by productId to avoid non-arduino devices from appearing
						const validProductIDs = [
							"000A",
							"0483",
							"6015",
							"6001",
							"606D",
							"003D",
							"0042",
							"0043",
							"2341",
							"7523",
							"EA60",
							"2303",
							"2145",
							"0AD8",
							"08D8",
							"5740",
							"0FA7",
						];
						const validVendorIDs = [
							"2E8A",
							"16C0",
							"1D50",
							"0403",
							"2341",
							"0042",
							"1A86",
							"10C4",
							"067B",
							"03EB",
							"16D0",
							"0483",
						];
						let [recognizedPorts, unrecognizedPorts] = partition(
							ports,
							(port) => {
								if (!port.vendorId || !port.productId) {
									return false;
								}
								return (
									caseInsensitiveIncludes(validProductIDs, port.productId) &&
									caseInsensitiveIncludes(validVendorIDs, port.vendorId)
								);
							},
						);

						const portInfoMapFn = (port) => {
							return {
								port: port.path,
								manufacturer: port.manufacturer,
								inuse: portsInUse.indexOf(port.path) >= 0,
							};
						};

						recognizedPorts = recognizedPorts.map(portInfoMapFn);
						unrecognizedPorts = unrecognizedPorts.map(portInfoMapFn);
						//unrecognizedPorts = recognizedPorts;

						const networkPorts = this.networkDevices.map((port) => {
							return {
								port: port.ip,
								manufacturer: undefined,
								inuse: controllers[port],
							};
						});
						/*unrecognizedPorts = [{
                            port: 'COM3',
                            manufacturer: 'Microsoft',
                            inuse: false
                        }, {
                            port: 'COM7',
                            manufacturer: 'Broadcom',
                            inuse: false
                        }];*/

						socket.emit(
							"serialport:list",
							recognizedPorts,
							unrecognizedPorts,
							networkPorts,
						);
					})
					.catch((err) => {
						log.error(err);
					});
			});

			// Sends back the available IPv4 addresses on this computer, annotated
			// with the adapter they belong to and which one we recommend hosting on.
			socket.on("listAllIps", async () => {
				try {
					socket.emit("ip:list", await listNetworkAddresses());
				} catch (err) {
					log.error(`Unable to list network addresses: ${err.message}`);
					socket.emit("ip:list", []);
				}
			});

			// Open serial port
			socket.on("open", (port, options, callback) => {
				const engine = this;

				log.debug(
					`socket.open("${port}", ${JSON.stringify(options)}): id=${socket.id}`,
				);

				// Remove old listeners from the existing connection before potentially replacing it
				if (this.connection) {
					removeConnectionListeners();
				}

				if (!this.connection || this.connection.isClose()) {
					// No connection or stale closed connection — start fresh
					this.connection = new Connection(engine, port, options, callback);
					addConnectionListeners();
				} else {
					// Genuinely open connection — refresh for additional client joining
					addConnectionListeners();
					this.connection.updateOptions(options);
					this.connection.refresh();
				}

				this.connection.addConnection(socket);

				if (this.connection.isOpen()) {
					// Join the room
					socket.join(port);

					callback(null);
					return;
				}

				this.connection.open((err = null) => {
					if (err) {
						callback(err);
						this.connection = null;
						return;
					}

					// System Trigger: Open a serial port
					this.event.trigger("port:open");

					callback(null);
				});
			});

			// Close serial port
			socket.on("close", (port, callback = noop) => {
				const numClients = socket.adapter.rooms?.get(port)?.size;
				if (typeof callback !== "function") {
					callback = noop;
				}

				log.debug(`socket.close("${port}"): id=${socket.id}`);

				const controller = store.get(`controllers["${port}"]`);
				if (!controller) {
					const err = `Controller on "${port}" not accessible`;
					log.error(err);
					callback(new Error(err));
					return;
				}

				if (!this.connection) {
					const err = `Serial port "${port}" not accessible`;
					log.error(err);
					callback(new Error(err));
					return;
				}

				// System Trigger: Close a serial port
				this.event.trigger("port:close");

				// Leave the room
				socket.leave(port);

				if (!numClients || numClients <= 1) {
					// if only this one was connected
					this.connection.close();
					this.connection = null;
					controller.close((err) => {
						// Remove controller from store
						store.unset(`controllers[${JSON.stringify(port)}]`);

						// Destroy controller
						controller.destroy();

						callback(null);
					});
				}

				socket.emit("serialport:close", {
					port: port,
				});
			});

			socket.on("command", (port, cmd, ...args) => {
				log.debug(`socket.command("${port}", "${cmd}"): id=${socket.id}`);

				// socket.io appends the client's ack as the last argument. It is
				// deliberately left IN `args`: handlers that support a completion
				// callback ('gcode:load', 'macro:load', 'macro:run',
				// 'watchdir:load') destructure it positionally and invoke it with
				// their real result, which is what settles the client's promise.
				// We only reach for it on the paths below, where the controller is
				// never invoked and so nothing else could ever settle it.
				const ack =
					typeof args[args.length - 1] === "function"
						? args[args.length - 1]
						: null;

				if (!this.connection || this.connection.isClose()) {
					const error = `Serial port "${port}" not accessible`;
					log.error(error);
					ack?.(new Error(error));
					return;
				}

				const controller = store.get(`controllers["${port}"]`);
				if (!controller) {
					const error = `controller on "${port}" not accessible`;
					log.error(error);
					ack?.(new Error(error));
					return;
				}

				try {
					controller.command.apply(controller, [cmd].concat(args));
				} catch (err) {
					log.error(`socket.command("${port}", "${cmd}") failed: ${err.message}`);
					ack?.(err);
				}
			});

			// --- Plugin bridge ----------------------------------------------
			// Unlike "command" above, these always invoke their ack on every
			// path — the client side is promise-based and has nothing else to
			// settle on. They also never let a callback travel inside the
			// controller's args; see "plugin:command" below for why.

			const withController = (port, ack, fn) => {
				const controller = store.get(`controllers["${port}"]`);
				if (!controller) {
					ack?.({ ok: false, error: `controller on "${port}" not accessible` });
					return;
				}
				try {
					fn(controller);
				} catch (err) {
					ack?.({ ok: false, error: err.message });
				}
			};

			// A plugin's machine.command(). Deliberately NOT routed through the
			// legacy "command" handler: that one leaves the socket.io ack sitting
			// in `args`, and handlers destructure positionally — so
			// controller.command("gcode", "$$", ack) has the ack function read as
			// `context` and handed to feeder.feed(), which expects a plain object.
			// Nothing then invokes it and the plugin's promise hangs until the
			// SDK's request timeout. Here the ack is a separate parameter and
			// never enters the args array.
			//
			// The ack signals DELIVERY, not completion — most command handlers
			// have no completion signal at all. machine.query() is the
			// request/response primitive.
			socket.on("plugin:command", (port, cmd, args, ack) => {
				if (!this.connection || this.connection.isClose()) {
					ack?.({ ok: false, error: `Serial port "${port}" not accessible` });
					return;
				}
				if (typeof cmd !== "string" || cmd === "") {
					ack?.({ ok: false, error: "A command is required" });
					return;
				}
				withController(port, ack, (controller) => {
					controller.command.apply(controller, [cmd].concat(args || []));
					ack?.({ ok: true });
				});
			});

			socket.on(
				"plugin:parser:register",
				(port, ownerId, pluginId, specs, ack) => {
					withController(port, ack, (controller) => {
						const result = controller.registerPluginParsers(
							ownerId,
							pluginId,
							specs,
						);
						ack?.({ ok: true, ...result });
					});
				},
			);

			socket.on("plugin:parser:unregister", (port, ownerId, parserId, ack) => {
				withController(port, ack, (controller) => {
					controller.unregisterPluginParsers(ownerId, parserId);
					ack?.({ ok: true });
				});
			});

			socket.on("plugin:query", (port, cmd, opts, ack) => {
				withController(port, ack, (controller) => {
					controller.pluginQuery(cmd, opts, (err, result) => {
						if (err) {
							ack?.({ ok: false, error: err.message, code: err.code });
							return;
						}
						ack?.({ ok: true, result });
					});
				});
			});

			socket.on(
				"flash:start",
				(
					flashPort,
					imageType,
					isHal = false,
					data = null,
					firmwareType = "hex",
				) => {
					log.debug(
						`Flashing ${flashPort}, isHal: ${isHal}, imageType: ${imageType}, firmwareType: ${firmwareType}`,
					);
					if (!flashPort) {
						log.error(
							"task:error",
							"No port specified - make sure you connect to you device at least once before attempting flashing",
						);
						return;
					}

					// UF2 flashing (RP2350 / Pico 2350): board has been sent $UF2 and
					// reboots as a USB mass-storage volume — copy the .uf2 onto it.
					if (firmwareType === "uf2") {
						const uf2Flasher = new UF2Flasher({ uf2: data });
						uf2Flasher.on("error", (err) => {
							this.emit("flash:message", { type: "Error", content: err });
						});
						uf2Flasher.on("info", (msg) => {
							this.emit("flash:message", { type: "Info", content: msg });
						});
						uf2Flasher.on("progress", (amount, total) => {
							this.emit("flash:progress", amount, total);
						});
						uf2Flasher.on("end", () => {
							this.emit("flash:end");
						});

						// Release the controller so the board can reboot into UF2 mode.
						const controller = store.get('controllers["' + flashPort + '"]');
						if (controller) {
							store.unset(`controllers[${JSON.stringify(flashPort)}]`);
						}

						uf2Flasher.flash().catch((err) => {
							this.emit("flash:message", {
								type: "Error",
								content: err.message || err,
							});
						});
						return;
					}

					let halFlasher;
					if (isHal) {
						halFlasher = new DFUFlasher({
							image: imageType,
							isHal,
							hex: data,
						});

						halFlasher.on("error", (err) => {
							this.emit("flash:message", { type: "Error", content: err });
						});

						halFlasher.on("info", (msg) => {
							this.emit("flash:message", { type: "Info", content: msg });
						});

						halFlasher.on("end", () => {
							this.emit("flash:end");
						});
						halFlasher.on("progress", (amount, total) => {
							this.emit("flash:progress", amount, total);
						});
					}

					const isInDFUmode = flashPort === "SLB_DFU";

					//Close the controller for flasher utility to take over the port
					const controller = store.get('controllers["' + flashPort + '"]');
					if (controller) {
						if (isHal) {
							store.unset(`controllers[${JSON.stringify(flashPort)}]`);
							const startFlash = () => {
								try {
									halFlasher.flash(data);
								} catch (err) {
									this.emit("flash:message", { type: "Error", content: err });
								}
							};
							if (isInDFUmode) {
								startFlash();
							} else {
								delay(1500).then(startFlash);
							}
							return;
						}

						// Normal flash - close port then flash using AVRgirl
						this.connection.close();
						controller.close(() => {
							FlashingFirmware(flashPort, imageType, socket);
						});

						store.unset(`controllers[${JSON.stringify(flashPort)}]`);

						return;
					} else if (isHal) {
						const startFlash = () => {
							try {
								halFlasher.flash(data);
							} catch (err) {
								this.emit("flash:message", { type: "Error", content: err });
							}
						};
						if (isInDFUmode) {
							startFlash();
						} else {
							delay(1500).then(startFlash);
						}

						return;
					}

					FlashingFirmware(flashPort, imageType, socket);
				},
			);

			socket.on("write", (port, data, context = {}) => {
				log.debug(
					`socket.write("${port}", "${data}", ${JSON.stringify(context)}): id=${socket.id}`,
				);

				const controller = store.get(`controllers["${port}"]`);
				if (
					!this.connection ||
					this.connection.isClose() ||
					!controller ||
					controller.isClose()
				) {
					log.error(`Serial port "${port}" not accessible`);
					return;
				}

				controller.write(data, context);
			});

			socket.on("writeln", (port, data, context = {}) => {
				log.debug(
					`socket.writeln("${port}", "${data}", ${JSON.stringify(context)}): id=${socket.id}`,
				);
				store.set("inAppConsoleInput", data);
				const controller = store.get(`controllers["${port}"]`);
				if (
					!this.connection ||
					this.connection.isClose() ||
					!controller ||
					controller.isClose()
				) {
					log.error(`Serial port "${port}" not accessible`);
					return;
				}

				controller.writeln(data, context);
			});

			socket.on("hPing", () => {
				log.debug(
					`Health check received at ${new Date().toLocaleTimeString()}`,
				);
				socket.emit("hPong");
			});

			socket.on("file:fetch", () => {
				socket.emit("file:fetch", this.gcode, this.meta);
			});

			socket.on("file:unload", () => {
				log.debug("Socket unload called");
				this.unload();
			});
		});
	}

	stop() {
		if (this.io) {
			this.io.close();
			this.io = null;
		}
		this.sockets = [];
		this.server = null;

		taskRunner.removeListener("start", this.listener.taskStart);
		taskRunner.removeListener("finish", this.listener.taskFinish);
		taskRunner.removeListener("error", this.listener.taskError);
		config.removeListener("change", this.listener.configChange);
	}

	// Emit message across all sockets
	emit(msg, ...args) {
		this.sockets.forEach((socket) => {
			socket.emit(msg, ...args);
		});
	}

	/**
	 * Rebuilds every live controller's manifest-declared parser chain. Call this
	 * whenever the set of enabled plugins changes (enable, disable, import) so
	 * parsers start and stop without needing a reconnect or an app restart.
	 */
	reloadPluginParsers() {
		const controllers = store.get("controllers", {});
		Object.keys(controllers).forEach((port) => {
			try {
				controllers[port]?.reloadPluginParsers?.();
			} catch (err) {
				log.error(
					`Failed to reload plugin parsers on "${port}": ${err.message}`,
				);
			}
		});
	}

	/* Functions related to loading file through server */
	// If gcode is going to live in CNCengine, we need functions to access or unload it.
	load({ port, gcode, ...meta }) {
		this.gcode = gcode;
		this.meta = meta;

		// Load the file to the sender if controller connection exists
		if (port) {
			const controller = store.get(`controllers["${port}"]`);
			if (controller) {
				controller.loadFile(this.gcode, this.meta);
			}
		}

		log.info(`Loaded file '${meta.name}' to CNCEngine`);
		this.emit("file:load", gcode, meta.size, meta.name, meta.visualizer);
	}

	unload() {
		log.info("Unloading file from CNCEngine");
		this.gcode = null;
		this.meta = null;
		this.emit("file:unload");
	}

	fetchGcode() {
		return [this.gcode, this.meta];
	}

	hasFileLoaded() {
		// this function is for checking whether we need to reload a file to the main vis,
		// so if the file we loaded was in secondary vis, return false
		if (this.meta?.visualizer === VISUALIZER_SECONDARY) {
			return false;
		}
		return this.gcode !== null;
	}
}

export default CNCEngine;
