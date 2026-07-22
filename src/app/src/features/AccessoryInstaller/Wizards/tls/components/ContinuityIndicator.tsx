import { Check, AlertTriangle } from 'lucide-react';
import './ContinuityIndicator.css';

export type ContinuityPhase =
    | 'checking-idle'
    | 'waiting'
    | 'success'
    | 'stuck-on';

const COPY: Record<ContinuityPhase, string> = {
    'checking-idle': 'Checking continuity…',
    waiting: 'Waiting for probe contact…',
    success: 'Continuity confirmed',
    'stuck-on': 'Sensor triggered immediately',
};

interface ContinuityIndicatorProps {
    phase: ContinuityPhase;
    size?: number;
    label?: string;
}

export function ContinuityIndicator({
    phase,
    size = 140,
    label,
}: ContinuityIndicatorProps) {
    const text = label ?? COPY[phase];

    return (
        <div className="continuity-indicator" data-phase={phase}>
            <div
                className="continuity-indicator__shell"
                style={{ width: size, height: size }}
            >
                <svg className="continuity-indicator__svg" viewBox="0 0 160 160">
                    <circle
                        className="ci-bezel"
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                    />
                    <circle
                        className="ci-ripple ci-ripple--1"
                        cx="80"
                        cy="80"
                        r="20"
                        fill="none"
                        strokeWidth="2"
                    />
                    <circle
                        className="ci-ripple ci-ripple--2"
                        cx="80"
                        cy="80"
                        r="20"
                        fill="none"
                        strokeWidth="2"
                    />
                    <circle className="ci-core" cx="80" cy="80" r="16" />
                </svg>

                <span
                    className="continuity-indicator__glyph continuity-indicator__glyph--check"
                    aria-hidden="true"
                >
                    <Check strokeWidth={2.5} />
                </span>
                <span
                    className="continuity-indicator__glyph continuity-indicator__glyph--warning"
                    aria-hidden="true"
                >
                    <AlertTriangle strokeWidth={2.5} />
                </span>
            </div>

            <div className="continuity-indicator__readout">
                <span className="continuity-indicator__dot" />
                <span>{text}</span>
            </div>

            <div
                className="continuity-indicator__visually-hidden"
                role="status"
                aria-live="polite"
            >
                {text}
            </div>
        </div>
    );
}
