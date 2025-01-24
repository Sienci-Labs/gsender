import OptionResolver from 'option-resolver.js';

import EventEmitter from './EventEmitter';

/**
 * Gamepad Handler
 *
 * @param {Gamepad} gamepad
 * @param {Object} config
 */
export default class GamepadHandler extends EventEmitter {
    static optionResolver = new OptionResolver()
        .setDefaults({
            analog: true,
            deadZone: 0,
            precision: 0,
        })
        .setTypes({
            analog: 'boolean',
            deadZone: 'number',
            precision: 'number',
        })
        .setValidators({
            deadZone: (value) => Math.max(Math.min(value, 1), 0),
            precision: (value) => (value > 0 ? Math.pow(10, value) : 0),
        });

    constructor(index, gamepad, config = {}) {
        super();

        this.index = index;
        this.gamepad = gamepad;
        this.options = this.constructor.resolveOptions(config);
        this.axes = new Array(gamepad.axes.length).fill(null);
        this.buttons = new Array(gamepad.buttons.length).fill(null);

        this.initAxes();
        this.initButtons();
    }

    /**
     * Resolve options
     *
     * @param {Object} config
     *
     * @return {Object}
     */
    static resolveOptions(config) {
        const { axis, button } = config;

        return {
            axis: this.optionResolver.resolve(axis ?? button ?? config ?? {}),
            button: this.optionResolver.resolve(button ?? axis ?? config ?? {}),
        };
    }

    initAxes() {
        const { length } = this.axes;

        for (let index = 0; index < length; index++) {
            this.axes[index] = this.resolveAxisValue(index);
        }
    }

    initButtons() {
        const { length } = this.buttons;

        for (let index = 0; index < length; index++) {
            this.buttons[index] = this.resolveButtonValue(index);
        }
    }

    update(gamepad) {
        this.gamepad = gamepad;
        this.updateAxis();
        this.updateButtons();
    }

    updateAxis() {
        const { length } = this.axes;

        for (let index = 0; index < length; index++) {
            this.setAxisValue(index, this.resolveAxisValue(index));
        }
    }

    updateButtons() {
        const { length } = this.buttons;

        for (let index = 0; index < length; index++) {
            this.setButtonValue(index, this.resolveButtonValue(index));
        }
    }

    setAxisValue(index, value) {
        if (this.axes[index] !== value) {
            this.axes[index] = value;
            this.emit('axis', {
                gamepad: this.gamepad,
                index: this.index,
                axis: index,
                value,
            });
        }
    }

    setButtonValue(index, value) {
        if (this.buttons[index] !== value) {
            this.buttons[index] = value;
            this.emit('button', {
                gamepad: this.gamepad,
                index: this.index,
                button: index,
                pressed: this.gamepad.buttons[index].pressed,
                value,
            });
        }
    }

    /**
     * @param {Number} index
     */
    resolveAxisValue(index) {
        const { deadZone, analog, precision } = this.options.axis;
        const value = this.gamepad.axes[index];

        if (deadZone && value < deadZone && value > -deadZone) {
            return 0;
        }

        if (!analog) {
            return value > 0 ? 1 : value < 0 ? -1 : 0;
        }

        if (precision) {
            return Math.round(value * precision) / precision;
        }

        return value;
    }

    /**
     * @param {Number} index
     *
     * @return {Number}
     */
    resolveButtonValue(index) {
        const { deadZone, analog, precision } = this.options.button;
        const { value } = this.gamepad.buttons[index];

        if (deadZone > 0 && value < deadZone && value > -deadZone) {
            return 0;
        }

        if (!analog) {
            return value === 0 ? 0 : 1;
        }

        if (precision) {
            return Math.round(value * precision) / precision;
        }

        return value;
    }
}
