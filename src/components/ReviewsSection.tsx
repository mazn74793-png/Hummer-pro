import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Sparkles, UserPlus, FileEdit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Review } from '../types';
import { SAMPLE_REVIEWS } from '../menuData';

interface ReviewsSectionProps {
  lang: 'ar' | 'en';
}

export default function ReviewsSection({ lang }: ReviewsSectionProps) {
  const isRtl = lang === 'ar';

  // Load reviews from local storage
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<Review['badge']>('همر الأكيل');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hummer_reviews');
    if (saved) {
      setReviews(JSON.parse(saved));
    } else {
      setReviews(SAMPLE_REVIEWS as Review[]);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      name: name.trim(),
      rating,
      comment: comment.trim(),
      date: isRtl ? 'الآن' : 'Just now',
      badge: selectedBadge
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem('hummer_reviews', JSON.stringify(updated));

    // Reset Form
    setName('');
    setRating(5);
    setComment('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section id="reviews" className="py-16 bg-white border-t border-zinc-200 overflow-hidden text-[#18181b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-black mb-4">
            <MessageSquare className="w-4 h-4 text-red-600" />
            <span className="text-red-700 tracking-wide uppercase">{isRtl ? 'آراء وحكاوي الأكيلة!' : 'Hear From Our Food Critics!'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-sans tracking-tight">
            {isRtl ? 'ماذا يقول عشاق همر عن القرمشة؟' : 'The Hummer Crunch Talk of the Town'}
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-2 leading-relaxed">
            {isRtl 
              ? 'نهتم برأي كل عميل من عيلة همر. إقرأ مراجعات حقيقية وتفاعلية كتبها عشاق ومحبو الكريبات الساخنة والفراخ الكريسبي المقرمشة!'
              : 'Feedback means the world to our kitchen. Here are authentic, organic reviews from people who devour our hot crepes and crispy golden brotested strips daily!'}
          </p>
        </div>

        {/* TWO COLUMN GRID : Write Review vs Read Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Write a review (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 p-6 rounded-[2rem] space-y-5 shadow-xs relative overflow-hidden text-right">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-650 from-red-600 to-amber-400" />
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-1.5 font-sans justify-end">
              <FileEdit className="w-5 h-5 text-red-600 animate-pulse" />
              <span>{isRtl ? 'اكتب رأيك ودع المطبخ يقرأه!' : 'Write Your Premium Review!'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs sm:text-sm">
              {/* Name box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block text-right uppercase tracking-wider">
                  {isRtl ? 'الاسم بالكامل أو كود الشهرة:' : 'Full Name or Nickname:'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRtl ? 'أبو مروان الأكيل، آية هشام...' : 'e.g. Adam Carver, FoodLover...'}
                  className="w-full px-4 py-2.5 bg-zinc-50 text-zinc-950 rounded-xl text-xs border border-zinc-200 focus:border-red-600 font-bold outline-none placeholder-zinc-400"
                />
              </div>

              {/* Star Rating Select slider */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block text-right uppercase tracking-wider">
                  {isRtl ? 'تقييمك للقرمشة والجودة:' : 'Rate the Crunch & Quality:'}
                </label>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-zinc-500 font-black mr-2 text-xs font-mono">
                    {rating} / 5
                  </span>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= rating ? 'fill-yellow-400 text-yellow-500' : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block text-right uppercase tracking-wider">
                  {isRtl ? 'اختر لقب الأكيل الخاص بك:' : 'Pick your Hunger Badge:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['عاشق الكريبات', 'ملك المقرمشات', 'همر الأكيل', 'زبون دائم'] as Review['badge'][]).map((bdg) => (
                    <button
                      type="button"
                      key={bdg}
                      onClick={() => setSelectedBadge(bdg)}
                      className={`p-2.5 rounded-xl text-[10px] sm:text-xs font-black border transition text-center cursor-pointer ${
                        selectedBadge === bdg
                          ? 'border-red-600 bg-red-50 text-red-650 text-red-600'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      {bdg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block text-right uppercase tracking-wider">
                  {isRtl ? 'قصتك أو المراجعة مالتك:' : 'What is your food story?:'}
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={180}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isRtl ? 'مثال: الفراخ سخنة جداً وغلاف الكريسبي تتبيلته مية مية، الكريب مليان موزاريلا بتشد...!' : 'e.g. Crisp chicken breading is perfect, cheese pull in the crepe is wild...'}
                  className="w-full px-4 py-2.5 bg-zinc-50 text-zinc-950 rounded-xl text-xs border border-zinc-200 focus:border-red-600 font-bold outline-none resize-none placeholder-zinc-400"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs border border-red-700 hover:scale-[1.01] transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4.5 h-4.5" />
                <span>{isRtl ? 'نشر مراجعتي فوراً' : 'Publish My Review'}</span>
              </button>

              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl text-center"
                  >
                    {isRtl ? '✓ شكراً لثقتك! تم نشر تقييمك بنجاح وسيتلقاه كبار الطهاه!' : '✓ Review saved and published live! Thanks for loving Hummer!'}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Feed Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4 max-h-[520px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {reviews.map((rev) => (
                <motion.div
                  layout
                  key={rev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2.5 relative hover:border-zinc-900 transition-all duration-300"
                >
                  {/* Reviews Star count and label header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-yellow-400 text-yellow-500' : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="text-right">
                      <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2 font-sans justify-end">
                        <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded text-[9px] font-black tracking-normal">
                          {rev.badge}
                        </span>
                        <span>{rev.name}</span>
                      </h4>
                      {/* Sub timestamp */}
                      <span className="text-[10px] text-zinc-400 font-bold mt-0.5 block">{rev.date}</span>
                    </div>
                  </div>

                  {/* Comment narrative with beautiful italic style */}
                  <p className="text-zinc-650 text-zinc-650 text-zinc-600 text-xs sm:text-sm font-bold leading-relaxed font-sans text-right relative pr-3 border-r-2 border-red-500/40">
                    "{rev.comment}"
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
