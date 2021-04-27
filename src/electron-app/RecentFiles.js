const path = require('path');
const fs = require('fs').promises;
const fsBase = require('fs');
const { dialog } = require('electron');

const getFileInformation = (file) => {
    const fileName = path.parse(file).base;
    const filePath = path.parse(file).dir;
    return [filePath, fileName];
};

const fileExistsAtPath = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch (e) {
        return false;
    }
};


export const parseAndReturnGCode = async ({ filePath }) => {
    const [fileDir, fileName] = getFileInformation(filePath);

    try {
        const stats = fsBase.statSync(filePath);
        const { size } = stats;
        await dialog.showMessageBox({
            message: `size - ${size}`
        });

        const data = await fs.readFile(filePath, 'utf-8');
        return {
            result: data,
            size: size,
            name: fileName,
            dir: fileDir,
            timeUploaded: Date.now()
        };
    } catch (err) {
        await dialog.showMessageBox({
            message: `Error in readFile: ${err}`
        });
        return err;
    }
};
