const path = require('path');
const fs = require('fs').promises;
const fsBase = require('fs');

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
        const fileExists = await fileExistsAtPath(filePath);
        if (!fileExists) {
            return null; // TODO: Handle null as FILENOTFOUND error
        }

        const stats = fsBase.statSync(filePath);
        const { size } = stats;

        const data = await fs.readFile(filePath, 'utf-8');
        return {
            result: data,
            size: size,
            name: fileName,
            dir: fileDir,
        };
    } catch (err) {
        throw err;
    }
};
