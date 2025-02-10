type ShortcutActions = {
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyDownHold?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
};

class ActionRegistry {
    private actions: Map<string, ShortcutActions> = new Map();
    private activeKeys: Set<string> = new Set();
    private holdTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly HOLD_DELAY = 500; // Time in ms before considering it a hold

    constructor() {
        // Clear active keys when window loses focus
        window.addEventListener('blur', () => {
            this.clearActiveKeys();
            this.clearHoldTimers();
        });
    }

    register(id: string, actions: ShortcutActions) {
        this.actions.set(id, actions);
    }

    unregister(id: string) {
        if (this.holdTimers.has(id)) {
            clearTimeout(this.holdTimers.get(id));
            this.holdTimers.delete(id);
        }
        this.actions.delete(id);
    }

    executeKeyDown(id: string, e: KeyboardEvent) {
        const actions = this.actions.get(id);
        if (!actions) return;

        if (this.activeKeys.has(id)) {
            // Key is already being held down, don't trigger again
            return;
        }

        this.activeKeys.add(id);

        // Execute immediate key down action
        actions.onKeyDown?.(e);

        // Set up hold timer if there's a hold action
        if (actions.onKeyDownHold) {
            const timer = setTimeout(() => {
                if (this.activeKeys.has(id)) {
                    actions.onKeyDownHold?.(e);
                }
            }, this.HOLD_DELAY);

            this.holdTimers.set(id, timer);
        }
    }

    executeKeyUp(id: string, e: KeyboardEvent) {
        const actions = this.actions.get(id);
        if (!actions) return;

        // Clear hold timer if it exists
        if (this.holdTimers.has(id)) {
            clearTimeout(this.holdTimers.get(id));
            this.holdTimers.delete(id);
        }

        this.activeKeys.delete(id);
        actions.onKeyUp?.(e);
    }

    private clearHoldTimers() {
        this.holdTimers.forEach((timer) => clearTimeout(timer));
        this.holdTimers.clear();
    }

    private clearActiveKeys() {
        this.activeKeys.clear();
    }

    hasAction(id: string): boolean {
        return this.actions.has(id);
    }
}

export const actionRegistry = new ActionRegistry();
