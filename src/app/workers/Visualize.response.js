import pubsub from 'pubsub-js';

export const visualizeResponse = ({ data }) => {
    pubsub.publish('file:load', data);
};
