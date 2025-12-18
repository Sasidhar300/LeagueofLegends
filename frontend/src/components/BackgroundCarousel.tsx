"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./BackgroundCarousel.module.css";

interface BackgroundCarouselProps {
  images: string[];
  interval?: number;
}

export default function BackgroundCarousel({ 
  images, 
  interval = 5000 
}: BackgroundCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % images.length;
        // Preload next image
        setLoadedImages(prev => new Set(prev).add(nextIndex));
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  // Only render current and adjacent slides for better performance
  const visibleSlides = useMemo(() => {
    const prev = (currentIndex - 1 + images.length) % images.length;
    const next = (currentIndex + 1) % images.length;
    return new Set([prev, currentIndex, next]);
  }, [currentIndex, images.length]);

  return (
    <div className={styles.carouselContainer}>
      {images.map((image, index) => {
        // Only render visible slides
        if (!visibleSlides.has(index)) return null;
        
        return (
          <div
            key={index}
            className={`${styles.slide} ${
              index === currentIndex ? styles.active : ""
            }`}
            style={{
              backgroundImage: loadedImages.has(index) ? `url(${image})` : undefined,
            }}
          />
        );
      })}
      <div className={styles.overlay} />
    </div>
  );
}
