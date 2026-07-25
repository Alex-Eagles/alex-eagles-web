import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AmbientVideoProps {
  src: string;
  poster: string;
  mobileSrc?: string;
  mobilePoster?: string;
  label: string;
  className?: string;
  videoClassName?: string;
  controlClassName?: string;
  preload?: "none" | "metadata" | "auto";
}

/**
 * A muted, looping background video with an accessible play/pause control.
 * Motion starts disabled when the visitor prefers reduced motion.
 */
export default function AmbientVideo({
  src,
  poster,
  mobileSrc,
  mobilePoster,
  label,
  className,
  videoClassName = "absolute inset-0 h-full w-full object-cover",
  controlClassName = "",
  preload = "metadata",
}: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );
  const selectedSrc = mobileLayout && mobileSrc ? mobileSrc : src;
  const selectedPoster =
    mobileLayout && mobilePoster ? mobilePoster : poster;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const onChange = () => setMobileLayout(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();

    if (reduced) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          if (!manuallyPaused.current) {
            void video.play().catch(() => setPlaying(false));
          }
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.2] },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced, selectedSrc]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      manuallyPaused.current = false;
      void video.play().catch(() => setPlaying(false));
    } else {
      manuallyPaused.current = true;
      video.pause();
    }
  };

  return (
    <div className={className}>
      <video
        ref={videoRef}
        className={videoClassName}
        muted
        loop
        playsInline
        poster={selectedPoster}
        preload={reduced ? "none" : preload}
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={selectedSrc} type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={`${playing ? "Pause" : "Play"} ${label}`}
        className={`absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black/80 ${controlClassName}`}
        style={{
          background: "rgba(9, 9, 14, 0.62)",
          border: "1px solid rgba(255, 255, 255, 0.24)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {playing ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        <span>{playing ? "Pause" : "Play"}</span>
      </button>
    </div>
  );
}
