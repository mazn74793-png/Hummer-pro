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
              className="absolute inset-0 w-full h-full object-cover brightness-[0.7] scale-[1.02]"
              id="intro-cinematic-video"
            />
          )}

          {/* Golden Warm Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40 pointer-events-none" />

          {/* Middle Branding/Chef Titles (Cinematic fade-in) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={hasStarted ? { opacity: 1, y: 0 } : { opacity: 0.4 }}
            transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
            className="relative z-10 text-center max-w-lg px-6 flex flex-col items-center gap-4"
          >
            {/* Pulsing Light Indicator */}
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mb-2" />

            <h1 className="text-3xl sm:text-5xl font-black font-sans text-white tracking-widest uppercase drop-shadow-2xl">
              {isRtl ? 'مطعم هـامـر 🔥' : 'HUMMER RESTAURANT'}
            </h1>
            
            <p className="text-xs sm:text-sm font-black tracking-widest text-[#f59e0b] px-4 py-1.5 rounded-full bg-black/60 border border-zinc-800/80 uppercase font-sans drop-shadow-lg">
              {isRtl ? 'أشهى كريبات وأقوى وجبات الفراخ الكريسبي 🍕' : 'The Ultimate Crispy Chicken & Crepes'}
            </p>

            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[10px] sm:text-xs text-zinc-400 font-extrabold font-sans mt-8 tracking-widest"
            >
              {isRtl ? 'جاري تجهيز المتعة والافتتاح... 🍗' : 'Preparing deliciousness... 🍗'}
            </motion.div>
          </motion.div>

          {/* Simple Top & Bottom cinematic black bars effect */}
          <div className="absolute top-0 left-0 right-0 h-[6vh] bg-black/80 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[6vh] bg-black/80 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
