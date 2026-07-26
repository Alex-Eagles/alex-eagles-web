import { useState, useEffect, useCallback, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';
import {
  motion,
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

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
};

// Scanline animation
const scanlineVariants = {
  hidden: { top: '-10%', opacity: 0 },
  visible: { top: ['-10%', '110%'], opacity: [0, 1, 1, 0] },
};

/* ---------------------------------------------------------------------- */
/* Targeting cursor - Mix-blend-difference                                */
/* ---------------------------------------------------------------------- */

function TargetCursor({
  x,
  y,
  locked,
  label,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  locked: boolean;
  label: string | null;
}) {
  const corner = (position: string) =>
    `absolute h-3 w-3 transition-colors duration-300 ${position} ${
      locked ? 'border-white' : 'border-white/50'
    }`;

  return (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-difference text-white" style={{ x, y }}>
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2"
        animate={{ width: locked ? 46 : 22, height: locked ? 46 : 22, rotate: locked ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <span className={corner('left-0 top-0 border-l-2 border-t-2')} />
        <span className={corner('right-0 top-0 border-r-2 border-t-2')} />
        <span className={corner('left-0 bottom-0 border-l-2 border-b-2')} />
        <span className={corner('right-0 bottom-0 border-r-2 border-b-2')} />
        <span
          className={`absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${
            locked ? 'bg-white' : 'bg-white/60'
          }`}
        />
      </motion.div>
      <AnimatePresence>
        {locked && label && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Shared card chrome                                                     */
/* ---------------------------------------------------------------------- */

function CardChrome({ item }: { item: GalleryItem }) {
  return (
    <>
      <span className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-[var(--brand-glow)] opacity-0 transition-opacity duration-300 group-hover/card:opacity-90 z-20" />
      <span className="absolute right-3 bottom-3 h-4 w-4 border-r-2 border-b-2 border-[var(--brand-glow)] opacity-0 transition-opacity duration-300 group-hover/card:opacity-90 z-20" />
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
        <h3 className="text-white font-display font-extrabold text-xl leading-none m-0 drop-shadow-md">{item.title}</h3>
      </div>
    </>
  );
}

type HoverFn = (id: GalleryItem['id'] | null, label: string | null) => void;

/* ---------------------------------------------------------------------- */
/* Grid view                                                              */
/* ---------------------------------------------------------------------- */

function GridCard({
  item,
  index,
  tall,
  isDimmed,
  reduceMotion,
  onOpen,
  onHover,
}: {
  item: GalleryItem;
  index: number;
  tall: boolean;
  isDimmed: boolean;
  reduceMotion: boolean;
  onOpen: () => void;
  onHover: HoverFn;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 220, damping: 22 });
  const springRotateY = useSpring(rotateY, { stiffness: 220, damping: 22 });

  useEffect(() => {
    if (isInView && item.videoUrl && videoRef.current) {
      const delay = 1200 + (index * 200);
      const timer = setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, item.videoUrl, index]);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 10);
    rotateX.set(py * -10);
  };
  
  const handleMouseEnter = () => onHover(item.id, 'VIEW');
  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    onHover(null, null);
  };

  return (
    <motion.div
      layoutId={`card-container-${item.id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
      className={`group/card relative h-full w-full transition-[opacity] duration-500 ${tall ? 'row-span-2' : ''} ${
        isDimmed ? 'opacity-40 saturate-50' : ''
      }`}
    >
      <motion.div
        ref={ref}
        style={reduceMotion ? undefined : { rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 800 }}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onOpen}
        className="relative h-full w-full overflow-hidden rounded-2xl bg-black/10"
      >
        {!reduceMotion && (
          <motion.div
            variants={scanlineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1.2, ease: 'linear', delay: (index * 0.08) + 0.2 }}
            className="pointer-events-none absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[var(--brand-glow)]/40 to-transparent z-10"
          />
        )}

        {item.videoUrl ? (
          <video
            ref={videoRef}
            src={`${item.videoUrl}#t=0.001`}
            poster={item.imageUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        )}
        <CardChrome item={item} />
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Reel view                                                              */
/* ---------------------------------------------------------------------- */

function ReelCard({
  item,
  index,
  isDimmed,
  reduceMotion,
  containerRef,
  onOpen,
  onHover,
  isDragging
}: {
  item: GalleryItem;
  index: number;
  isDimmed: boolean;
  reduceMotion: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onOpen: () => void;
  onHover: HoverFn;
  isDragging: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });
  
  const { scrollXProgress } = useScroll({
    target: ref,
    container: containerRef,
    axis: 'x',
    offset: ['start end', 'center center', 'end start'],
  });
  const scale = useTransform(scrollXProgress, [0, 0.5, 1], [0.82, 1, 0.82]);
  const focus = useTransform(scrollXProgress, [0, 0.5, 1], [0.5, 1, 0.5]);

  useEffect(() => {
    if (isInView && item.videoUrl && videoRef.current) {
      const delay = 1200 + (index * 200);
      const timer = setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, item.videoUrl, index]);

  return (
    <motion.div
      layoutId={`card-container-${item.id}`}
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
      className={`group/card w-[72vw] flex-shrink-0 snap-center sm:w-[420px] transition-[opacity] duration-500 ${
        isDimmed ? 'opacity-40' : ''
      }`}
    >
      <motion.div
        ref={ref}
        style={reduceMotion ? undefined : { scale, opacity: focus }}
        onClick={() => {
          // Prevent opening the lightbox if the user was just dragging the reel
          if (!isDragging) onOpen();
        }}
        onMouseEnter={() => onHover(item.id, 'VIEW')}
        onMouseLeave={() => onHover(null, null)}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black/10 select-none"
        onDragStart={(e) => e.preventDefault()} // Prevent native browser image drag
      >
        {!reduceMotion && (
          <motion.div
            variants={scanlineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 1.2, ease: 'linear', delay: (index * 0.08) + 0.2 }}
            className="pointer-events-none absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[var(--brand-glow)]/40 to-transparent z-10"
          />
        )}

        {item.videoUrl ? (
          <video
            ref={videoRef}
            src={`${item.videoUrl}#t=0.001`}
            poster={item.imageUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover pointer-events-none" />
        )}
        <CardChrome item={item} />
      </motion.div>
    </motion.div>
  );
}


/* ---------------------------------------------------------------------- */
/* Gallery page                                                           */
/* ---------------------------------------------------------------------- */

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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
  const springX = useSpring(cursorX, { stiffness: 300, damping: 26, mass: 0.5 });
  const springY = useSpring(cursorY, { stiffness: 300, damping: 26, mass: 0.5 });

  const reelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- DRAG TO SCROLL LOGIC ---
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (!reelRef.current) return;
    setIsDragging(true);
    startX.current = e.pageX - reelRef.current.offsetLeft;
    scrollLeft.current = reelRef.current.scrollLeft;
    // Disable snapping while dragging for a fluid feel
    reelRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseLeaveOrUp = () => {
    if (!reelRef.current) return;
    // Delay turning off isDragging slightly so we don't accidentally trigger a click event
    setTimeout(() => setIsDragging(false), 50); 
    // Re-enable snapping so it rests perfectly on a card
    reelRef.current.style.scrollSnapType = 'x mandatory';
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging || !reelRef.current) return;
    e.preventDefault();
    const x = e.pageX - reelRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Drag multiplier
    reelRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // --- WHEEL TO HORIZONTAL SCROLL LOGIC ---
  useEffect(() => {
    const reel = reelRef.current;
    if (!reel || viewMode !== 'reel') return;

    const onWheel = (e: WheelEvent) => {
      // If the scroll is mostly vertical, hijack it and scroll horizontally
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        // Jump cleanly from card to card based on scroll direction
        reel.scrollBy({ left: e.deltaY > 0 ? 500 : -500, behavior: 'smooth' });
      }
    };

    // Add passive: false so we can preventDefault
    reel.addEventListener('wheel', onWheel, { passive: false });
    return () => reel.removeEventListener('wheel', onWheel);
  }, [viewMode]);

  // Shuffle images on component mount
  useEffect(() => {
    const shuffled = [...galleryData].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  }, []);

  const lightboxOpen = selectedImageIndex !== null;
  const activeItem = lightboxOpen && items.length > 0 ? items[selectedImageIndex as number] : null;
  
  const cursorActive = isFinePointer && !prefersReducedMotion && pointerInField && !lightboxOpen;

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    setIsFinePointer(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
    if (!lightboxOpen && timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [lightboxOpen]);

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
    setSelectedImageIndex((prev) => (prev! + 1) % items.length);
  }, [items.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setSelectedImageIndex((prev) => (prev! - 1 + items.length) % items.length);
  }, [items.length]);

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
    <div 
      className={`min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-6 ${cursorActive ? 'cursor-none [&_*]:cursor-none' : ''}`}
      onMouseEnter={() => setPointerInField(true)}
      onMouseMove={(e) => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }}
      onMouseLeave={() => {
        setPointerInField(false);
        setHoveredCardId(null);
        setCursorLabel(null);
      }}
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 text-center max-w-[560px] mx-auto mb-10 mt-8"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* Red Led */}
          <motion.span 
            animate={{ opacity: [1, 0.1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" 
          />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted">Flight Archive</span>
        </div>
        
        <h1 className="font-display font-extrabold text-[4rem] sm:text-[5.5rem] md:text-[7rem] text-fg leading-[0.9] tracking-[-0.02em] m-0 mb-6">
          Gallery
        </h1>
        
        <p className="font-sans text-body-lg text-fg-muted leading-[1.7] mx-auto mb-6 prose-measure">
          A visual record of our engineering journey and team spirit.
        </p>
      </motion.div>

      {/* Controls */}
      <div className="max-w-[1600px] mx-auto mb-8 flex justify-between items-end border-b border-[var(--border-subtle)] pb-4 px-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          {items.length} {items.length === 1 ? 'frame' : 'frames'} captured
        </p>
        
        <div className="relative flex items-center gap-1 rounded-full border border-[var(--border-subtle)] p-1 bg-[var(--bg-primary)]">
          {viewModes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              onMouseEnter={() => setCursorLabel(label)}
              onMouseLeave={() => setCursorLabel(null)}
              aria-label={`${label} view`}
              className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-300 ${
                viewMode === key ? 'text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {viewMode === key && (
                <motion.span
                  layoutId="viewModePill"
                  transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[var(--brand-glow)] border border-[var(--border-subtle)]"
                />
              )}
              <Icon size={14} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {viewMode === 'grid' && (
            <div
              className="max-w-[1600px] mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{ gridAutoRows: 300 }}
            >
              <AnimatePresence>
                {items.map((item, i) => (
                  <GridCard
                    key={item.id}
                    item={item}
                    index={i} 
                    tall={i % 5 === 2}
                    isDimmed={hoveredCardId !== null && hoveredCardId !== item.id}
                    reduceMotion={prefersReducedMotion}
                    onOpen={() => openAt(i, item.id)}
                    onHover={handleHover}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {viewMode === 'reel' && (
            <div className="relative w-full max-w-[100vw] -mx-6 px-6">
              <button
                onClick={() => reelRef.current?.scrollBy({ left: -500, behavior: 'smooth' })}
                className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur transition-colors hover:bg-black/80 sm:flex"
                aria-label="Scroll reel left"
              >
                <ChevronLeft size={24} />
              </button>
              
              {/* Draggable Reel Container */}
              <div
                ref={reelRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory py-6 px-[10vw] [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' }}
              >
                <AnimatePresence>
                  {items.map((item, i) => (
                    <ReelCard
                      key={item.id}
                      item={item}
                      index={i} 
                      isDimmed={hoveredCardId !== null && hoveredCardId !== item.id}
                      reduceMotion={prefersReducedMotion}
                      containerRef={reelRef}
                      onOpen={() => openAt(i, item.id)}
                      onHover={handleHover}
                      isDragging={isDragging} // Passed to disable clicks while swiping
                    />
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={() => reelRef.current?.scrollBy({ left: 500, behavior: 'smooth' })}
                className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur transition-colors hover:bg-black/80 sm:flex"
                aria-label="Scroll reel right"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {cursorActive && <TargetCursor x={springX} y={springY} locked={!!cursorLabel} label={cursorLabel} />}

      {/* Lightbox */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md cursor-auto"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[70] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(null);
              }}
            >
              <X size={32} />
            </button>

            <button
              className="absolute left-4 sm:left-8 text-white/50 hover:text-white transition-colors z-[70] p-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
            >
              <ChevronLeft size={48} />
            </button>
            <button
              className="absolute right-4 sm:right-8 text-white/50 hover:text-white transition-colors z-[70] p-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
            >
              <ChevronRight size={48} />
            </button>

            <motion.div
              layoutId={openedItemId !== null ? `card-container-${openedItemId}` : undefined}
              className="relative w-full max-w-6xl flex flex-col justify-center rounded-xl overflow-hidden shadow-2xl bg-black cursor-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleUserActivity();
              }}
              onMouseMove={handleUserActivity}
            >
              <span className="absolute left-3 top-3 z-20 h-6 w-6 border-l-2 border-t-2 border-white/40 pointer-events-none" />
              <span className="absolute right-3 top-3 z-20 h-6 w-6 border-r-2 border-t-2 border-white/40 pointer-events-none" />
              <span className="absolute left-3 bottom-3 z-20 h-6 w-6 border-l-2 border-b-2 border-white/40 pointer-events-none" />
              <span className="absolute right-3 bottom-3 z-20 h-6 w-6 border-r-2 border-b-2 border-white/40 pointer-events-none" />

              <div className="absolute top-5 left-8 z-20 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 pointer-events-none">
                {String((selectedImageIndex as number) + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeItem.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  drag={activeItem.videoUrl ? false : 'x'}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                    if (info.offset.x < -80) goNext();
                    else if (info.offset.x > 80) goPrev();
                  }}
                >
                  {activeItem.videoUrl ? (
                    <div className="relative flex justify-center w-full max-h-[85vh]">
                      <video
                        id="lightbox-video"
                        src={activeItem.videoUrl}
                        poster={activeItem.imageUrl}
                        controls
                        autoPlay
                        onPlay={handleUserActivity}
                        onPause={handleUserActivity}
                        className="max-w-full max-h-[85vh] w-auto h-auto object-contain bg-black"
                      />
                      <div
                        ref={overlayRef}
                        className="absolute top-0 left-0 right-0 px-8 pt-14 pb-24 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none transition-opacity duration-500 z-10"
                      >
                        <h2 className="text-3xl text-white font-display font-extrabold m-0 leading-none drop-shadow-lg">
                          {activeItem.title}
                        </h2>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex justify-center max-h-[85vh]">
                      <img
                        src={activeItem.imageUrl}
                        alt={activeItem.title}
                        draggable={false}
                        className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10">
                        <h2 className="text-3xl text-white font-display font-extrabold m-0 leading-none drop-shadow-lg">
                          {activeItem.title}
                        </h2>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {items.length > 1 && (
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70] flex max-w-[80vw] flex-wrap items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDirection(i > (selectedImageIndex as number) ? 1 : -1);
                      setSelectedImageIndex(i);
                    }}
                    aria-label={`Go to ${item.title}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === selectedImageIndex ? 'w-6 bg-[var(--brand-glow)]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}