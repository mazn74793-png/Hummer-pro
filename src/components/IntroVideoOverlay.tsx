import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
  isSettingsLoaded: boolean;
}

export default function IntroVideoOverlay({ siteSettings, lang, isSettingsLoaded }: IntroVideoOverlayProps) {
  // Check session storage to see if they completed the intro in this browser tab tab
  const [hasDismissed, setHasDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hummer_intro_seen') === 'true';
    }
    return false;
  });

  const [videoSrc, setVideoSrc] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
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
      // Direct DOM property enforcement (Unconditional Safari / iOS Bypass)
      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('controls', 'false');
      video.removeAttribute('controls');
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasStarted(true);
            setAutoplayBlocked(false);
          })
          .catch(err => {
            console.warn("Autoplay was blocked on iOS Safari/Chrome (low-power or high-security active). Registering fallback callbacks.", err);
            setAutoplayBlocked(true);
            
            // Register aggressive viewport-wide click/touch overrides to kickstart playback safely
            const playOnInteraction = () => {
              if (videoRef.current) {
                videoRef.current.play()
                  .then(() => {
                    setHasStarted(true);
                    setAutoplayBlocked(false);
                    cleanup();
                  })
                  .catch(e => {
                    console.error("Interactive fallback play failed:", e);
                  });
              }
            };

            const cleanup = () => {
              document.removeEventListener('touchstart', playOnInteraction);
              document.removeEventListener('click', playOnInteraction);
            };
            
            document.addEventListener('touchstart', playOnInteraction, { passive: true });
            document.addEventListener('click', playOnInteraction, { passive: true });

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
    const now = Date.now();
    if (now - lastInteractionTime.current < 600) {
      return;
    }
    lastInteractionTime.current = now;

    const video = videoRef.current;
    if (!video) return;

    // If already playing, tap serves to SKIP the cinematic and instantly enter the home page!
    if (!video.paused) {
      dismissIntro();
    } else {
      // If paused due to autoplay restriction, attempt to kickstart on this touch
      video.play()
        .then(() => {
          setHasStarted(true);
          setAutoplayBlocked(false);
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
            Always render the video tag in the document from frame zero. 
            Safari refuses to autoplay nodes injected lazily after network ticks. 
          */}
          <video
            ref={(el) => {
              (videoRef as any).current = el;
              if (el) {
                el.muted = true;
                el.defaultMuted = true;
                el.playsInline = true;
                el.setAttribute('playsinline', '');
                el.setAttribute('webkit-playsinline', '');
                el.setAttribute('autoplay', '');
                el.setAttribute('muted', '');
              }
            }}
            src={videoSrc || undefined}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            controls={false}
            preload="auto"
            onPlay={() => {
              setHasStarted(true);
              setAutoplayBlocked(false);
            }}
            onEnded={handleEnded}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              // Log error but do not disrupt user if it's transient
              if (videoSrc) {
                console.warn("Media error during live player processing, bypassing crash:", e);
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${
              hasStarted ? 'opacity-100' : 'opacity-0'
            }`}
            id="intro-cinematic-video"
          />

          {/* Elegant modern overlay skeleton/spinner to show during loading or when autoplay is blocked */}
          {(!hasStarted || autoplayBlocked) && isSettingsLoaded && !siteSettings.disableIntro && (
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center text-center space-y-3 text-white px-4">
              {autoplayBlocked ? (
                <div className="flex flex-col items-center space-y-2 translate-y-[-10px] animate-pulse">
                  <div className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 transform active:scale-95 border border-white/25">
                    <svg className="w-5 h-5 text-white ml-0.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold tracking-wide">
                    {isRtl ? 'اضغط لتشغيل تجربة الدخول 🎬' : 'Tap to start cinematic entry 🎬'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-[10px] font-mono tracking-wider uppercase opacity-75">
                    {isRtl ? 'جاري التحميل...' : 'Loading cinematic experience...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
