import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface IntroVideoOverlayProps {
  siteSettings: SiteSettings;
  lang: 'ar' | 'en';
}

export default function IntroVideoOverlay({ siteSettings, lang }: IntroVideoOverlayProps) {
  // To avoid flashing the website first before remote Firestore settings arrive, 
  // we start with dismissed=false if they haven't seen it in this session.
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

  // The overlay is shown if not dismissed
  const isOpen = !hasDismissed;

  // Save dismissal state securely in sessionStorage
  const dismissIntro = () => {
    setHasDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hummer_intro_seen', 'true');
    }
  };

  // Skip / dismiss instantly if the remote settings are loaded and show that intro is disabled
  useEffect(() => {
    if (siteSettings.disableIntro === true) {
      dismissIntro();
    }
  }, [siteSettings.disableIntro]);

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
    const video = videoRef.current;
    if (isOpen && video && videoSrc) {
      // Force settings on the DOM node directly to ensure Safari compliance
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
          console.warn("Autoplay was prevented on iOS Safari. Setting up interactive play listeners without passive flag:", err);
          
          const playOnInteraction = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  setHasStarted(true);
                  document.removeEventListener('touchstart', playOnInteraction);
                  document.removeEventListener('click', playOnInteraction);
                })
                .catch(e => console.error("Interactive fallback play failed:", e));
            }
          };
          
          document.addEventListener('touchstart', playOnInteraction, { passive: false });
          document.addEventListener('click', playOnInteraction, { passive: false });
        });
      }
    }
  }, [isOpen, videoSrc]);

  // Set safety timeout to close the overlay if it gets stuck or settings take too long to load
  useEffect(() => {
    if (!isOpen) return;

    const safetyTimeout = setTimeout(() => {
      dismissIntro();
    }, 12000); // 12 seconds max safety limit

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
      }, durationMs + 400); // 400ms buffer after video naturally finishes
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
          // If it fails to play even on tap, dismiss it as a fallback
          dismissIntro();
        });
    } else {
      // If already playing, tap anywhere on the screen skips the video and opens the site!
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
          className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center overflow-hidden select-none pointer-events-auto cursor-pointer"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
