import React, { useState } from 'react';
import { Plus, Flame, Sparkles, ChefHat, CheckCircle2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CUSTOMIZE_INGREDIENTS } from '../menuData';

interface CrepeCustomizerProps {
  onAddCustomCrepe: (customDetails: {
    nameAr: string;
    nameEn: string;
    totalPrice: number;
    description: string;
    items: { nameAr: string; nameEn: string; price: number }[];
  }) => void;
  lang: 'ar' | 'en';
}

export default function CrepeCustomizer({ onAddCustomCrepe, lang }: CrepeCustomizerProps) {
  const isRtl = lang === 'ar';

  // State selection
  const [selectedBase, setSelectedBase] = useState(CUSTOMIZE_INGREDIENTS.bases[0]);
  const [selectedFillings, setSelectedFillings] = useState<typeof CUSTOMIZE_INGREDIENTS.fillings>([]);
  const [selectedToppings, setSelectedToppings] = useState<typeof CUSTOMIZE_INGREDIENTS.toppings>([]);
  const [selectedSauces, setSelectedSauces] = useState<typeof CUSTOMIZE_INGREDIENTS.sauces>([]);
  const [customName, setCustomName] = useState<string>('');
  const [isSuccessfullyAdded, setIsSuccessfullyAdded] = useState(false);

  // Toggle helpers
  const toggleFilling = (filling: typeof CUSTOMIZE_INGREDIENTS.fillings[0]) => {
    if (selectedFillings.some(f => f.id === filling.id)) {
      setSelectedFillings(selectedFillings.filter(f => f.id !== filling.id));
    } else {
      setSelectedFillings([...selectedFillings, filling]);
    }
  };

  const toggleTopping = (topping: typeof CUSTOMIZE_INGREDIENTS.toppings[0]) => {
    if (selectedToppings.some(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const toggleSauce = (sauce: typeof CUSTOMIZE_INGREDIENTS.sauces[0]) => {
    if (selectedSauces.some(s => s.id === sauce.id)) {
      setSelectedSauces(selectedSauces.filter(s => s.id !== sauce.id));
    } else {
      if (selectedSauces.length >= 4) return; // limit to 4 sauces for flavor balance
      setSelectedSauces([...selectedSauces, sauce]);
    }
  };

  const handleReset = () => {
    setSelectedBase(CUSTOMIZE_INGREDIENTS.bases[0]);
    setSelectedFillings([]);
    setSelectedToppings([]);
    setSelectedSauces([]);
    setCustomName('');
  };

  // Prices calculation
  const baseCost = selectedBase.price;
  const fillingsCost = selectedFillings.reduce((sum, f) => sum + f.price, 0);
  const toppingsCost = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const saucesCost = selectedSauces.reduce((sum, s) => sum + s.price, 0);
  const totalCrepePrice = baseCost + fillingsCost + toppingsCost + saucesCost;

  // Compile summary details for cart
  const handleSubmit = () => {
    const formattedNameAr = customName.trim() 
      ? `كريب هامر: ${customName}` 
      : `كريب مبتكر مخصص (${selectedBase.nameAr.slice(0, 9)})`;
    const formattedNameEn = customName.trim() 
      ? `Hummer Crepe: ${customName}` 
      : `Custom Crepe (${selectedBase.nameEn.slice(0, 10)})`;

    // Flatten lists
    const addons = [
      { nameAr: selectedBase.nameAr, nameEn: selectedBase.nameEn, price: selectedBase.price },
      ...selectedFillings.map(f => ({ nameAr: f.nameAr, nameEn: f.nameEn, price: f.price })),
      ...selectedToppings.map(t => ({ nameAr: t.nameAr, nameEn: t.nameEn, price: t.price })),
      ...selectedSauces.map(s => ({ nameAr: s.nameAr, nameEn: s.nameEn, price: s.price }))
    ];

    const description = [
      ...selectedFillings.map(f => (isRtl ? f.nameAr : f.nameEn)),
      ...selectedToppings.map(t => (isRtl ? t.nameAr : t.nameEn)),
      ...selectedSauces.map(s => (isRtl ? s.nameAr : s.nameEn))
    ].join(', ');

    onAddCustomCrepe({
      nameAr: formattedNameAr,
      nameEn: formattedNameEn,
      totalPrice: totalCrepePrice,
      description,
      items: addons
    });

    setIsSuccessfullyAdded(true);
    setTimeout(() => {
      setIsSuccessfullyAdded(false);
      handleReset();
    }, 2500);
  };

  return (
    <section id="customize" className="py-16 bg-zinc-100 border-y border-zinc-200 overflow-hidden text-[#18181b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-650 text-xs font-black mb-4">
            <ChefHat className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="text-red-700 tracking-wide uppercase">{isRtl ? 'افتح المعمل وصمم وجبتك على ذوقك' : 'Open the Lab and Craft Custom Crepe'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-sans tracking-tight">
            {isRtl ? 'مصنع كريبات هامر التفاعلي' : 'Interactive Hummer Crepe Lab'}
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-2 leading-relaxed">
            {isRtl 
              ? 'اختر لقمة الأساس، احشوها بأقوى حشوات الكريسبي الطازة والجبن السايح، رش toppings المفضل، دبل صوصاتك واستلم كريب خارق ينسيك الدنيا!'
              : 'Choose the base, fill it up with crispy tenders, add premium stretchy cheeses, select fresh toppings, double down on sauces, and order your dream crepe!'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Visual Interactive Cooking Canvas (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] border border-zinc-200 relative min-h-[460px] shadow-xs">
            {/* Aesthetic circular grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none rounded-[2.5rem]" />
            <div className="absolute top-5 right-6 text-[10px] text-zinc-400 font-black tracking-widest uppercase">
              {isRtl ? 'مطبخ هامر للمحاكاة الفورية' : 'HUMMER LIVE PREVIEW PANEL'}
            </div>

            {/* Custom Crepe Canvas Render */}
            <div className="relative w-72 h-72 flex items-center justify-center my-4 overflow-hidden rounded-full">
              
              {/* Outer circular spinning indicator representing hot griddle */}
              <div className="absolute inset-x-0 inset-y-0 border border-dashed border-amber-600/20 rounded-full animate-spin-slow pointer-events-none" />

              {/* Stacked Interactive Graphic Crepe Body */}
              <motion.div 
                layout
                animate={{ scale: [0.98, 1.02, 0.98], rotate: selectedBase.id === 'cb-sweet' ? 2 : -2 }}
                transition={{ duration: 6, repeat: Infinity }}
                className="relative w-64 h-64 flex items-center justify-center shadow-lg rounded-full"
                style={{ 
                  clipPath: 'polygon(50% 10%, 100% 100%, 0% 100%)', // Crisp cone wedge fold
                  transform: 'rotate(180deg)' // folded crepe sits downwards
                }}
              >
                {/* Toasted Crepe Pastry Surface Layer */}
                <div className={`absolute inset-0 transition-all duration-500 ${
                  selectedBase.id === 'cb-sweet'
                    ? 'bg-gradient-to-b from-[#e8c392] via-[#f7ddb2] to-[#daad6e]'
                    : 'bg-gradient-to-b from-[#df9d43] via-[#e8b571] to-[#cf8832]'
                }`} />
                {/* Grill / toasted spots simulation */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#af7326_2px,transparent_3px)] [background-size:24px_24px]" />
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6c3f0b_3px,transparent_4px)] [background-size:40px_40px] [background-position:10px_10px]" />
              </motion.div>

              {/* Floating Ingredient Indicators overlay */}
              <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-1.5 p-3 pointer-events-none">
                <AnimatePresence>
                  {/* Floating base badge */}
                  <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="px-2.5 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg shadow-sm z-10 block border border-red-700"
                  >
                    {isRtl ? selectedBase.nameAr : selectedBase.nameEn}
                  </motion.span>

                  {/* Floatings for fillings */}
                  {selectedFillings.map((filling, idx) => (
                    <motion.span
                      key={filling.id}
                      initial={{ scale: 0, y: -20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0, y: 20, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-2 py-0.5 bg-zinc-900 text-white text-[9px] font-black rounded-lg shadow-sm z-20 flex items-center gap-1"
                    >
                      {isRtl ? (filling.nameAr.split(' ')[1] || filling.nameAr) : filling.nameEn}
                    </motion.span>
                  ))}

                  {/* Floatings for toppings */}
                  {selectedToppings.map((topping, idx) => (
                    <motion.span
                      key={topping.id}
                      initial={{ scale: 0, x: -10, opacity: 0 }}
                      animate={{ scale: 1, x: 0, opacity: 1 }}
                      exit={{ scale: 0, x: 10, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-2 py-0.5 bg-amber-400 text-black border border-black text-[9px] font-black rounded-lg shadow-sm z-30 flex items-center gap-1"
                    >
                      {isRtl ? topping.nameAr : topping.nameEn}
                    </motion.span>
                  ))}

                  {/* Floatings for sauces */}
                  {selectedSauces.map((sauce, idx) => (
                    <motion.span
                      key={sauce.id}
                      initial={{ scale: 0, y: 15, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0, y: -15, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="px-2 py-0.5 bg-red-100 text-red-650 border border-red-300 text-[9px] font-black rounded-lg shadow-sm z-40 flex items-center gap-1"
                    >
                      {isRtl ? sauce.nameAr : sauce.nameEn}
                    </motion.span>
                  ))}
                </AnimatePresence>
                
                {/* Empty State Banner in Visual crepe */}
                {selectedFillings.length === 0 && selectedToppings.length === 0 && selectedSauces.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                    <p className="text-xs font-black font-sans uppercase tracking-wider text-zinc-650">
                      {isRtl ? 'صاج الكريب جاهز للتعبئة!' : 'Griddle is preheated!'}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {isRtl ? 'اختر حشوتك وصنف كريبك المفضل من القائمة الجانبية' : 'Pick items below to load the crust'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Price block and add action */}
            <div className="w-full mt-6 space-y-4 pt-4 border-t border-zinc-200">
              {/* Optional Name Box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block text-right uppercase tracking-wider">
                  {isRtl ? 'أعطِ اسمًا لإبتكارك (اختياري):' : 'Name your invention (Optional):'}
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={isRtl ? 'مثال: السوبر فاهيتا، قنبلة الأسبوع...' : 'e.g. Big Cheesy Blast, Chili Max...'}
                  className="w-full px-4 py-2.5 bg-zinc-50 text-zinc-950 rounded-xl text-xs border border-zinc-200 font-sans font-bold outline-none focus:border-red-600 placeholder-zinc-400"
                />
              </div>

              {/* Total Calculation breakdown inline */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-black uppercase tracking-wider">
                  {isRtl ? 'خصائص الكريب المقدرة:' : 'Total Lab Surcharge:'}
                </span>
                <span className="text-2xl font-mono font-black text-zinc-900">
                  {totalCrepePrice} <span className="text-xs text-red-600 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={handleReset}
                  className="p-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-2xl transition cursor-pointer"
                  title={isRtl ? 'تصفير الحشوات' : 'Reset Customizer'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={selectedFillings.length === 0 || isSuccessfullyAdded}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border duration-300 transition-all ${
                    isSuccessfullyAdded
                      ? 'bg-green-600 border-green-700 text-white'
                      : selectedFillings.length === 0
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                      : 'bg-red-600 hover:bg-red-700 text-white border-red-700 cursor-pointer shadow-xs hover:shadow-md'
                  }`}
                >
                  {isSuccessfullyAdded ? (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5 animate-bounce" />
                      <span>{isRtl ? 'أُرسل الكريب للمطبخ والسلة!' : 'Crepe Add to Order!'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4.5 h-4.5" />
                      <span>
                        {isRtl ? 'أضف كريبك المبتكر للسلة' : 'Add Custom Crepe to Cart'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Detailed Options Selectors (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Base Select */}
            <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-3 shadow-xs">
              <h3 className="text-xs font-black text-zinc-800 flex items-center gap-1.5 font-sans uppercase tracking-wider">
                <span className="w-1.5 h-3.5 bg-red-600 rounded-full inline-block"></span>
                {isRtl ? '١. لقمة عينة الكريب الأساسية:' : '1. Crepe Outer Dough Base:'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CUSTOMIZE_INGREDIENTS.bases.map((base) => {
                  const isSel = selectedBase.id === base.id;
                  return (
                    <button
                       key={base.id}
                       onClick={() => setSelectedBase(base)}
                       className={`p-3.5 rounded-2xl border text-right transition-all flex justify-between items-center cursor-pointer ${
                         isSel
                           ? 'border-red-650 border-red-600 bg-red-50 text-red-600 font-black shadow-xs'
                           : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
                       }`}
                    >
                      <div className="font-sans text-xs">
                        <p className="font-black">{isRtl ? base.nameAr : base.nameEn}</p>
                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                          {isRtl ? 'رول ذهبي مرن محمص' : 'Crisp and satisfying roll'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-black text-red-600">{base.price} ج.م</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Main Fillings Select */}
            <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-3 shadow-xs">
              <h3 className="text-xs font-black text-zinc-800 flex items-center gap-1.5 font-sans uppercase tracking-wider">
                <span className="w-1.5 h-3.5 bg-red-600 rounded-full inline-block"></span>
                {isRtl ? '٢. حدد حشوتك الرئيسية (حرة اختيار متعدد):' : '2. Load Main Fillings (Select Multiple):'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUSTOMIZE_INGREDIENTS.fillings.map((filling) => {
                  const isSel = selectedFillings.some(f => f.id === filling.id);
                  return (
                    <button
                      key={filling.id}
                      onClick={() => toggleFilling(filling)}
                      className={`p-3 rounded-xl border text-right transition-all flex justify-between items-center cursor-pointer ${
                        isSel
                          ? 'border-red-600 bg-red-50 text-red-600 font-black'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-[#18181b]'
                      }`}
                    >
                      <div className="font-sans text-xs flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSel ? 'bg-red-600 border-red-700 text-white' : 'border-zinc-300 bg-white'
                        }`}>
                          {isSel && <span className="text-[9px] font-black">✓</span>}
                        </div>
                        <span>{isRtl ? filling.nameAr : filling.nameEn}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-zinc-400">+{filling.price} ج.م</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Toppings Select */}
            <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-3 shadow-xs">
              <h3 className="text-xs font-black text-zinc-800 flex items-center gap-1.5 font-sans uppercase tracking-wider">
                <span className="w-1.5 h-3.5 bg-red-600 rounded-full inline-block"></span>
                {isRtl ? '٣. رش إضافاتك المفضلة (Toppings):' : '3. Sprinkle Fresh Toppings/Sides:'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUSTOMIZE_INGREDIENTS.toppings.map((topping) => {
                  const isSel = selectedToppings.some(t => t.id === topping.id);
                  return (
                    <button
                      key={topping.id}
                      onClick={() => toggleTopping(topping)}
                      className={`p-3 rounded-xl border text-right transition-all flex justify-between items-center cursor-pointer ${
                        isSel
                          ? 'border-amber-400 bg-amber-50 text-black font-black'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <div className="font-sans text-xs flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSel ? 'bg-black border-black text-white' : 'border-zinc-300 bg-white'
                        }`}>
                          {isSel && <span className="text-[9px] font-black">✓</span>}
                        </div>
                        <span>{isRtl ? topping.nameAr : topping.nameEn}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-zinc-400">+{topping.price} ج.م</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Sauces Select */}
            <div className="bg-white border border-zinc-200 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-zinc-800 flex items-center gap-1.5 font-sans uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-red-600 rounded-full inline-block"></span>
                  {isRtl ? '٤. دبل صوصات هامر الساحرة (الحد أقصى ٤):' : '4. Drizzle Secret Glazes/Sauces (Max 4):'}
                </h3>
                <span className="text-[10px] text-zinc-400 font-black">
                  {selectedSauces.length} / 4
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUSTOMIZE_INGREDIENTS.sauces.map((sauce) => {
                  const isSel = selectedSauces.some(s => s.id === sauce.id);
                  const isLimit = selectedSauces.length >= 4;
                  return (
                    <button
                      key={sauce.id}
                      onClick={() => toggleSauce(sauce)}
                      disabled={!isSel && isLimit}
                      className={`p-3 rounded-xl border text-right transition-all flex justify-between items-center ${
                        isSel
                          ? 'border-red-600 bg-red-50 text-red-650 font-black'
                          : !isSel && isLimit
                          ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-50'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 cursor-pointer'
                      }`}
                    >
                      <div className="font-sans text-xs flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSel ? 'bg-red-600 border-red-700 text-white' : 'border-zinc-300 bg-white'
                        }`}>
                          {isSel && <span className="text-[9px] font-black">✓</span>}
                        </div>
                        <span>{isRtl ? sauce.nameAr : sauce.nameEn}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-zinc-400">+{sauce.price} ج.م</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
