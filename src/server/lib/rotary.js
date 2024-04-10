export const checkIfRotaryFile = (gcode) => {
    const commentMatcher = /\s*;.*/g;
    const bracketCommentLine = /\([^\)]*\)/gm;
    const content = gcode.replace(bracketCommentLine, '').trim().replace(commentMatcher, '').trim();
    return content.includes('A');
};
