import fs from 'fs';

export function parseLatestReadmeNotes() {
    const readme = fs.readFileSync('README.md', 'utf8');

    const notes = readme.split('## 🕣 Development History')[1];

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

    console.log(latestReleaseNotes);
}

parseLatestReadmeNotes();
