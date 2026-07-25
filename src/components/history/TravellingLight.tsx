/**
 * TravellingLight — the blue light that carries you through the team's history.
 *
 * ─── THE GLOW IS FAKE, ON PURPOSE ───────────────────────────────────────────
 * The "correct" way to make something glow in three.js is a bloom
 * post-processing pass: render the scene, extract bright pixels, blur them
 * across several downsampled buffers, composite back. It looks superb and it
 * costs an entire extra pass over the screen every frame. It is the single
 * most common reason a WebGL page runs at 20fps on a phone.
 *
 * We use additive sprites instead — two soft radial gradients stacked, drawn
 * on top of the scene. On a DARK background additive blending is genuinely
 * how light behaves: overlapping brightness sums toward white, exactly as
 * bloom would. The result is near-indistinguishable here for a rounding error
 * of the cost.
 *
 * ─── AND WHY LIGHT MODE COMPOSITES DIFFERENTLY ──────────────────────────────
 * This header used to end by conceding that on a light background the trick
 * "falls apart and you'd be forced into real bloom". Half of that is true: it
 * does fall apart, because adding anything to a #f7f8ff floor clamps to pure
 * white, so both sprites rendered as literally nothing while still washing out
 * the core sphere underneath them.
 *
 * But the conclusion doesn't follow. Bloom is a way to make something look
 * BRIGHTER than the surface around it, and on a near-white surface there is no
 * headroom left to be brighter into. What a glow does on white paper is tint:
 * a saturated core washing out to the paper. That is plain alpha compositing of
 * the same gradient through a saturated colour — same texture, same two
 * sprites, same cost, one blending constant. So light mode keeps every bit of
 * the cheap approach and just stops pretending it's adding light.
 *
 * See `glowStyle` / `PALETTE_LIGHT_OVERRIDES` in sceneConfig for the numbers.
 *
 * ─── WHY SPRITES AND NOT PLANES ─────────────────────────────────────────────
 * A glow must always face the camera, or you'd catch it edge-on and watch it
 * vanish — especially bad here, since our camera deliberately banks and rolls.
 * three's Sprite billboards on the GPU as part of its normal transform, so we
 * never touch a quaternion from JS.
 */

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  NormalBlending,
  SRGBColorSpace,
  type Group,
} from "three";
import {
  LIGHT,
  glowStyle,
  type QualitySettings,
  type ScenePalette,
} from "./sceneConfig";

/**
 * Generates the soft radial gradient used by both glow sprites.
 *
 * Drawn once into a small offscreen canvas and uploaded as a single texture.
 * 128px is plenty: it's a smooth gradient stretched over a large sprite, so
 * there's no detail to lose, and a small texture means a trivial GPU upload
 * and excellent cache behaviour.
 */
function createGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );

  // An exponential-ish ramp rather than a linear one: real light falls off
  // fast near the source, and a linear ramp reads as a flat painted disc.
  gradient.addColorStop(0.0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.35)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

interface TravellingLightProps {
  quality: QualitySettings;
  /** The scene controller moves this group along the path each frame. */
  groupRef: React.RefObject<Group>;
  /** Active-theme palette. The light re-tints with it — see the header. */
  palette: ScenePalette;
  /** Selects the compositing mode for the glow sprites. */
  isDark: boolean;
}

export default function TravellingLight({
  quality,
  groupRef,
  palette,
  isDark,
}: TravellingLightProps) {
  const invalidate = useThree((state) => state.invalidate);
  const glowTexture = useMemo(createGlowTexture, []);

  // Textures hold GPU memory — release it when the page unmounts. Without
  // this, navigating between routes repeatedly would leak a texture each time.
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const glow = glowStyle(isDark);
  const blending = isDark ? AdditiveBlending : NormalBlending;

  const glowColor = useMemo(
    () => new Color(palette.lightGlow),
    [palette.lightGlow],
  );
  const coreColor = useMemo(
    () => new Color(palette.lightCore),
    [palette.lightCore],
  );

  // The canvas is frameloop="demand", so it only draws when something asks it
  // to. A theme flip changes no scroll position and settles no spring, so
  // without this the new colours would sit in the materials unseen until the
  // visitor happened to scroll.
  // (Block body, not a concise arrow: React treats an effect's return value as
  // a cleanup function, and matches how GroundDots/JourneyPath do the same.)
  useEffect(() => {
    invalidate();
  }, [palette, isDark, invalidate]);

  return (
    <group ref={groupRef}>
      {/* Solid core. Basic (unlit) material — this object IS the light source
          conceptually, so shading it would be backwards. */}
      <mesh>
        <sphereGeometry
          args={[
            LIGHT.coreRadius,
            8 + quality.sphereDetail * 4,
            6 + quality.sphereDetail * 3,
          ]}
        />
        <meshBasicMaterial color={coreColor} toneMapped={false} />
      </mesh>

      {/* Wide, soft halo — the bulk of the perceived glow.

          ─── THE `key` IS LOAD-BEARING ───────────────────────────────────────
          `blending` is not an ordinary uniform: three bakes the blend equation
          into the material's compiled program, so mutating it on a live
          material needs an explicit `needsUpdate` to force a recompile —
          which there is no declarative way to express here. Keying the sprite
          on the theme sidesteps the question entirely: React unmounts it and
          mounts a fresh one, with a correctly-compiled material, on toggle.
          It costs one remount per theme flip and nothing at all per frame.
          (The texture is NOT remounted with it — it's memoised above and
          shared by both sprites, so no GPU upload happens here either.) */}
      <sprite
        key={isDark ? "halo-dark" : "halo-light"}
        scale={[LIGHT.glowSize, LIGHT.glowSize, 1]}
      >
        <spriteMaterial
          map={glowTexture}
          color={glowColor}
          blending={blending}
          transparent
          // Glows must never write depth, or they'd punch a hole in everything
          // drawn behind them.
          depthWrite={false}
          toneMapped={false}
          opacity={glow.haloOpacity}
        />
      </sprite>

      {/* Tight, hot inner glow. Stacking two gradients gives a concentrated
          centre with a wide falloff — the shape real bloom produces.
          In light mode this is also what makes the very centre of the light
          the deepest point on screen, since it's tinted with `lightCore`. */}
      <sprite
        key={isDark ? "core-dark" : "core-light"}
        scale={[LIGHT.glowSize * 0.35, LIGHT.glowSize * 0.35, 1]}
      >
        <spriteMaterial
          map={glowTexture}
          color={coreColor}
          blending={blending}
          transparent
          depthWrite={false}
          toneMapped={false}
          opacity={glow.coreOpacity}
        />
      </sprite>
    </group>
  );
}
