/**
 * ChaseCamera — a camera with mass, chasing the light through the turns.
 *
 * ─── WHY A SPRING AND NOT A LERP ────────────────────────────────────────────
 * The usual "smooth camera" is `position.lerp(target, 0.1)`. It's smooth, but
 * it's framerate-dependent (0.1 per frame means something different at 30fps
 * and 144fps) and it has no momentum — it decelerates into place with a soft,
 * weightless feel that reads as an animation rather than a camera.
 *
 * A damped spring has real dynamics. It accelerates, overshoots if you let it,
 * and settles. Here we run it CRITICALLY DAMPED (damping ratio ζ = 1), which
 * is the exact boundary between bouncy and sluggish: the fastest possible
 * approach with ZERO overshoot. The camera lags behind the light as it enters
 * a turn, then catches up cleanly — that lag is the whole feeling of weight.
 *
 *   acceleration = −2ζω·v − ω²·(x − target)
 *
 * ─── THE BANKING IS ACTUAL AIRCRAFT PHYSICS ─────────────────────────────────
 * In a coordinated turn, an aircraft banks so that lift's horizontal component
 * supplies exactly the centripetal force the turn needs. That gives:
 *
 *   tan(θ) = v² / (r·g)  =  v²·κ / g        (κ = curvature = 1/r)
 *
 * So the camera's roll is computed from the path's real curvature and the
 * light's real speed. Faster through a tighter bend rolls harder — for free,
 * with no keyframes and nothing hand-authored. For a UAV team's history page,
 * having the camera obey flight dynamics felt like the right kind of detail.
 *
 * The result is scaled by `bankGain` and clamped by `maxBank`, because
 * physically correct is not the same as comfortable to look at.
 *
 * ─── COST ───────────────────────────────────────────────────────────────────
 * All of the above is a few dozen floating-point operations per frame. It is
 * thousands of times cheaper than drawing a single shadow. None of the page's
 * performance budget goes here.
 */

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import { CAMERA, LIGHT } from "./sceneConfig";
import { signedCurvatureAt } from "./journeyCurve";

/**
 * Largest timestep the spring will integrate in one go.
 *
 * Without this, returning to a backgrounded tab hands us a delta of several
 * SECONDS, the spring integrates one enormous step, and the camera is flung
 * somewhere absurd — a classic and very visible physics-integration blowup.
 */
const MAX_DELTA = 1 / 30;

/** Below these thresholds the rig is "settled" and we can stop rendering. */
const SETTLE_POSITION = 0.002;
const SETTLE_VELOCITY = 0.01;

interface ChaseCameraProps {
  curve: CatmullRomCurve3;
  pathLength: number;
  /** Light's current arc-length position (0..1). */
  uRef: React.MutableRefObject<number>;
  /** Light's current speed in world units per second. */
  speedRef: React.MutableRefObject<number>;
  /**
   * Vertical field of view, in degrees, solved for this screen by `fitScene`.
   *
   * This used to be an `isMobile` boolean the camera turned into one of two
   * hardcoded angles. It is a number now because the fit that produced it also
   * decided how far off the path to place every stop — the two have to be the
   * same solution or the camera frames a layout it was not solved against.
   */
  fov: number;
  /** When true: no banking, near-instant follow. Honours reduced-motion. */
  reducedMotion: boolean;
}

export default function ChaseCamera({
  curve,
  pathLength,
  uRef,
  speedRef,
  fov,
  reducedMotion,
}: ChaseCameraProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  // Spring state and scratch vectors, allocated once. Allocating Vector3s
  // inside useFrame would generate garbage every frame and cause periodic
  // GC stutter — the kind of jank that's maddening to track down later.
  const state = useMemo(
    () => ({
      position: new Vector3(),
      velocity: new Vector3(),
      lookAt: new Vector3(),
      bank: 0,
      bankVelocity: 0,
      initialised: false,
    }),
    [],
  );

  const scratch = useMemo(
    () => ({
      point: new Vector3(),
      tangent: new Vector3(),
      target: new Vector3(),
      desiredLook: new Vector3(),
    }),
    [],
  );

  // Pushed onto the camera whenever the solved fit changes — a rotation, a
  // window drag, entering split screen. `updateProjectionMatrix` is required:
  // three.js caches the projection and will not notice `fov` moving on its own.
  useEffect(() => {
    if ("fov" in camera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [fov, camera, invalidate]);

  // Runs at priority -1: after the scene controller has moved the light
  // (priority -2), before everything else. Keeping every priority ≤ 0 is
  // important — a positive priority makes R3F hand rendering control to us.
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DELTA);
    const u = uRef.current;

    // ── Where the camera WANTS to be ────────────────────────────────────────
    curve.getPointAt(u, scratch.point);
    curve.getTangentAt(u, scratch.tangent).normalize();

    scratch.target
      .copy(scratch.point)
      .addScaledVector(scratch.tangent, -CAMERA.followDistance);
    scratch.target.y += CAMERA.height;

    // Aim ahead of the light so you can see the turn coming, not just where
    // you already are.
    const lookU = Math.min(1, u + CAMERA.lookAhead / pathLength);
    curve.getPointAt(lookU, scratch.desiredLook);
    scratch.desiredLook.y += LIGHT.hoverHeight;

    // First frame: snap, don't spring in from the origin.
    if (!state.initialised) {
      state.position.copy(scratch.target);
      state.lookAt.copy(scratch.desiredLook);
      state.initialised = true;
    }

    if (reducedMotion) {
      // Reduced motion: follow rigidly, no lag, no roll. The journey still
      // works — it just stops being cinematic about it.
      state.position.copy(scratch.target);
      state.lookAt.copy(scratch.desiredLook);
      state.velocity.set(0, 0, 0);
      state.bank = 0;
    } else {
      // ── The spring ────────────────────────────────────────────────────────
      const omega = CAMERA.stiffness;
      const zeta = CAMERA.damping;

      // Semi-implicit Euler: update velocity from current error, then apply.
      // More stable than explicit Euler at these timesteps and costs the same.
      const ax =
        -2 * zeta * omega * state.velocity.x -
        omega * omega * (state.position.x - scratch.target.x);
      const ay =
        -2 * zeta * omega * state.velocity.y -
        omega * omega * (state.position.y - scratch.target.y);
      const az =
        -2 * zeta * omega * state.velocity.z -
        omega * omega * (state.position.z - scratch.target.z);

      state.velocity.x += ax * delta;
      state.velocity.y += ay * delta;
      state.velocity.z += az * delta;

      state.position.addScaledVector(state.velocity, delta);

      // The look-at point is smoothed too, but more tightly — a look target
      // with as much lag as the position makes the horizon slosh around.
      state.lookAt.lerp(
        scratch.desiredLook,
        1 - Math.exp(-CAMERA.stiffness * 2 * delta),
      );

      // ── Banking ───────────────────────────────────────────────────────────
      const curvature = signedCurvatureAt(curve, u, pathLength);
      const speed = speedRef.current;

      // Below a crawl, curvature noise would produce visible micro-rolls.
      const effectiveSpeed =
        Math.abs(speed) < CAMERA.bankSpeedFloor ? 0 : speed;

      // tan(θ) = v²·κ / g — the coordinated-turn relationship. Gravity is
      // folded into bankScale, since we're tuning for feel rather than
      // simulating a real aircraft. See sceneConfig for the worked values;
      // the atan result is used directly, NOT multiplied by a further gain,
      // which would saturate the clamp and flatten the whole effect.
      const targetBank = MathUtils.clamp(
        Math.atan(
          effectiveSpeed * effectiveSpeed * curvature * CAMERA.bankScale,
        ),
        -CAMERA.maxBank,
        CAMERA.maxBank,
      );

      // The roll gets its own critically-damped spring, so the camera eases
      // into and out of a bank instead of snapping between angles.
      const bankAccel =
        -2 * omega * state.bankVelocity - omega * omega * (state.bank - targetBank);
      state.bankVelocity += bankAccel * delta;
      state.bank += state.bankVelocity * delta;
    }

    camera.position.copy(state.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(state.lookAt);

    // Roll around the camera's own forward axis. Must come AFTER lookAt,
    // which would otherwise overwrite it.
    if (state.bank !== 0) camera.rotateZ(state.bank);

    // ── Render-on-demand bookkeeping ──────────────────────────────────────
    // The canvas only draws when something asks it to. Scrolling asks. But
    // when you STOP scrolling the spring is usually still mid-flight, so we
    // must keep asking until it has actually settled — otherwise the camera
    // freezes mid-drift, which looks broken.
    const positionError = state.position.distanceTo(scratch.target);
    const settled =
      positionError < SETTLE_POSITION &&
      state.velocity.lengthSq() < SETTLE_VELOCITY * SETTLE_VELOCITY &&
      Math.abs(state.bankVelocity) < SETTLE_VELOCITY;

    if (!settled) invalidate();
  }, -1);

  return null;
}
