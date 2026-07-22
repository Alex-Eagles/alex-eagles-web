/**
 * GroundDots — the dot-grid floor that lights up around the travelling light.
 *
 * ─── WHY A SHADER PLANE AND NOT THOUSANDS OF DOTS ───────────────────────────
 * The obvious build is an InstancedMesh with one small circle per dot. Covering
 * this path at a readable density needs roughly 6,000 of them: that's 6,000
 * instance matrices in memory, and any per-dot brightness animation means
 * rewriting a 6,000-entry colour buffer on the CPU every single frame. That
 * buffer upload alone would blow the frame budget on a phone.
 *
 * Instead this is ONE plane with one shader. The dots are computed
 * procedurally per pixel, so:
 *   • 1 draw call, 4 vertices, no instance memory at all
 *   • dot brightness is computed on the GPU from distance to the light, so
 *     the CPU does nothing per frame beyond setting one uniform (the light's
 *     position — 3 floats)
 *   • dots stay perfectly crisp at any resolution or zoom, because they're
 *     evaluated per pixel rather than being fixed geometry
 *
 * ─── THE POOL OF LIGHT SOLVES AN ALIASING BUG, TOO ──────────────────────────
 * A repeating dot grid viewed at a grazing angle produces heavy moiré
 * shimmer in the distance — a classic and very ugly artifact. Rather than pay
 * for mipmapping or supersampling to fix it, the dots simply fade to nothing
 * beyond `poolRadius` around the light. That's the look we wanted anyway (a
 * pool of light travelling through darkness), and the aliasing-prone distant
 * grid is never drawn at all. The cheapest bug fix is the one where the fix
 * IS the art direction.
 */

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Color } from "three";
import type { Vector3 } from "three";
import { PALETTE, type QualitySettings, type ScenePalette } from "./sceneConfig";

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
  uniform vec3  uGround;
  uniform vec3  uDotIdle;
  uniform vec3  uDotLit;
  uniform float uSpacing;
  uniform float uDotRadius;
  uniform float uPoolRadius;

  varying vec3 vWorldPos;

  void main() {
    // ── The dot mask ────────────────────────────────────────────────────────
    // Fold world position into a single grid cell, then measure distance from
    // that cell's centre. This draws an infinite grid with no geometry.
    vec2 cell = mod(vWorldPos.xz, uSpacing) - uSpacing * 0.5;
    float distToCentre = length(cell);

    // fwidth() gives us the pixel footprint at this fragment, which lets the
    // dot edge stay exactly one pixel soft no matter how far away it is —
    // free, correct antialiasing that a fixed-size mesh could never manage.
    float edge = fwidth(distToCentre) * 1.2;
    // NB: named dotMask, not dot — dot() is a GLSL builtin, and shadowing it
    // makes the real dot() unusable in this scope and upsets some drivers.
    float dotMask = 1.0 - smoothstep(uDotRadius - edge, uDotRadius + edge, distToCentre);

    // ── The pool of light ───────────────────────────────────────────────────
    // Dots are excited by proximity to the travelling light and vanish beyond
    // the pool radius (see the file header — this also kills distant moiré).
    float distToLight = distance(vWorldPos.xz, uLightPos.xz);
    float pool = 1.0 - smoothstep(0.0, uPoolRadius, distToLight);

    // Squared falloff concentrates the brightness near the light instead of
    // washing the whole pool out evenly.
    float excite = pool * pool;

    vec3 dotColour = mix(uDotIdle, uDotLit, excite);
    vec3 colour = mix(uGround, dotColour, dotMask * pool);

    gl_FragColor = vec4(colour, 1.0);

    #include <colorspace_fragment>
  }
`;

interface GroundDotsProps {
  /** Plane size in world units — should comfortably cover the whole path. */
  width: number;
  depth: number;
  /** Plane is centred here (the middle of the journey). */
  centerZ: number;
  quality: QualitySettings;
  /** Shared ref holding the light's current world position. */
  lightPosRef: React.MutableRefObject<Vector3>;
  /** Active-theme palette. Only the ground + idle dots re-tint; `dotLit` stays. */
  palette: ScenePalette;
}

export default function GroundDots({
  width,
  depth,
  centerZ,
  quality,
  lightPosRef,
  palette,
}: GroundDotsProps) {
  const invalidate = useThree((state) => state.invalidate);

  // Built once. Colours are converted from the palette's hex values into the
  // renderer's working colour space here, not per frame.
  //
  // uLightPos holds the SAME Vector3 instance the scene controller mutates
  // each frame. Because three re-reads the uniform's value object on every
  // draw, the shader always sees the current position without us touching a
  // single uniform from JS per frame.
  const uniforms = useMemo(
    () => ({
      uLightPos: { value: lightPosRef.current },
      // Ground + idle dots follow the theme; `dotLit` (the blue the light
      // paints) is constant. Initialised from the current palette so the first
      // frame is already correct; kept in sync by the effect below.
      uGround: { value: new Color(palette.ground) },
      uDotIdle: { value: new Color(palette.dotIdle) },
      uDotLit: { value: new Color(PALETTE.dotLit) },
      uSpacing: { value: quality.dotSpacing },
      // 0.115 of the spacing. Larger values (0.16 was the first attempt) read
      // as bold polka dots up close rather than the fine technical grid in the
      // reference — the dots sit near the camera at a grazing angle, so they
      // foreshorten into wide ellipses and look much bigger than they measure.
      uDotRadius: { value: quality.dotSpacing * 0.115 },
      uPoolRadius: { value: 26 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality.dotSpacing],
  );

  // Re-tint the ground + idle dots when the theme flips, then draw one frame so
  // the change shows without waiting for the next scroll (frameloop="demand").
  useEffect(() => {
    uniforms.uGround.value.set(palette.ground);
    uniforms.uDotIdle.value.set(palette.dotIdle);
    invalidate();
  }, [palette, uniforms, invalidate]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centerZ]}>
      <planeGeometry args={[width, depth, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
