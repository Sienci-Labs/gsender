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

export const getEstimateData = () => {
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
                    return resolve({
                        estimates: event.target.result.estimates,
                        estimatedTime: event.target.result.info.estimatedTime
                    });
                };
        };
        request.onerror = (event) => {
            console.error('Error getting parsed data from indexedDB');
        };
    });
};

export const replaceParsedData = (parsedData) => {
    return new Promise((resolve) => {
        let db;
        const request = indexedDB.open(DB_NAME);
        request.onupgradeneeded = onupgradeneeded;
        request.onsuccess = (event) => {
            db = event.target.result;
            db
                .transaction(OBJECT_STORE, 'readwrite')
                .objectStore(OBJECT_STORE)
                .delete(DATA_ID).onsuccess = (event) => {
                    // delete previous data
                    const replaceReq = db
                        .transaction([OBJECT_STORE], 'readwrite')
                        .objectStore(OBJECT_STORE)
                        .put({ id: DATA_ID, ...parsedData });
                    replaceReq.onsuccess = (event) => {
                        console.log('Finished replacing parsed data');
                        return resolve('Finished replacing parsed data');
                    };
                    replaceReq.onerror = (event) => {
                        console.error('Error replacing parsed data from indexedDB');
                    };
                };
        };
    });
};
