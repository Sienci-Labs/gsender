import isElectron from 'is-electron';

export async function copyToClipboard(text: string): Promise<{ success: boolean, error?: string }> {
    try {
        if (isElectron()) {
            // @ts-ignore
            const result = await window.ipcRenderer.invoke('copy-to-clipboard', text);

            return { success: result.success, error: result.error };
        } else {
            await navigator.clipboard.writeText(text);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to copy link to clipboard:', error);
        return { success: false, error: 'Failed to copy link to clipboard' };
    }
}