const MODIFIER_KEYS = ['Control', 'Alt', 'Shift', 'Meta'] as const;

// Convert a keyboard event to a consistent shortcut string
export function eventToShortcut(e: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('cmd');

    // Get the non-modifier key
    let key = e.key.toLowerCase();

    // Handle special keys
    switch (e.code) {
        case 'Space':
            key = 'space';
            break;
        case 'Escape':
            key = 'esc';
            break;
        case 'Enter':
            key = 'enter';
            break;
        case 'Tab':
            key = 'tab';
            break;
        case 'ArrowUp':
            key = 'up';
            break;
        case 'ArrowDown':
            key = 'down';
            break;
        case 'ArrowLeft':
            key = 'left';
            break;
        case 'ArrowRight':
            key = 'right';
            break;
        default:
            // For single character keys, use lowercase
            if (key.length === 1) {
                key = key.toLowerCase();
            }
    }

    return [...modifiers, key].join('+');
}

// Convert a shortcut string to a more readable format
export function formatShortcut(shortcut: string): string {
    return shortcut
        .split('+')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' + ');
}

// Check if a keyboard event matches a shortcut string
export function matchesShortcut(
    event: KeyboardEvent,
    shortcut: string,
): boolean {
    const eventShortcut = eventToShortcut(event);
    return eventShortcut === shortcut.toLowerCase();
}

// Check if the pressed key is a modifier key
export function isModifierKey(key: string): boolean {
    return MODIFIER_KEYS.includes(key as (typeof MODIFIER_KEYS)[number]);
}

// Global shortcut registry to prevent duplicates
export const shortcutRegistry = new Map<string, Set<string>>();

// Register a shortcut
export function registerGlobalShortcut(id: string, shortcut: string) {
    if (!shortcutRegistry.has(shortcut)) {
        shortcutRegistry.set(shortcut, new Set());
    }
    shortcutRegistry.get(shortcut)?.add(id);
}

// Unregister a shortcut
export function unregisterGlobalShortcut(id: string, shortcut: string) {
    const shortcuts = shortcutRegistry.get(shortcut);
    if (shortcuts) {
        shortcuts.delete(id);
        if (shortcuts.size === 0) {
            shortcutRegistry.delete(shortcut);
        }
    }
}

// Check for shortcut conflicts
export function findConflictingShortcuts(
    shortcut: string,
    currentId?: string,
): string[] {
    const conflicts = shortcutRegistry.get(shortcut);
    if (!conflicts) return [];

    return Array.from(conflicts).filter((id) => id !== currentId);
}
