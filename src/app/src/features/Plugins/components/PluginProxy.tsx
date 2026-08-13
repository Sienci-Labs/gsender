function createGatedSDK(realSdk, allowedCapabilities: ) {
  return new Proxy(realSdk, {
    get(target, prop) {
      if (!allowedCapabilities.has(prop)) {
        throw new Error(`Plugin not authorized to use '${prop}'`);
      }
      return target[prop];
    }
  });
}