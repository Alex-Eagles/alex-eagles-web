import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { galleryData, galleryCategories } from '@/data/gallery';

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const filteredImages = galleryData.filter(
    (item) => activeCategory === 'All' || item.category === activeCategory
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserActivity = useCallback(() => {
    if (!overlayRef.current) return;
    
    overlayRef.current.style.opacity = '1';
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const video = document.getElementById('lightbox-video') as HTMLVideoElement;
    
    if (video && !video.paused) {
      timeoutRef.current = setTimeout(() => {
        if (overlayRef.current) overlayRef.current.style.opacity = '0';
      }, 2500);
    }
  }, []);

  useEffect(() => {
    if (selectedImageIndex === null && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [selectedImageIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev! + 1) % filteredImages.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
      }
    },
    [selectedImageIndex, filteredImages.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-6">
      
      {/* Header Section */}
      <div className="relative z-10 text-center max-w-[560px] mx-auto mb-12 mt-12">
        <h1 className="font-display font-extrabold text-h1 text-fg leading-none tracking-[-0.02em] m-0 mb-4">
          Gallery
        </h1>
        <p className="font-sans text-body-lg text-fg-muted leading-[1.7] mx-auto mb-9 prose-measure">
          From workshop late nights to autonomous test flights — a visual record of our engineering journey and team spirit.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {galleryCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-5 py-2 rounded-full font-sans text-sm transition-all duration-300 ${
              activeCategory === category
                ? 'bg-[var(--brand-glow)] border border-[var(--border-subtle)] text-fg'
                : 'bg-transparent border border-transparent text-fg-muted hover:bg-[var(--brand-glow)]/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 group">
        <AnimatePresence>
          {filteredImages.map((item, index) => (
            <motion.div
              layoutId={`card-container-${item.id}`}
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid 
                         transition-all duration-500 group-hover:opacity-40 hover:!opacity-100 hover:scale-[1.02] hover:z-10 hover:shadow-2xl group/card"
              onClick={() => setSelectedImageIndex(index)}
              onMouseEnter={(e) => {
                const video = e.currentTarget.querySelector('video');
                if (video) video.play();
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget.querySelector('video');
                if (video) video.pause();
              }}
            >
              
              {/* Media Renderer */}
              {item.videoUrl ? (
                <>
                  <video
                    src={`${item.videoUrl}#t=0.001`}
                    poster={item.imageUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-black/40 p-2 rounded-full backdrop-blur-md z-20 pointer-events-none">
                    <Play size={16} className="text-white fill-white" />
                  </div>
                </>
              ) : (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              )}
              
              {/* Details Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent 
                              opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
                <h3 className="text-white font-display font-extrabold text-lg leading-none m-0">{item.title}</h3>
                <p className="text-gray-300 font-sans text-sm mt-2">{item.category}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox / Expandable Card */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
            onClick={() => setSelectedImageIndex(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[70]">
              <X size={32} />
            </button>

            <button 
              className="absolute left-4 sm:left-8 text-white/50 hover:text-white transition-colors z-[70] p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
              }}
            >
              <ChevronLeft size={48} />
            </button>
            <button 
              className="absolute right-4 sm:right-8 text-white/50 hover:text-white transition-colors z-[70] p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev! + 1) % filteredImages.length);
              }}
            >
              <ChevronRight size={48} />
            </button>

            <motion.div
              layoutId={`card-container-${filteredImages[selectedImageIndex].id}`}
              className="relative w-full max-w-5xl flex flex-col justify-center rounded-xl overflow-hidden shadow-2xl bg-black"
              onClick={(e) => { e.stopPropagation(); handleUserActivity(); }}
              onMouseMove={handleUserActivity}
            >
              
              {filteredImages[selectedImageIndex].videoUrl ? (
                <div className="relative flex justify-center w-full max-h-[85vh]">
                  <video
                    id="lightbox-video"
                    src={filteredImages[selectedImageIndex].videoUrl}
                    poster={filteredImages[selectedImageIndex].imageUrl}
                    controls
                    autoPlay
                    onPlay={handleUserActivity}
                    onPause={handleUserActivity}
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain bg-black"
                  />
                  <div 
                    ref={overlayRef}
                    className="absolute top-0 left-0 right-0 px-6 pt-6 pb-24 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none transition-opacity duration-500 z-10"
                  >
                    <h2 className="text-2xl text-white font-display font-extrabold m-0 leading-none drop-shadow-lg">
                      {filteredImages[selectedImageIndex].title}
                    </h2>
                    <div className="inline-flex mt-3 items-center px-2.5 py-1 rounded-md bg-[var(--brand-glow)]/20 border border-[var(--border-subtle)]/30 backdrop-blur-sm shadow-lg">
                      <span className="font-mono text-[12px] text-white uppercase tracking-[0.08em]">
                        {filteredImages[selectedImageIndex].category}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex justify-center max-h-[85vh]">
                  <img
                    src={filteredImages[selectedImageIndex].imageUrl}
                    alt={filteredImages[selectedImageIndex].title}
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10">
                    <h2 className="text-2xl text-white font-display font-extrabold m-0 leading-none drop-shadow-lg">
                      {filteredImages[selectedImageIndex].title}
                    </h2>
                    <div className="inline-flex mt-3 items-center px-2.5 py-1 rounded-md bg-[var(--brand-glow)]/20 border border-[var(--border-subtle)]/30 backdrop-blur-sm shadow-lg">
                      <span className="font-mono text-[12px] text-white uppercase tracking-[0.08em]">
                        {filteredImages[selectedImageIndex].category}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}