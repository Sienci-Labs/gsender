import { DB_NAME, OBJECT_STORE, DATA_ID } from 'app/constants';

const onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore(OBJECT_STORE, { keyPath: 'id' });
};

export const getParsedData = () => {
    return new Promise((resolve) => {
        let db;
        const request = indexedDB.open(DB_NAME);
        request.onupgradeneeded = onupgradeneeded;
        request.onsuccess = (event) => {
            db = event.target.result;
            db
                .transaction(OBJECT_STORE)
                .objectStore(OBJECT_STORE)
                .get(DATA_ID).onsuccess = (event) => {
                    return resolve(event.target.result);
                };
        };
        request.onerror = (event) => {
            console.error('Error getting parsed data from indexedDB');
        };
    });
};

export const replaceParsedData = (parsedData) => {
    let db;
    const request = indexedDB.open(DB_NAME);
    request.onupgradeneeded = onupgradeneeded;
    request.onsuccess = (event) => {
        db = event.target.result;

        // delete previous data
        const replaceReq = db
            .transaction([OBJECT_STORE], 'readwrite')
            .objectStore(OBJECT_STORE)
            .put({ id: DATA_ID, ...parsedData });
        replaceReq.oncomplete = (event) => {
            console.log('Finished replacing parsed data');
        };
    };
};
