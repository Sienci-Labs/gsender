type ShortcutActions = {
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyDownHold?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
    onKeyUpHold?: (e: KeyboardEvent) => void;
};

class ActionRegistry {
    private actions: Map<string, ShortcutActions> = new Map();
    private activeKeys: Set<string> = new Set();
    private holdTimers: Map<string, NodeJS.Timeout> = new Map();
    private keyDownExecuted: Set<string> = new Set(); // Track which keys have executed keyDown
    private isHoldActive: Set<string> = new Set(); // Track if hold was activated
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
        this.keyDownExecuted.delete(id);
        this.isHoldActive.delete(id);
    }

    executeKeyDown(id: string, e: KeyboardEvent) {
        const actions = this.actions.get(id);
        if (!actions) return;

        if (this.activeKeys.has(id)) {
            // Key is already being held down, don't trigger again
            return;
        }

        this.activeKeys.add(id);

        // Set up hold timer if there's a hold action
        if (actions.onKeyDownHold) {
            const timer = setTimeout(() => {
                if (this.activeKeys.has(id)) {
                    // Only execute hold action if key is still being held
                    actions.onKeyDownHold?.(e);
                    // Prevent keyDown from executing on key up
                    this.keyDownExecuted.add(id);
                    this.isHoldActive.add(id);
                }
            }, this.HOLD_DELAY);

            this.holdTimers.set(id, timer);
        } else if (actions.onKeyDown) {
            // If there's no hold action, execute keyDown immediately
            actions.onKeyDown(e);
            this.keyDownExecuted.add(id);
        }
    }

    executeKeyUp(id: string, e: KeyboardEvent) {
        const actions = this.actions.get(id);
        if (!actions) return;

        // Clear hold timer if it exists
        if (this.holdTimers.has(id)) {
            clearTimeout(this.holdTimers.get(id));
            this.holdTimers.delete(id);

            // If key was released before hold timer and keyDown hasn't executed yet
            if (!this.keyDownExecuted.has(id) && actions.onKeyDown) {
                actions.onKeyDown(e);
            }
        }

        // Execute the appropriate key up handler
        if (this.isHoldActive.has(id)) {
            // If this was a hold action, use onKeyUpHold if available, otherwise fall back to onKeyUp
            actions.onKeyUpHold?.(e) ?? actions.onKeyUp?.(e);
            this.isHoldActive.delete(id);
        } else {
            // For normal key presses, use onKeyUp
            actions.onKeyUp?.(e);
        }

        this.activeKeys.delete(id);
        this.keyDownExecuted.delete(id);
    }

    private clearHoldTimers() {
        this.holdTimers.forEach((timer) => clearTimeout(timer));
        this.holdTimers.clear();
    }

    private clearActiveKeys() {
        this.activeKeys.clear();
        this.keyDownExecuted.clear();
        this.isHoldActive.clear();
    }

    hasAction(id: string): boolean {
        return this.actions.has(id);
    }
}

export const actionRegistry = new ActionRegistry();
