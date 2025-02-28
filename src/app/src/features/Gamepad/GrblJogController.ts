import { JogAxis } from './types';

type JogCommand = {
    axis: JogAxis;
    distance?: number;
    feedRate: number;
};

type JogState = {
    [key in JogAxis]: {
        isJogging: boolean;
        direction: number;
    };
};

export class GrblJogController {
    private jogState: JogState = {
        X: { isJogging: false, direction: 0 },
        Y: { isJogging: false, direction: 0 },
        Z: { isJogging: false, direction: 0 },
        A: { isJogging: false, direction: 0 },
    };

    private continuousJogInterval: number | null = null;
    private readonly jogIntervalMs = 100; // How often to send jog commands in continuous mode

    constructor(
        private readonly sendGrblCommand: (command: string) => void,
        private readonly onError?: (error: string) => void,
    ) {}

    public startContinuousJog(
        axis: JogAxis,
        direction: number,
        feedRate: number,
    ) {
        if (this.jogState[axis].isJogging) {
            return;
        }

        this.jogState[axis] = { isJogging: true, direction };

        // Send initial jog command
        this.sendJogCommand({
            axis,
            feedRate,
            distance: direction * (feedRate / 60) * (this.jogIntervalMs / 1000),
        });

        // Set up interval for continuous jogging
        this.continuousJogInterval = window.setInterval(() => {
            if (this.jogState[axis].isJogging) {
                this.sendJogCommand({
                    axis,
                    feedRate,
                    distance:
                        direction *
                        (feedRate / 60) *
                        (this.jogIntervalMs / 1000),
                });
            }
        }, this.jogIntervalMs);
    }

    public stopContinuousJog(axis: JogAxis) {
        this.jogState[axis] = { isJogging: false, direction: 0 };

        if (this.continuousJogInterval) {
            clearInterval(this.continuousJogInterval);
            this.continuousJogInterval = null;
        }

        // Send cancel command
        this.sendGrblCommand('\x85'); // Cancel command
    }

    public jogIncremental(axis: JogAxis, distance: number, feedRate: number) {
        this.sendJogCommand({ axis, distance, feedRate });
    }

    public setFeedOverride(percentage: number) {
        if (percentage < 10 || percentage > 200) {
            this.onError?.('Feed override must be between 10% and 200%');
            return;
        }
        this.sendGrblCommand(`M220 S${percentage}`);
    }

    public setRapidOverride(percentage: number) {
        if (percentage < 25 || percentage > 100) {
            this.onError?.('Rapid override must be between 25% and 100%');
            return;
        }
        this.sendGrblCommand(`M220 S${percentage}`);
    }

    public setSpindleOverride(percentage: number) {
        if (percentage < 10 || percentage > 200) {
            this.onError?.('Spindle override must be between 10% and 200%');
            return;
        }
        this.sendGrblCommand(`M221 S${percentage}`);
    }

    private sendJogCommand({ axis, distance = 0, feedRate }: JogCommand) {
        // Format the jog command according to GRBL specifications
        const command = `$J=G91 G21 ${axis}${distance.toFixed(3)} F${feedRate}`;
        this.sendGrblCommand(command);
    }
}
