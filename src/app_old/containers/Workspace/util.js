const getOperatingSystem = (window) => {
    let operatingSystem = 'unknown';

    if (window.navigator.appVersion.indexOf('Win') !== -1) {
        operatingSystem = 'Windows OS';
    } else if (window.navigator.appVersion.indexOf('Mac') !== -1) {
        operatingSystem = 'MacOS';
    } else if (window.navigator.appVersion.indexOf('Linux') !== -1) {
        operatingSystem = 'Linux OS';
    }
    return operatingSystem;
};

export { getOperatingSystem };
