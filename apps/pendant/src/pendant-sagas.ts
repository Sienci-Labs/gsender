/**
 * Minimal saga for the pendant: wires socket events → redux store.
 * Covers connection state, machine state/position, port listing.
 * Deliberately omits Electron IPC, visualizer workers, tool-change wizards.
 */
import controller from '@gsender/controller-client/controller';
import { store as reduxStore } from '@gsender/controller-client/store/redux';
import {
    openConnection,
    closeConnection,
    setConnectionState,
    listPorts,
} from '@gsender/controller-client/store/redux/slices/connection.slice';
import {
    updateControllerSettings,
    updateControllerState,
    updateControllerType,
    updateWorkflowState,
    updateFeederStatus,
    updateSenderStatus,
} from '@gsender/controller-client/store/redux/slices/controller.slice';
import {
    updateFileContent,
    unloadFileInfo,
} from '@gsender/controller-client/store/redux/slices/fileInfo.slice';

import type { PortInfo } from '@gsender/controller-client/store/definitions';
import type { ControllerSettings, FIRMWARE_TYPES_T } from 'app/definitions/firmware';
import type { WORKFLOW_STATES_T } from 'app/constants';

export function* initialize() {
    // ── Machine state ──────────────────────────────────────────────────────
    controller.addListener(
        'controller:settings',
        (type: string, settings: ControllerSettings) => {
            reduxStore.dispatch(updateControllerSettings({ type, settings }));
        },
    );

    controller.addListener(
        'controller:state',
        (type: string, state: any) => {
            reduxStore.dispatch(updateControllerState({ type, state }));
        },
    );

    controller.addListener('workflow:state', (state: WORKFLOW_STATES_T) => {
        reduxStore.dispatch(updateWorkflowState({ state }));
    });

    controller.addListener('feeder:status', (status: any) => {
        reduxStore.dispatch(updateFeederStatus({ status }));
    });

    controller.addListener('sender:status', (status: any) => {
        reduxStore.dispatch(updateSenderStatus({ status }));
    });

    // ── Connection lifecycle ───────────────────────────────────────────────
    controller.addListener(
        'serialport:open',
        (options: { port: string; baudrate: string; controllerType: string }) => {
            reduxStore.dispatch(
                openConnection({
                    port: options.port,
                    baudrate: options.baudrate,
                    isConnected: false,
                }),
            );
            reduxStore.dispatch(updateControllerType({ type: options.controllerType }));
        },
    );

    controller.addListener(
        'serialport:openController',
        (controllerType: FIRMWARE_TYPES_T) => {
            reduxStore.dispatch(updateControllerType({ type: controllerType }));
            setTimeout(() => {
                reduxStore.dispatch(setConnectionState({ isConnected: true }));
            }, 300);
        },
    );

    controller.addListener('serialport:close', () => {
        reduxStore.dispatch(closeConnection());
    });

    controller.addListener('serialport:closeController', () => {
        reduxStore.dispatch(closeConnection());
    });

    // ── Port discovery (populates the Connection widget dropdown) ──────────
    controller.addListener(
        'serialport:list',
        (ports: PortInfo[], unrecognizedPorts: PortInfo[], networkPorts: PortInfo[]) => {
            reduxStore.dispatch(listPorts({ ports, unrecognizedPorts, networkPorts }));
        },
    );

    // ── File load/unload (feeds the SVG visualizer) ────────────────────────
    controller.addListener('gcode:load', (name: string, content: string) => {
        const size = new Blob([content]).size;
        reduxStore.dispatch(updateFileContent({ content, size, name }));
    });

    controller.addListener(
        'file:load',
        (content: string, size: number, name: string) => {
            reduxStore.dispatch(updateFileContent({ content, size, name }));
        },
    );

    controller.addListener('gcode:unload', () => {
        reduxStore.dispatch(unloadFileInfo());
    });
}
