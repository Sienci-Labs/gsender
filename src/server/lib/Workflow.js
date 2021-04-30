/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import events from 'events';

// Workflow State
export const WORKFLOW_STATE_RUNNING = 'running';
export const WORKFLOW_STATE_PAUSED = 'paused';
export const WORKFLOW_STATE_IDLE = 'idle';

class Workflow extends events.EventEmitter {
    state = WORKFLOW_STATE_IDLE;

    isRunning() {
        return this.state === WORKFLOW_STATE_RUNNING;
    }

    isPaused() {
        return this.state === WORKFLOW_STATE_PAUSED;
    }

    isIdle() {
        return this.state === WORKFLOW_STATE_IDLE;
    }

    start(...args) {
        if (this.state !== WORKFLOW_STATE_RUNNING) {
            this.state = WORKFLOW_STATE_RUNNING;
            this.emit('start', ...args);
        }
    }

    stop(...args) {
        if (this.state !== WORKFLOW_STATE_IDLE) {
            this.state = WORKFLOW_STATE_IDLE;
            this.emit('stop', ...args);
        }
    }

    stopTesting() {
        this.state = WORKFLOW_STATE_IDLE;
        this.emit('stop');
    }

    resumeTesting() {
        if (this.state === WORKFLOW_STATE_PAUSED) {
            this.state = WORKFLOW_STATE_RUNNING;
            this.emit('resume');
        }
    }

    pause(...args) {
        if (this.state === WORKFLOW_STATE_RUNNING) {
            this.state = WORKFLOW_STATE_PAUSED;
            this.emit('pause', ...args);
        }
    }

    resume(...args) {
        if (this.state === WORKFLOW_STATE_PAUSED) {
            this.state = WORKFLOW_STATE_RUNNING;
            this.emit('resume', ...args);
        }
    }
}

export default Workflow;
