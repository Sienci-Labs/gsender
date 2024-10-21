import { DB_NAME, OBJECT_STORE, DATA_ID } from '../constants';
import { EstimateData, ParsedData } from 'store/definitions';

const onupgradeneeded = (event: Event): void => {
    const db = (event.target as IDBRequest).result;
    db.createObjectStore(OBJECT_STORE, { keyPath: 'id' });
};

export const getParsedData = (): Promise<ParsedData> => {
    return new Promise((resolve) => {
        let db;
        const request = indexedDB.open(DB_NAME);
        request.onupgradeneeded = onupgradeneeded;
        request.onsuccess = (event) => {
            db = (event.target as IDBRequest).result;
            db
                .transaction(OBJECT_STORE)
                .objectStore(OBJECT_STORE)
                .get(DATA_ID).onsuccess = (event: Event) => {
                return resolve((event.target as IDBRequest).result);
            };
        };
        request.onerror = () => {
            console.error('Error getting parsed data from indexedDB');
        };
    });
};

export const getEstimateData = (): Promise<EstimateData> => {
    return new Promise((resolve) => {
        let db: IDBDatabase;
        const request = indexedDB.open(DB_NAME);
        request.onupgradeneeded = onupgradeneeded;
        request.onsuccess = (event) => {
            db = (event.target as IDBRequest).result;
            db
                .transaction(OBJECT_STORE)
                .objectStore(OBJECT_STORE)
                .get(DATA_ID).onsuccess = (event: Event) => {
                return resolve({
                    estimates: (event.target as IDBRequest).result?.estimates,
                    estimatedTime: (event.target as IDBRequest).result?.info
                        ?.estimatedTime,
                });
            };
        };
        request.onerror = () => {
            console.error('Error getting parsed data from indexedDB');
        };
    });
};

export const replaceParsedData = (parsedData: ParsedData): Promise<string> => {
    return new Promise((resolve) => {
        let db: IDBDatabase;
        const request = indexedDB.open(DB_NAME);
        request.onupgradeneeded = onupgradeneeded;
        request.onsuccess = (event) => {
            db = (event.target as IDBRequest).result;
            db
                .transaction(OBJECT_STORE, 'readwrite')
                .objectStore(OBJECT_STORE)
                .delete(DATA_ID).onsuccess = () => {
                // delete previous data
                const replaceReq = db
                    .transaction([OBJECT_STORE], 'readwrite')
                    .objectStore(OBJECT_STORE)
                    .put({ id: DATA_ID, ...parsedData });
                replaceReq.onsuccess = () => {
                    return resolve('Finished replacing parsed data');
                };
                replaceReq.onerror = () => {
                    console.error('Error replacing parsed data from indexedDB');
                };
            };
        };
    });
};
