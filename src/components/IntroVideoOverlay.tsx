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

    // 2. Check localStorage to enforce FIRST TIME ONLY
    const hasPlayed = localStorage.getItem('hummer_intro_played_v1');
    if (hasPlayed === 'true') {
      setShouldShow(false);
    } else {
      setShouldShow(true);
    }
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
    localStorage.setItem('hummer_intro_played_v1', 'true');
    setShouldShow(false);
  };

  const toggleMute = () => {
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
            className="w-full h-full object-cover sm:object-contain select-none max-h-screen"
            id="intro-cinematic-video-element"
          />

          {/* Top Control Bar styled elegantly */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            {/* Direct Skip Button (tactile & high-contrast red/dark accent) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-750 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-red-700 shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isRtl ? 'تخطي الفيديو' : 'Skip Intro'}</span>
              <X className="w-4 h-4" />
            </motion.button>

            {/* Mute/Unmute Indicator */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className="p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700/50 rounded-xl shadow-lg transition flex items-center justify-center cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              )}
            </motion.button>
          </div>

          {/* Bottom Branding Badge */}
          <div className="absolute bottom-10 left-6 right-6 text-center z-10 pointer-events-none">
            <div className="max-w-xs mx-auto bg-black/50 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-805 border-zinc-700/30">
              <span className="text-[10px] font-black tracking-widest text-red-500 uppercase block mb-1">
                {isRtl ? 'مطعم همر الأصلي' : 'Hummer Restaurant'}
              </span>
              <h4 className="text-white text-xs font-black">
                {isRtl ? 'استمتع بأقوى تجربة طعام كرسبي في مصر' : 'Get Ready for the Crispy Legends'}
              </h4>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
