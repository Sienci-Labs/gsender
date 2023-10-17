export const BL = 0;
export const TL = 1;
export const TR = 2;
export const BR = 3;



// 0 is default (bottom left), moves clockwise
export const probeDirections = [BL, TL, TR, BR];

// Returns which direction to probe in for X and Y - positive or negative
export const getProbeDirections = (corner) => {
    if (corner === BL) {
        return [1, 1];
    } else if (corner === TL) {
        return [1, -1];
    } else if (corner === TR) {
        return [-1, -1];
    } else if (corner === BR) {
        return [-1, 1];
    }
    return [0, 0];
};
