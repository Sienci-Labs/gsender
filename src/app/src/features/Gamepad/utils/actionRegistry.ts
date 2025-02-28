type GamepadActions = {
    onPress?: () => void;
    onPressHold?: () => void;
    onRelease?: () => void;
    onReleaseHold?: () => void;
};

class GamepadActionRegistry {
    private actions: Map<string, GamepadActions> = new Map();
    private holdIntervals: Map<string, number> = new Map();
    private readonly holdDelay = 500; // ms before hold action triggers
    private readonly holdInterval = 100; // ms between hold action repeats

    register(id: string, actions: GamepadActions) {
        this.actions.set(id, actions);
    }

    unregister(id: string) {
        this.actions.delete(id);
        this.clearHoldInterval(id);
    }

    executePress(id: string) {
        const actions = this.actions.get(id);
        if (!actions) return;

        actions.onPress?.();

        if (actions.onPressHold) {
            // Clear any existing hold interval
            this.clearHoldInterval(id);

            // Set up new hold interval
            const interval = window.setInterval(() => {
                actions.onPressHold?.();
            }, this.holdInterval);

            this.holdIntervals.set(id, interval);
        }
    }

    executeRelease(id: string) {
        const actions = this.actions.get(id);
        if (!actions) return;

        actions.onRelease?.();

        if (actions.onReleaseHold) {
            // Clear any existing hold interval
            this.clearHoldInterval(id);

            // Set up new hold interval
            const interval = window.setInterval(() => {
                actions.onReleaseHold?.();
            }, this.holdInterval);

            this.holdIntervals.set(id, interval);
        }
    }

    private clearHoldInterval(id: string) {
        const interval = this.holdIntervals.get(id);
        if (interval) {
            clearInterval(interval);
            this.holdIntervals.delete(id);
        }
    }
}

export const actionRegistry = new GamepadActionRegistry();
