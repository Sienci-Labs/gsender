// import { shortcuts } from './shortcuts';

/*
***********IMPORTANT*************
- default gamepad keys are in shuttleControlEvents now
    (this makes it easier to implement, since the default shortcuts don't have the new keybindings changes (cmd changes, id changes).
    this way I don't have to edit all 70 of them to make the gamepad shortcuts work,
    and it makes the process of adding shortcuts consistent)
- to find and remove them:
    - global search this regex: \s*gamepadKeys: .*\n\s*keysName: .*,
    - replace with nothing
    - for reference, they should only exist in:
        /Users/sophiabeluli/Documents/work/dev2/gsender/src/app/widgets/JogControl/index.jsx
        /Users/sophiabeluli/Documents/work/dev2/gsender/src/app/widgets/Visualizer/index.jsx
*/
export const profiles = [
    {
        id: ['Logitech Cordless RumblePad 2 (STANDARD GAMEPAD Vendor: 046d Product: c219)'],
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Logitech F710 Gamepad',
        shortcuts: {}
    },
    {
        id: [
            'Xbox 360 Controller (XInput STANDARD GAMEPAD)',
            'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)',
            'Wireless Gamepad (Vendor: 2563 Product: 0575)'
        ],
        icon: 'fas fa-gamepad',
        active: true,
        profileName: 'Xbox Controller',
        shortcuts: {}
    }
];
