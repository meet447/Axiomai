/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Skeleton } from "./ui/skeleton";

export const ImageSectionSkeleton = () => {
  return (
    <>
      <div className="my-4 grid grid-cols-2 gap-2 lg:grid-cols-4 w-full">
        {[...Array(4)].map((_, index) => (
          <div className="w-full h-full" key={`image-skeleton-${index}`}>
            <Skeleton className="rounded-md object-cover shadow-none border-none w-full bg-card h-[100px]" />
          </div>
        ))}
      </div>
    </>
  );
};

export function ImageSection({ images }: { images: string[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!images || images.length === 0) return null;

  const maxVisible = 4;
  const hasMore = images.length > maxVisible;
  const visibleImages = showAll ? images : images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  return (
    <div className="my-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {visibleImages.map((image, index) => {
        const isLastVisible = index === maxVisible - 1 && hasMore && !showAll;

        return (
          <div key={image} className="relative">
            <a
              href={image}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-video w-full h-full overflow-hidden hover:scale-[1.03] duration-150 rounded-lg transition-all shadow-md block"
              onClick={isLastVisible ? (e) => { e.preventDefault(); setShowAll(true); } : undefined}
            >
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full object-cover object-top h-full max-h-[80vh]"
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
