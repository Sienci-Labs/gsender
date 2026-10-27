export type PairRequest = {
    nonce: string;
    desktopId: string;
    desktopName: string;
};

// Parses the payload a desktop's Send to Pendant dialog renders as a QR:
// gsender-pendant://pair?v=1&n=<nonce>&d=<desktopId>&name=<desktopName>
export function parsePairPayload(text: string): PairRequest | null {
    try {
        const url = new URL(text);
        if (url.protocol !== 'gsender-pendant:') return null;
        const params = url.searchParams;
        const nonce = params.get('n');
        const desktopId = params.get('d');
        if (!nonce || !desktopId) return null;
        return {
            nonce,
            desktopId,
            desktopName: params.get('name') || 'Desktop',
        };
    } catch {
        return null;
    }
}
