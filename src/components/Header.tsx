import React, { useState, useEffect } from 'react';
import { ShoppingCart, Flame, PhoneCall, Gift, MapPin, Sparkles, Smartphone, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenWheel: () => void;
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  siteSettings: SiteSettings;
}

export default function Header({
  cartCount,
  onOpenCart,
  onOpenWheel,
  lang,
  setLang,
  activeTab,
  setActiveTab,
  siteSettings,
}: HeaderProps) {
  const isRtl = lang === 'ar';

  const [deviceMeta, setDeviceMeta] = useState<{ os: string; type: string; isPhone: boolean }>({
    os: 'PC / Large Screen',
    type: 'Desktop',
    isPhone: false
  });

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Keep visible at the very top of the page
      if (currentScrollY < 120) {
        setIsVisible(true);
      } else {
        // Hide on scroll down, show on scroll up
        if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const ua = navigator.userAgent;
    let os = 'Desktop App';
    let type = 'Desktop';
    let isPhone = false;

    if (/iPhone|iPod/.test(ua)) {
      os = 'Apple iPhone';
      type = 'iOS App';
      isPhone = true;
    } else if (/iPad/.test(ua)) {
      os = 'Apple iPad';
      type = 'Tablet';
      isPhone = true;
    } else if (/Android/i.test(ua)) {
      const isMobile = /Mobile/i.test(ua);
      os = isMobile ? 'Android Phone' : 'Android Tablet';
      type = isMobile ? 'Android OS' : 'Tablet OS';
      isPhone = isMobile;
    } else if (/Macintosh/i.test(ua)) {
      os = 'Apple macOS';
      type = 'macOS Desktop';
    } else if (/Windows/i.test(ua)) {
      os = 'Windows PC';
      type = 'Windows Desktop';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux Client';
      type = 'Linux Desktop';
    }

    setDeviceMeta({ os, type, isPhone });
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Dynamic Promo Banner - Simplified and Centered to avoid extreme width clutter */}
      <div className="bg-red-600 py-2.5 text-center text-xs font-black text-white px-4 relative shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-350 shrink-0" />
          <span className="tracking-wide">
            {isRtl 
              ? (siteSettings?.promoBannerAr || 'عروض الصيف من همر! خصم ١٠٪ على كل الكريبات بـ كود HUMMER10')
              : (siteSettings?.promoBannerEn || 'Summer Deals! 10% OFF all crepes with code HUMMER10')}
          </span>
          <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-white/70"></span>
          <span className="hidden sm:flex items-center gap-1.5 bg-red-700/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-red-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            {isRtl ? 'عجلة الحظ همر لايف!' : 'Hummer Wheel Live!'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo and Tagline matching layout with freshly generated branding logo */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <motion.img 
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
              src={siteSettings?.logoUrl || "/src/assets/images/hummer_logo_1780839326548.png"}
              alt="Hummer Brand Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl object-cover bg-zinc-950 shadow-md cursor-pointer"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tighter flex items-center gap-1 font-sans">
              {isRtl ? 'مطعم همر' : 'Hummer Restaurant'}
              <span className="text-red-700 text-[10px] font-black animate-pulse px-2 py-0.5 bg-red-50 rounded-md border border-red-200 tracking-wider">
                CRISPY
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
              {isRtl ? 'ملك الكريبات وأقوى فرخة وبطاطس مقرمشة' : 'King of Crepes & Best Crispy Chicken'}
            </p>
          </div>
        </div>

        {/* Header Actions & Detection System badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Device Detector Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-650 rounded-xl text-[10px] font-black uppercase tracking-wider select-none">
            {deviceMeta.isPhone ? <Smartphone className="w-3.5 h-3.5 text-zinc-500" /> : <Laptop className="w-3.5 h-3.5 text-zinc-500" />}
            <span>
              {isRtl ? 'الكشف تلقائياً:' : 'Auto Detect:'}{' '}
              <span className="text-red-600 font-extrabold">{deviceMeta.os}</span>
            </span>
          </div>

          {/* Lucky Wheel Fast Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenWheel}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-black shadow-sm hover:shadow transition-all border-2 border-black cursor-pointer"
          >
            <Gift className="w-4 h-4 animate-bounce text-black" />
            <span className="hidden sm:inline uppercase">{isRtl ? 'عجلة الحظ' : 'Lucky Wheel'}</span>
          </motion.button>

          {/* Lang Selector */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-750 bg-white hover:bg-zinc-50 hover:text-black font-black font-mono transition shadow-xs cursor-pointer"
          >
            {lang === 'ar' ? 'EN' : 'العربية'}
          </button>

          {/* Cart Icon in Light Minimal style */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCart}
            className="relative p-2.5 bg-zinc-100 border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-red-500 text-zinc-900 transition-all shadow-xs cursor-pointer"
            id="cart-trigger-button"
          >
            <ShoppingCart className="w-5 h-5 text-zinc-900" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black font-mono h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center shadow-md animate-bounce"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Marquee Ticker CSS injection on the fly */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        [dir="rtl"] .animate-marquee {
          animation: marquee 30s linear infinite reverse;
        }
      `}</style>
    </header>
  );
}
