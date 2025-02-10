type ActionHandlers = {
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyDownHold?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
    onKeyUpHold?: (e: KeyboardEvent) => void;
};

class ActionRegistry {
    private actions: Map<string, ActionHandlers> = new Map();
    private activeKeys: Set<string> = new Set();
    private holdTimers: Map<string, NodeJS.Timeout> = new Map();
    private isHolding: Map<string, boolean> = new Map();
    private readonly HOLD_DELAY = 500; // Time in ms before considering it a hold

    constructor() {
        // Clear active keys when window loses focus
        if (typeof window === 'undefined') return;
        window.addEventListener('blur', () => {
            this.clearActiveKeys();
            this.clearHoldTimers();
        });
    }

    register(id: string, handlers: ActionHandlers) {
        this.actions.set(id, handlers);
    }

    unregister(id: string) {
        if (this.holdTimers.has(id)) {
            clearTimeout(this.holdTimers.get(id));
            this.holdTimers.delete(id);
        }
        this.actions.delete(id);
        this.activeKeys.delete(id);
        this.isHolding.delete(id);
    }

    executeKeyDown(id: string, e: KeyboardEvent) {
        const actions = this.actions.get(id);
        if (!actions) return;

        // If key is already being held down, don't trigger again
        if (this.activeKeys.has(id)) return;

        this.activeKeys.add(id);
        this.isHolding.set(id, false);

        // Execute immediate keydown action
        actions.onKeyDown?.(e);

        // Set up hold timer if there's a hold action
        if (actions.onKeyDownHold) {
            const timer = setTimeout(() => {
                if (this.activeKeys.has(id)) {
                    this.isHolding.set(id, true);
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

        // Execute the appropriate key up handler based on hold state
        if (this.isHolding.get(id)) {
            actions.onKeyUpHold?.(e);
        } else {
            actions.onKeyUp?.(e);
        }

        this.activeKeys.delete(id);
        this.isHolding.delete(id);
    }

    private clearHoldTimers() {
        this.holdTimers.forEach((timer) => clearTimeout(timer));
        this.holdTimers.clear();
    }

    private clearActiveKeys() {
        this.activeKeys.clear();
        this.isHolding.clear();
    }

    hasAction(id: string): boolean {
        return this.actions.has(id);
    }
}

export const actionRegistry = new ActionRegistry();
