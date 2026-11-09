package org.sienci.gsender.pendant

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.os.SystemClock
import android.util.AttributeSet
import android.view.View
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/**
 * Load-screen animation: a rocket climbing through a starfield. Startup has
 * no real percentage, so [setStage] gives each server state a height (0 =
 * bottom of the lane, 1 = top) and the rocket eases up to it, idling with a
 * sway and a flickering flame. [launch] flies it out the top when the pendant
 * page has loaded.
 *
 * The rocket's lane is the upper part of the view; the load screen's text
 * sits below it. Frames only run while the view is shown, and not at all when
 * the system has animations turned off.
 */
class RocketLaunchView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {
    private class Star(var x: Float, var y: Float, val radius: Float, val alpha: Float, val phase: Float, val speed: Float, val color: Int)

    private val dp = resources.displayMetrics.density
    private val rocket = context.getDrawable(R.drawable.rocket)!!
    private val random = Random(SystemClock.uptimeMillis())
    private var stars = emptyList<Star>()

    private val starPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val smokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = context.getColor(R.color.pendant_text_muted) }
    private val flamePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = context.getColor(R.color.pendant_flame) }
    private val corePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = context.getColor(R.color.pendant_flame_core) }
    private val flamePath = Path()

    // Exhaust puffs: x, y, age (s).
    private val smoke = FloatArray(MAX_SMOKE * 3)
    private var smokeCount = 0
    private var smokeTimer = 0f

    private var target = 0f
    private var pos = 0f
    private var vel = 0f
    private var thrust = 1f
    private var engineOn = true
    private var launching = false
    private var launchTime = 0f
    private var launchFrom = 0f
    private var time = 0f
    private var lastFrame = 0L

    private val animated get() = ValueAnimator.areAnimatorsEnabled()

    /** Height to climb to, 0..1 of the lane. */
    fun setStage(target: Float) {
        this.target = target.coerceIn(0f, 1f)
        if (!animated) pos = this.target
        invalidate()
    }

    /** Engine off: flame out, stars slow to a drift, the rocket holds where it is. */
    fun setEngineOn(on: Boolean) {
        engineOn = on
        invalidate()
    }

    /** Fly out the top of the view. */
    fun launch() {
        if (launching) return
        launching = true
        engineOn = true
        launchTime = 0f
        launchFrom = pos
        invalidate()
    }

    /** Back to the bottom with the engine on, for when the load screen comes back. */
    fun reset() {
        launching = false
        engineOn = true
        pos = 0f
        vel = 0f
        target = 0f
        smokeCount = 0
        invalidate()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        val colors = intArrayOf(
            context.getColor(R.color.pendant_spark_green),
            context.getColor(R.color.pendant_flame),
            context.getColor(R.color.pendant_spark_red),
        )
        val white = context.getColor(R.color.pendant_text)
        stars = List(STAR_COUNT) {
            val sparkle = random.nextFloat() < 0.08f
            Star(
                x = random.nextFloat() * w,
                y = random.nextFloat() * h,
                radius = (if (sparkle) 2f else 0.6f + random.nextFloat() * 1.2f) * dp,
                alpha = 0.35f + random.nextFloat() * 0.65f,
                phase = random.nextFloat() * 6.28f,
                speed = (20f + random.nextFloat() * 60f) * dp,
                color = if (sparkle) colors[random.nextInt(colors.size)] else white,
            )
        }
    }

    override fun onVisibilityAggregated(isVisible: Boolean) {
        super.onVisibilityAggregated(isVisible)
        // Frames stop while hidden; don't count that gap as one long frame.
        lastFrame = 0L
        if (isVisible) invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        val now = SystemClock.uptimeMillis()
        val dt = if (lastFrame == 0L || !animated) 0f else min((now - lastFrame) / 1000f, 0.05f)
        lastFrame = now
        step(dt)

        val size = min(112 * dp, height * 0.22f)
        val laneBottom = height * 0.62f
        val laneTop = size * 0.8f
        val cy = laneBottom - pos * (laneBottom - laneTop)
        val cx = width / 2f + sin(time * 0.9f) * 4 * dp * thrust

        drawStars(canvas)
        drawSmoke(canvas)

        canvas.save()
        canvas.translate(cx, cy)
        canvas.rotate(sin(time * 1.3f) * 3f * min(thrust, 1f))
        drawFlame(canvas, size)
        rocket.setBounds((-size / 2).toInt(), (-size / 2).toInt(), (size / 2).toInt(), (size / 2).toInt())
        rocket.draw(canvas)
        canvas.restore()

        // Puffs come out of the nozzle, which sits 34/96 of the size below centre.
        if (dt > 0 && thrust > 0.1f) {
            smokeTimer += dt
            if (smokeTimer > 0.04f) {
                smokeTimer = 0f
                addSmoke(cx + (random.nextFloat() - 0.5f) * 6 * dp, cy + size * NOZZLE_Y)
            }
        }

        if (animated && isShown) postInvalidateOnAnimation()
    }

    private fun step(dt: Float) {
        time += dt
        val wantThrust = when {
            launching -> 2.5f
            engineOn -> 1f
            else -> 0f
        }
        thrust += (wantThrust - thrust) * min(1f, dt * 4f)

        if (launching) {
            // Accelerate out of the top (pos 2.5 is well clear) and stay there
            // until reset().
            launchTime += dt
            val t = min(launchTime / LAUNCH_SECONDS, 1.5f)
            pos = launchFrom + (2.5f - launchFrom) * t * t
        } else if (engineOn) {
            // Critically damped spring towards the stage height.
            val omega = 2.5f
            vel += (omega * omega * (target - pos) - 2 * omega * vel) * dt
            pos += vel * dt
        } else {
            vel = 0f
        }

        val drift = (0.12f + thrust) * dt
        for (s in stars) {
            s.y += s.speed * drift
            if (s.y > height) {
                s.y -= height
                s.x = random.nextFloat() * width
            }
        }

        var i = 0
        while (i < smokeCount) {
            smoke[i * 3 + 1] += 40 * dp * drift
            smoke[i * 3 + 2] += dt
            if (smoke[i * 3 + 2] > SMOKE_LIFE) {
                smokeCount--
                System.arraycopy(smoke, smokeCount * 3, smoke, i * 3, 3)
            } else {
                i++
            }
        }
    }

    private fun drawStars(canvas: Canvas) {
        for (s in stars) {
            starPaint.color = s.color
            starPaint.alpha = (255 * s.alpha * (0.65f + 0.35f * sin(time * 2.2f + s.phase))).toInt()
            canvas.drawCircle(s.x, s.y, s.radius, starPaint)
        }
    }

    private fun drawSmoke(canvas: Canvas) {
        for (i in 0 until smokeCount) {
            val age = smoke[i * 3 + 2] / SMOKE_LIFE
            smokePaint.alpha = (70 * (1 - age)).toInt()
            canvas.drawCircle(smoke[i * 3], smoke[i * 3 + 1], (3 + 9 * age) * dp, smokePaint)
        }
    }

    private fun addSmoke(x: Float, y: Float) {
        if (smokeCount == MAX_SMOKE) return
        smoke[smokeCount * 3] = x
        smoke[smokeCount * 3 + 1] = y
        smoke[smokeCount * 3 + 2] = 0f
        smokeCount++
    }

    /** Teardrop below the nozzle; length flickers with the thrust. */
    private fun drawFlame(canvas: Canvas, size: Float) {
        if (thrust < 0.05f) return
        val flicker = 1f + 0.18f * sin(time * 31f) + 0.1f * sin(time * 17f + 1f)
        val top = size * NOZZLE_Y
        val halfWidth = size * 5f / 96f
        val length = size * 0.22f * thrust * flicker
        teardrop(canvas, top, halfWidth, length, flamePaint)
        teardrop(canvas, top, halfWidth * 0.55f, length * 0.55f, corePaint)
    }

    private fun teardrop(canvas: Canvas, top: Float, halfWidth: Float, length: Float, paint: Paint) {
        flamePath.reset()
        flamePath.moveTo(-halfWidth, top)
        flamePath.quadTo(-halfWidth, top + length * 0.6f, 0f, top + length)
        flamePath.quadTo(halfWidth, top + length * 0.6f, halfWidth, top)
        flamePath.close()
        canvas.drawPath(flamePath, paint)
    }

    private companion object {
        const val STAR_COUNT = 80
        const val MAX_SMOKE = 40
        const val SMOKE_LIFE = 0.9f
        const val LAUNCH_SECONDS = 0.35f

        /** Nozzle exit in rocket.xml is at y = 82 of 96, i.e. 34/96 below centre. */
        const val NOZZLE_Y = 34f / 96f
    }
}
