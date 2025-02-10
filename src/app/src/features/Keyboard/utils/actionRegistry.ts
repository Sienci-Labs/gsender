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
                    // Mark that we're in hold mode
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

            // If key was released before hold timer and we haven't executed any action yet
            if (!this.isHoldActive.has(id)) {
                actions.onKeyDown?.(e);
                actions.onKeyUp?.(e);
            }
        }

        // If we were in hold mode, execute hold-specific cleanup
        if (this.isHoldActive.has(id)) {
            actions.onKeyUpHold?.(e);
            this.isHoldActive.delete(id);
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
