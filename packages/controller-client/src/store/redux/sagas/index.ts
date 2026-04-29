import createSagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';

export const sagaMiddleware = createSagaMiddleware();

export function createRootSaga(sagas: Array<{ initialize: () => Generator }>) {
    return function* root() {
        yield all(sagas.map((saga) => call(saga.initialize)));
    };
}
