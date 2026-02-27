import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import store from 'app/store';
import { CommandKeys } from 'app/lib/definitions/shortcuts';
import { Notification } from 'app/workspace/definitions';

import { PreferencesState } from '../../definitions';

const initialState: PreferencesState = {
    shortcuts: {
        list: store.get('commandKeys', {} as CommandKeys),
        shouldHold: false,
    },
    ipList: [],
    notifications: [],
    accessibility: store.get('workspace.accessibility', {
        statusAnnouncements: true,
        jobProgressAnnouncements: true,
        jobProgressIncrement: 10,
        focusRings: false,
        focusTrapping: false,
        visualizerKeyboardControl: false,
    }),
};

const preferencesSlice = createSlice({
    name: 'preferences',
    initialState,
    reducers: {
        setShortcutsList(state, action: PayloadAction<CommandKeys>) {
            state.shortcuts.list = action.payload;
        },
        holdShortcuts(state) {
            state.shortcuts.shouldHold = true;
        },
        unholdShortcuts(state) {
            state.shortcuts.shouldHold = false;
        },
        setIpList(state, action: PayloadAction<string[]>) {
            state.ipList = action.payload;
        },
        addNotification(state, action: PayloadAction<Notification>) {
            state.notifications.push(action.payload);
        },
        removeNotification(state, action: PayloadAction<string>) {
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== action.payload,
            );
        },
        readAllNotifications(state) {
            const notifications = [...state.notifications];
            notifications.map((n) => (n.status = 'Read'));
            state.notifications = notifications;
        },
        clearNotifications(state) {
            state.notifications = [];
        },
        setNotifications(state, action: PayloadAction<Notification[]>) {
            state.notifications = action.payload;
        },
        updateAccessibility(
            state,
            action: PayloadAction<Partial<PreferencesState['accessibility']>>,
        ) {
            state.accessibility = {
                ...state.accessibility,
                ...action.payload,
            };
            store.set('workspace.accessibility', state.accessibility);
        },
    },
});

export const {
    setShortcutsList,
    holdShortcuts,
    unholdShortcuts,
    setIpList,
    readAllNotifications,
    addNotification,
    removeNotification,
    clearNotifications,
    setNotifications,
    updateAccessibility,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
