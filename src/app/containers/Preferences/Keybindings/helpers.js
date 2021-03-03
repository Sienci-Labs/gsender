import React from 'react';

export const formatShortcut = (shortcut = []) => {
    const output = [];
    for (let i = 0; i < shortcut.length; i++) {
        if (i === shortcut.length - 1) {
            output.push(<span key={i}><kbd>{shortcut[i]}</kbd></span>);
        } else {
            output.push(<span key={i}><kbd>{shortcut[i]}</kbd> + </span>);
        }
    }

    return output;
};
