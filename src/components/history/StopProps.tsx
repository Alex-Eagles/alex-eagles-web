/**
 * StopProps — the flag poles, crowds and ground shadows at every stop.
 *
 * ─── ONE DRAW CALL PER PROP TYPE, NOT PER STOP ──────────────────────────────
 * Ten stops with a growing crowd at each is roughly 70 figures, 10 poles and
 * 80 shadows. Rendered naively that's ~160 separate draw calls — and draw call
 * count, not triangle count, is what actually strangles mobile GPUs.
 *
 * Instead each prop type is a single InstancedMesh: one geometry, one
 * material, uploaded once, drawn once, positioned by a per-instance matrix on
 * the GPU. Total: 3 draw calls, whether there are 10 stops or 100. Adding
 * years to the history file costs essentially nothing.
 *
 * ─── THE FADE ───────────────────────────────────────────────────────────────
 * Per-instance COLOUR is the one thing that changes per frame. There are only
 * ~160 of them, so writing them on the CPU is genuinely cheap (unlike the
 * ground's 6,000 dots, which is why that one had to be a shader). Each stop's
 * brightness is a pure function of how far the light is from it, so scrolling
 * back up fades everything back in with no state to unwind.
 *
 * ─── DETERMINISTIC "RANDOMNESS" ─────────────────────────────────────────────
 * The crowd is scattered with a seeded hash rather than Math.random(). A crowd
 * that rearranged itself on every reload — or worse, differed between a
 * quality downgrade and the frame before it — would read as a glitch.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  type InstancedMesh,
  Object3D,
  type Vector3,
} from "three";
import { PALETTE, STOP, type QualitySettings } from "./sceneConfig";
import { crowdSizeFor, stopIntensity } from "./journeyCurve";

/**
 * Cheap deterministic hash → 0..1. Same inputs always give the same layout,
 * so the crowd is stable across reloads, resizes and quality changes.
 */
function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
   * Y rotation (radians) that turns a flat frame to face back down the path,
   * squarely at the approaching camera.
   *
   * Because the camera chases the light ALONG the path, "facing the camera"
   * and "perpendicular to the path" are the same thing here — so the frame's
   * edge lines up exactly with the line, which is what makes it look placed
   * rather than dropped in at a random angle.
   */
  facing: number;
  /** How many awards this year won. Drives crowd size. */
  awardCount: number;
  /** How many image frames to show (one per provided photo, min 1). */
  frameCount: number;
  /** Centre the frames, crowd and label cluster around. */
  poleBase: Vector3;
  /** One pole per distinct competition. 1 or 2 in the current data. */
  poles: PolePlacement[];
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
}

export default function StopProps({
  stops,
  quality,
  uRef,
  pathLength,
}: StopPropsProps) {
  const peopleRef = useRef<InstancedMesh>(null);
  const polesRef = useRef<InstancedMesh>(null);
  const shadowsRef = useRef<InstancedMesh>(null);

  /**
   * Lay out every instance once. Each entry records which STOP it belongs to,
   * so the per-frame fade can look up the right intensity without recomputing
   * any geometry.
   */
  const layout = useMemo(() => {
    const dummy = new Object3D();
    const people: { matrix: number[]; stopIndex: number }[] = [];
    const poles: { matrix: number[]; stopIndex: number }[] = [];
    const shadows: { matrix: number[]; stopIndex: number }[] = [];

    stops.forEach((stop, stopIndex) => {
      // Pole positions are precomputed per competition in JourneyScene and
      // handed in via stop.poles — one pole per distinct competition. Render a
      // cylinder and a shadow at each.
      const poleBase = stop.poleBase;

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

      // The crowd — more people for a bigger year (see crowdSizeFor).
      const crowd = crowdSizeFor(stop.awardCount);
      for (let i = 0; i < crowd; i++) {
        const seed = stopIndex * 100 + i;

        // Scatter around the pole in a ring with jittered angle and radius, so
        // it reads as a gathered group rather than a geometric formation.
        const angle = (i / crowd) * Math.PI * 2 + (hash(seed) - 0.5) * 0.9;
        const radius = STOP.crowdRadius * (0.45 + hash(seed + 0.5) * 0.75);

        const px = poleBase.x + Math.cos(angle) * radius;
        const pz = poleBase.z + Math.sin(angle) * radius;

        // Slight height variation so the crowd doesn't look cloned.
        const heightScale = 0.88 + hash(seed + 1.5) * 0.24;

        dummy.position.set(px, (STOP.personHeight * heightScale) / 2, pz);
        dummy.rotation.set(0, hash(seed + 2.5) * Math.PI * 2, 0);
        dummy.scale.set(1, heightScale, 1);
        dummy.updateMatrix();
        people.push({ matrix: dummy.matrix.toArray(), stopIndex });

        dummy.position.set(px, 0.02, pz);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.setScalar(0.32);
        dummy.updateMatrix();
        shadows.push({ matrix: dummy.matrix.toArray(), stopIndex });
      }
    });

    return { people, poles, shadows };
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

    place(peopleRef.current, layout.people);
    place(polesRef.current, layout.poles);
    place(shadowsRef.current, layout.shadows);
  }, [layout, quality.blobShadows]);

  // Scratch colours, reused every frame — allocating a Color per instance per
  // frame would produce a steady stream of garbage for the GC to collect,
  // which shows up as periodic stutter.
  const litColor = useMemo(() => new Color(PALETTE.prop), []);
  const dimColor = useMemo(() => new Color(PALETTE.propDimmed), []);
  const scratch = useMemo(() => new Color(), []);

  useFrame(() => {
    const people = peopleRef.current;
    const poles = polesRef.current;
    // NB: shadows are absent on the low quality tier, so this must stay
    // optional — an early return on a null shadows mesh would silently kill
    // the fade for people and poles as well.
    const shadows = shadowsRef.current;
    if (!people || !poles) return;

    const u = uRef.current;

    // One intensity per stop, computed once and reused across all three
    // instanced meshes rather than recomputed per instance.
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

    paint(people, layout.people, 0);
    paint(poles, layout.poles, 0);
    if (shadows) paint(shadows, layout.shadows, 0);
  });

  return (
    <group>
      {/* People — capsules. Abstract on purpose, matching the reference's
          tiny featureless figures, and far cheaper than real character meshes. */}
      <instancedMesh
        ref={peopleRef}
        args={[undefined, undefined, layout.people.length]}
        frustumCulled={false}
      >
        <capsuleGeometry
          args={[
            STOP.personRadius,
            STOP.personHeight - STOP.personRadius * 2,
            quality.sphereDetail + 1,
            5 + quality.sphereDetail * 2,
          ]}
        />
        <meshLambertMaterial toneMapped={false} />
      </instancedMesh>

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
      {quality.blobShadows && (
        <instancedMesh
          ref={shadowsRef}
          args={[undefined, undefined, layout.shadows.length]}
          frustumCulled={false}
        >
          <circleGeometry args={[1, 12]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.35}
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}
