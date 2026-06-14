import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';
import { getLargeAsset } from '../utils/indexedDB';

let hasIntroBeenSeenInSession = false;

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
  isSettingsLoaded: boolean;
}

export default function IntroVideoOverlay({ siteSettings, lang, isSettingsLoaded }: IntroVideoOverlayProps) {
  // 1. Evaluate local storage to see if settings are loaded of previous session
  const [hasDismissed, setHasDismissed] = useState<boolean>(() => {
    if (hasIntroBeenSeenInSession) return true;
    
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hummer_site_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.disableIntro === true) {
            return true;
          }
        }
      } catch (e) {
        console.warn("Could not read initial site settings check:", e);
      }
    }
    return false;
  });

  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastInteractionTime = useRef<number>(0);
  const isRtl = lang === 'ar';

  const isOpen = !hasDismissed;

  const dismissIntro = () => {
    setHasDismissed(true);
    hasIntroBeenSeenInSession = true;
  };

  // 2. Synchronize remote live disable settings from Firestore
  useEffect(() => {
    if (isSettingsLoaded) {
      if (siteSettings.disableIntro === true) {
        dismissIntro();
      } else if (siteSettings.disableIntro === false && !hasIntroBeenSeenInSession) {
        // Enforce restoring intro if settings say it's enabled, bypassing stale local cache
        setHasDismissed(false);
      }
    }
  }, [isSettingsLoaded, siteSettings.disableIntro]);

  // 3. Resolve the video URL properly (using background decodes for data URIs to avoid render lock-ups)
  useEffect(() => {
    if (hasDismissed) return;

    let isCancelled = false;
    let objectUrl = '';

    const resolveVideoSource = async () => {
      let activeUrl = '';
      
      // Attempt to load from settings, falling back to local Storage, or defaults
      if (siteSettings && siteSettings.introVideoUrl) {
        activeUrl = siteSettings.introVideoUrl;
      } else {
        try {
          const saved = localStorage.getItem('hummer_site_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            activeUrl = parsed.introVideoUrl || '';
          }
        } catch (e) {}
      }

      if (!activeUrl) {
        activeUrl = 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-41611-large.mp4';
      }

      // If it refers to local Large Assets saved in IndexedDB
      if (activeUrl === 'local-db:introVideoUrl') {
        const storedAsset = await getLargeAsset('introVideoUrl');
        if (storedAsset) {
          activeUrl = storedAsset;
        } else {
          activeUrl = 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-41611-large.mp4';
        }
      }

      if (isCancelled) return;

      if (activeUrl.startsWith('data:')) {
        try {
          const response = await fetch(activeUrl);
          const blob = await response.blob();
          if (isCancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setVideoSrc(objectUrl);
        } catch (err) {
          console.error("Async blob processing failed, falling back to direct data URL:", err);
          if (!isCancelled) {
            setVideoSrc(activeUrl);
          }
        }
      } else {
        setVideoSrc(activeUrl);
      }

      if (!isCancelled) {
        setIsResolving(false);
      }
    };

    resolveVideoSource();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hasDismissed, siteSettings.introVideoUrl]);

  // 4. Robust muted autoplay starting mechanism with event listeners for mobile Safari fallback
  useEffect(() => {
    if (!isOpen || isResolving || !videoSrc) return;

    const video = videoRef.current;
    if (!video) return;

    // Apply strict specifications for native browser muted autoplay
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
            console.warn("Autoplay deferred by Safari/Chrome power manager. Establishing fallback gesture listener.", err);
            
            // Start play on first gesture (touchscreen interaction or tap)
            const handleFirstGesture = () => {
              if (videoRef.current) {
                videoRef.current.play()
                  .then(() => {
                    setHasStarted(true);
                    cleanup();
                  })
                  .catch(e => {
                    console.error("Gesture starter failed, bypassing intro gracefully:", e);
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

    const frameId = requestAnimationFrame(() => {
      tryPlay();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isOpen, isResolving, videoSrc]);

  // 5. Watchdog fallback: automatically bypass intro overlay if loading exceeds 4.5 seconds,
  // preventing user from ever being stuck on a black/blank loader screen.
  useEffect(() => {
    if (!isOpen) return;
    const safetyTimeout = setTimeout(() => {
      dismissIntro();
    }, 4500);
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
      }, durationMs + 300); // 300ms buffer
      return () => clearTimeout(t);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Beautiful Skip Control: Any click or tap on the overlay immediately closes the intro!
    // This resolves the double-tap requirement on Safari completely.
    dismissIntro();
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
          {/* Render the video only when its URL resolution completes to avoid the midway swap stutter */}
          {!isResolving && videoSrc && (
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
                console.warn("Video render error, bypassing intro gracefully", e);
                dismissIntro();
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100"
              id="intro-cinematic-video"
            />
          )}

          {/* Centered spinner before video starts loading to maintain premium appearance */}
          {(!hasStarted || isResolving) && !siteSettings.disableIntro && (
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center text-center space-y-2 text-white/40">
              <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
              <p className="text-[9px] font-mono tracking-wider uppercase">
                {isRtl ? 'تحميل...' : 'Loading...'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
