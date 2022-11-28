import { shortcuts } from './shortcuts';

export const profiles = [
    {
        id: 'Logitech Cordless RumblePad 2 (STANDARD GAMEPAD Vendor: 046d Product: c219)',
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Logitech F710 Gamepad',
        shortcuts: shortcuts.map(shortcut => {
            const { cmd, title } = shortcut;

            switch (cmd) {
            case 'LOAD_FILE': {
                return { ...shortcut, keys: '0', keysName: 'A' };
            }

            case 'UNLOAD_FILE': {
                return { ...shortcut, keys: '1', keysName: 'B' };
            }

            case 'START_JOB': {
                return { ...shortcut, keys: '9', keysName: 'Start' };
            }

            case 'PAUSE_JOB': {
                return { ...shortcut, keys: '2', keysName: 'X' };
            }

            case 'STOP_JOB': {
                return { ...shortcut, keys: '3', keysName: 'Y' };
            }

            case 'JOG': {
                if (title === 'Jog: X+') {
                    return { ...shortcut, keys: '15', keysName: 'Arrow Right' };
                }

                if (title === 'Jog: X-') {
                    return { ...shortcut, keys: '14', keysName: 'Arrow Left' };
                }

                if (title === 'Jog: Y+') {
                    return { ...shortcut, keys: '12', keysName: 'Arrow Up' };
                }

                if (title === 'Jog: Y-') {
                    return { ...shortcut, keys: '13', keysName: 'Arrow Down' };
                }

                if (title === 'Jog: Z+') {
                    return { ...shortcut, keys: '5', keysName: 'Left Button' };
                }

                if (title === 'Jog: Z-') {
                    return { ...shortcut, keys: '4', keysName: 'Right Button' };
                }

                if (title === 'Jog: X+ Y+') {
                    return { ...shortcut, keys: '12+15', keysName: 'Arrow Right and Arrow Up' };
                }

                if (title === 'Jog: X+ Y-') {
                    return { ...shortcut, keys: '13+15', keysName: 'Arrow Right and Arrow Down' };
                }

                if (title === 'Jog: X- Y-') {
                    return { ...shortcut, keys: '13+14', keysName: 'Arrow Left and Arrow Down' };
                }

                if (title === 'Jog: X- Y+') {
                    return { ...shortcut, keys: '12+14', keysName: 'Arrow Left and Arrow Up' };
                }

                return { ...shortcut, keys: '' };
            }

            case 'JOG_SPEED': {
                if (title === 'Decrease Jog Speed') {
                    return { ...shortcut, keys: '6', keysName: 'Left Trigger' };
                }

                if (title === 'Increase Jog Speed') {
                    return { ...shortcut, keys: '7', keysName: 'Right Trigger' };
                }

                return { ...shortcut, keys: '' };
            }

            default: {
                return { ...shortcut, keys: '' };
            }
            }
        })
    },
    {
        id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)',
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Xbox Controller',
        shortcuts: shortcuts.map(shortcut => {
            const { cmd, title } = shortcut;

            switch (cmd) {
            case 'LOAD_FILE': {
                return { ...shortcut, keys: '0', keysName: 'A' };
            }

            case 'UNLOAD_FILE': {
                return { ...shortcut, keys: '1', keysName: 'B' };
            }

            case 'START_JOB': {
                return { ...shortcut, keys: '9', keysName: 'Start' };
            }

            case 'PAUSE_JOB': {
                return { ...shortcut, keys: '2', keysName: 'X' };
            }

            case 'STOP_JOB': {
                return { ...shortcut, keys: '3', keysName: 'Y' };
            }

            case 'JOG': {
                if (title === 'Jog: X+') {
                    return { ...shortcut, keys: '15', keysName: 'Arrow Right' };
                }

                if (title === 'Jog: X-') {
                    return { ...shortcut, keys: '14', keysName: 'Arrow Left' };
                }

                if (title === 'Jog: Y+') {
                    return { ...shortcut, keys: '12', keysName: 'Arrow Up' };
                }

                if (title === 'Jog: Y-') {
                    return { ...shortcut, keys: '13', keysName: 'Arrow Down' };
                }

                if (title === 'Jog: Z+') {
                    return { ...shortcut, keys: '5', keysName: 'Left Button' };
                }

                if (title === 'Jog: Z-') {
                    return { ...shortcut, keys: '4', keysName: 'Right Button' };
                }

                if (title === 'Jog: X+ Y+') {
                    return { ...shortcut, keys: '12+15', keysName: 'Arrow Right and Arrow Up' };
                }

                if (title === 'Jog: X+ Y-') {
                    return { ...shortcut, keys: '13+15', keysName: 'Arrow Right and Arrow Down' };
                }

                if (title === 'Jog: X- Y-') {
                    return { ...shortcut, keys: '13+14', keysName: 'Arrow Left and Arrow Down' };
                }

                if (title === 'Jog: X- Y+') {
                    return { ...shortcut, keys: '12+14', keysName: 'Arrow Left and Arrow Up' };
                }

                return { ...shortcut, keys: '' };
            }

            case 'JOG_SPEED': {
                if (title === 'Decrease Jog Speed') {
                    return { ...shortcut, keys: '6', keysName: 'Left Trigger' };
                }

                if (title === 'Increase Jog Speed') {
                    return { ...shortcut, keys: '7', keysName: 'Right Trigger' };
                }

                return { ...shortcut, keys: '' };
            }

            default: {
                return { ...shortcut, keys: '' };
            }
            }
        })
    }
];
