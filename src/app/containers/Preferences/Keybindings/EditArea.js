import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button, ButtonGroup } from 'app/components/Buttons';

import { formatShortcut } from './helpers';
import styles from './edit-area.styl';

const triggerKeys = ['Meta', 'Alt', 'Shift', 'Control'];

/**
 * Keybinding Edit Area Component
 * @param {Object} shortcut Currently selected shortcut to edit
 * @param {Array} shortcuts List of keybind (shortcut) objects
 * @param {Function} switchPages Function to switch pages within parent Keybindings component
 * @param {Function} edit Function to edit currently selected shortcut
 */
export default class EditArea extends Component {
    static propTypes = {
        shortcut: PropTypes.object,
        shorcuts: PropTypes.array,
        switchPages: PropTypes.func,
        edit: PropTypes.func,
    }

    initialState = {
        pressed: false,
        singleKey: '',
        keyCombo: '',
        metaTriggered: false,
        altTriggered: false,
        shiftTriggered: false,
        ctrlTriggered: false,
        state: { available: false, error: false, message: '' }
    }

    state = this.initialState;

    /**
     * Function to listen to keydowns and generate new keybinding command combo
     * @param {KeyboardEvent} e The keyboard object containing all keyboard related attributes and methods
     */
    outputKeys = (e) => {
        e.preventDefault();
        const key = e.key;
        const keyLocation = e.location;

        const NUMPAD_LOCATION = e.DOM_KEY_LOCATION_NUMPAD;

        //Ignore trigger keys
        if (triggerKeys.includes(key)) {
            return;
        }

        //Space is not allowed as a keybinding
        if (key === ' ') {
            return;
        }

        //Backspace key will reset state
        if (e.key === 'Backspace') {
            this.setState(this.initialState);
            return;
        }

        this.setState({
            pressed: true,
            metaTriggered: false,
            altTriggered: false,
            shiftTriggered: false,
            ctrlTriggered: false,
        });

        const keys = {
            metaKey: { label: 'command', triggered: e.metaKey },
            altKey: { label: 'alt', triggered: e.altKey },
            ctrlKey: { label: 'ctrl', triggered: e.ctrlKey },
            shiftKey: { label: 'shift', triggered: e.shiftKey },
        };

        let keyCombo = '';
        if (keys.metaKey.triggered) {
            keyCombo += `${keys.metaKey.label}+`;
        }

        if (keys.altKey.triggered) {
            keyCombo += `${keys.altKey.label}+`;
        }

        if (keys.ctrlKey.triggered) {
            keyCombo += `${keys.ctrlKey.label}+`;
        }

        //If the key that was pressed is located on the numpad, we can add shift to the combo if it was triggered,
        //otherwise if the location is somewhere else we need to check if the shift key was the only one triggered,
        //in that case we would not add it to the combo as we want the pressed key's primary value, not secondary
        if (keyLocation === NUMPAD_LOCATION && keys.shiftKey.triggered) {
            keyCombo += `${keys.shiftKey.label}+`;
        } else if (keys.shiftKey.triggered && keyCombo) {
            keyCombo += `${keys.shiftKey.label}+`;
        }

        keyCombo += key;

        const foundShortcut = this.props.shorcuts.find(shortcut => shortcut.keys === keyCombo);

        const keyState = {
            singleKey: key,
            keyCombo,
            metaTriggered: e.metaKey,
            altTriggered: e.altKey,
            shiftTriggered: e.shiftKey,
            ctrlTriggered: e.ctrlKey,
        };

        if (foundShortcut) {
            if (foundShortcut.keys !== this.props.shortcut.keys) {
                this.setState({
                    ...keyState,
                    state: { available: false, error: true, message: `This shortcut is already in use by action "${foundShortcut.title}"` }
                });
            } else {
                //If it found itself, return to original state
                this.setState({ ...keyState, state: { available: false, error: false, message: '' } });
            }
            return;
        }

        this.setState({
            ...keyState,
            state: { available: true, error: false, message: 'Shortcut is Available' },
        });
    }

    /**
     * Function to edit shortcut with new key combo, function invokes parent function received in props
     */
    handleEdit = () => {
        const { shortcut, edit } = this.props;
        const { keyCombo } = this.state;

        edit({ ...shortcut, keys: keyCombo });
    }

    componentDidMount() {
        document.addEventListener('keydown', this.outputKeys);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.outputKeys);
    }

    /**
     * Function to output information window with dynamic message and styling
     */
    infoWindowOutput = () => {
        const { state } = this.state;

        if (state.available) {
            return (<div className={styles['info-window-area-success']}><i className="fas fa-check-circle" /> <p>{state.message}</p></div>);
        }

        if (state.error) {
            return (<div className={styles['info-window-area-error']}><i className="fas fa-exclamation-circle" /> <p>{state.message}</p></div>);
        }

        return (<div className={styles['info-window-area']}><i className="fas fa-info-circle" /> <p>&nbsp;</p></div>);
    }

    render() {
        const {
            pressed,
            singleKey,
            shiftTriggered,
            altTriggered,
            metaTriggered,
            ctrlTriggered,
            state,
        } = this.state;
        const { switchPages, shortcut } = this.props;

        const infoWindowOutput = this.infoWindowOutput();

        const output = pressed
            ? formatShortcut([singleKey])
            : <span className={styles['glowing-text']}>Press Some Keys...</span>;

        const shortcutkeys = formatShortcut(shortcut.keys.split('+'));

        return (
            <div className={styles.wrapper}>

                <div className={styles['edit-info']}>
                    <h5 style={{ textAlign: 'center', textDecoration: 'underline' }}><strong>Action</strong></h5>
                    <h5 style={{ textAlign: 'center', textDecoration: 'underline' }}><strong>Current Shortcut</strong></h5>

                    <h5 style={{ textAlign: 'center' }}>{shortcut.title}</h5>
                    <h5 style={{ textAlign: 'center' }}>{shortcutkeys}</h5>
                </div>

                <div className={styles['new-shortcut']}>
                    <div style={{ textAlign: 'center' }}>
                        <h4>New Shorcut:</h4>
                        <h4>{output}</h4>
                    </div>
                </div>

                <div className={styles['trigger-keys']}>
                    <label className={ctrlTriggered ? styles.active : styles.disabled}>Ctrl</label>
                    <label className={shiftTriggered ? styles.active : styles.disabled}>Shift</label>
                    <label className={altTriggered ? styles.active : styles.disabled}>Alt</label>
                    <label className={metaTriggered ? styles.active : styles.disabled}>Command</label>
                </div>

                {infoWindowOutput}

                <div className={styles['button-group-wrapper']}>
                    <ButtonGroup style={{ marginTop: '2rem' }}>
                        <Button btnSize="lg" btnStyle="default" onClick={() => switchPages('Table')}>Back</Button>
                        <Button btnSize="lg" btnStyle="primary" disabled={!state.available} onClick={this.handleEdit}>Save Changes</Button>
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}
