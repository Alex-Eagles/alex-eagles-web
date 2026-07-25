/**
 * VehicleShadows — the pool of shade under each parked aircraft.
 *
 * ─── WHY THESE AREN'T THE INSTANCED BLOB SHADOWS ────────────────────────────
 * Every other shadow in this scene is an instance of one circle, sharing one
 * material and one texture, which is why ten stops of poles cost a single draw
 * call. That trick only works while every shadow is the SAME SHAPE.
 *
 * A stretched ellipse is honest under a flag pole — the pole really is a round
 * post. Under a fixed-wing aircraft it isn't: you get a smooth oval sitting
 * beneath a thing with a four-metre wingspan and a tail, and the eye reads the
 * two as unrelated. The shadow stops being evidence that the aircraft is on the
 * ground, which was the entire reason for drawing it.
 *
 * So each aircraft gets its own shadow, masked by ITS OWN SILHOUETTE — the
 * alpha channel of the render, squashed as though seen from above and blurred
 * into a soft pool. Wings read as wings.
 *
 * ─── WHAT THAT COSTS, AND WHY IT'S ACCEPTABLE ───────────────────────────────
 * A different texture per shadow means a different material, which means one
 * draw call each. There are two aircraft in the entire journey, so this is +2
 * draw calls on a scene that runs in single digits — and the masks are 0.5KB
 * and 0.8KB, smaller than the rounding error on a photo.
 *
 * ─── LOADING ────────────────────────────────────────────────────────────────
 * Textures are loaded imperatively rather than through drei's `useTexture`,
 * which suspends. Suspending here would unmount the whole canvas subtree on a
 * theme flip or a quality downgrade. Instead each shadow simply doesn't render
 * until its mask has arrived, then asks for one frame.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DoubleSide,
  type Mesh,
  type MeshBasicMaterial,
  NoColorSpace,
  type Texture,
  TextureLoader,
} from "three";
import { SHADOW, type QualitySettings } from "./sceneConfig";
import type { StopPlacement } from "./StopProps";
import { stopIntensity } from "./journeyCurve";

interface VehicleShadowsProps {
  stops: StopPlacement[];
  quality: QualitySettings;
  uRef: React.MutableRefObject<number>;
  pathLength: number;
  /** Active theme — each aircraft resolves its own shadow strength from it. */
  isDark: boolean;
}

/**
 * How dark THIS aircraft's shadow is.
 *
 * An aircraft may carry its own value, because one number can't suit every
 * silhouette: a mask that is mostly thin wing needs a heavier pool to register
 * at all, while a dense one looks like an oil spill at the same setting. Any
 * aircraft that doesn't care simply follows the scene-wide SHADOW values.
 */
function resolveOpacity(
  vehicle: StopPlacement["vehicles"][number],
  isDark: boolean,
): number {
  if (isDark) return vehicle.shadowOpacityDark ?? SHADOW.vehicleDarkOpacity;
  return vehicle.shadowOpacityLight ?? SHADOW.vehicleLightOpacity;
}

export default function VehicleShadows({
  stops,
  quality,
  uRef,
  pathLength,
  isDark,
}: VehicleShadowsProps) {
  // Flatten to a plain list — the stop index is only needed to look the fade up.
  const shadows = useMemo(
    () =>
      stops.flatMap((stop, stopIndex) =>
        stop.vehicles.map((vehicle) => ({ stop, stopIndex, vehicle })),
      ),
    [stops],
  );

  // The cheapest tier drops blob shadows entirely; stay consistent with it.
  if (!quality.blobShadows || shadows.length === 0) return null;

  return (
    <group>
      {shadows.map(({ stop, stopIndex, vehicle }) => (
        <VehicleShadow
          key={`${stopIndex}-${vehicle.shadowMask}`}
          vehicle={vehicle}
          stopU={stop.u}
          uRef={uRef}
          pathLength={pathLength}
          shadowOpacity={resolveOpacity(vehicle, isDark)}
        />
      ))}
    </group>
  );
}

interface VehicleShadowProps {
  vehicle: StopPlacement["vehicles"][number];
  stopU: number;
  uRef: React.MutableRefObject<number>;
  pathLength: number;
  shadowOpacity: number;
}

function VehicleShadow({
  vehicle,
  stopU,
  uRef,
  pathLength,
  shadowOpacity,
}: VehicleShadowProps) {
  const invalidate = useThree((state) => state.invalidate);
  const meshRef = useRef<Mesh>(null);
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: Texture | null = null;

    new TextureLoader().load(vehicle.shadowMask, (tex) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      // This is a MASK, not a picture: its values are coverage, not colour, so
      // it must not be gamma-decoded on upload or the falloff shifts.
      tex.colorSpace = NoColorSpace;
      loaded = tex;
      setTexture(tex);
      // The loop is idle by the time this resolves — ask for the frame that
      // actually draws it.
      invalidate();
    });

    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [vehicle.shadowMask, invalidate]);

  /**
   * Plane size in world units.
   *
   * Width comes from the aircraft's `shadowRadius`; depth follows the MASK's
   * own aspect, which already carries the from-above squash baked in at export.
   * Deriving depth from the image rather than a constant means a differently
   * proportioned aircraft gets a correctly proportioned shadow for free.
   */
  const size = useMemo<[number, number]>(() => {
    const width = vehicle.shadowRadius * 2;
    const image = texture?.image as { width: number; height: number } | undefined;
    const aspect = image && image.width ? image.height / image.width : 0.4;
    return [width, width * aspect];
  }, [texture, vehicle.shadowRadius]);

  // Opacity is written straight to the material each frame, never through
  // React — this runs at frame rate and a setState here would re-render the
  // subtree sixty times a second.
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const intensity = stopIntensity((uRef.current - stopU) * pathLength);
    const material = mesh.material as MeshBasicMaterial;
    material.opacity = shadowOpacity * intensity;
    mesh.visible = intensity > 0.01;
  });

  if (!texture) return null;

  return (
    <mesh
      ref={meshRef}
      // Flat on the floor, spun to point the way the aircraft does. Sits a hair
      // above the ground plane so it wins the depth test against it without
      // z-fighting.
      position={[vehicle.position.x, 0.025, vehicle.position.z]}
      rotation={[-Math.PI / 2, 0, vehicle.facing]}
      frustumCulled={false}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial
        color="#000000"
        transparent
        alphaMap={texture}
        opacity={0}
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
