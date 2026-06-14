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
          console.warn("Autoplay was prevented on iOS Safari. Setup seamless click/touch fallback listener:", err);
          
          const playOnInteraction = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  setHasStarted(true);
                  document.removeEventListener('touchstart', playOnInteraction);
                  document.removeEventListener('click', playOnInteraction);
                })
                .catch(e => console.error("Interaction play attempt failed:", e));
            }
          };
          
          document.addEventListener('touchstart', playOnInteraction, { passive: true });
          document.addEventListener('click', playOnInteraction, { passive: true });
        });
      }
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

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => {
          setHasStarted(true);
        })
        .catch(() => {
          // If it fails to play on tap, dismiss it as safety measure
          setHasDismissed(true);
        });
    } else {
      // If already playing, tap anywhere to skip/dismiss!
      setHasDismissed(true);
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
                setHasDismissed(true);
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              id="intro-cinematic-video"
            />
          )}
          
          {/* Unmuted Helper hint overlay only visible if video fails to play automatically */}
          {!hasStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-2xl text-white space-y-4"
              >
                <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  🎬
                </div>
                <h4 className="text-sm font-black tracking-tight">
                  {isRtl ? 'اضغط أي مكان لتشغيل الفيديو ومواصلة التصفح' : 'Tap anywhere to start cinematic intro'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {isRtl 
                    ? 'نظراً لقيود أجهزة iPhone ومتصفحات Safari، يرجى لمس الشاشة للبدء فوراً.'
                    : 'Due to Safari & iOS browser media policies, a tap is required to start.'}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
