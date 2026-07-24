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
 * of the cost. (This is precisely why the dark palette was chosen over the
 * pale reference — on a light background this trick falls apart and you'd be
 * forced into real bloom.)
 *
 * ─── WHY SPRITES AND NOT PLANES ─────────────────────────────────────────────
 * A glow must always face the camera, or you'd catch it edge-on and watch it
 * vanish — especially bad here, since our camera deliberately banks and rolls.
 * three's Sprite billboards on the GPU as part of its normal transform, so we
 * never touch a quaternion from JS.
 */

import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  SRGBColorSpace,
  type Group,
} from "three";
import { PALETTE, LIGHT, type QualitySettings } from "./sceneConfig";

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
}

export default function TravellingLight({
  quality,
  groupRef,
}: TravellingLightProps) {
  const glowTexture = useMemo(createGlowTexture, []);

  // Textures hold GPU memory — release it when the page unmounts. Without
  // this, navigating between routes repeatedly would leak a texture each time.
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const glowColor = useMemo(() => new Color(PALETTE.lightGlow), []);
  const coreColor = useMemo(() => new Color(PALETTE.lightCore), []);

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

      {/* Wide, soft halo — the bulk of the perceived glow. */}
      <sprite scale={[LIGHT.glowSize, LIGHT.glowSize, 1]}>
        <spriteMaterial
          map={glowTexture}
          color={glowColor}
          blending={AdditiveBlending}
          transparent
          // Additive glows must never write depth, or they'd punch a hole in
          // everything drawn behind them.
          depthWrite={false}
          toneMapped={false}
          opacity={0.55}
        />
      </sprite>

      {/* Tight, hot inner glow. Stacking two gradients gives a bright core
          with a wide falloff — the shape real bloom produces. */}
      <sprite scale={[LIGHT.glowSize * 0.35, LIGHT.glowSize * 0.35, 1]}>
        <spriteMaterial
          map={glowTexture}
          color={coreColor}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          toneMapped={false}
          opacity={0.9}
        />
      </sprite>
    </group>
  );
}
