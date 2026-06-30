import React, { useState, useEffect } from 'react';
import { Flame, Plus, Check, Info, MessageSquare, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, SizeOption } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import ProductCommentsModal from './ProductCommentsModal';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number, selectedSize?: SizeOption, isSpicy?: boolean, notes?: string) => void;
  lang: 'ar' | 'en';
  isAdmin?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string) => void;
}

const MenuCard = React.memo(function MenuCard({ 
  item, 
  onAddToCart, 
  lang, 
  isAdmin = false,
  isFavorite = false,
  onToggleFavorite
}: MenuCardProps) {
  const isRtl = lang === 'ar';
  const hasSizes = item.sizes && item.sizes.length > 0;

  // Real-time comments count state
  const [commentCount, setCommentCount] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Real-time star rating state
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalRatingsCount, setTotalRatingsCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    const qComments = query(
      collection(db, 'product_comments'),
      where('productId', '==', item.id)
    );
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      setCommentCount(snapshot.size);
    }, (error) => {
      console.warn('Comments fetch warning:', error);
      handleFirestoreError(error, OperationType.LIST, 'product_comments');
    });

    const qRatings = query(
      collection(db, 'product_ratings'),
      where('productId', '==', item.id)
    );
    const unsubscribeRatings = onSnapshot(qRatings, (snapshot) => {
      if (!snapshot.empty) {
        const ratingsList = snapshot.docs.map(dDoc => dDoc.data() as { rating: number, userId: string });
        const sum = ratingsList.reduce((acc, r) => acc + r.rating, 0);
        const avg = sum / ratingsList.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setTotalRatingsCount(ratingsList.length);

        if (auth.currentUser) {
          const myRatingDoc = ratingsList.find(r => r.userId === auth.currentUser?.uid);
          if (myRatingDoc) {
            setUserRating(myRatingDoc.rating);
          }
        }
      } else {
        setAverageRating(5.0);
        setTotalRatingsCount(0);
      }
    }, (err) => {
      console.warn('Ratings fetch warning:', err);
      handleFirestoreError(err, OperationType.LIST, 'product_ratings');
    });

    return () => {
      unsubscribeComments();
      unsubscribeRatings();
    };
  }, [item.id, auth.currentUser]);

  // Handle rating submits
  const handleRate = async (starValue: number) => {
    let user = auth.currentUser;
    if (!user) {
      // If not logged in, we sign in anonymously instantly
      try {
        const { signInAnonymously } = await import('firebase/auth');
        const credential = await signInAnonymously(auth);
        user = credential.user;
      } catch (err) {
        console.error("Anonymous authentication for rating failed:", err);
      }
    }

    if (user) {
      try {
        const ratingId = `${user.uid}_${item.id}`;
        await setDoc(doc(db, 'product_ratings', ratingId), {
          id: ratingId,
          userId: user.uid,
          productId: item.id,
          rating: starValue,
          createdAt: new Date().toISOString()
        });
        setUserRating(starValue);
      } catch (err) {
        console.error("Failed to store rating to Firestore:", err);
      }
    }
  };

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
    setQuantity(1);
    setNotes('');
    setShowNotesField(false);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col h-full bg-white border border-zinc-150 hover:border-red-500 rounded-2xl sm:rounded-[2rem] overflow-hidden relative shadow-sm hover:shadow-[0_0_20px_rgba(220,38,38,0.12)] transition-all duration-300 text-right"
    >
      {/* Heart/Favorite Button */}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(item.id)}
          className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 p-2 bg-white/90 hover:bg-white text-zinc-400 hover:text-red-600 rounded-full shadow-md backdrop-blur-xs transition cursor-pointer"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-all ${
              isFavorite ? 'fill-red-600 text-red-600 scale-110' : 'text-zinc-500 hover:scale-110'
            }`}
          />
        </button>
      )}

      {/* Visual Badge/Tag if any */}
      {item.tags && item.tags.length > 0 && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex flex-col gap-0.5 sm:gap-1 items-end">
          {item.tags.map((tag, idx) => (
            <span
              key={idx}
              className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-black rounded-md sm:rounded-lg shadow-sm border ${
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
      <div className="relative h-20 xs:h-28 sm:h-44 overflow-hidden bg-zinc-55">
        <img
          src={item.image}
          alt={isRtl ? item.nameAr : item.nameEn}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/5 to-transparent" />
        
        {/* Dynamic Price tag loaded nicely in Red Accent */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-4 px-1.5 py-0.5 sm:px-3 sm:py-1 bg-red-600 border border-red-700 text-white rounded-lg sm:rounded-xl font-black font-mono shadow-sm text-[9px] sm:text-xs">
          {currentPrice} {isRtl ? 'ج.م' : 'EGP'}
        </div>
      </div>

      {/* Card Content wrapper */}
      <div className="p-2 xs:p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
        {/* Title & Desc */}
        <div>
          <h3 className="text-[11px] sm:text-base font-black text-zinc-900 tracking-tight line-clamp-1 font-sans">
            {isRtl ? item.nameAr : item.nameEn}
          </h3>

          {/* Real-time Star Rating Component */}
          <div className="flex items-center justify-between mt-1 mb-1" dir="ltr">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = userRating >= star || (!userRating && averageRating >= star);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    className="p-0.5 hover:scale-125 transition transform focus:outline-none cursor-pointer"
                  >
                    <span className={`text-[12px] sm:text-[15px] leading-none ${isLit ? 'text-amber-400' : 'text-zinc-200'}`}>
                      ★
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] sm:text-[11px] text-zinc-500 font-mono font-black">
              ⭐️ {averageRating.toFixed(1)} {totalRatingsCount > 0 ? `(${totalRatingsCount})` : ''}
            </span>
          </div>

          <p className="text-zinc-500 text-[9px] sm:text-[11px] font-bold mt-0.5 sm:mt-1.5 leading-relaxed line-clamp-2">
            {isRtl ? item.descriptionAr : item.descriptionEn}
          </p>
        </div>

        {/* Customization Options inside card */}
        <div className="space-y-2 font-sans text-xs">
          {/* 1. Spicy / Regular Choice */}
          {item.spicyOption && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-1 bg-zinc-50 border border-zinc-200/80 rounded-lg sm:rounded-xl gap-1 sm:gap-1">
              <span className="text-zinc-450 font-extrabold pr-1 sm:pl-1 text-[8px] xs:text-[10px] sm:text-[11px]">{isRtl ? 'حار؟' : 'Spicy?'}</span>
              <div className="flex gap-0.5 sm:gap-1 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSpicy(false)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg font-black text-[8px] xs:text-[9px] sm:text-[10px] transition-all cursor-pointer ${
                    !isSpicy
                      ? 'bg-zinc-900 text-white'
                      : 'border border-transparent text-zinc-550 hover:text-zinc-900'
                  }`}
                >
                  {isRtl ? 'بارد' : 'Cool'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpicy(true)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg font-black text-[8px] xs:text-[9px] sm:text-[10px] flex items-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${
                    isSpicy
                      ? 'bg-red-600 text-white shadow-xs border border-red-700'
                      : 'border border-transparent text-zinc-400 hover:text-red-600'
                  }`}
                >
                  <Flame className="w-2.5 h-2.5 fill-current animate-pulse text-yellow-300" />
                  <span>{isRtl ? 'حراق' : 'Spicy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Sizing selector if sizes exist */}
          {hasSizes && (
            <div className="space-y-0.5">
              <span className="text-zinc-450 font-black text-[8px] xs:text-[9px] sm:text-[10px] block mb-0.5">
                {isRtl ? 'الحجم:' : 'Size:'}
              </span>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                {item.sizes?.map((sz) => (
                  <button
                    type="button"
                    key={sz.id}
                    onClick={() => setSelectedSize(sz)}
                    className={`p-1 sm:p-2 rounded-lg sm:rounded-xl border text-right transition-all flex flex-col justify-center cursor-pointer ${
                      selectedSize?.id === sz.id
                        ? 'border-red-600 bg-red-50/50 text-red-600 font-black'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
                    }`}
                  >
                    <span className="font-black text-[8px] xs:text-[9px] sm:text-[11px] block">{isRtl ? sz.nameAr : sz.nameEn}</span>
                    <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-bold text-zinc-400 mt-0.5">
                      {sz.extraPrice > 0 ? `+${sz.extraPrice}` : isRtl ? 'أساسي' : 'Base'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Note Trigger Input & Product Comments click */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowNotesField(!showNotesField)}
                className="text-[8px] xs:text-[10px] sm:text-[11px] text-red-600 hover:text-red-700 font-black flex items-center gap-0.5 cursor-pointer"
              >
                <Info className="w-2.5 h-2.5" />
                <span>{isRtl ? 'ملاحظة للشيف؟' : 'Special request?'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCommentsModal(true)}
                className="text-[8px] xs:text-[9px] sm:text-[10px] p-1 px-2.5 bg-yellow-55 border border-yellow-200/60 rounded-lg text-yellow-800 font-black flex items-center gap-1 cursor-pointer transition hover:bg-yellow-100"
              >
                <MessageSquare className="w-2.5 h-2.5 text-yellow-600 fill-current" />
                <span>{isRtl ? `تعليقات (${commentCount})` : `Comments (${commentCount})`}</span>
              </button>
            </div>
            <AnimatePresence>
              {showNotesField && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRtl ? 'بدون توم، صوص شيدر...' : 'No onion...'}
                  className="w-full mt-1 px-2 py-1 bg-zinc-50 text-zinc-900 rounded-lg text-[9px] sm:text-xs border border-zinc-200 focus:border-red-600 outline-none placeholder-zinc-400 font-medium"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interactive Add Actions */}
        <div className="pt-1 flex flex-col xs:flex-row items-stretch gap-1 sm:gap-2">
          {/* Quantity selector */}
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-150 rounded-lg sm:rounded-xl px-1 py-0.5 sm:px-2 sm:py-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-zinc-500 hover:text-zinc-900 text-sm font-black w-5 h-5 flex items-center justify-center cursor-pointer select-none"
            >
              -
            </button>
            <span className="px-1 text-zinc-900 font-extrabold font-mono text-[10px] sm:text-xs w-4 text-center select-none">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="text-zinc-500 hover:text-zinc-900 text-sm font-black w-5 h-5 flex items-center justify-center cursor-pointer select-none"
            >
              +
            </button>
          </div>

          {/* Submit add to cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdded}
            className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[9px] xs:text-[10px] sm:text-xs flex items-center justify-center gap-1 border transition-all ${
              isAdded
                ? 'bg-green-600 border-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white border-red-700 cursor-pointer shadow-xs hover:shadow-md'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3 h-3 animate-bounce" />
                <span>{isRtl ? 'تم!' : 'Added!'}</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span>{isRtl ? 'أضف' : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <ProductCommentsModal
        item={item}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        lang={lang}
        isAdmin={isAdmin}
      />
    </motion.div>
  );
})

export default MenuCard;
