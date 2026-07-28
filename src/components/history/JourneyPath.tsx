/**
 * JourneyPath — the glowing line the light travels along.
 *
 * ─── HOW THE GLOW WORKS (and why it costs nothing per frame) ────────────────
 * The whole tube is drawn once, as static geometry that never changes. The
 * travelling glow is done entirely in the fragment shader: each pixel measures
 * its own distance to the light and brightens accordingly. So "animating" the
 * trail is just moving one uniform — three floats — and the GPU does the rest.
 *
 * The alternative (rebuilding geometry or rewriting a vertex colour buffer as
 * the light moves) would push thousands of floats to the GPU every frame for
 * an identical result.
 *
 * ─── THE COMET TAIL ─────────────────────────────────────────────────────────
 * A glow based purely on distance is symmetrical — it would light the path
 * ahead of the light exactly as much as behind, which reads as a glowing blob
 * rather than something in motion. So we project each pixel onto the light's
 * direction of travel to find out whether it's AHEAD or BEHIND, and give the
 * tail a much longer falloff than the nose. That asymmetry is what sells the
 * sense of speed and direction.
 */

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { CatmullRomCurve3, Color } from "three";
import type { Vector3 } from "three";
import { LIGHT, type QualitySettings, type ScenePalette } from "./sceneConfig";

/** Tube radius in world units. Thin — it's a light trail, not a pipe. */
const PATH_RADIUS = 0.16;
/** How far ahead of the light the path pre-glows. Short, so motion reads. */
const AHEAD_LENGTH = 6;

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3  uLightPos;
  uniform vec3  uLightDir;
  uniform vec3  uIdle;
  uniform vec3  uLit;
  uniform float uTrailLength;
  uniform float uAheadLength;

  varying vec3 vWorldPos;

  void main() {
    vec3 offset = vWorldPos - uLightPos;

    // Signed distance along the direction of travel.
    //   negative → behind the light (the tail)
    //   positive → ahead of the light (the nose)
    float along = dot(offset, uLightDir);

    // Different falloff each way — see the header. This is the comet tail.
    float reach = along < 0.0 ? uTrailLength : uAheadLength;
    float glow = 1.0 - smoothstep(0.0, reach, abs(along));

    // Cubed so the trail has a hot core that decays fast, rather than a long
    // even smear which would look like a painted stripe.
    glow = glow * glow * glow;

    vec3 colour = mix(uIdle, uLit, glow);
    gl_FragColor = vec4(colour, 1.0);

    #include <colorspace_fragment>
  }
`;

interface JourneyPathProps {
  curve: CatmullRomCurve3;
  length: number;
  quality: QualitySettings;
  lightPosRef: React.MutableRefObject<Vector3>;
  lightDirRef: React.MutableRefObject<Vector3>;
  /** Active-theme palette. Both the idle path and the lit trail re-tint. */
  palette: ScenePalette;
}

export default function JourneyPath({
  curve,
  length,
  quality,
  lightPosRef,
  lightDirRef,
  palette,
}: JourneyPathProps) {
  const invalidate = useThree((state) => state.invalidate);

  // Geometry is built once per quality tier and then never touched again.
  const tubularSegments = useMemo(
    () => Math.max(24, Math.round(length * quality.pathSegmentsPerUnit)),
    [length, quality.pathSegmentsPerUnit],
  );

  const uniforms = useMemo(
    () => ({
      // Same shared Vector3 instances the controller mutates — no per-frame
      // uniform writes from JS at all.
      uLightPos: { value: lightPosRef.current },
      uLightDir: { value: lightDirRef.current },
      // Both follow the theme. `uLit` was previously pinned to the dark-mode
      // hot cyan (#6fe3ff), which is lighter than the light-mode floor it was
      // drawn on — so the comet tail, the one element on the path that conveys
      // direction and speed, was the FAINTEST thing in the scene rather than
      // the brightest. Seeded from the initial palette and synced below.
      uIdle: { value: new Color(palette.pathIdle) },
      uLit: { value: new Color(palette.pathLit) },
      uTrailLength: { value: LIGHT.trailLength },
      uAheadLength: { value: AHEAD_LENGTH },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Re-tint on theme flip, then draw one frame so the change shows immediately
  // (frameloop="demand").
  useEffect(() => {
    uniforms.uIdle.value.set(palette.pathIdle);
    uniforms.uLit.value.set(palette.pathLit);
    invalidate();
  }, [palette, uniforms, invalidate]);

  return (
    <mesh position={[0, LIGHT.hoverHeight, 0]}>
      <tubeGeometry
        args={[curve, tubularSegments, PATH_RADIUS, quality.pathRadialSegments, false]}
      />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
