import pubsub from 'pubsub-js';

// Styling choices
export const TOASTER_INFO = 'info';
export const TOASTER_WARNING = 'warning';
export const TOASTER_DANGER = 'danger';
export const TOASTER_SUCCESS = 'success';

// Durations
export const TOASTER_SHORT = 2000;
export const TOASTER_DEFAULT = 5000;
export const TOASTER_LONG = 10000;
export const TOASTER_UNTIL_CLOSE = -1;

export const Toaster = {
    pop: (options) => {
        pubsub.publish('toast:new', options);
    }
};
