/**
 * StopProps — the flag poles and their ground shadows at every stop.
 *
 * ─── ONE DRAW CALL PER PROP TYPE, NOT PER STOP ──────────────────────────────
 * Ten stops carry a dozen poles and a shadow under each. Rendered naively
 * that's two dozen separate draw calls — and draw call count, not triangle
 * count, is what actually strangles mobile GPUs.
 *
 * Instead each prop type is a single InstancedMesh: one geometry, one
 * material, uploaded once, drawn once, positioned by a per-instance matrix on
 * the GPU. Total: 2 draw calls, whether there are 10 stops or 100. Adding
 * years to the history file costs essentially nothing.
 *
 * ─── THE FADE ───────────────────────────────────────────────────────────────
 * Per-instance COLOUR is the one thing that changes per frame. There are only
 * a couple of dozen of them, so writing them on the CPU is genuinely cheap
 * (unlike the ground's 6,000 dots, which is why that one had to be a shader).
 * Each stop's brightness is a pure function of how far the light is from it,
 * so scrolling back up fades everything back in with no state to unwind.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  DoubleSide,
  type InstancedMesh,
  Object3D,
  type Vector3,
} from "three";
import { STOP, type QualitySettings, type ScenePalette } from "./sceneConfig";
import { stopIntensity } from "./journeyCurve";

/**
 * One aircraft parked at a stop, resolved to world space.
 *
 * Computed once in JourneyScene alongside the poles, because TWO files need
 * it and they must not disagree: StopOverlays anchors the <img> here, and this
 * file pools the contact shadow at the same spot. Deriving it independently in
 * both would let an aircraft drift off its own shadow.
 */
export interface VehiclePlacement {
  /** Ground position the aircraft stands on. */
  position: Vector3;
  /** Half-width of its contact shadow, world units. */
  shadowRadius: number;
  /** Greyscale silhouette used as this aircraft's ground shadow. */
  shadowMask: string;
  /** Which way the aircraft — and so its shadow — points. */
  facing: number;
  /**
   * Height of the aircraft's bottom edge above the floor. Read by StopOverlays
   * for the <img> anchor; the shadow here deliberately ignores it and stays
   * flat on the ground, so lifting one separates it from its shadow.
   */
  groundOffset: number;
}

/** One flag pole standing at a stop. */
export interface PolePlacement {
  /** World position of the pole's foot. */
  base: Vector3;
  /** Flag image flown on it (competition logo, or Egyptian flag for 2013). */
  logo: string;
  /** Which way the flag drapes from the pole. */
  side: "left" | "right";
}

export interface StopPlacement {
  /** Where this stop sits on the path. */
  anchor: Vector3;
  /** Unit vector pointing sideways off the path — props stand along this. */
  right: Vector3;
  /**
   * Unit vector pointing to the VIEWER's right (cross(tangent, up)), which —
   * unlike `right` — never flips with path parity. Multi-competition stops lay
   * their poles and frames along this so competitions always read left-to-right
   * in label order. See JourneyScene and StopOverlays.
   */
  screenRight: Vector3;
  /**
   * Unit vector pointing the way the path is HEADING at this stop. Negating it
   * points back at the oncoming camera, which is how the parked aircraft are
   * placed in FRONT of the poles rather than level with them.
   */
  tangent: Vector3;
  /**
   * Y rotation (radians) that turns a flat frame to face back down the path,
   * squarely at the approaching camera.
   *
   * Because the camera chases the light ALONG the path, "facing the camera"
   * and "perpendicular to the path" are the same thing here — so the frame's
   * edge lines up exactly with the line, which is what makes it look placed
   * rather than dropped in at a random angle.
   */
  facing: number;
  /** How many image frames to show (one per provided photo, min 1). */
  frameCount: number;
  /** Centre the frames, poles and label cluster around. */
  poleBase: Vector3;
  /** One pole per distinct competition. 1 or 2 in the current data. */
  poles: PolePlacement[];
  /** The aircraft parked at this stop, if any. */
  vehicles: VehiclePlacement[];
  /** Arc-length position of this stop, for the fade calculation. */
  u: number;
}

interface StopPropsProps {
  stops: StopPlacement[];
  quality: QualitySettings;
  /** Light's current arc-length position, written by the scene controller. */
  uRef: React.MutableRefObject<number>;
  /** Total path length, to convert normalised distance into world units. */
  pathLength: number;
  /** Active-theme palette. Both prop tints follow the theme. */
  palette: ScenePalette;
  /** Ground-shadow strength for the active theme (see SHADOW in sceneConfig). */
  shadowOpacity: number;
  /**
   * Whether the POLES cast shadows. False in light mode: a pole's shadow is a
   * small dark ellipse with nothing above it wide enough to explain it, which
   * on the pale floor reads as a smudge. See SHADOW.poleShadowsInLight.
   */
  showPoleShadows: boolean;
}

export default function StopProps({
  stops,
  quality,
  uRef,
  pathLength,
  palette,
  shadowOpacity,
  showPoleShadows,
}: StopPropsProps) {
  const invalidate = useThree((state) => state.invalidate);
  const polesRef = useRef<InstancedMesh>(null);
  const shadowsRef = useRef<InstancedMesh>(null);

  /**
   * Lay out every instance once. Each entry records which STOP it belongs to,
   * so the per-frame fade can look up the right intensity without recomputing
   * any geometry.
   */
  const layout = useMemo(() => {
    const dummy = new Object3D();
    const poles: { matrix: number[]; stopIndex: number }[] = [];
    const shadows: { matrix: number[]; stopIndex: number }[] = [];

    stops.forEach((stop, stopIndex) => {
      // Pole positions are precomputed per competition in JourneyScene and
      // handed in via stop.poles — one pole per distinct competition. Render a
      // cylinder and a shadow at each.
      stop.poles.forEach((pole) => {
        dummy.position.set(pole.base.x, STOP.poleHeight / 2, pole.base.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poles.push({ matrix: dummy.matrix.toArray(), stopIndex });

        // Blob shadow beneath the pole.
        dummy.position.set(pole.base.x, 0.02, pole.base.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.setScalar(0.6);
        dummy.updateMatrix();
        shadows.push({ matrix: dummy.matrix.toArray(), stopIndex });
      });

      // NB: aircraft shadows are NOT here. A stretched ellipse is fine under a
      // pole, which really is a circular post, but under a fixed-wing it reads
      // as a blob that has nothing to do with the aircraft above it. They get
      // their own silhouette-shaped shadows — see VehicleShadows.
    });

    return { poles, shadows };
  }, [stops]);

  /**
   * Push the baked matrices into the instanced meshes.
   *
   * This is an effect, not per-frame work: the positions never change once
   * laid out, so re-uploading them every frame would be pure waste. Refs are
   * guaranteed populated by the time effects run.
   */
  useEffect(() => {
    const dummy = new Object3D();
    const place = (
      mesh: InstancedMesh | null,
      entries: { matrix: number[] }[],
    ) => {
      if (!mesh) return;
      entries.forEach((entry, i) => {
        dummy.matrix.fromArray(entry.matrix);
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    place(polesRef.current, layout.poles);
    place(shadowsRef.current, layout.shadows);
  }, [layout, quality.blobShadows]);

  /**
   * Soft-edged alpha mask for the contact shadows.
   *
   * Drawn into a 64px canvas rather than shipped as a file: it's a radial
   * gradient, so generating it costs a fraction of a millisecond once and saves
   * a network request, a decode and an asset to keep in sync. 64px is plenty —
   * it's nothing but a smooth falloff, and the GPU is stretching it across a
   * blurry ellipse anyway.
   *
   * Without it these are flat discs with a hard polygonal rim, which read as
   * dark stickers on the floor. The falloff is what makes them read as shadow.
   */
  const shadowAlpha = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const half = size / 2;
      const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
      // Held near-opaque through the middle so the shadow has a solid core and
      // only softens at the rim — a gradient straight from 1 to 0 looks like
      // fog rather than contact.
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.92)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    return new CanvasTexture(canvas);
  }, []);

  // Textures hold a GPU allocation that outlives the React tree, so it has to
  // be released explicitly — garbage collection won't reclaim it.
  useEffect(() => () => shadowAlpha.dispose(), [shadowAlpha]);

  // Scratch colours, reused every frame — allocating a Color per instance per
  // frame would produce a steady stream of garbage for the GC to collect,
  // which shows up as periodic stutter.
  const litColor = useMemo(() => new Color(palette.prop), [palette]);
  const dimColor = useMemo(() => new Color(palette.propDimmed), [palette]);
  const scratch = useMemo(() => new Color(), []);

  // The per-frame fade below already reads these colours, but at rest the loop
  // is idle — so on a theme flip, ask for one frame to repaint the props.
  useEffect(() => {
    invalidate();
  }, [palette, invalidate]);

  useFrame(() => {
    const poles = polesRef.current;
    // NB: shadows are absent on the low quality tier, so this must stay
    // optional — an early return on a null shadows mesh would silently kill
    // the fade for the poles as well.
    const shadows = shadowsRef.current;
    if (!poles) return;

    const u = uRef.current;

    // One intensity per stop, computed once and reused across both instanced
    // meshes rather than recomputed per instance.
    const intensities = stops.map((stop) =>
      stopIntensity((u - stop.u) * pathLength),
    );

    const paint = (
      mesh: InstancedMesh,
      entries: { stopIndex: number }[],
      floor: number,
    ) => {
      entries.forEach((entry, i) => {
        const t = floor + intensities[entry.stopIndex] * (1 - floor);
        scratch.copy(dimColor).lerp(litColor, t);
        mesh.setColorAt(i, scratch);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    paint(poles, layout.poles, 0);
    if (shadows) paint(shadows, layout.shadows, 0);
  });

  return (
    <group>
      {/* Flag poles — thin cylinders. The flag itself is a DOM image, so its
          colours stay crisp and cost no texture upload. */}
      <instancedMesh
        ref={polesRef}
        args={[undefined, undefined, layout.poles.length]}
        frustumCulled={false}
      >
        <cylinderGeometry
          args={[STOP.poleRadius, STOP.poleRadius, STOP.poleHeight, 6]}
        />
        <meshLambertMaterial toneMapped={false} />
      </instancedMesh>

      {/* Fake contact shadows. A real shadow map would re-render the scene from
          the light's viewpoint every frame; at this camera angle a soft dark
          ellipse is indistinguishable and effectively free. */}
      {quality.blobShadows && showPoleShadows && (
        <instancedMesh
          ref={shadowsRef}
          args={[undefined, undefined, layout.shadows.length]}
          frustumCulled={false}
        >
          {/* 24 segments, not 12: an aircraft's shadow is several world units
              across, and at that size a 12-gon's straight edges are visible. */}
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            alphaMap={shadowAlpha}
            opacity={shadowOpacity}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}
