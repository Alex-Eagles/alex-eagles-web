interface AmbientImageProps {
  src: string;
  mobileSrc?: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
}

/**
 * A decorative, full-bleed background still. Purely presentational: it sits
 * behind headline copy, so it is hidden from assistive tech and carries no
 * playback controls or motion of its own.
 */
export default function AmbientImage({
  src,
  mobileSrc,
  className,
  imageClassName = "absolute inset-0 h-full w-full object-cover",
  loading = "eager",
}: AmbientImageProps) {
  return (
    <div className={className} aria-hidden="true">
      <picture>
        {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
        <img
          src={src}
          alt=""
          className={imageClassName}
          loading={loading}
          decoding="async"
        />
      </picture>
    </div>
  );
}
