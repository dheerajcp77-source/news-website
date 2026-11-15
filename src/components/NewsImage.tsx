import { useState } from 'react';
import { Newspaper } from 'lucide-react';

interface NewsImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
}

export function NewsImage({
  src,
  alt,
  className = '',
  aspectClass = 'aspect-[4/3]',
}: NewsImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`${aspectClass} w-full bg-stone-100 border border-stone-200 flex flex-col items-center justify-center p-4 text-center ${className}`}
        aria-label={alt}
      >
        <Newspaper className="w-6 h-6 text-stone-400 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-stone-500 line-clamp-2 max-w-[220px] font-kannada">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`${aspectClass} w-full overflow-hidden bg-stone-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
      />
    </div>
  );
}
