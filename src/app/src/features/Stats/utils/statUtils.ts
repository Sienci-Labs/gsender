export function truncatePort(port: string) {
    if (!port) {
        return;
    }
    return port.slice(-6);
}
