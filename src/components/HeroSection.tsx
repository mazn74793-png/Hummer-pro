import React from 'react';
import { Flame, Compass, Gift, Sparkles, ChefHat, Star, MapPin, PhoneCall, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { IMAGES } from '../menuData';
import { SiteSettings } from '../types';

interface HeroSectionProps {
  onOpenWheel: () => void;
  lang: 'ar' | 'en';
  siteSettings: SiteSettings;
}

export default function HeroSection({ onOpenWheel, lang, siteSettings }: HeroSectionProps) {
  const isRtl = lang === 'ar';

  const handleScrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="py-10 bg-zinc-50 font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Responsive Bento Grid Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:grid-rows-3 min-h-[720px]">
          
          {/* Box 1: Main Hero Box (col-span-2 row-span-2) */}
          <div className="md:col-span-2 md:row-span-2 bg-red-600 rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-11 flex flex-col justify-between text-white overflow-hidden relative shadow-xl border border-red-700 min-h-[340px] md:min-h-[380px]">
            <div className="relative z-10 space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>
                  {isRtl 
                    ? (siteSettings?.heroBadgeAr || 'همر الأصلي دايماً يكسب') 
                    : (siteSettings?.heroBadgeEn || 'Original Hummer Taste')}
                </span>
              </motion.div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight italic uppercase tracking-tighter text-right">
                {isRtl ? (
                  <span className="block whitespace-pre-line text-white">
                    {siteSettings?.heroTitleAr || 'كريب وقرمشة ملوك همر!'}
                  </span>
                ) : (
                  <span className="block whitespace-pre-line text-white">
                    {siteSettings?.heroTitleEn || 'Crunch The King'}
                  </span>
                )}
              </h1>
              
              <p className="text-red-50 text-xs sm:text-base font-bold max-w-sm leading-relaxed text-right">
                {isRtl 
                  ? (siteSettings?.heroSubAr || 'أقوى كريبات ووجبات فراخ بروستد كريسبي نارية بالبهارات السحرية والجبنة السايحة المحضرة طازجة فور طلبك!') 
                  : (siteSettings?.heroSubEn || 'The most powerful fried chicken and folded crepes in the city. Sizzling hot, freshly pressed, and made daily.')}
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-6 relative z-10 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleScrollToId('menu')}
                className="px-5 py-3 bg-white text-red-600 hover:bg-neutral-100 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase"
              >
                <Compass className="w-4 h-4 text-red-600 animate-pulse" />
                <span>{isRtl ? 'تصفح المنيو' : 'Explore Menu'}</span>
              </button>

              <button
                onClick={() => handleScrollToId('branches')}
                className="px-5 py-3 bg-black/30 hover:bg-black/40 text-white rounded-2xl font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-red-500 fill-red-500/20" />
                <span>{isRtl ? 'فروعنا وتوصيلنا' : 'Our Branches'}</span>
              </button>
            </div>

            {/* Decorative giant "H" in background */}
            <div className="absolute -left-6 -bottom-12 opacity-10 text-[18rem] md:text-[24rem] font-black leading-none pointer-events-none italic select-none">
              H
            </div>
          </div>

          {/* Box 2: Featured Chicken Box (col-span-1 row-span-1) - Yellow Hummer Accent */}
          <div 
            onClick={() => handleScrollToId('menu')}
            className="hidden md:flex md:col-span-1 md:row-span-1 bg-amber-400 rounded-[2.5rem] p-6 flex-col justify-between border-4 border-black group cursor-pointer shadow-md hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start">
              <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {isRtl ? 'الأكثر طلباً' : 'Best Seller'}
              </span>
              <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-black group-hover:translate-x-1 hover:bg-black hover:text-amber-400 transition-all font-mono">
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </div>
            </div>
            
            <div className="mt-4 text-right">
              <h3 className="text-2xl font-black uppercase leading-tight italic text-zinc-950 font-sans">
                {isRtl ? <>فراخ <br />مقرمشة</> : <>Fried <br />Chicken</>}
              </h3>
              <p className="text-[10px] font-extrabold text-black/70 mt-1 uppercase tracking-wide">
                {isRtl ? 'بـ ۱۷ تابل وخلطة سحرية منفجرة' : 'Secret Hummer Spice Mix'}
              </p>
            </div>
          </div>

          {/* Box 3: Safe Fast Delivery Stat Box (col-span-1 row-span-1) */}
          <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl md:rounded-[2.5rem] p-6 flex flex-col justify-center items-center border border-zinc-200 text-center shadow-xs">
            <Zap className="w-10 h-10 text-amber-500 fill-amber-400 animate-pulse mb-2" />
            <div className="text-3xl font-black text-zinc-900 tracking-tighter">
              {isRtl ? (siteSettings?.deliveryTimeAr || '٣٥ دقيقة') : (siteSettings?.deliveryTimeEn || '35 MIN')}
            </div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
              {isRtl ? (siteSettings?.deliveryTimeSubAr || 'سرعة التوصيل وعمر الجريء طيار') : (siteSettings?.deliveryTimeSubEn || 'Average Delivery Time')}
            </div>
          </div>

          {/* Box 4: Featured Crepes Box (col-span-1 row-span-1) - Dark Slate Theme */}
          <div 
            onClick={() => handleScrollToId('menu')}
            className="hidden md:flex md:col-span-1 md:row-span-1 bg-zinc-900 rounded-[2.5rem] p-6 flex-col justify-between text-white border-b-8 border-red-600 shadow-lg cursor-pointer hover:bg-zinc-800 transition-all text-right"
          >
            <h3 className="text-2xl font-black uppercase leading-tight italic tracking-tight font-sans">
              {isRtl ? <>الكريبات <br />الذهبية</> : <>Golden <br />Crepes</>}
            </h3>
            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider mt-2">
              {isRtl ? 'عجب وموزاريلا مطبوخ ببرستيج' : 'Sweet & Savory perfection'}
            </p>
          </div>

          {/* Box 5: Star Reviews / Trust Badge Card (col-span-1 row-span-1) */}
          <div 
            onClick={() => handleScrollToId('reviews')}
            className="hidden md:flex md:col-span-1 md:row-span-1 bg-white rounded-[2.5rem] p-6 flex-col justify-between border border-zinc-200 shadow-xs cursor-pointer hover:border-red-600/40 transition-all text-right"
          >
            <div className="flex gap-0.5 text-amber-500 justify-end">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="mt-2">
              <p className="text-xs font-black text-zinc-800 leading-snug italic">
                {isRtl 
                  ? '"الكريب مقرمش والفراخ نضيفة جداً وتتبيلتها تفوق الخيال بجد أولاد البلد!"' 
                  : '"The crunchiest chicken folded crepe I\'ve ever had in Cairo!"'}
              </p>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-2">
                {isRtl ? '— أحمد الشافعي' : '— Ahmed S.'}
              </p>
            </div>
          </div>

          {/* Box 6: Wide Interactive Promo Wheel Shortcut (col-span-2 row-span-1) */}
          <div className="md:col-span-2 md:row-span-1 bg-zinc-100 rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 flex items-center justify-between border border-zinc-200 overflow-hidden relative shadow-xs min-h-[140px] md:min-h-[160px]">
            <div className="flex-1 text-right space-y-1 relative z-10">
              <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                {isRtl ? 'هدية الويكند الحارقة' : 'Weekend Mega Deal'}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight">
                {isRtl ? 'اكسب كريب مجاني بالكامل!' : 'Get a FREE Crepe!'}
              </h3>
              <p className="text-zinc-500 text-xs font-bold max-w-sm">
                {isRtl 
                  ? 'دير عجلة الحظ المضمونة همر واكسب كود خصم فوري أو مقبلات مجانية لطلبك.' 
                  : 'Spin our lucky winning wheel to snag extreme discounts or crispy free fries right away.'}
              </p>
              
              <button
                onClick={onOpenWheel}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5 animate-bounce" />
                <span>{isRtl ? 'العب واكسب الآن' : 'Spin Wheel Now'}</span>
              </button>
            </div>

            {/* Dashed Rotated Stamp Badge */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white text-red-600 rounded-full border-4 border-dashed border-red-600 flex items-center justify-center font-black text-lg sm:text-xl rotate-12 select-none shadow-xs ml-4 max-sm:hidden">
              {isRtl ? 'مجاناً!' : 'FREE!'}
            </div>
          </div>

          {/* Box 7: Urban Location & Hotline Section (col-span-2 row-span-1) */}
          <div 
            onClick={() => handleScrollToId('branches')}
            className="md:col-span-2 md:row-span-1 bg-white rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center border border-zinc-200 shadow-xs cursor-pointer hover:border-red-600/30 transition-all font-sans"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 text-right justify-between w-full">
              
              {/* Left element - Map detail */}
              <div className="flex items-center gap-4 order-2 sm:order-none">
                <div className="w-11 h-11 bg-zinc-900 rounded-2xl flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-zinc-900 flex items-center gap-1 justify-end sm:justify-start">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>{isRtl ? 'تفضل بزيارتنا' : 'Visit Branches'}</span>
                  </h4>
                  <p className="text-zinc-500 font-bold text-xs tracking-tight">
                    {isRtl ? (siteSettings?.addressSummaryAr || 'شارع عباس العقاد | المعادي شارع 9 | المنيل') : (siteSettings?.addressSummaryEn || 'Road 9, Maadi | Abbas Akkad St, Cairo')}
                  </p>
                </div>
              </div>

              {/* Right element - Hotline */}
              <div className="text-center sm:text-left self-stretch sm:self-auto border-b sm:border-b-0 pb-3 sm:pb-0 border-zinc-100 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest sm:order-none">
                  {isRtl ? 'دليفري سريع خط ساخن' : 'Hotline Call Center'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-red-600 flex items-center gap-1.5 font-mono">
                  <span>{siteSettings?.hotline || '19033'}</span>
                  <PhoneCall className="w-5 h-5 text-red-600" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
