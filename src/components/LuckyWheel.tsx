import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteSettings } from '../types';

interface LuckyWheelProps {
  onApplyGiftCode: (code: string, giftName: string) => void;
  lang: 'ar' | 'en';
  siteSettings?: SiteSettings;
}

export default function LuckyWheel({ onApplyGiftCode, lang, siteSettings }: LuckyWheelProps) {
  const isRtl = lang === 'ar';
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate sector segments dynamically from siteSettings coupons!
  const dynamicCoupons = siteSettings?.coupons || [];
  const activeCoupons = dynamicCoupons.filter(c => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = c.expiryDate && todayStr > c.expiryDate;
    const isLimitExceeded = c.limit > 0 && c.usedCount >= c.limit;
    return !isExpired && !isLimitExceeded;
  });

  // Maximum of 6 prize slots
  const PRIZES: { textAr: string; textEn: string; code: string; color: string }[] = [];
  
  activeCoupons.slice(0, 5).forEach((c, idx) => {
    const textAr = c.giftType === 'discount' 
      ? `خصم ${c.discountPercent}% (${c.code})` 
      : `هدية (${c.giftItem === 'PEPSI' ? 'بيبسي' : c.giftItem === 'FRIES' ? 'بطاطس' : 'كول سلو'}) (${c.code})`;
    const textEn = c.giftType === 'discount' 
      ? `${c.discountPercent}% OFF (${c.code})` 
      : `Free ${c.giftItem} (${c.code})`;
    
    // Contrasting colors
    const colors = ['#ea580c', '#1e3a8a', '#b45309', '#16a34a', '#d97706'];
    PRIZES.push({
      textAr,
      textEn,
      code: c.code,
      color: colors[idx % colors.length]
    });
  });

  // Default hardcoded fallbacks to guarantee exactly 6 sectors
  const defaultFallbacks = [
    { textAr: 'خصم ١٠٪ كود (HUMMER10)', textEn: '10% OFF Promo (HUMMER10)', code: 'HUMMER10', color: '#ea580c' },
    { textAr: 'بيبسي مثلج مجاناً (PEPSI)', textEn: 'Free Cold Pepsi (PEPSI)', code: 'PEPSI', color: '#1e3a8a' },
    { textAr: 'حظ سعيد المرة المقابلة!', textEn: 'Better luck next time!', code: '', color: '#18181b' },
    { textAr: 'خصم ٢٠٪ كود (MEGA20)', textEn: '20% OFF Promo (MEGA20)', code: 'MEGA20', color: '#b45309' },
    { textAr: 'سلطة كول سلو هدية (COLESLAW)', textEn: 'Free Coleslaw (COLESLAW)', code: 'COLESLAW', color: '#16a34a' },
    { textAr: 'بطاطس مقلية مجانية (FRIES)', textEn: 'Free Classic Fries (FRIES)', code: 'FRIES', color: '#d97706' },
  ];

  while (PRIZES.length < 6) {
    const nextFallback = defaultFallbacks[PRIZES.length];
    if (!PRIZES.some(p => p.code === nextFallback.code)) {
      PRIZES.push(nextFallback);
    } else {
      PRIZES.push({ textAr: 'حظ سعيد الغيب!', textEn: 'Better luck next time!', code: '', color: '#18181b' });
    }
  }

  useEffect(() => {
    const spun = localStorage.getItem('hummer_wheel_spun');
    if (spun === 'true') {
      setHasSpun(true);
      const savedIndex = localStorage.getItem('hummer_wheel_prize_index');
      if (savedIndex !== null) {
        setWinningIndex(parseInt(savedIndex, 10));
      }
    }
  }, []);

  const handleSpin = () => {
    if (spinning || hasSpun) return;

    setSpinning(true);
    // Select valid indices (prefer winning sectors, avoid index with empty code if possible)
    const validIndices = PRIZES.map((p, idx) => p.code ? idx : -1).filter(idx => idx !== -1);
    const fallbackIndices = PRIZES.map((_, idx) => idx);
    const targetSelection = validIndices.length > 0 ? validIndices : fallbackIndices;
    const targetIdx = targetSelection[Math.floor(Math.random() * targetSelection.length)];

    const sectorAngle = 360 / PRIZES.length;
    // Align so the ticker pointer arrow at top center (90 deg) points to it
    const extraOffset = 360 - (targetIdx * sectorAngle) - (sectorAngle / 2);
    const finalRotation = 2160 + extraOffset; // 6 spins + offset

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinningIndex(targetIdx);
      setHasSpun(true);
      localStorage.setItem('hummer_wheel_spun', 'true');
      localStorage.setItem('hummer_wheel_prize_index', targetIdx.toString());

      const wonPrize = PRIZES[targetIdx];
      if (wonPrize.code) {
        onApplyGiftCode(wonPrize.code, isRtl ? wonPrize.textAr : wonPrize.textEn);
      }
    }, 5000); // 5s spin duration
  };

  const wonPrize = winningIndex !== null ? PRIZES[winningIndex] : null;

  const handleCopy = () => {
    if (wonPrize && wonPrize.code) {
      navigator.clipboard.writeText(wonPrize.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4 text-right" dir={isRtl ? 'rtl' : 'ltr'} id="lucky-wheel-section">
      <div className="bg-white border-2 border-red-600/10 rounded-[2.5rem] p-6 md:p-10 text-center shadow-lg relative overflow-hidden text-[#18181b]">
        {/* Background glow flares */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-red-600/5 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-yellow-400/5 blur-[80px]" />

        {/* Section Header */}
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-bounce">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-black text-zinc-950 text-xl md:text-2xl mt-2 select-none">
            {isRtl ? 'عجلة الحظ التفاعلية من هامر 🎡' : 'Dynamic Hummer Wheel of Fortune 🎡'}
          </h3>
          <p className="text-zinc-500 text-xs font-bold max-w-xl text-center leading-relaxed">
            {isRtl
              ? 'محتار تاكل إيه وعايز هدية؟ دير عجحة الحظ الاستثنائية الحين! العجلة متصلة مباشرة بلوحة الإدارة، والطهي مجهزلك هدايا تضاف لسلتك فوراً!'
              : 'Unsure what to order today? Roll the active chef wheel to reveal dynamic discounts and rewards linked directly into your checkout flow.'}
          </p>
        </div>

        {/* Flat Grid Layout with wheel and settings details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          
          {/* Column 1: Custom Vector SVG Wheel */}
          <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
            {/* Top Pointer */}
            <div className="absolute -top-2 z-20 transition-transform">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-650" />
              <div className="w-3 h-3 bg-white rounded-full mx-auto -mt-4 ring-2 ring-red-650" />
            </div>

            <div className="absolute inset-0 border-4 border-red-600/10 rounded-full scale-102 pointer-events-none" />

            <motion.div
              style={{ rotate: rotation }}
              animate={spinning ? undefined : { rotate: rotation }}
              transition={{ duration: 5, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-64 h-64 rounded-full shadow-md relative select-none cursor-pointer overflow-hidden border-4 border-zinc-900"
            >
              <svg viewBox="0 0 100 100" className="w-[100%] h-[100%]">
                <g transform="translate(50, 50)">
                  {PRIZES.map((prize, index) => {
                    const angle = 360 / PRIZES.length;
                    const startAngle = index * angle;
                    const endAngle = startAngle + angle;
                    
                    const rad = (deg: number) => (deg - 90) * Math.PI / 180;
                    const x1 = 50 * Math.cos(rad(startAngle));
                    const y1 = 50 * Math.sin(rad(startAngle));
                    const x2 = 50 * Math.cos(rad(endAngle));
                    const y2 = 50 * Math.sin(rad(endAngle));

                    const textAngle = startAngle + (angle / 2);
                    const textRadius = 26; 
                    const tx = textRadius * Math.cos(rad(textAngle));
                    const ty = textRadius * Math.sin(rad(textAngle));

                    return (
                      <g key={index}>
                        <path
                          d={`M0,0 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                          fill={prize.color}
                          className="transition-colors duration-300"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize="3.6"
                          fontWeight="900"
                          textAnchor="middle"
                          transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                          className="font-sans select-none"
                        >
                          {isRtl ? prize.textAr.split(' ')[0] : prize.textEn.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Center Cap */}
              <div className="absolute inset-x-0 inset-y-0 m-auto w-10 h-10 bg-white rounded-full border-4 border-zinc-950 shadow-sm flex items-center justify-center font-sans font-black text-zinc-950 text-[10px] z-10 select-none">
                {isRtl ? 'هامر' : 'HMR'}
              </div>
            </motion.div>
          </div>

          {/* Column 2: Interactive Actions Area */}
          <div className="space-y-6 text-center md:text-right flex flex-col justify-center">
            <h4 className="text-sm font-black text-zinc-900 hidden md:block select-none">
              {isRtl ? 'ابدأ كسب هدية اليوم الآن:' : 'Roll to redeem coupon:'}
            </h4>
            
            <AnimatePresence mode="wait">
              {!wonPrize ? (
                <motion.button
                  key="spin-btn"
                  onClick={handleSpin}
                  disabled={spinning || hasSpun}
                  className={`py-3.5 px-8 rounded-2xl w-full text-xs font-black flex items-center justify-center gap-2 border duration-200 cursor-pointer ${
                    spinning
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : hasSpun
                      ? 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-lg active:scale-98'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                  <span>
                    {spinning
                      ? isRtl ? 'جاري تدوير جريل الحظ...' : 'Grill roller spinning...'
                      : hasSpun
                      ? isRtl ? 'لقد انتهت دورتك اليوم!' : 'Spun already!'
                      : isRtl ? 'اضغط لتشغيل عجلة الجريل الكسبانة! 🔥' : 'Spin the Grill Now! 🔥'}
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  key="result-banner"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-red-50 border border-red-200 rounded-3xl space-y-4 text-right flex flex-col items-stretch"
                >
                  <p className="text-red-700 font-extrabold text-xs block">
                    {isRtl ? '🎁 تهانينا! كسبت الهدية التالية:' : '🎁 Congratulations! You won:'}
                  </p>
                  <p className="text-lg font-black text-red-600 leading-tight">
                    {isRtl ? wonPrize.textAr : wonPrize.textEn}
                  </p>
                  
                  {wonPrize.code ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className="p-3 bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                          title={isRtl ? 'نسخ الكوبون' : 'Copy code'}
                        >
                          {copied ? <Check className="w-4.5 h-4.5 text-green-600" /> : <Copy className="w-4.5 h-4.5" />}
                        </button>
                        <div className="flex-1 bg-zinc-50 p-2.5 rounded-xl text-center font-mono font-black text-base text-zinc-950 border border-zinc-200 select-all tracking-widest uppercase shadow-inner">
                          {wonPrize.code}
                        </div>
                      </div>
                      <p className="text-[10px] text-green-600 font-black text-right block mt-1.5 animate-pulse">
                        {isRtl 
                          ? '* تم إضافتها تلقائياً لطلبك! افتح سلة المشتريات للتحقق.' 
                          : '* Linked to your checkout profile! Open basket to confirm.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-xs font-semibold block leading-relaxed">
                      {isRtl
                        ? 'شكراً لتجربتك! لا داعي للقلق، كريبات هامر الشهيرة لا تحتاج لعروض لتأكل بشغف تذوق الحين.'
                        : 'Thanks for playing! Food makes everything better anyway.'}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-zinc-100 pt-4 flex flex-wrap justify-center md:justify-end gap-4 text-[10px] text-zinc-400 font-semibold select-none">
              <span>{isRtl ? '● ربط لايف مع الإدارة والمسؤولين' : '● Live linked admin sync'}</span>
              <span>{isRtl ? '● كود واحد لكل زبون باليوم' : '● 1 spin per customer daily'}</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
