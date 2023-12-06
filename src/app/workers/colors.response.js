import pubsub from 'pubsub-js';

export const colorsResponse = ({ data }) => {
    const { colorArray } = data;
    // Handle file load
    pubsub.publish('colors:load', colorArray);
};
