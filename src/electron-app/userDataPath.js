// Side-effect module: must be the first import in main.js so userData is
// settled before electron-log, electron-store or the single-instance lock use it.
//
// In dev the Electron binary runs a bare file, so its app name is "Electron" and
// userData would be .../Electron, while the separately-run backend resolves
// .../gSender (see getDefaultUserDataPath in server/config/settings.base.js).
// The server owns the preferences file, so make Electron match it.
import { app } from 'electron';
import path from 'path';
import pkg from '../package.json';

if (process.env.GSENDER_USER_DATA) {
    app.setPath('userData', process.env.GSENDER_USER_DATA);
} else if (!app.isPackaged) {
    app.setPath('userData', path.join(app.getPath('appData'), pkg.name));
}
