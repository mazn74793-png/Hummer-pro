import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
}

export default function IntroVideoOverlay({ siteSettings, lang }: IntroVideoOverlayProps) {
  const isRtl = lang === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [shouldShow, setShouldShow] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true); // start muted for bulletproof autoplay safety on iOS/Safari
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if video intro is configured & URL exists
    if (siteSettings.disableIntro || !siteSettings.introVideoUrl) {
      setShouldShow(false);
      return;
    }

    // Always show on page load (satisfying "يظهر كل ما اعمل ريفريش")
    setShouldShow(true);
  }, [siteSettings]);

  // Attempt to autoplay when shouldShow updates
  useEffect(() => {
    if (shouldShow && videoRef.current) {
      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(err => {
              console.warn("Autoplay was restricted initially, starting in standby:", err);
            });
        } else {
          // Fallback if browser doesn't return a promise on play()
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn("Play invocation failed:", err);
      }
    }
  }, [shouldShow]);

  const handleSkip = () => {
    setShouldShow(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent skipping when toggling mute
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center overflow-hidden"
      >
        {/* Cinematic Grid Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Video Player Frame with smart sizing */}
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={siteSettings.introVideoUrl}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={handleSkip}
            onClick={handleSkip}
            className="w-full h-full object-cover sm:object-contain select-none max-h-screen cursor-pointer"
            id="intro-cinematic-video-element"
          />

          {/* Top Control Bar styled elegantly */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            {/* Direct Skip Button (tactile & high-contrast red/dark accent) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSkip}
              className="p-3 bg-red-600 hover:bg-red-750 text-white rounded-full border border-red-700 shadow-lg transition flex items-center justify-center cursor-pointer"
              title={isRtl ? 'تخطي' : 'Skip'}
            >
              <X className="w-5 h-5 font-bold" />
            </motion.button>

            {/* Mute/Unmute Indicator */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700/50 rounded-full shadow-lg transition flex items-center justify-center cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-zinc-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
