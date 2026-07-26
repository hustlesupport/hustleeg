"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface Props {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const allImages = images.length > 0 ? images : [{ id: "placeholder", url: "", alt: null }];

  /* Close lightbox on Escape */
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setActive((a) => (a + 1) % allImages.length);
      if (e.key === "ArrowLeft") setActive((a) => (a - 1 + allImages.length) % allImages.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, allImages.length]);

  /* Prevent body scroll when lightbox open */
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, [zoomed]);

  const currentImage = allImages[active];

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-2">
        {/* Primary image */}
        <div
          className="relative aspect-[4/5] bg-concrete-grey/10 overflow-hidden cursor-zoom-in group"
          onClick={() => { setLightbox(true); setZoomed(false); }}
          role="button"
          aria-label="Open image zoom"
        >
          {currentImage.url ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt ?? productName}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-concrete-grey/15" />
          )}

          {/* Zoom hint overlay */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="font-mono text-[9px] uppercase tracking-widest text-white">Zoom</span>
          </div>

          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute top-3 left-3 bg-black/40 px-2 py-1 backdrop-blur-sm">
              <span className="font-mono text-[9px] text-white">
                {active + 1} / {allImages.length}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {allImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActive(i)}
                className={`relative aspect-square overflow-hidden transition-all duration-150 ${
                  i === active
                    ? "ring-2 ring-matte-black ring-offset-1"
                    : "opacity-50 hover:opacity-80"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                {img.url ? (
                  <Image
                    src={img.url}
                    alt={img.alt ?? `${productName} ${i + 1}`}
                    fill
                    sizes="15vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-concrete-grey/15" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center text-white/70 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              onClick={() => setActive((a) => (a - 1 + allImages.length) % allImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center text-white/60 hover:text-white"
              aria-label="Previous image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={() => setActive((a) => (a + 1) % allImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center text-white/60 hover:text-white"
              aria-label="Next image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Zoomed image */}
          <div
            className={`relative w-full h-full max-w-3xl mx-auto flex items-center justify-center ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onClick={() => setZoomed((z) => !z)}
            onMouseMove={handleMouseMove}
          >
            {currentImage.url && (
              <div
                className="relative w-full h-full overflow-hidden"
                style={
                  zoomed
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: "scale(2.5)",
                        transition: "transform 0.1s ease-out",
                      }
                    : { transform: "scale(1)", transition: "transform 0.3s ease-out" }
                }
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.alt ?? productName}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {/* Bottom thumbnail strip in lightbox */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {allImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setActive(i); setZoomed(false); }}
                  className={`relative h-12 w-9 flex-shrink-0 overflow-hidden transition-all ${
                    i === active ? "ring-1 ring-white opacity-100" : "opacity-40 hover:opacity-70"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  {img.url && (
                    <Image src={img.url} alt="" fill sizes="60px" className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-widest text-white/30">
            {zoomed ? "Click to zoom out" : "Click to zoom in · Arrow keys to navigate"}
          </div>
        </div>
      )}
    </>
  );
}
