import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { galleryData, galleryCategories, GalleryItem } from '@/data/gallery';

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Filter images based on selected category
  const filteredImages = galleryData.filter(
    (item) => activeCategory === 'All' || item.category === activeCategory
  );

  // Handle keyboard navigation for the Lightbox
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

  // Attach and detach event listener
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
            className={`px-5 py-2 rounded-full font-inter text-sm transition-all duration-300 ${
              activeCategory === category
                ? 'bg-[var(--brand)] text-[var(--bg-primary)]'
                : 'bg-[var(--bg-glass)] text-[var(--text-primary)] hover:bg-[var(--brand-muted)]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Masonry Grid with Pop & Dim*/}
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
                         transition-all duration-500 group-hover:opacity-40 hover:!opacity-100 hover:scale-[1.02] hover:z-10 hover:shadow-2xl"
              onClick={() => setSelectedImageIndex(index)}
            >
              {/* Native Lazy Loading for performance */}
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
              
              {/* Glassmorphism Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent 
                              opacity-0 hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white font-barlow font-bold text-lg">{item.title}</h3>
                <p className="text-gray-300 font-inter text-sm">{item.category}</p>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedImageIndex(null)}
          >
            {/* Close Button */}
            <button className="absolute top-6 right-6 text-white hover:text-[var(--brand)] transition-colors z-50">
              <X size={32} />
            </button>

            {/* Navigation Arrows */}
            <button 
              className="absolute left-6 text-white/50 hover:text-white transition-colors z-50 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
              }}
            >
              <ChevronLeft size={48} />
            </button>
            <button 
              className="absolute right-6 text-white/50 hover:text-white transition-colors z-50 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev! + 1) % filteredImages.length);
              }}
            >
              <ChevronRight size={48} />
            </button>

            {/* Main Expanded Image */}
            <motion.div
              layoutId={`card-container-${filteredImages[selectedImageIndex].id}`}
              className="relative max-w-[95vw] max-h-[85vh] w-auto flex justify-center rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredImages[selectedImageIndex].imageUrl}
                alt={filteredImages[selectedImageIndex].title}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
              />
              
              {/* Image Details Overlay*/}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <h2 className="text-2xl text-white font-display font-extrabold m-0 leading-none">
                  {filteredImages[selectedImageIndex].title}
                </h2>
                <div className="inline-flex mt-3 items-center px-2.5 py-1 rounded-md bg-[var(--brand-glow)]/20 border border-[var(--border-subtle)]/30 backdrop-blur-sm">
                  <span className="font-mono text-[12px] text-white uppercase tracking-[0.08em]">
                    {filteredImages[selectedImageIndex].category}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}