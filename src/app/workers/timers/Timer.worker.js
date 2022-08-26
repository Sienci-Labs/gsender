onmessage = () => {
    setTimeout(() => {
        postMessage('done');
    }, 5000);
};
