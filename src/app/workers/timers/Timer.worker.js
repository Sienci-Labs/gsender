onmessage = (duration) => {
    clearTimeout(timer);
    let timer = setTimeout(() => {
        postMessage('done');
    }, duration.data, 'done');
};
