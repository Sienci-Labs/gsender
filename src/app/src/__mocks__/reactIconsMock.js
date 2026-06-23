module.exports = new Proxy({}, { get: () => () => null });
