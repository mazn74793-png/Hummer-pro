import React, { useState } from 'react';
import { Flame, Plus, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, SizeOption } from '../types';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number, selectedSize?: SizeOption, isSpicy?: boolean, notes?: string) => void;
  lang: 'ar' | 'en';
}

export default function MenuCard({ item, onAddToCart, lang }: MenuCardProps) {
  const isRtl = lang === 'ar';
  const hasSizes = item.sizes && item.sizes.length > 0;

  // Configuration state
  const [isSpicy, setIsSpicy] = useState<boolean>(item.spicyOption ? true : false);
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>(item.sizes?.[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [showNotesField, setShowNotesField] = useState<boolean>(false);

  // Computed price
  const basePrice = item.price;
  const sizeSurcharge = selectedSize ? selectedSize.extraPrice : 0;
  const currentPrice = basePrice + sizeSurcharge;

  const handleAdd = () => {
    onAddToCart(item, quantity, selectedSize, isSpicy, notes);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    // Reset quantity/notes
    setQuantity(1);
    setNotes('');
    setShowNotesField(false);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-white border border-zinc-200 hover:border-zinc-900 rounded-[2rem] overflow-hidden relative shadow-xs hover:shadow-md transition-all text-right"
    >
      {/* Visual Badge/Tag if any */}
      {item.tags && item.tags.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 items-end">
          {item.tags.map((tag, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 text-[9px] font-black rounded-lg shadow-sm border ${
                tag.includes('سبايسي') || tag.includes('نار')
                  ? 'bg-red-600 border-red-700 text-white'
                  : 'bg-amber-400 border-black text-black'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Image Block */}
      <div className="relative h-32 sm:h-48 overflow-hidden bg-zinc-100">
        <img
          src={item.image}
          alt={isRtl ? item.nameAr : item.nameEn}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
        
        {/* Dynamic Price tag loaded nicely in Red Accent */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-4 px-2 sm:px-3 py-0.5 sm:py-1 bg-red-600 border border-red-700 text-white rounded-lg sm:rounded-xl font-black font-mono shadow-sm text-[10px] sm:text-xs">
          {currentPrice} {isRtl ? 'ج.م' : 'EGP'}
        </div>
      </div>

      {/* Card Content wrapper */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        {/* Title & Desc */}
        <div>
          <h3 className="text-xs sm:text-base font-black text-zinc-900 tracking-tight line-clamp-1 font-sans">
            {isRtl ? item.nameAr : item.nameEn}
          </h3>
          <p className="text-zinc-550 text-[10px] sm:text-[11px] font-bold mt-1 sm:mt-1.5 leading-relaxed min-h-[26px] sm:min-h-[36px] line-clamp-2">
            {isRtl ? item.descriptionAr : item.descriptionEn}
          </p>
        </div>

        {/* Customization Options inside card */}
        <div className="space-y-3 font-sans text-xs">
          {/* 1. Spicy / Regular Choice */}
          {item.spicyOption && (
            <div className="flex items-center justify-between p-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <span className="text-zinc-400 font-extrabold pl-1 text-[10px]">{isRtl ? 'الحجم الحار:' : 'Spiciness:'}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsSpicy(false)}
                  className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition-all cursor-pointer ${
                    !isSpicy
                      ? 'bg-zinc-900 text-white'
                      : 'border border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {isRtl ? 'بارد كلاسيك' : 'Cool Classic'}
                </button>
                <button
                  onClick={() => setIsSpicy(true)}
                  className={`px-2.5 py-1 rounded-lg font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                    isSpicy
                      ? 'bg-red-600 text-white shadow-xs border border-red-700'
                      : 'border border-transparent text-zinc-400 hover:text-red-600'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-yellow-300" />
                  <span>{isRtl ? 'نار سبايسي' : 'Sizzling Spicy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Sizing selector if sizes exist */}
          {hasSizes && (
            <div className="space-y-1">
              <span className="text-zinc-400 font-black text-[10px] block mb-1">
                {isRtl ? 'اختر حجم الكريب:' : 'Select Crepe Size:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {item.sizes?.map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setSelectedSize(sz)}
                    className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-center cursor-pointer ${
                      selectedSize?.id === sz.id
                        ? 'border-red-600 bg-red-50 text-red-600 font-black'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
                    }`}
                  >
                    <span className="font-black text-[11px] block">{isRtl ? sz.nameAr : sz.nameEn}</span>
                    <span className="text-[9px] font-bold text-zinc-400 mt-0.5">
                      {sz.extraPrice > 0 ? `+${sz.extraPrice} ج.م` : isRtl ? 'سعر أساسي' : 'Base Price'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Note Trigger Input */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowNotesField(!showNotesField)}
              className="text-[10px] text-red-600 hover:text-red-700 font-black flex items-center gap-1 self-start cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>{isRtl ? 'إضافة تعليمات خاصة للشيف؟' : 'Add instructions for the chef?'}</span>
            </button>
            <AnimatePresence>
              {showNotesField && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: بدون بصل، صوص رانش زيادة...' : 'e.g. Extra ranch, no pickles...'}
                  className="w-full mt-1.5 px-3 py-1.5 bg-zinc-50 text-zinc-900 rounded-xl text-xs border border-zinc-200 focus:border-red-600 outline-none placeholder-zinc-400 font-medium"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive Add Actions */}
        <div className="pt-2 flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-xl px-2.5 py-1.5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-zinc-400 hover:text-zinc-900 text-base font-black w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="px-3 text-zinc-900 font-black font-display text-xs w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="text-zinc-400 hover:text-zinc-900 text-base font-black w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Submit add to cart Button */}
          <button
            onClick={handleAdd}
            disabled={isAdded}
            className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all ${
              isAdded
                ? 'bg-green-600 border-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white border-red-700 cursor-pointer shadow-xs hover:shadow-md'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>{isRtl ? 'تمت الإضافة!' : 'Added!'}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'أضف للطلب' : 'Add to Order'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
