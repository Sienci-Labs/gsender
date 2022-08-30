onmessage = (duration) => {
    clearTimeout(timer);
    console.log('timer called');
    let timer = setTimeout(() => {
        postMessage('done');
        console.log('timer end. response sent');
    }, duration.data, 'done');
};
