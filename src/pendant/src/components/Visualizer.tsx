import type { GCodeViewerHandle, GCodeViewerOptions } from '@sienci/gviewer/viewer';
import { GCodeVisualizer } from '@sienci/gviewer/react';
import { buildMachineBedOptions } from 'app/features/Visualizer/viewerOptions';
import {
    buildViewerTheme,
    currentViewerThemeName,
    WORKSHOP_VISUALIZER_COLORS,
} from 'app/features/Visualizer/viewerTheme';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import type { RootState } from 'app/store/redux';
import _get from 'lodash/get';
import pubsub from 'pubsub-js';
import { memo, useEffect, useMemo, useRef } from 'react';

// Pendant mode: gviewer's WebGL renderer locked top-down (orthographic, no
// view cube, no grid), fed the worker's Z-deduped 2D segment groups. The
// crosshair and origin dot are sized in screen pixels.
const BASE_OPTIONS: Partial<GCodeViewerOptions> = {
    viewMode: 'pendant',
    units: 'mm',
    bit: {
        enabled: true,
        type: 'crosshair',
        size: 26,
        opacity: 1,
        tweenMs: 260,
        colorSource: 'custom',
        color: WORKSHOP_VISUALIZER_COLORS.bit,
        spinRpm: 300,
        screenSpace: true,
    },
    originMarker: { visible: true, color: '#ffffff', sizePx: 9 },
    boundingBox: { visible: false, labels: false },
    camera: {
        projection: 'orthographic',
        fov: 45,
        focusDurationMs: 0,
        orbit: { enableDamping: false },
        initialPosition: { x: 0, y: 0, z: 400 },
        lockTopDown: true,
    },
};

// Everything the bed rectangle depends on. All low-frequency, so options are
// rebuilt only when this key changes, not on every status report.
const selectMachineBedKey = (s: RootState): string => {
    const settings = s.controller.settings?.settings ?? {};
    const keys = ['$22', '$23', '$130', '$131', '$683', '$684', '$685', '$686', '$687'];
    const wco = s.controller.wco ?? { x: 0, y: 0 };
    return [
        ...keys.map((k) => _get(settings, k)),
        !!s.controller.hasHomed,
        wco.x,
        wco.y,
    ].join(',');
};

// A primitive key, so identical idle status reports don't re-render.
const selectWposKey = (s: RootState): string => {
    const { x, y, z } = s.controller.wpos ?? { x: 0, y: 0, z: 0 };
    return `${Number(x) || 0},${Number(y) || 0},${Number(z) || 0}`;
};

function Visualizer() {
    const viewerRef = useRef<GCodeViewerHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // A file loaded while the Carve tab is hidden has nothing to fit against;
    // frame it once the container gets a size.
    const pendingFocusRef = useRef(false);

    const fileLoaded = useTypedSelector((s: RootState) => s.file.fileLoaded);
    const isConnected = useTypedSelector(
        (s: RootState) => s.connection.isConnected,
    );
    const machineBedKey = useTypedSelector(selectMachineBedKey);
    const wposKey = useTypedSelector(selectWposKey);

    const options = useMemo<Partial<GCodeViewerOptions>>(
        () => ({
            ...BASE_OPTIONS,
            machineBed: buildMachineBedOptions({ ignoreUserToggle: true }),
            render: {
                antialias: true,
                theme: buildViewerTheme(currentViewerThemeName()),
            },
        }),
        // buildMachineBedOptions reads the store; the key tracks its inputs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [machineBedKey],
    );

    // The gviewer handle throws until its viewer exists.
    const withViewer = (fn: (viewer: GCodeViewerHandle) => void) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        try {
            fn(viewer);
        } catch {
            // Not mounted yet, or already disposed.
        }
    };

    const focusOrDefer = () => {
        const el = containerRef.current;
        if (!el || el.clientWidth === 0 || el.clientHeight === 0) {
            pendingFocusRef.current = true;
            return;
        }
        pendingFocusRef.current = false;
        withViewer((v) => v.focusToModel());
    };

    useEffect(() => {
        const token = pubsub.subscribe('file:load', (_msg, data) => {
            if (!data?.svgSegmentGroups) return;
            withViewer((v) =>
                v.loadFromPrecomputedGroups(
                    data.svgSegmentGroups,
                    data.svgMeta,
                ),
            );
            focusOrDefer();
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (pendingFocusRef.current) focusOrDefer();
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!fileLoaded) {
            pendingFocusRef.current = false;
            withViewer((v) => v.unload());
        }
    }, [fileLoaded]);

    useEffect(() => {
        withViewer((v) => v.setBitVisible(isConnected));
    }, [isConnected]);

    useEffect(() => {
        const [x, y, z] = wposKey.split(',').map(Number);
        withViewer((v) => v.setBitPosition({ x, y, z }));
    }, [wposKey]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <GCodeVisualizer
                ref={viewerRef}
                id="pendant-gl-vis"
                options={options}
                className="w-full h-full"
            />
        </div>
    );
}

export default memo(Visualizer);
