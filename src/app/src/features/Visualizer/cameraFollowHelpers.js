/**
 * Pure helpers for the "follow tool" camera behaviour.
 *
 * All functions accept a `ctx` object instead of using `this` so they can be
 * tested without mounting a full Visualizer instance. The Visualizer class
 * methods delegate here, passing `this` as the context.
 *
 * ctx shape (subset of Visualizer instance):
 *   props          – React props ({ followTool?, state? })
 *   cameraFollowRAF – number|null   rAF handle, mutated by start/stop
 *   controls       – Three OrbitControls  (target: Vector3, update())
 *   camera         – Three Camera         (position: Vector3)
 *   cuttingTool    – Three Object3D|null  (position: Vector3)
 *   pivotPoint     – { get(): { x, y, z } }
 *   workPosition   – { x?, y?, z? }|null
 *   updateScene    – (opts?) => void
 */

const SMOOTHING = 0.08; // fraction of remaining distance eased per frame
const SETTLE_SQ = 1e-4; // stop easing once within ~0.01 units

/**
 * Returns true when the "follow tool" toggle is on, checking both the direct
 * prop and the nested state object (the two paths used in Visualizer).
 */
export function isFollowEnabled(ctx) {
    return !!(ctx.props.followTool || ctx.props.state?.followTool);
}

/**
 * Returns the cutting tool's position in scene space.
 * Prefers `cuttingTool.position` (when the STL model is loaded); falls back to
 * `workPosition - pivotPoint` so following works before the model has loaded.
 */
export function getToolScenePosition(ctx) {
    if (ctx.cuttingTool) {
        const p = ctx.cuttingTool.position;
        return { x: p.x, y: p.y, z: p.z };
    }
    const pivot = ctx.pivotPoint.get();
    const wp = ctx.workPosition || {};
    return {
        x: (wp.x || 0) - pivot.x,
        y: (wp.y || 0) - pivot.y,
        z: (wp.z || 0) - pivot.z,
    };
}

/**
 * Starts a requestAnimationFrame loop that smoothly pans the orbit target
 * toward the cutting tool. No-ops if follow is disabled or already running.
 * Mutates ctx.cameraFollowRAF.
 */
export function startCameraFollow(ctx) {
    if (ctx.cameraFollowRAF !== null || !isFollowEnabled(ctx)) {
        return;
    }

    const tick = () => {
        if (!isFollowEnabled(ctx) || !ctx.controls || !ctx.camera) {
            ctx.cameraFollowRAF = null;
            return;
        }

        const tool = getToolScenePosition(ctx);
        const ex = tool.x - ctx.controls.target.x;
        const ey = tool.y - ctx.controls.target.y;
        const ez = tool.z - ctx.controls.target.z;

        if (ex * ex + ey * ey + ez * ez < SETTLE_SQ) {
            ctx.cameraFollowRAF = null;
            return;
        }

        const mx = ex * SMOOTHING;
        const my = ey * SMOOTHING;
        const mz = ez * SMOOTHING;
        ctx.camera.position.x += mx;
        ctx.camera.position.y += my;
        ctx.camera.position.z += mz;
        ctx.controls.target.x += mx;
        ctx.controls.target.y += my;
        ctx.controls.target.z += mz;
        ctx.controls.update();
        ctx.updateScene({ forceUpdate: true });

        ctx.cameraFollowRAF = requestAnimationFrame(tick);
    };

    ctx.cameraFollowRAF = requestAnimationFrame(tick);
}

/**
 * Cancels the rAF loop started by startCameraFollow. Safe to call when idle.
 * Mutates ctx.cameraFollowRAF.
 */
export function stopCameraFollow(ctx) {
    if (ctx.cameraFollowRAF !== null) {
        cancelAnimationFrame(ctx.cameraFollowRAF);
        ctx.cameraFollowRAF = null;
    }
}
