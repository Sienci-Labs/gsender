import createSagaMiddleware from 'redux-saga';

// On its own so the store can import it without importing the sagas, which
// import the store: with both loaded at once (the pendant does), the store
// could otherwise run before the middleware existed.
export const sagaMiddleware = createSagaMiddleware();
