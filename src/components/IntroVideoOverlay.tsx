import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
}

export default function IntroVideoOverlay({ siteSettings, lang }: IntroVideoOverlayProps) {
  const [hasDismissed, setHasDismissed] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isRtl = lang === 'ar';

  const isOpen = !siteSettings.disableIntro && !hasDismissed;

  // Reset dismissed state when the intro gets enabled or the video url changes
  useEffect(() => {
    if (!siteSettings.disableIntro) {
      setHasDismissed(false);
    }
  }, [siteSettings.disableIntro, siteSettings.introVideoUrl]);

  // Track video raw source changes and convert Base64 to Blob URL for Safari/iOS compatibility
  useEffect(() => {
    let activeUrl = siteSettings.introVideoUrl || '';
    let objectUrl = '';

    if (activeUrl.startsWith('data:')) {
      try {
        const parts = activeUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'video/mp4';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
      } catch (e) {
        console.error("Error creating Blob URL for video in Safari:", e);
        setVideoSrc(activeUrl);
      }
    } else {
      setVideoSrc(activeUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [siteSettings.introVideoUrl]);

  // Handle active playback and force start on Safari/iOS devices
  useEffect(() => {
    if (isOpen && videoRef.current && videoSrc) {
      videoRef.current.load();
      videoRef.current.play().catch(err => {
        console.warn("Autoplay was prevented or failed on iOS Safari:", err);
      });
    }
  }, [isOpen, videoSrc]);

  // Set safety timeout to close the overlay if it gets stuck
  useEffect(() => {
    if (!isOpen) return;

    const safetyTimeout = setTimeout(() => {
      setHasDismissed(true);
    }, 12000); // 12 seconds max safety limit

    return () => clearTimeout(safetyTimeout);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleEnded = () => {
    setHasDismissed(true);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      const durationMs = videoRef.current.duration * 1000;
      const t = setTimeout(() => {
        setHasDismissed(true);
      }, durationMs + 400); // 400ms buffer after video naturally finishes
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
          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              webkit-playsinline="true"
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
