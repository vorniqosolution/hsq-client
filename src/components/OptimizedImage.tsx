import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 1. Show Skeleton while loading */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {/* 2. Error Fallback */}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 text-gray-400">
          <ImageIcon className="h-10 w-10" />
        </div>
      )}

      {/* 3. The Image with smooth transition */}
      <img
        src={src}
        alt={alt}
        loading="lazy"     // Native Browser Lazy Loading
        decoding="async"   // Decodes image off the main thread
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        className={`
          w-full h-full object-cover transition-opacity duration-500 ease-in-out
          ${isLoading ? "opacity-0" : "opacity-100"}
        `}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;