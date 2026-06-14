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
  // 1. Immediately evaluate local storage of siteSettings to avoid any flash or wait for Firestore
  const [hasDismissed, setHasDismissed] = useState(() => {
    if (hasIntroBeenSeenInSession) return true;
    
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('hummer_intro_seen') === 'true';
      if (seen) return true;

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
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastInteractionTime = useRef<number>(0);
  const isRtl = lang === 'ar';

  const isOpen = !hasDismissed;

  const dismissIntro = () => {
    setHasDismissed(true);
    hasIntroBeenSeenInSession = true;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hummer_intro_seen', 'true');
    }
  };

  // 2. Automatically listen to remote/live disable settings changes from Firestore
  useEffect(() => {
    if (isSettingsLoaded && siteSettings.disableIntro === true) {
      dismissIntro();
    }
  }, [isSettingsLoaded, siteSettings.disableIntro]);

  // 3. Resolve the video URL as fast as humans can see!
  useEffect(() => {
    if (hasDismissed) return;

    let isCancelled = false;
    let objectUrl = '';

    const resolveVideoSource = async () => {
      // First, check immediate site settings prop (which gets its initial value from localStorage synchronously!)
      let activeUrl = '';
      
      // If it exists in props, use it
      if (siteSettings && siteSettings.introVideoUrl) {
        activeUrl = siteSettings.introVideoUrl;
      } else {
        // Fallback: double check localStorage synchronously to trigger fast load
        try {
          const saved = localStorage.getItem('hummer_site_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            activeUrl = parsed.introVideoUrl || '';
          }
        } catch (e) {}
      }

      // If activeUrl is empty, use standard default
      if (!activeUrl) {
        activeUrl = 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-41611-large.mp4';
      }

      // If it points to IndexedDB large assets, retrieve it asynchronously but instantly
      if (activeUrl === 'local-db:introVideoUrl') {
        const storedAsset = await getLargeAsset('introVideoUrl');
        if (storedAsset) {
          activeUrl = storedAsset;
        } else {
          // Fallback if indexedDB is corrupted/empty
          activeUrl = 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-41611-large.mp4';
        }
      }

      if (isCancelled) return;

      // EXTREMELY CRITICAL OPTIMIZATION: Bypassing synchronous "atob()" block.
      // Synchronous base64 parsing (atob) blocks the browser rendering engine, causing massive stutter / "تعليقة"
      // we utilize the native browser async 'fetch' stream decoding which converts base64 to Blob 
      // completely in C++ background threads. This results in zero frame skips!
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
    };

    resolveVideoSource();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hasDismissed, siteSettings.introVideoUrl]);

  // 4. Robust autoplay bypassing with automatic gesture support
  useEffect(() => {
    if (!isOpen || !videoSrc) return;

    const video = videoRef.current;
    if (!video) return;

    // Direct element attribute injection to ensure immediate play
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');

    // Trigger video load
    video.load();

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasStarted(true);
          })
          .catch(err => {
            console.warn("Autoplay deferred by Safari/Chrome power manager. Establishing fallback gesture listener.", err);
            
            // To provide a flawless feel on restricted iOS/Low-Power devices, we start playback
            // on the absolute first screen gesture (touch or interact) anywhere on the viewport.
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

    // Use raw requestAnimationFrame to run on the next paint,
    // avoiding the immediate React frame lock-up. This deletes the stutter!
    const frameId = requestAnimationFrame(() => {
      tryPlay();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isOpen, videoSrc]);

  // 5. Safety watchdog: close if loading is extremely slow
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
      // Tap skips intro and enters immediately!
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
                  console.warn("Media error, skipping to homepage gently:", e);
                  dismissIntro();
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
                hasStarted ? 'opacity-100' : 'opacity-0'
              }`}
              id="intro-cinematic-video"
            />
          )}

          {/* Centered minimalist spinner while resolving video to maintain high premium vibe */}
          {!hasStarted && !siteSettings.disableIntro && (
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
