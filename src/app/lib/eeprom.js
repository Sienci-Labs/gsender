import { getHomingLocation, FRONT_RIGHT, FRONT_LEFT, BACK_LEFT } from 'app/widgets/Location/RapidPosition';

export const homingString = (mask) => {
    let location = '';
    const placement = getHomingLocation(mask);
    if (placement === FRONT_LEFT) {
        location = 'Front Left';
    } else if (placement === FRONT_RIGHT) {
        location = 'Front Right';
    } else if (placement === BACK_LEFT) {
        location = 'Back Left';
    } else {
        location = 'Back Right';
    }
    return `${mask} (${location})`;
};
