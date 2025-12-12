/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { ImageIcon } from "lucide-react";

export const ImageSectionSkeleton = () => {
  return (
    <>
      <div className="my-4 grid grid-cols-2 gap-2 lg:grid-cols-4 w-full">
        {[...Array(4)].map((_, index) => (
          <div className="w-full h-full" key={`image-skeleton-${index}`}>
            <Skeleton className="rounded-lg w-full h-[100px]" />
          </div>
        ))}
      </div>
    </>
  );
};

export function ImageSection({ images }: { images: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set(images));

  if (!images || images.length === 0) return null;

  const maxVisible = 4;
  // Filter out failed images
  const validImages = images.filter(img => !failedImages.has(img));
  const hasMore = validImages.length > maxVisible;
  const visibleImages = showAll ? validImages : validImages.slice(0, maxVisible);
  const remainingCount = validImages.length - maxVisible;

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(imageUrl);
      return next;
    });
  };

  const handleImageLoad = (imageUrl: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(imageUrl);
      return next;
    });
  };

  if (visibleImages.length === 0) return null;

  return (
    <div className="my-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {visibleImages.map((image, index) => {
        const isLastVisible = index === maxVisible - 1 && hasMore && !showAll;
        const isLoading = loadingImages.has(image);

        return (
          <div key={image} className="relative">
            <a
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-video w-full h-full overflow-hidden hover:scale-[1.02] duration-200 rounded-lg transition-all shadow-md block bg-muted"
              onClick={isLastVisible ? (e) => { e.preventDefault(); setShowAll(true); } : undefined}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <ImageIcon className="w-6 h-6 text-muted-foreground animate-pulse" />
                </div>
              )}
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className={`w-full object-cover object-top h-full max-h-[80vh] transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onError={() => handleImageError(image)}
                onLoad={() => handleImageLoad(image)}
              />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg cursor-pointer hover:bg-black/70 transition-colors">
                  <span className="text-white text-2xl font-semibold">+{remainingCount}</span>
                </div>
              )}
            </a>
          </div>
        );
      })}
    </div>
  );
}
