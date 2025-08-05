const fs = require("fs");

export function parseLatestReadmeNotes() {
    const readme = fs.readFileSync('README.md', 'utf8');
    let re = /### (\d.\d.\d) \((.*)\)/;

    const notes = readme.split('<summary>Expand to see all version notes</summary>')[1];
    const collectedNotes = [];
    let headerCount = 0;

    const latestReleaseNotes = notes.split('\n').filter(line => {
        if (line.includes('###')) {
            headerCount++;
        }
        if (line.length < 2) {
            return false;
        }
        return headerCount < 4;
    }).map(line => line.trim());

    let currentVersion = null;
    for (let line of latestReleaseNotes) {
        const match = line.match(re);
        if (match) {
            currentVersion && collectedNotes.push(currentVersion);
            currentVersion = {};
            currentVersion.version = match[1];
            currentVersion.date = match[2];
            currentVersion.notes = [];
        } else {
            currentVersion.notes.push(line.replace('- ', ''));
        }
    }

    collectedNotes.push(currentVersion);
    fs.writeFileSync('./src/server/api/notes.json', JSON.stringify(collectedNotes, null, 2));
}
