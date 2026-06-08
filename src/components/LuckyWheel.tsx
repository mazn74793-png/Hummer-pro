import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Copy, Check, Volume2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LuckyWheelProps {
  onApplyGiftCode: (code: string, giftName: string) => void;
  lang: 'ar' | 'en';
  onClose: () => void;
}

const PRIZES = [
  { textAr: 'خصم ١٠٪ كود (HUMMER10)', textEn: '10% OFF Promo (HUMMER10)', code: 'HUMMER10', color: '#ea580c' },
  { textAr: 'بيبسي مثلج مجاناً (PEPSI)', textEn: 'Free Cold Pepsi (PEPSI)', code: 'PEPSI', color: '#1e3a8a' },
  { textAr: 'حظ سعيد المرة المقابلة!', textEn: 'Better luck next time!', code: '', color: '#18181b' },
  { textAr: 'خصم ٢٠٪ كود (MEGA20)', textEn: '20% OFF Promo (MEGA20)', code: 'MEGA20', color: '#b45309' },
  { textAr: 'سلطة كول سلو هدية (COLESLAW)', textEn: 'Free Sweet Coleslaw (COLESLAW)', code: 'COLESLAW', color: '#16a34a' },
  { textAr: 'بطاطس مقلية مجانية (FRIES)', textEn: 'Free Classic Fries (FRIES)', code: 'FRIES', color: '#d97706' },
];

export default function LuckyWheel({ onApplyGiftCode, lang, onClose }: LuckyWheelProps) {
  const isRtl = lang === 'ar';
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load spin state from LocalStorage to prevent multi-spins
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
    // Select a randomized sector. Avoid index 2 slightly (the 'luck' one) to satisfy hunger!
    const validIndices = [0, 1, 3, 4, 5];
    const targetIdx = validIndices[Math.floor(Math.random() * validIndices.length)];

    // Target angle calculations: we want 5 full rotations (1800 deg) plus the sector alignment
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-white border border-zinc-200 rounded-[2.5rem] p-6 text-center shadow-lg relative overflow-hidden text-[#18181b]"
      >
        {/* Background glow flares */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-red-600/5 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-amber-400/5 blur-[80px]" />

        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-200">
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 transition font-mono p-1 rounded-md text-sm cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center gap-1.5 text-right font-sans">
            <Gift className="w-5 h-5 text-red-600 animate-pulse" />
            <h3 className="font-sans font-black text-zinc-950 text-base">
              {isRtl ? 'عجلة حظ مطعم هامر 🎡' : 'Hummer Wheel of Fortune 🎡'}
            </h3>
          </div>
        </div>

        {/* Intro */}
        <p className="text-zinc-500 text-xs font-bold mb-6">
          {isRtl
            ? 'محتار تاكل إيه وعايز هدية؟ دير عجلة الحظ هامر الحصرية، المطبخ محضرلك هدايا فتاكة تضاف لسلة طلباتك فوراً!'
            : 'Confused what to order? Roll the premium Hummer Wheel. The Chef has prepared exciting rewards added directly to your active cart!'}
        </p>

        {/* WHEEL BODY WORKSPACE CONTAINER */}
        <div className="relative w-72 h-72 mx-auto mb-6 flex items-center justify-center">
          
          {/* Top Ticker Pointer */}
          <div className="absolute -top-2 z-35 transition-transform">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-600 filter drop-shadow-sm" />
            <div className="w-3 h-3 bg-white rounded-full mx-auto -mt-4 ring-2 ring-red-650" />
          </div>

          {/* Glowing ring overlay */}
          <div className="absolute inset-0 border-4 border-red-600/10 rounded-full scale-102 pointer-events-none" />

          {/* SVG Wheel Circle */}
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

                  const largeArc = 0;

                  const textAngle = startAngle + (angle / 2);
                  const textRadius = 26; 
                  const tx = textRadius * Math.cos(rad(textAngle));
                  const ty = textRadius * Math.sin(rad(textAngle));

                  return (
                    <g key={index}>
                      <path
                        d={`M0,0 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={prize.color}
                        className="transition-colors duration-300"
                      />
                      
                      <text
                        x={tx}
                        y={ty}
                        fill="#ffffff"
                        fontSize="3.8"
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

            {/* Core center node */}
            <div className="absolute inset-x-0 inset-y-0 m-auto w-10 h-10 bg-white rounded-full border-4 border-zinc-950 shadow-sm flex items-center justify-center font-display font-black text-zinc-950 text-[10px] z-10 select-none">
              هامر
            </div>
          </motion.div>
        </div>

        {/* Spin Actions and results */}
        <div className="space-y-4 text-right">
          <AnimatePresence mode="wait">
            {!wonPrize ? (
              <motion.button
                key="spin-btn"
                onClick={handleSpin}
                disabled={spinning || hasSpun}
                className={`py-3 px-8 rounded-xl w-full text-xs font-black flex items-center justify-center gap-2 border duration-200 cursor-pointer ${
                  spinning
                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                    : hasSpun
                    ? 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
                <span>
                  {spinning
                    ? isRtl ? 'جاري دوران الصاج وتجهيز الهدية...' : 'Spiced roller spinning...'
                    : hasSpun
                    ? isRtl ? 'تم إجراء الدورة اليوم!' : 'Already Spun Today!'
                    : isRtl ? 'اضغط لتشغيل عجلة الجريل!' : 'Spin the Grill Now!'}
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="result-banner"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-250 border-red-200 rounded-2xl space-y-3 font-sans text-xs text-right"
              >
                <p className="text-red-700 font-black">{isRtl ? 'مبارك! كسبت مع هامر:' : 'Congrats! You won:'}</p>
                <p className="text-base font-extrabold text-[#b45309]">
                  {isRtl ? wonPrize.textAr : wonPrize.textEn}
                </p>
                
                {wonPrize.code ? (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleCopy}
                      className="p-2.5 bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition cursor-pointer flex items-center justify-center"
                      title={isRtl ? 'نسخ كوبون الخصم' : 'Copy coupon code'}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 bg-zinc-50 p-2.5 rounded-xl text-center font-mono font-black text-sm text-zinc-900 border border-zinc-200 select-all tracking-widest uppercase">
                      {wonPrize.code}
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-[11px] block mt-1 leading-relaxed">
                    {isRtl
                      ? 'لا بأس في اللقمة القادمة! يمكنك طلب كريب سوبر هامر المقرمش الآن كونه لا يعوض!'
                      : 'Never mind, food makes everything better! Try our legendary Super Hummer Crepe.'}
                  </p>
                )}

                <p className="text-[10px] text-green-600 font-extrabold italic mt-1.5 block">
                  {isRtl 
                    ? '* تم إدراج هدية الخصم والرمز تلقائياً في سلة مشترياتك النشطة!' 
                    : '* Reward discount code linked into your checkout session automatically!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-900 block mx-auto underline font-sans font-bold cursor-pointer mt-2"
          >
            {isRtl ? 'إغلاق، العودة للمينو' : 'Close and explore menu'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
