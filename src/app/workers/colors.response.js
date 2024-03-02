import pubsub from 'pubsub-js';

export const colorsResponse = ({ data }) => {
    // Handle file load
    pubsub.publish('colors:load', data);
};
