import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';
import {
  m,
  LazyMotion,
  domAnimation,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, LayoutGrid, Film } from 'lucide-react';
import { galleryData } from '@/data/gallery';

type GalleryItem = (typeof galleryData)[number];
type ViewMode = 'grid' | 'reel';

const CATEGORIES = ['All', 'SUAS', 'UAVC','Test Flight', 'Manufacturing', 'Team'] as const;
type Category = (typeof CATEGORIES)[number];

// Ask Cloudinary for an appropriately-sized image instead of shipping full-res
// originals to small thumbnail cards.
/**
 * Widths at or below this get the pre-built grid-sized copy; anything larger
 * (the lightbox) gets the original. Kept just above the 640px the tiles are
 * generated at, so `sizedImage(url, 600)` lands on the small file.
 */
const TILE_MAX_WIDTH = 800;

function sizedImage(url: string | undefined, width: number): string | undefined {
  if (!url) return url;

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},c_limit,dpr_auto/`);
  }

  /*
   * Local photos, which is what every entry in src/data/gallery.ts actually is.
   * The Cloudinary branch above never matched them, so this helper used to hand
   * the grid the full-size original — camera files up to 5712px wide — and
   * that, more than anything else, is why the page was slow to fill in.
   *
   * There's no on-the-fly resize for a static file, so the small copy is built
   * ahead of time by scripts/build-gallery-tiles.mjs into a `tiles/` subfolder
   * under the same name. Swap the directory in and keep the filename.
   */
  if (width <= TILE_MAX_WIDTH) {
    const local = /^(.*\/)?([^/]+)\.(?:jpe?g|png|webp)$/i.exec(url);
    if (local && !url.includes('//')) {
      return `${local[1] ?? ''}tiles/${local[2]}.webp`;
    }
  }

  return url;
}

/*
 * Same idea for the clips. Cloudinary serves a video at its source resolution
 * unless a transform says otherwise, and these URLs only carry `q_auto,f_auto`
 * — so a full-size clip was being downloaded into a grid tile a few hundred
 * pixels wide. Chaining a width cap in front of the existing transform is the
 * single biggest win on this page.
 *
 * Tiles only; the lightbox keeps the untouched URL so opening one still plays
 * at full quality.
 */
function sizedVideo(url: string | undefined, width: number): string | undefined {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},c_limit/`);
}

/*
 * A still pulled from the clip itself, for the entries that are video-only.
 *
 * Several items in src/data/gallery.ts carry a videoUrl and no imageUrl, so
 * they had no poster and no fallback image — nothing at all to show until the
 * video painted its first frame. On a tile with a near-black backdrop that read
 * as a black square, and on mobile, where the clip wasn't loading, it stayed
 * that way. Cloudinary can hand back a frame from the video (`so_0`, asked for
 * as .jpg), so the poster costs no new asset and no upload.
 */
function videoPoster(url: string | undefined, width: number): string | undefined {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) {
    return undefined;
  }
  return url
    .replace('/video/upload/', `/video/upload/so_0,w_${width},c_limit,q_auto/`)
    .replace(/\.(mp4|webm|mov)$/i, '.jpg');
}

function getCSSVar(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function ParticleGrid({ mouseX, mouseY }: { mouseX: MotionValue<number>; mouseY: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const unsubX = mouseX.on('change', (v) => { mouseRef.current.x = v; });
    const unsubY = mouseY.on('change', (v) => { mouseRef.current.y = v; });
    return () => { unsubX(); unsubY(); };
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const spacing = 40;
    const influenceRadius = 180;
    const maxDisplacement = 18;
    const baseSize = 1.2;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const dotColor = getCSSVar('--border-subtle') || 'rgba(60,64,181,0.18)';
      const glowColor = getCSSVar('--brand-light') || '#5458cc';

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ox = col * spacing;
          const oy = row * spacing;

          const dx = ox - mx;
          const dy = oy - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let px = ox;
          let py = oy;
          let size = baseSize;
          let alpha = 0.5;

          if (dist < influenceRadius && dist > 0) {
            const force = (1 - dist / influenceRadius);
            const forceSq = force * force;
            px += (dx / dist) * maxDisplacement * forceSq;
            py += (dy / dist) * maxDisplacement * forceSq;
            size = baseSize + 1.4 * forceSq;
            alpha = 0.5 + 0.5 * forceSq;
          }

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);

          if (dist < influenceRadius && dist > 0) {
            const force = (1 - dist / influenceRadius);
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = alpha * force;
          } else {
            ctx.fillStyle = dotColor;
            ctx.globalAlpha = 0.35;
          }

          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}

function TargetCursor({ x, y, locked, label }: { x: MotionValue<number>; y: MotionValue<number>; locked: boolean; label: string | null; }) {
  const corner = (position: string) => `absolute h-3 w-3 transition-colors duration-300 ${position} ${locked ? 'border-white' : 'border-white/50'}`;
  return (
    <m.div 
      className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-difference text-white" 
      style={{ x, y, willChange: 'transform' }}
    >
      <m.div
        className="relative -translate-x-1/2 -translate-y-1/2"
        animate={{ width: locked ? 46 : 22, height: locked ? 46 : 22, rotate: locked ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <span className={corner('left-0 top-0 border-l-2 border-t-2')} />
        <span className={corner('right-0 top-0 border-r-2 border-t-2')} />
        <span className={corner('left-0 bottom-0 border-l-2 border-b-2')} />
        <span className={corner('right-0 bottom-0 border-r-2 border-b-2')} />
        <span className={`absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${locked ? 'bg-white' : 'bg-white/60'}`} />
      </m.div>
      <m.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
        animate={{ width: locked ? 72 : 0, height: locked ? 72 : 0, opacity: locked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      />
      <AnimatePresence>
        {locked && label && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-full mt-5 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          >
            {label}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

function GlareOverlay({ mouseX, mouseY }: { mouseX: MotionValue<number>; mouseY: MotionValue<number> }) {
  const background = useTransform([mouseX, mouseY], ([x, y]: number[]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`);
  return <m.div className="pointer-events-none absolute inset-0 z-10 rounded-2xl" style={{ background }} />;
}

function CardChrome({ item }: { item: GalleryItem }) {
  return (
    <>
      <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-[var(--brand-glow)] opacity-0 transition-opacity duration-300 group-hover/card:opacity-90 z-20" />
      <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-[var(--brand-glow)] opacity-0 transition-opacity duration-300 group-hover/card:opacity-90 z-20" />
      {item.videoUrl && (
        <span className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-white/70 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
          <Play size={8} fill="currentColor" /> Video
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
        <h3 className="text-white font-display font-extrabold text-xl leading-none m-0 drop-shadow-md">{item.title}</h3>
      </div>
    </>
  );
}

/*
 * Media paints the moment it's usable, with no fade — on every viewport.
 *
 * There used to be two independent opacity transitions in here: the still faded
 * up over 0.5s on load, then the clip faded up over it on its own 1s timing.
 * Two fades over the same tile, at different speeds, is the blink — the tile
 * arrives, dips, and arrives again. Nothing is gained by them: the browser only
 * paints an image once it has decoded it either way, and the clip's poster is
 * the same frame as the still, so swapping between them is invisible without a
 * fade and obvious with one.
 */
function SmartMedia({
  item,
  priority,
  onRatio,
  fill = false,
}: {
  item: GalleryItem;
  priority: boolean;
  /**
   * Reports the media's true width/height ratio once known, so a parent can
   * shape its own box to match. The reel uses this; the grid, whose rows are a
   * fixed height, ignores it.
   */
  onRatio?: (ratio: number) => void;
  /**
   * Skip the letterboxing below. Set by a parent that has already sized itself
   * to the media, where `contain` would have nothing to letterbox anyway and
   * `cover` avoids a hairline gap from rounding.
   */
  fill?: boolean;
}) {
  const [videoReady, setVideoReady] = useState(false);

  /* Landscape media in a portrait box is letterboxed rather than cropped in
     half. Only consulted when the parent hasn't sized itself to the media. */
  const [isLandscapeImg, setIsLandscapeImg] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldPreload = useInView(containerRef, { once: true, margin: "800px" });
  const isInViewport = useInView(containerRef, { margin: "100px" });
  const videoRef = useRef<HTMLVideoElement>(null);
  /* One retry only — see the video's onError below. */
  const retriedRef = useRef(false);

  /*
   * Start playback as soon as the tile is near the viewport — not once the clip
   * has reported itself ready.
   *
   * Gating this on `videoReady` deadlocked on phones. `videoReady` is set from
   * `canplay`, `canplay` can't fire until the browser actually fetches the
   * clip, and mobile browsers routinely ignore `preload` until something asks
   * for playback. So: nothing loaded, `canplay` never fired, play() was never
   * called, nothing loaded. The tile sat on its poster forever, and the clip
   * only ever appeared in the lightbox — whose <video> carries `controls` and
   * `autoPlay` and so loads on its own.
   *
   * Calling play() is what kicks the fetch off; the browser starts playing once
   * it has enough buffered, and a rejected promise (autoplay refused, no data
   * yet) just leaves the poster up, which is the same thing it showed before.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!isInViewport) {
      el.pause();
      return;
    }
    const playing = el.play();
    if (playing && playing.catch) playing.catch(() => {});
    // shouldPreload is a dependency because it is what mounts the <video>:
    // without it this runs before there's an element to play.
  }, [isInViewport, shouldPreload]);

  /* A clip with no still of its own falls back to a frame from itself. */
  const poster = sizedImage(item.imageUrl, 600) ?? videoPoster(item.videoUrl, 640);

  return (
    <div ref={containerRef} className="relative w-full h-full pointer-events-none">
      {/* Video-only entries have no imageUrl, and an <img> with no src is an
          empty box that can surface its alt text — the clip's own poster covers
          those instead. */}
      {item.imageUrl && (
      <img
        src={sizedImage(item.imageUrl, 600)}
        alt={item.title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget;
          if (!naturalWidth || !naturalHeight) return;
          if (naturalWidth / naturalHeight > 1.35) {
            setIsLandscapeImg(true);
          }
          onRatio?.(naturalWidth / naturalHeight);
        }}
        /* No opacity gate and no transition: an image that hasn't decoded yet
           paints nothing regardless, so fading it in only delays it. It also
           stays put once the clip is up — it's covered by an opaque video, not
           faded out under one, which is what used to let the tile dip. */
        className={`absolute inset-0 w-full h-full ${!fill && isLandscapeImg ? 'object-contain' : 'object-cover'}`}
      />
      )}

      {item.videoUrl && (shouldPreload || priority) && (
        <video
          ref={videoRef}
          src={`${sizedVideo(item.videoUrl, 640)}#t=0.001`}
          poster={poster}
          muted
          loop
          playsInline
          /* "auto" for anything mounted at all, not just the first tile. The
             element is only mounted once it's within 800px of the viewport
             (shouldPreload), so this buffers the next card or two ahead rather
             than starting the fetch as you arrive — which is what made the reel
             feel slow, since swiping brings the next card into view instantly. */
          preload="auto"
          /*
           * Cloudinary builds a derived clip lazily: the first request for a
           * transformation it hasn't made yet answers 423 while it renders in
           * the background, and a <video> treats that as fatal and never tries
           * again — one dead tile, permanently. scripts/warm-gallery-derived.mjs
           * is what normally stops that happening, by making the first request
           * from a terminal instead; this is the safety net for a clip added
           * without running it.
           */
          onError={() => {
            const el = videoRef.current;
            if (!el || retriedRef.current) return;
            retriedRef.current = true;
            window.setTimeout(() => {
              el.load();
              const playing = el.play();
              if (playing && playing.catch) playing.catch(() => {});
            }, 2500);
          }}
          /*
           * `canplay`, not `canplaythrough`. canplaythrough waits until the
           * browser thinks the WHOLE clip can play start to finish without
           * stalling — in practice, until it is very nearly all downloaded. The
           * tile stayed on its poster at opacity 0 for that entire time, which
           * is what read as the gallery being slow: the video was usually
           * playable seconds before it was allowed to be seen. canplay fires
           * when there's enough buffered to start, and the clip is muted, short
           * and looping, so it keeps up from there.
           */
          onCanPlay={() => setVideoReady(true)}
          /* Video-only entries have no still to measure, so the clip's own
             dimensions are the only way the parent can learn its shape. */
          onLoadedMetadata={(e) => {
            const { videoWidth, videoHeight } = e.currentTarget;
            if (videoWidth && videoHeight) onRatio?.(videoWidth / videoHeight);
          }}
          /* Revealed the instant it can play, with no transition. The clip's
             poster is the same frame as the still underneath it, so there is
             nothing to crossfade between — a fade here only announced a swap
             that would otherwise be invisible.
             Readiness only, deliberately not `isInViewport`: tying visibility
             to that made the clip vanish and come back every time a card
             crossed the observer's edge, which in a horizontal reel is once per
             swipe. It's paused off-screen by the effect above instead, and a
             paused video keeps painting its current frame. */
          className={`absolute inset-0 w-full h-full object-cover ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}

type HoverFn = (id: GalleryItem['id'] | null, label: string | null) => void;

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
};

const scanlineVariants = {
  hidden: { top: '-10%', opacity: 0 },
  visible: { top: ['-10%', '110%'], opacity: [0, 1, 1, 0] },
};

function SpatialGridCard({
  item, index, tall, isDimmed, reduceMotion, isMobile, onOpen, onHover, priority
}: {
  item: GalleryItem; index: number; tall: boolean; isDimmed: boolean; reduceMotion: boolean; isMobile: boolean; onOpen: () => void; onHover: HoverFn; priority: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(0.5);
  const glareY = useMotionValue(0.5);

  const springConfig = { stiffness: 220, damping: 22 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const zDepth = useMemo(() => {
    const depths = [0, 5, -5, 10, -10, 3, -3, 8, -8, 2];
    return depths[index % depths.length];
  }, [index]);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reduceMotion || isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 14);
    rotateX.set(py * -14);
    glareX.set((e.clientX - rect.left) / rect.width);
    glareY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => onHover(item.id, 'VIEW');
  const handleMouseLeave = () => {
    rotateX.set(0); rotateY.set(0); glareX.set(0.5); glareY.set(0.5); onHover(null, null);
  };

  const still = reduceMotion || isMobile;
  const canAnimate = !still;

  return (
    <m.div
      layoutId={`card-container-${item.id}`}
      /* No entry animation on a phone. Tiles staggered in over 0.8s with up to
         0.6s of delay, which on a short scroll meant a tile was still fading up
         while its own media was arriving underneath — two overlapping reveals
         on the same card. */
      initial={still ? false : { opacity: 0, y: 40, scale: 0.88, rotateX: 8 }}
      whileInView={still ? undefined : { opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.07, 0.6) }}
      className={`group/card relative h-full w-full ${still ? '' : 'transition-[opacity,filter] duration-500'} ${tall ? 'row-span-2' : ''} ${isDimmed ? 'opacity-40 saturate-50 blur-[0.5px]' : ''}`}
      style={{ perspective: 800 }}
    >
      <m.div
        ref={ref}
        style={canAnimate ? { rotateX: springRotateX, rotateY: springRotateY, transformStyle: 'preserve-3d' as const, z: zDepth } : undefined}
        whileHover={canAnimate ? { scale: 1.03, z: zDepth + 15 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onOpen}
        className="relative h-full w-full overflow-hidden rounded-2xl bg-black/10 shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)] transition-shadow duration-500 cursor-pointer"
      >
        {canAnimate && (
          <m.div
            variants={scanlineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1.2, ease: 'linear', delay: Math.min(index * 0.07, 0.6) + 0.2 }}
            className="pointer-events-none absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[var(--brand-light)]/30 to-transparent z-10"
          />
        )}
        {canAnimate && <GlareOverlay mouseX={glareX} mouseY={glareY} />}
        
        <SmartMedia item={item} priority={priority} />
        
        <CardChrome item={item} />
      </m.div>
    </m.div>
  );
}

function OrbitalReelCard({
  item, index, isDimmed, reduceMotion, isMobile, containerRef, onOpen, onHover, isDragging, priority
}: {
  item: GalleryItem; index: number; isDimmed: boolean; reduceMotion: boolean; isMobile: boolean; containerRef: RefObject<HTMLDivElement | null>; onOpen: () => void; onHover: HoverFn; isDragging: boolean; priority: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ target: ref, container: containerRef, axis: 'x', offset: ['start end', 'center center', 'end start'] });

  /*
   * `isMobile` was already being passed in and typed here, but never
   * destructured — so none of it applied and the reel ran its full desktop
   * treatment on phones. That's the worst of the blinking: every card's opacity
   * is driven by its position in the scroller (0.3 at the edges, 1 in the
   * middle), so swiping faded each card out and back in, on top of a one-off
   * entry animation and a scanline sweep. On a touch scroller that reads as the
   * media appearing, blinking, and appearing again.
   */
  const still = reduceMotion || isMobile;
  const canAnimate = !still;

  /*
   * The card takes its shape from whatever it holds.
   *
   * It used to be a hard `aspect-[4/5]` portrait frame for everything, and the
   * collection is an even split — 13 landscape, 13 portrait, plus 15 video-only
   * entries. So half of it was a landscape photo letterboxed into a portrait
   * box: black bars top and bottom, and the picture itself shrunk to a band in
   * the middle. Matching the box to the media shows each one at its own
   * proportions and leaves nothing to letterbox.
   *
   * Clamped because the source material runs to extremes (a 0.54 phone portrait,
   * a 1.89 crop) and an unclamped strip would lurch between a sliver and a
   * billboard. Null until the media reports back, so the default is the portrait
   * shape the reel had before.
   */
  const [ratio, setRatio] = useState<number | null>(null);
  const aspectRatio = ratio ? Math.min(Math.max(ratio, 0.7), 1.5) : 4 / 5;

  const scale = useTransform(scrollXProgress, [0, 0.5, 1], [0.75, 1, 0.75]);
  const rotY = useTransform(scrollXProgress, [0, 0.5, 1], canAnimate ? [35, 0, -35] : [0, 0, 0]);
  const opacity = useTransform(scrollXProgress, [0, 0.5, 1], [0.3, 1, 0.3]);
  const zTrans = useTransform(scrollXProgress, [0, 0.5, 1], canAnimate ? [-100, 0, -100] : [0, 0, 0]);

  return (
    <m.div
      layoutId={`card-container-${item.id}`}
      initial={still ? false : { opacity: 0, x: 60 }}
      whileInView={still ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      className={`group/card flex-shrink-0 snap-center ${still ? '' : 'transition-[opacity] duration-500'} ${isDimmed ? 'opacity-40' : ''}`}
      style={{ perspective: 1000, width: isMobile ? '72vw' : '420px' }}
    >
      <m.div
        ref={ref}
        /* No scroll-driven transform at all when still — the previous fallback
           still applied `scale` and `opacity`, which is the fade-per-swipe. */
        style={
          canAnimate
            ? { aspectRatio, scale, rotateY: rotY, opacity, z: zTrans, transformStyle: 'preserve-3d' as const }
            : { aspectRatio }
        }
        onClick={() => {
          if (isDragging) return;
          const card = ref.current;
          const container = containerRef.current;
          if (card && container) {
            const cardRect = card.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const containerCenter = containerRect.left + containerRect.width / 2;
            
            const isCentered = Math.abs(cardCenter - containerCenter) < (cardRect.width / 3);

            if (isCentered) {
              onOpen();
            } else {
              const offsetToScroll = cardCenter - containerCenter;
              container.scrollBy({ left: offsetToScroll, behavior: 'smooth' });
            }
          }
        }}
        onMouseEnter={() => onHover(item.id, 'VIEW')}
        onMouseLeave={() => onHover(null, null)}
        /* No aspect-[4/5] here — the shape comes from `aspectRatio` in the
           style above, which follows the media. */
        className="relative w-full overflow-hidden rounded-2xl bg-black/10 select-none shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)] transition-shadow duration-500 cursor-pointer"
        onDragStart={(e) => e.preventDefault()}
      >
        {canAnimate && (
          <m.div
            variants={scanlineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1.2, ease: 'linear', delay: index * 0.06 + 0.2 }}
            className="pointer-events-none absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[var(--brand-light)]/30 to-transparent z-10"
          />
        )}
        
        <SmartMedia item={item} priority={priority} onRatio={setRatio} fill />

        <CardChrome item={item} />
      </m.div>
    </m.div>
  );
}

function TelemetryCounter({ target, reduceMotion }: { target: number; reduceMotion: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduceMotion || target === 0) {
      setCount(target);
      return;
    }
    let frame = 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduceMotion]);

  return <>{String(count).padStart(2, '0')}</>;
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [openedItemId, setOpenedItemId] = useState<GalleryItem['id'] | null>(null);
  const [direction, setDirection] = useState(0);

  const [hoveredCardId, setHoveredCardId] = useState<GalleryItem['id'] | null>(null);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [pointerInField, setPointerInField] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const prefersReducedMotion = !!useReducedMotion();

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const globalMouseX = useMotionValue(0);
  const globalMouseY = useMotionValue(0);

  const reelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parallaxX = useSpring(useTransform(globalMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [6, -6]), { stiffness: 50, damping: 30 });
  const parallaxY = useSpring(useTransform(globalMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [4, -4]), { stiffness: 50, damping: 30 });

  const [isDragging, setIsDragging] = useState(false);
  const dragThreshold = 5;
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isDraggingRef = useRef(false);

  /*
   * Click-and-drag scrolling is a mouse affordance, and touch already has one
   * that's better. Phones synthesise mouse events after a touch sequence, so
   * without this guard the emulation could start on a swipe, and its first act
   * is `scrollSnapType = 'none'` — which only gets restored by mouseup/mouseleave,
   * events touch doesn't reliably deliver. Snapping then stays off for good.
   */
  const handleMouseDown = (e: ReactMouseEvent) => {
    if (!reelRef.current || !isFinePointer) return;
    startX.current = e.pageX;
    scrollLeft.current = reelRef.current.scrollLeft;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleReelMouseMove = (e: ReactMouseEvent) => {
    if (!reelRef.current || !isFinePointer || startX.current === 0) return;
    const dx = Math.abs(e.pageX - startX.current);

    if (!isDraggingRef.current && dx > dragThreshold) {
      isDraggingRef.current = true;
      setIsDragging(true);
      reelRef.current.style.scrollSnapType = 'none';
    }

    if (isDraggingRef.current) {
      e.preventDefault();
      const walk = (e.pageX - startX.current) * 2;
      reelRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleMouseLeaveOrUp = () => {
    if (!reelRef.current) return;
    startX.current = 0;
    if (isDraggingRef.current) {
      setTimeout(() => {
        setIsDragging(false);
        isDraggingRef.current = false;
      }, 100);
    }
    reelRef.current.style.scrollSnapType = 'x mandatory';
  };

  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const updateActiveReelIndex = useCallback(() => {
    if (!reelRef.current) return;
    const container = reelRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    const cards = container.querySelectorAll('.group\\/card');
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const diff = Math.abs(containerCenter - cardCenter);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });
    
    setActiveReelIndex(closestIndex);
  }, []);

  useEffect(() => {
    const reel = reelRef.current;
    if (!reel || viewMode !== 'reel') return;
    reel.addEventListener('scroll', updateActiveReelIndex, { passive: true });
    updateActiveReelIndex(); 
    return () => reel.removeEventListener('scroll', updateActiveReelIndex);
  }, [viewMode, updateActiveReelIndex]);

  useEffect(() => {
    const shuffled = [...galleryData].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setIsFinePointer(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isFinePointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      globalMouseX.set(e.clientX);
      globalMouseY.set(e.clientY);
      setPointerInField(true);
    };

    const handleMouseLeave = () => {
      setPointerInField(false);
      setHoveredCardId(null);
      setCursorLabel(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isFinePointer, cursorX, cursorY, globalMouseX, globalMouseY]);

  const isMobile = !isFinePointer;
  const cursorActive = isFinePointer && !prefersReducedMotion && pointerInField && selectedImageIndex === null;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter(item => {
      const itemCategory = (item as any).category || 'Team';
      return itemCategory === activeCategory;
    });
  }, [items, activeCategory]);

  const activeItem = selectedImageIndex !== null && filteredItems.length > 0 ? filteredItems[selectedImageIndex] : null;

  const handleUserActivity = useCallback(() => {
    if (!overlayRef.current) return;
    overlayRef.current.style.opacity = '1';
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const video = document.getElementById('lightbox-video') as HTMLVideoElement | null;
    if (video && !video.paused) {
      timeoutRef.current = setTimeout(() => {
        if (overlayRef.current) overlayRef.current.style.opacity = '0';
      }, 2500);
    }
  }, []);

  useEffect(() => {
    if (selectedImageIndex === null && timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [selectedImageIndex]);

  const openAt = (index: number, id: GalleryItem['id']) => {
    setOpenedItemId(id);
    setDirection(0);
    setSelectedImageIndex(index);
  };

  const handleHover: HoverFn = (id, label) => {
    setHoveredCardId(id);
    setCursorLabel(label);
  };

  const goNext = useCallback(() => {
    setDirection(1);
    setSelectedImageIndex((prev) => (prev! + 1) % filteredItems.length);
  }, [filteredItems.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setSelectedImageIndex((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length);
  }, [filteredItems.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') setSelectedImageIndex(null);
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    },
    [selectedImageIndex, goNext, goPrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const viewModes: { key: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'grid', label: 'Grid', icon: LayoutGrid },
    { key: 'reel', label: 'Reel', icon: Film },
  ];

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-[var(--bg-primary)] transition-colors duration-[400ms] ease-out pt-24 pb-12 px-6 overflow-hidden">
        
        {cursorActive && (
          <style>{`
            * {
              cursor: none !important;
            }
          `}</style>
        )}

        {!prefersReducedMotion && !isMobile && <ParticleGrid mouseX={globalMouseX} mouseY={globalMouseY} />}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[30%] -left-[15%] h-[70vmax] w-[70vmax] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, var(--brand-light) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-[20%] -right-[10%] h-[50vmax] w-[50vmax] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, var(--brand) 0%, transparent 70%)' }} />
        </div>

        <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 text-center max-w-[560px] mx-auto mb-10 mt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <m.span animate={{ opacity: [1, 0.1, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted">Flight Archive</span>
          </div>
          <m.h1 initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }} className="font-display font-extrabold text-[4rem] sm:text-[5.5rem] md:text-[7rem] text-fg leading-[0.9] tracking-[-0.02em] m-0 mb-6">
            Gallery
          </m.h1>
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="font-sans text-body-lg text-fg-muted leading-[1.7] mx-auto mb-6 prose-measure">
            A visual record of our engineering journey and team spirit.
          </m.p>
        </m.div>

        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="relative z-10 max-w-[1600px] mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-[var(--border-subtle)] pb-4 px-2">
          
          <div className="w-full sm:w-1/4 flex justify-center sm:justify-start order-2 sm:order-1 shrink-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
              <TelemetryCounter target={filteredItems.length} reduceMotion={prefersReducedMotion} /> {filteredItems.length === 1 ? 'frame' : 'frames'} captured
            </p>
          </div>

          <div 
            className="w-full sm:w-auto flex justify-start sm:justify-center overflow-x-auto [&::-webkit-scrollbar]:hidden order-1 sm:order-2" 
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="relative flex items-center gap-1 rounded-full border border-[var(--border-subtle)] p-1 bg-[var(--bg-primary)] transition-colors duration-[400ms] ease-out w-max sm:mx-auto">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => { setActiveCategory(cat); setSelectedImageIndex(null); }} 
                  onMouseEnter={() => setCursorLabel(`Filter: ${cat}`)} 
                  onMouseLeave={() => setCursorLabel(null)} 
                  className={`relative flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.1em] transition-colors duration-300 whitespace-nowrap ${activeCategory === cat ? 'text-fg' : 'text-fg-muted hover:text-fg'}`}
                >
                  {activeCategory === cat && <m.span layoutId="categoryPill" transition={{ type: 'spring', stiffness: 340, damping: 30 }} className="absolute inset-0 rounded-full bg-[var(--brand-glow)] border border-[var(--border-subtle)]" />}
                  <span className="relative z-10">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-1/4 flex justify-center sm:justify-end order-3 shrink-0">
            <div className="relative flex items-center gap-1 rounded-full border border-[var(--border-subtle)] p-1 bg-[var(--bg-primary)] transition-colors duration-[400ms] ease-out">
              {viewModes.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setViewMode(key)} onMouseEnter={() => setCursorLabel(label)} onMouseLeave={() => setCursorLabel(null)} aria-label={`${label} view`} className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-300 ${viewMode === key ? 'text-fg' : 'text-fg-muted hover:text-fg'}`}>
                  {viewMode === key && <m.span layoutId="viewModePill" transition={{ type: 'spring', stiffness: 340, damping: 30 }} className="absolute inset-0 rounded-full bg-[var(--brand-glow)] border border-[var(--border-subtle)]" />}
                  <Icon size={14} className="relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

        </m.div>

        <AnimatePresence mode="wait">
          <m.div key={`${viewMode}-${activeCategory}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="relative z-10">
            
            {filteredItems.length === 0 && (
              <div className="flex justify-center items-center py-20">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">No visual records found in this category.</p>
              </div>
            )}

            {viewMode === 'grid' && filteredItems.length > 0 && (
              <m.div className="max-w-[1600px] mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={!isMobile && !prefersReducedMotion ? { x: parallaxX, y: parallaxY, gridAutoRows: 300 } : { gridAutoRows: 300 }}>
                <AnimatePresence>
                  {filteredItems.map((item, i) => (
                    <SpatialGridCard key={item.id} item={item} index={i} tall={i % 5 === 2} isDimmed={hoveredCardId !== null && hoveredCardId !== item.id} reduceMotion={prefersReducedMotion} isMobile={isMobile} priority={i === 0} onOpen={() => openAt(i, item.id)} onHover={handleHover} />
                  ))}
                </AnimatePresence>
              </m.div>
            )}

            {viewMode === 'reel' && filteredItems.length > 0 && (
              /*
               * Was `w-full max-w-[100vw] -mx-6 px-6` — an attempt at the
               * full-bleed trick, and the reason the reel sat off-centre.
               *
               * That trick only works on a box whose width is `auto`, where
               * negative margins genuinely widen it. `w-full` pins the width to
               * the parent, so `-mx-6` couldn't widen anything and just shifted
               * the whole box 24px left; `px-6` then pulled the content in
               * another 24px on each side. Net effect: a track starting at the
               * parent's left edge but ending 48px short of its right one.
               * Asymmetric, so the centred card was 24px left of true centre and
               * the next card was clipped early with dead space beside it.
               *
               * The bleed wasn't buying anything, so it's gone. The track is now
               * the parent's content box — symmetric by construction — which is
               * what the `calc(50% - 36vw)` side padding below assumes.
               */
              <div className="relative">
                <button onClick={() => reelRef.current?.scrollBy({ left: -500, behavior: 'smooth' })} className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur transition-colors hover:bg-black/80 sm:flex" aria-label="Scroll reel left">
                  <ChevronLeft size={24} />
                </button>
                
                <div 
                  ref={reelRef} 
                  onScroll={updateActiveReelIndex}
                  onMouseDown={handleMouseDown} 
                  onMouseLeave={handleMouseLeaveOrUp} 
                  onMouseUp={handleMouseLeaveOrUp} 
                  onMouseMove={handleReelMouseMove} 
                  /*
                   * items-center: cards no longer share one height now that each
                   * takes the shape of its own media, so without this they'd
                   * hang from the top of the tallest one.
                   *
                   * The side padding is what centres a card, and it must be
                   * exactly half the leftover space: (track - card) / 2.
                   *
                   * It used to be `14vw` against a `72vw` card — 14 + 72 + 14 =
                   * 100, which is only correct if the track is the full viewport.
                   * It isn't: the wrapper above is `-mx-6 px-6`, so the track is
                   * about 48px narrower, and 14vw overshot by ~24px. The first
                   * card therefore sat off-centre at scrollLeft 0, and the only
                   * thing hiding it was scroll-snap pulling it back — which the
                   * drag handlers switch off (`scrollSnapType = 'none'`) and
                   * which touch doesn't reliably switch back on. When it stayed
                   * off, the card stayed off-centre.
                   *
                   * `50%` in padding resolves against the containing block's
                   * width — the track — so `calc(50% - <half card>)` is that
                   * exact half-leftover whatever the track turns out to be. The
                   * card is now centred at scrollLeft 0 by construction, with
                   * snapping as polish rather than as the mechanism.
                   */
                 className="relative flex items-center gap-6 sm:gap-8 overflow-x-auto snap-x snap-mandatory py-10 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', perspective: 1200, paddingLeft: isMobile ? 'calc(50% - 36vw)' : 'calc(50% - 210px)', paddingRight: isMobile ? 'calc(50% - 36vw)' : 'calc(50% - 210px)' }}
                >
                  <AnimatePresence>
                    {/* priority={i < 3}: the reel is a horizontal scroller, so
                        the second and third cards are one swipe from being on
                        screen — load them eagerly rather than waiting for them
                        to come within range. */}
                    {filteredItems.map((item, i) => (
                      <OrbitalReelCard key={item.id} item={item} index={i} isDimmed={hoveredCardId !== null && hoveredCardId !== item.id} reduceMotion={prefersReducedMotion} isMobile={isMobile} priority={i < 3} containerRef={reelRef} onOpen={() => openAt(i, item.id)} onHover={handleHover} isDragging={isDragging} />
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex md:hidden justify-center items-center gap-2 mt-4 pb-4">
                  {filteredItems.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const container = reelRef.current;
                        const cards = container?.querySelectorAll('.group\\/card');
                        if (container && cards && cards[i]) {
                          const card = cards[i] as HTMLElement;
                          const scrollPos = card.offsetLeft - (container.clientWidth / 2) + (card.clientWidth / 2);
                          container.scrollTo({ left: scrollPos, behavior: 'smooth' });
                        }
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeReelIndex ? 'w-6 bg-[var(--brand-glow)]' : 'w-1.5 bg-[var(--border-subtle)] hover:bg-white/50'}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                <button onClick={() => reelRef.current?.scrollBy({ left: 500, behavior: 'smooth' })} className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur transition-colors hover:bg-black/80 sm:flex" aria-label="Scroll reel right">
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </m.div>
        </AnimatePresence>

        {cursorActive && <TargetCursor x={cursorX} y={cursorY} locked={!!cursorLabel} label={cursorLabel} />}

        <AnimatePresence>
          {activeItem && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl cursor-auto" onClick={() => setSelectedImageIndex(null)}>
              <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[70] cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }}>
                <X size={32} />
              </button>
              <button className="absolute left-4 sm:left-8 text-white/50 hover:text-white transition-colors z-[70] p-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); goPrev(); }}>
                <ChevronLeft size={48} />
              </button>
              <button className="absolute right-4 sm:right-8 text-white/50 hover:text-white transition-colors z-[70] p-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); goNext(); }}>
                <ChevronRight size={48} />
              </button>
              <m.div layoutId={openedItemId !== null ? `card-container-${openedItemId}` : undefined} className="relative w-full max-w-6xl flex flex-col justify-center rounded-xl overflow-hidden shadow-2xl bg-black cursor-auto" onClick={(e) => { e.stopPropagation(); handleUserActivity(); }} onMouseMove={handleUserActivity}>
                <span className="absolute left-3 top-3 z-20 h-6 w-6 border-l-2 border-t-2 border-white/40 pointer-events-none" />
                <span className="absolute right-3 top-3 z-20 h-6 w-6 border-r-2 border-t-2 border-white/40 pointer-events-none" />
                <span className="absolute left-3 bottom-3 z-20 h-6 w-6 border-l-2 border-b-2 border-white/40 pointer-events-none" />
                <span className="absolute right-3 bottom-3 z-20 h-6 w-6 border-r-2 border-b-2 border-white/40 pointer-events-none" />
                <div className="absolute top-5 left-8 z-20 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 pointer-events-none">
                  {String((selectedImageIndex as number) + 1).padStart(2, '0')} / {String(filteredItems.length).padStart(2, '0')}
                </div>
                <AnimatePresence mode="wait" custom={direction}>
                  <m.div key={activeItem.id} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: 'easeOut' }} drag={activeItem.videoUrl ? false : 'x'} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15} onDragEnd={(_e, info: PanInfo) => { if (info.offset.x < -80) goNext(); else if (info.offset.x > 80) goPrev(); }}>
                    {activeItem.videoUrl ? (
                      <div className="relative flex justify-center w-full max-h-[85vh]">
                        <video id="lightbox-video" src={activeItem.videoUrl} poster={activeItem.imageUrl} controls autoPlay onPlay={handleUserActivity} onPause={handleUserActivity} className="max-w-full max-h-[85vh] w-auto h-auto object-contain bg-black" />
                        <div ref={overlayRef} className="absolute top-0 left-0 right-0 px-8 pt-14 pb-24 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none transition-opacity duration-500 z-10">
                          <h2 className="text-3xl text-white font-display font-extrabold m-0 leading-none drop-shadow-lg">{activeItem.title}</h2>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex justify-center max-h-[85vh]">
                        <img src={sizedImage(activeItem.imageUrl, 1800)} alt={activeItem.title} draggable={false} className="max-w-full max-h-[85vh] w-auto h-auto object-contain" />
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10">
                          <h2 className="text-3xl text-white font-display font-extrabold m-0 leading-none drop-shadow-lg">{activeItem.title}</h2>
                        </div>
                      </div>
                    )}
                  </m.div>
                </AnimatePresence>
              </m.div>
              {filteredItems.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70] flex max-w-[80vw] flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {filteredItems.map((item, i) => (
                    <button key={item.id} onClick={() => { setDirection(i > (selectedImageIndex as number) ? 1 : -1); setSelectedImageIndex(i); }} aria-label={`Go to ${item.title}`} className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === selectedImageIndex ? 'w-6 bg-[var(--brand-glow)]' : 'w-1.5 bg-white/30 hover:bg-white/60'}`} />
                  ))}
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}