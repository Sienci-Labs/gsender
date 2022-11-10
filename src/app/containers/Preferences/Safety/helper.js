import isElectron from 'is-electron';

const getAllErrors = () => {
    let userData = null;
    let content = '';
    // Check whether the code is running in Electron renderer process
    if (isElectron()) {
        const electron = window.require('electron');
        const path = window.require('path'); // Require the path module within Electron
        const app = electron.remote.app;
        try {
            userData = {
                path: path.join(app.getPath('userData'), 'logs/grbl.log'),
            };
            const fs = window.require('fs'); // Require the fs module within Electron
            if (fs.existsSync(userData.path)) {
                content = fs.readFileSync(userData.path, 'utf8') || '';
                if (content) {
                    content = content
                        .toString()
                        .replace(/\r\n/g, '\n')
                        .split('\n');
                    let tempContent = [];
                    content.forEach(record => {
                        if (record.toLowerCase().includes('error') || record.toLowerCase().includes('alarm')) {
                            tempContent.push(record);
                        }
                    });
                    if (tempContent.length > 50) {
                        tempContent = tempContent.slice(0, 50);
                    }
                    content = tempContent.reverse();
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    return content;
};

export { getAllErrors };
