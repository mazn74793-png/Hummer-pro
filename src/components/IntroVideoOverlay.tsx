import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
  isSettingsLoaded: boolean;
}

export default function IntroVideoOverlay({ siteSettings, lang, isSettingsLoaded }: IntroVideoOverlayProps) {
  // Check session storage to see if they completed the intro
  const [hasDismissed, setHasDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hummer_intro_seen') === 'true';
    }
    return false;
  });

  const [videoSrc, setVideoSrc] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastInteractionTime = useRef<number>(0);
  const isRtl = lang === 'ar';

  const isOpen = !hasDismissed;

  // Save dismissal state in sessionStorage
  const dismissIntro = () => {
    setHasDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hummer_intro_seen', 'true');
    }
  };

  // Once settings are loaded from Firestore, evaluate whether to show or skip
  useEffect(() => {
    if (!isSettingsLoaded) return;

    if (siteSettings.disableIntro === true) {
      // If intro is disabled globally, dismiss instantly with a smooth fade-out
      dismissIntro();
    }
  }, [isSettingsLoaded, siteSettings.disableIntro]);

  // Convert Base64 intro video to Blob URL for maximum Safari/iOS performance, Only when settings are loaded!
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

  // Handle playing video automatically on iOS/Safari as soon as videoSrc is resolved
  useEffect(() => {
    const video = videoRef.current;
    if (isOpen && video && videoSrc) {
      // Set playing metadata directly on HTML video tag for aggressive Safari support
      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('controls', 'false');
      video.removeAttribute('controls');

      video.load();
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setHasStarted(true);
        }).catch(err => {
          console.warn("Autoplay was blocked on iOS Safari. Waiting for user interaction anywhere on screen.");
          
          // Fallback touch listeners for iOS Safari 
          const playOnInteraction = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  setHasStarted(true);
                  cleanup();
                })
                .catch(e => console.error("Interactive fallback play failed:", e));
            }
          };

          const cleanup = () => {
            document.removeEventListener('touchstart', playOnInteraction);
            document.removeEventListener('click', playOnInteraction);
          };
          
          document.addEventListener('touchstart', playOnInteraction, { passive: false });
          document.addEventListener('click', playOnInteraction, { passive: false });

          return cleanup;
        });
      }
    }
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
    // Avoid double triggering (onTouchStart followed by click 300ms later)
    const now = Date.now();
    if (now - lastInteractionTime.current < 600) {
      return;
    }
    lastInteractionTime.current = now;

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => {
          setHasStarted(true);
        })
        .catch(() => {
          dismissIntro();
        });
    } else {
      // Tap anywhere skips the cinematic and instantly enters!
      dismissIntro();
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
          {/* If the video source is fully resolved and loading, render the video element */}
          {videoSrc && (
            <video
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
              onError={() => {
                console.error("Intro video loading error, dismissing overlay");
                dismissIntro();
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              id="intro-cinematic-video"
            />
          )}

          {/* Elegant modern overlay skeleton/spinner to show during the brief loading state */}
          {!hasStarted && isSettingsLoaded && !siteSettings.disableIntro && (
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center text-center space-y-2 text-white/55">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-[10px] font-mono tracking-wider uppercase">
                {isRtl ? 'جاري التحميل...' : 'Loading cinematic experience...'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
