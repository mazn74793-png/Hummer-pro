import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

// Use a module-level variable to ensure the intro is played exactly once per page load.
// This resets on refresh, which means reloading the page always shows the intro,
// but simple React re-renders or internal state updates do not trigger it again.
let hasIntroBeenSeenInSession = false;

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
  isSettingsLoaded: boolean;
}

export default function IntroVideoOverlay({ siteSettings, lang, isSettingsLoaded }: IntroVideoOverlayProps) {
  const [hasDismissed, setHasDismissed] = useState(() => hasIntroBeenSeenInSession);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastInteractionTime = useRef<number>(0);
  const isRtl = lang === 'ar';

  const isOpen = !hasDismissed;

  const dismissIntro = () => {
    setHasDismissed(true);
    hasIntroBeenSeenInSession = true;
  };

  // Once settings are loaded from Firestore, evaluate whether to show or skip
  useEffect(() => {
    if (!isSettingsLoaded) return;
    if (siteSettings.disableIntro === true) {
      dismissIntro();
    }
  }, [isSettingsLoaded, siteSettings.disableIntro]);

  // Convert Base64 intro video to Blob URL for maximum Safari/iOS performance
  useEffect(() => {
    if (!isSettingsLoaded) return;
    if (siteSettings.disableIntro === true) return;

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
  }, [isSettingsLoaded, siteSettings.introVideoUrl, siteSettings.disableIntro]);

  // Safari/iOS Autoplay Bypassing Effect
  useEffect(() => {
    if (!isOpen || !videoSrc) return;

    const video = videoRef.current;
    if (!video) return;

    // Direct configuration of DOM node for maximum browser autoplay compatibility
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasStarted(true);
          })
          .catch(err => {
            console.warn("Autoplay was restricted by the browser (Low Power Mode or high security active). Awaiting viewport gesture to trigger.", err);
            
            // To ensure a perfect experience on iOS "Low Power Mode", we register a silent, wide-viewport gesture listener
            // that will instantly play the video upon the very first touch/scroll anywhere.
            const handleFirstGesture = () => {
              if (videoRef.current) {
                videoRef.current.play()
                  .then(() => {
                    setHasStarted(true);
                    cleanup();
                  })
                  .catch(e => {
                    console.error("First gesture play failed, bypassing intro safely:", e);
                    dismissIntro();
                    cleanup();
                  });
              }
            };

            const cleanup = () => {
              document.removeEventListener('touchstart', handleFirstGesture);
              document.removeEventListener('click', handleFirstGesture);
            };

            document.addEventListener('touchstart', handleFirstGesture, { passive: true });
            document.addEventListener('click', handleFirstGesture, { passive: true });

            return cleanup;
          });
      }
    };

    tryPlay();
  }, [isOpen, videoSrc]);

  // Safety protection: auto close if loading takes longer than 15 seconds to prevent frozen overlay
  useEffect(() => {
    if (!isOpen) return;

    const safetyTimeout = setTimeout(() => {
      dismissIntro();
    }, 15000);

    return () => clearTimeout(safetyTimeout);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleEnded = () => {
    dismissIntro();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      const durationMs = videoRef.current.duration * 1000;
      const t = setTimeout(() => {
        dismissIntro();
      }, durationMs + 400); // 400ms buffer 
      return () => clearTimeout(t);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastInteractionTime.current < 600) {
      return;
    }
    lastInteractionTime.current = now;

    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      // Tap anywhere on progress skips the intro and enters!
      dismissIntro();
    } else {
      video.play()
        .then(() => {
          setHasStarted(true);
        })
        .catch(() => {
          dismissIntro();
        });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="intro-video-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.8, ease: 'easeInOut' } }}
          onClick={handleOverlayClick}
          onTouchStart={handleOverlayClick}
          className="fixed inset-0 z-[9999] bg-[#0e0e11] flex items-center justify-center overflow-hidden select-none pointer-events-auto cursor-pointer"
        >
          {/* 
            By only rendering the video element when videoSrc is fully resolved,
            and attaching a `key={videoSrc}`, we force the video to mount already having the src.
            This is highly recommended for Safari autoplay.
          */}
          {videoSrc && (
            <video
              key={videoSrc}
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              webkit-playsinline="true"
              controls={false}
              preload="auto"
              onPlay={() => setHasStarted(true)}
              onEnded={handleEnded}
              onLoadedMetadata={handleLoadedMetadata}
              onError={(e) => {
                if (videoSrc) {
                  console.warn("Media file loading exception, auto-bypassing:", e);
                  dismissIntro();
                }
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              id="intro-cinematic-video"
            />
          )}

          {/* Loading spinner - stays beautifully clean unless network load is very slow */}
          {!hasStarted && isSettingsLoaded && !siteSettings.disableIntro && (
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center text-center space-y-2 text-white/50">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-[10px] font-mono tracking-wider uppercase">
                {isRtl ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
