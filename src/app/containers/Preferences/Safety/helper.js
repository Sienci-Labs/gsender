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
                path: path.join(app.getPath('userData'), 'logs/main.log'),
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
                        if (record.includes('error') || record.includes('alarm')) {
                            tempContent.push(record);
                        }
                    });
                    content = tempContent;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    return content;
};

export { getAllErrors };
