import React, { useState, useEffect } from 'react';
import { ShoppingCart, Flame, PhoneCall, Gift, MapPin, Sparkles, Smartphone, Laptop, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';
import defaultLogo from '../assets/images/hummer_logo_1780839326548.png';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenWheel: () => void;
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  siteSettings: SiteSettings;
  onOpenProfile: () => void;
  isRealAdmin?: boolean;
  onOpenAdmin?: () => void;
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
  onOpenProfile,
  isRealAdmin = false,
  onOpenAdmin,
}: HeaderProps) {
  const isRtl = lang === 'ar';

  const getLogoSrc = (): string => {
    const url = siteSettings?.logoUrl;
    if (!url) return defaultLogo;
    const cleanUrl = url.trim();
    if (cleanUrl === '' || cleanUrl === 'null' || cleanUrl === 'undefined' || cleanUrl === 'local-db:logoUrl' || cleanUrl.startsWith('local-db:')) {
      return defaultLogo;
    }
    return cleanUrl;
  };

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
      <div className="bg-red-600 py-1.5 text-center text-[11px] font-black text-white px-4 relative shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-350 shrink-0" />
          <span className="tracking-wide">
            {isRtl 
              ? (siteSettings?.promoBannerAr || 'عروض الصيف من هامر! خصم ١٠٪ على كل الكريبات بـ كود HUMMER10')
              : (siteSettings?.promoBannerEn || 'Summer Deals! 10% OFF all crepes with code HUMMER10')}
          </span>
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-white/70"></span>
          <span className="hidden sm:flex items-center gap-1 bg-red-700/80 px-1.5 py-0.5 rounded text-[9px] font-extrabold border border-red-500">
            <Sparkles className="w-3 h-3 text-amber-300 animate-bounce" />
            {isRtl ? 'عجلة الحظ هامر لايف!' : 'Hummer Wheel Live!'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-1.5 flex items-center justify-between">
        {/* Logo and Tagline matching layout with freshly generated branding logo */}
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <motion.img 
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.02 }}
              transition={{ duration: 0.5 }}
              src={getLogoSrc()}
              alt="Hummer Brand Logo"
              referrerPolicy="no-referrer"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-contain bg-zinc-950 shadow-lg p-1 cursor-pointer border border-zinc-800"
            />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-zinc-900 tracking-tighter flex items-center gap-1 font-sans leading-none">
              {isRtl ? 'مطعم هامر' : 'Hummer Restaurant'}
              <span className="text-red-700 text-[8px] sm:text-[8.5px] font-black animate-pulse px-1 sm:px-1.5 py-0.2 bg-red-50 rounded border border-red-200 tracking-wider">
                CRISPY
              </span>
            </h1>
            <p className="text-[8px] sm:text-[9px] text-zinc-400 font-bold uppercase tracking-wide mt-0.5">
              {isRtl ? 'ملك الكريبات وأقوى فرخة وبطاطس مقرمشة' : 'King of Crepes & Best Crispy Chicken'}
            </p>
          </div>
        </div>

        {/* Header Actions & Detection System badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Device Detector Pill */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-650 rounded-lg text-[9px] font-black uppercase tracking-wider select-none">
            {deviceMeta.isPhone ? <Smartphone className="w-3 h-3 text-zinc-500" /> : <Laptop className="w-3 h-3 text-zinc-500" />}
            <span>
              {isRtl ? 'الكشف تلقائياً:' : 'Auto Detect:'}{' '}
              <span className="text-red-600 font-extrabold">{deviceMeta.os}</span>
            </span>
          </div>



          {/* Lang Selector */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-zinc-200 text-[10px] sm:text-xs text-zinc-750 bg-white hover:bg-zinc-50 hover:text-black font-black font-mono transition shadow-xs cursor-pointer"
          >
            {lang === 'ar' ? 'EN' : 'العربية'}
          </button>

          {/* Golden Lucky Wheel Scroll Redirect Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const el = document.getElementById('lucky-wheel-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-lg text-[10px] sm:text-xs transition shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1 border border-amber-600"
            title={isRtl ? 'اذهب لعجلة الحظ واربح جائزة!' : 'Go to Lucky Wheel & win prizes!'}
          >
            <Gift className="w-3.5 h-3.5 animate-bounce shrink-0" />
            <span className="hidden sm:inline">{isRtl ? 'عجلة الحظ' : 'Lucky Wheel'}</span>
          </motion.button>

          {/* Account Profile Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenProfile}
            className="p-1 sm:p-1.5 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-300 text-red-650 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            title={isRtl ? 'حساب الأكيل والتتبع حي' : 'My Account & Live Track'}
          >
            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-600 shrink-0" />
            <span className="hidden md:inline text-[10px] sm:text-xs font-black text-red-700">{isRtl ? 'حساب الأكيل' : 'My Profile'}</span>
          </motion.button>

          {/* Cart Icon in Light Minimal style */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCart}
            className="relative p-1 sm:p-1.5 bg-zinc-100 border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-red-500 text-zinc-900 transition-all shadow-xs cursor-pointer"
            id="cart-trigger-button"
          >
            <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-900" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] sm:text-[9px] font-black font-mono h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-md animate-bounce"
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
