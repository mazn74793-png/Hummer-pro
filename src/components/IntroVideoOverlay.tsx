import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
}

export default function IntroVideoOverlay({ siteSettings, lang }: IntroVideoOverlayProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isRtl = lang === 'ar';

  useEffect(() => {
    if (siteSettings.disableIntro) {
      setIsOpen(false);
      return;
    }

    // Set a safety timeout to close the intro after 10-12 seconds max
    // even if the video fails to fire the onEnded event.
    const safetyTimeout = setTimeout(() => {
      setIsOpen(false);
    }, 11000);

    return () => clearTimeout(safetyTimeout);
  }, [siteSettings.disableIntro]);

  if (siteSettings.disableIntro || !isOpen) {
    return null;
  }

  const handleEnded = () => {
    // Smoothly exit when video finishes
    setIsOpen(false);
  };

  const handleLoadedMetadata = () => {
    // We can auto-adjust safety timer if duration is successfully obtained
    if (videoRef.current && videoRef.current.duration) {
      const durationMs = videoRef.current.duration * 1000;
      const t = setTimeout(() => {
        setIsOpen(false);
      }, durationMs + 400); // 400ms margin
      return () => clearTimeout(t);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="intro-video-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.8, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center overflow-hidden select-none pointer-events-none"
        >
          {/* Main Fullscreen Video Background */}
          {siteSettings.introVideoUrl && (
            <video
              ref={videoRef}
              src={siteSettings.introVideoUrl}
              autoPlay
              muted
              playsInline
              onPlay={() => setHasStarted(true)}
              onEnded={handleEnded}
              onLoadedMetadata={handleLoadedMetadata}
              className="absolute inset-0 w-full h-full object-cover"
              id="intro-cinematic-video"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
