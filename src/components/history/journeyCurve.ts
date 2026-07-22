/**
 * journeyCurve.ts — the geometry the whole page is built on.
 *
 * ─── THE ONE BIG IDEA ───────────────────────────────────────────────────────
 * Everything visible on this page is a PURE FUNCTION of one number: `u`, the
 * light's normalised position along the path (0 = start, 1 = end). And `u`
 * itself is a pure function of scroll position.
 *
 *      scrollY  →  u  →  { light position, camera, every stop's opacity }
 *
 * That chain has no memory. Nothing is "remembered" about whether a stop was
 * already passed, so there is no state to get out of sync. Refresh halfway
 * down the page, flick-scroll to the bottom, rotate your phone, resize the
 * window — the scene is always exactly correct, because it is recomputed from
 * scratch every frame from a single scalar. This is why passed achievements
 * fade back IN when you scroll up, and it eliminates the entire family of bugs
 * where an animation gets stuck in the wrong state.
 *
 * ─── ARC LENGTH vs CURVE PARAMETER (the subtle bit) ─────────────────────────
 * three.js curves have two different notions of "how far along":
 *
 *   t — the raw spline parameter. Cheap, but NOT evenly spaced: equal steps in
 *       t cover more ground on straights than through tight bends.
 *   u — arc length, normalised. Equal steps in u cover equal DISTANCE.
 *
 * We drive the light by `u`, so it moves at a genuinely constant speed and the
 * scroll feels linear. But `getPoint(t)` is what lands exactly on our control
 * points, so stop positions are naturally expressed in `t`. `tToU` below
 * bridges the two. Mixing them up produces a light that mysteriously speeds up
 * on straights — worth knowing before editing this file.
 */

import {
  CatmullRomCurve3,
  Vector3,
} from "three";
import { FRAME, LAYOUT, STOP } from "./sceneConfig";

/** Sample count for the arc-length lookup table. Built once, then reused. */
const ARC_LUT_DIVISIONS = 800;

export interface JourneyCurve {
  /** The spline itself. */
  curve: CatmullRomCurve3;
  /** Total arc length in world units. */
  length: number;
  /** Arc-length position (0..1) of each stop, in chronological order. */
  stopUs: number[];
  /** World position of each stop's anchor point on the path. */
  stopPoints: Vector3[];
}

/**
 * Builds the journey path for `stopCount` stops.
 *
 * The path marches into -Z and swings side to side using a sine, so the light
 * always has real curves to bank through. The frequency is deliberately not a
 * neat fraction of π (see LAYOUT.lateralFrequency) so ten stops never settle
 * into an obviously repeating left-right-left rhythm.
 */
export function buildJourneyCurve(stopCount: number): JourneyCurve {
  const { stopSpacing, lateralAmplitude, lateralFrequency, leadLength } = LAYOUT;

  /** Lateral offset of stop `i`. Also used to place the lead-in/out points. */
  const lateralAt = (i: number) =>
    Math.sin(i * lateralFrequency) * lateralAmplitude;

  const anchors: Vector3[] = [];
  for (let i = 0; i < stopCount; i++) {
    anchors.push(new Vector3(lateralAt(i), 0, -i * stopSpacing));
  }

  // Straight run-in before the first stop and run-out past the last, so the
  // light enters and leaves frame instead of popping into existence.
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  const leadIn = new Vector3(first.x, 0, first.z + leadLength);
  const leadOut = new Vector3(last.x, 0, last.z - leadLength);

  const points = [leadIn, ...anchors, leadOut];

  // 'centripetal' parameterisation is the important choice here: the default
  // ('centripetal' vs 'chordal'/'uniform') is the only one that guarantees no
  // cusps or self-intersections when control points are unevenly spaced.
  const curve = new CatmullRomCurve3(points, false, "centripetal", 0.5);

  const lengths = curve.getLengths(ARC_LUT_DIVISIONS);
  const length = lengths[lengths.length - 1];

  // For a non-closed CatmullRomCurve3, getPoint(j / (P-1)) lands exactly on
  // points[j]. So stop `i` (which is points[i+1]) sits at this curve parameter.
  const stopUs: number[] = [];
  const stopPoints: Vector3[] = [];
  for (let i = 0; i < stopCount; i++) {
    const t = (i + 1) / (points.length - 1);
    stopUs.push(tToU(lengths, t));
    stopPoints.push(anchors[i].clone());
  }

  return { curve, length, stopUs, stopPoints };
}

/**
 * Converts a raw curve parameter `t` into normalised arc length `u`, by
 * interpolating the cumulative-length lookup table.
 */
function tToU(lengths: number[], t: number): number {
  const total = lengths[lengths.length - 1];
  if (total <= 0) return 0;

  const divisions = lengths.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * divisions;
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, divisions);
  const frac = scaled - lo;

  const lengthAtT = lengths[lo] + (lengths[hi] - lengths[lo]) * frac;
  return lengthAtT / total;
}

/**
 * Signed curvature of the path at arc-length position `u`, in 1/units.
 *
 * Because we're parameterised by arc length, curvature is just how fast the
 * unit tangent rotates per unit distance travelled: κ = |dT/ds|. We take that
 * derivative numerically from two nearby tangents.
 *
 * The SIGN says which way the path turns (from the cross product's Y, since
 * the path is flat in the XZ plane) — that's what lets the camera roll INTO a
 * turn rather than just rolling by some amount in an arbitrary direction.
 */
export function signedCurvatureAt(
  curve: CatmullRomCurve3,
  u: number,
  totalLength: number,
): number {
  const du = 0.004;
  const u0 = Math.max(0, u - du);
  const u1 = Math.min(1, u + du);
  if (u1 <= u0 || totalLength <= 0) return 0;

  const t0 = curve.getTangentAt(u0, new Vector3()).normalize();
  const t1 = curve.getTangentAt(u1, new Vector3()).normalize();

  // Arc distance actually covered between the two samples.
  const ds = (u1 - u0) * totalLength;
  const magnitude = t1.clone().sub(t0).length() / ds;

  // Cross product Y tells us left vs right for a path lying in the XZ plane.
  const direction = Math.sign(t0.clone().cross(t1).y) || 0;

  return magnitude * direction;
}

/**
 * How "awake" a stop is, given the light's distance from it along the path.
 *
 * Returns 1 at the stop, easing to 0 once the light is `activationRange` away
 * on EITHER side. Being symmetrical is what makes the fade reversible: a stop
 * behind the light is dimmed by exactly the same curve that brightened it on
 * the way in, so scrolling back up plays the whole thing in reverse for free.
 *
 * `distance` is in world units along the path — pass a signed or unsigned
 * value, it's absolute'd here.
 */
export function stopIntensity(distance: number): number {
  const x = Math.min(Math.abs(distance) / STOP.activationRange, 1);
  // smoothstep — no hard edges at either end of the transition.
  const eased = 1 - x * x * (3 - 2 * x);
  return eased;
}

/**
 * Number of figures standing at a stop: a base crowd plus more for each award
 * won that year, so bigger years are visibly bigger on the path.
 */
export function crowdSizeFor(awardCount: number): number {
  return STOP.peopleBase + awardCount * STOP.peoplePerAward;
}

/**
 * Positions for `count` image frames along a stop's `right` axis, in slot
 * units (multiply by FRAME.spacing for world units).
 *
 * Slots fill outward alternately (−1, +1, −2, +2 …) then sort left-to-right,
 * so the pole always keeps the centre and frames stay balanced around it:
 *
 *   1 award  → [−1]           one frame, between the path and the pole
 *   2 awards → [−1, +1]       [ Image 1 ]  pole  [ Image 2 ]
 *   3 awards → [−2, −1, +1]   2025's three frames, still centred on the pole
 */
export function frameSlots(count: number): number[] {
  const slots: number[] = [];
  for (let k = 1; slots.length < count; k++) {
    slots.push(-k);
    if (slots.length < count) slots.push(k);
  }
  return slots.sort((a, b) => a - b);
}

/**
 * How far off the path a stop's flag pole stands, given how many frames it
 * carries.
 *
 * MUST be used by everything that positions something at a stop — pole,
 * crowd, shadows, frames, label, flag. They are laid out in two different
 * files (StopProps for the 3D props, StopOverlays for the DOM), so if one used
 * a fixed offset and the other used this, a big year's flag pole would drift
 * away from its own crowd.
 *
 * Bigger years push further out, because their outermost-left frame reaches
 * further back toward the path — see FRAME.minPathClearance.
 */
export function poleOffsetFor(frameCount: number): number {
  const slots = frameSlots(Math.max(1, frameCount));
  const innermost = slots[0]; // most negative — the closest to the path
  const needed = FRAME.minPathClearance - innermost * FRAME.spacing;
  return Math.max(LAYOUT.stopOffset, needed);
}
