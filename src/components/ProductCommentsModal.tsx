import React, { useState, useEffect } from 'react';
import { X, Star, User, Calendar, Trash2, MessageSquare, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, ProductComment } from '../types';
import { db, auth, cleanFirestoreData } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from 'firebase/firestore';

interface ProductCommentsModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  isAdmin?: boolean;
}

export default function ProductCommentsModal({
  item,
  isOpen,
  onClose,
  lang,
  isAdmin = false
}: ProductCommentsModalProps) {
  const isRtl = lang === 'ar';
  
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [visitorName, setVisitorName] = useState('');
  const [rating, setRating] = useState(5);
  const [textareaValue, setTextareaValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  // Autofill name if authenticated
  useEffect(() => {
    if (isOpen) {
      const user = auth.currentUser;
      if (user) {
        if (user.displayName) {
          setVisitorName(user.displayName);
        } else if (user.email) {
          setVisitorName(user.email.split('@')[0]);
        } else {
          setVisitorName(isRtl ? 'عميل هامر' : 'Hummer Guest');
        }
      }
    }
  }, [isOpen]);

  // Read comments in real-time
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const q = query(
      collection(db, 'product_comments'),
      where('productId', '==', item.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ProductComment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          productId: data.productId,
          userName: data.userName || (isRtl ? 'زائر' : 'Guest'),
          rating: data.rating || 5,
          comment: data.comment || '',
          createdAt: data.createdAt || new Date().toISOString()
        });
      });

      // Sort client-side by date desc to avoid needing index setup in Firestore
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      
      setComments(list);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching product comments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, item.id]);

  // Submit new review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage(false);

    if (!visitorName.trim()) {
      setErrorMessage(isRtl ? 'من فضلك اكتب اسمك الكريم أولاً' : 'Please enter your name first');
      return;
    }
    if (!textareaValue.trim()) {
      setErrorMessage(isRtl ? 'من فضلك اكتب تعليقك أو تقييمك' : 'Please write your comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const commentPayload = cleanFirestoreData({
        productId: item.id,
        userName: visitorName.trim(),
        rating,
        comment: textareaValue.trim(),
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'product_comments'), commentPayload);
      
      // Reset
      setTextareaValue('');
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setErrorMessage(isRtl ? 'فشل إرسال التعليق لقاعدة البيانات.' : 'Failed to save review in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete review (Admin Exclusive)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(isRtl ? 'هل تريد حذف هذا التعليق نهائياً؟' : 'Delete this comment permanently?')) return;
    
    try {
      await deleteDoc(doc(db, 'product_comments', commentId));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      alert(isRtl ? 'فشل المسح: لا تمتلك صلاحيات كافية' : 'Failed to delete: insufficient permissions.');
    }
  };

  // Calculate stats
  const totalComments = comments.length;
  const averageRating = totalComments > 0 
    ? (comments.reduce((sum, c) => sum + c.rating, 0) / totalComments).toFixed(1)
    : '5.0';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 flex flex-col max-h-[85vh] text-right font-sans"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Elegant Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-zinc-200 text-zinc-500 hover:text-black rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-zinc-900 leading-tight">
                    {isRtl ? 'آراء وتعليقات الأكيلة' : 'Customer Feedback & Reviews'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">
                    {isRtl ? item.nameAr : item.nameEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Product Info & Quick Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 items-center">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.image} 
                    alt={isRtl ? item.nameAr : item.nameEn} 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-200"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-zinc-800">
                      {isRtl ? item.nameAr : item.nameEn}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-1 font-medium">
                      {isRtl ? item.descriptionAr : item.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-around sm:border-r sm:border-zinc-200/85 sm:pr-4">
                  <div className="text-center">
                    <span className="block text-xl sm:text-2xl font-black text-yellow-500 leading-none">
                      {averageRating} ★
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {isRtl ? 'معدل التقييم' : 'Avg Rating'}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="block text-xl sm:text-2xl font-black text-red-600 leading-none font-mono">
                      {totalComments}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {isRtl ? 'تعليق منشور' : 'Reviews Posted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TWO SECTIONS: Write comment OR view list */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Form column (5 cols) */}
                <div className="md:col-span-5 bg-zinc-50 border border-zinc-150 p-4 rounded-2xl space-y-3.5">
                  <h4 className="font-black text-xs text-zinc-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-red-600 rounded-xs" />
                    {isRtl ? 'أضف رأيك وتجربتك!' : 'Write Your Review'}
                  </h4>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Visitor name */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                        {isRtl ? 'اسم الأكيل بالكامل:' : 'Full Name:'}
                      </label>
                      <input
                        type="text"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder={isRtl ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                        className="w-full px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-200 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-semibold"
                        maxLength={35}
                      />
                    </div>

                    {/* Star scoring */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                        {isRtl ? 'تقييمك للمنتج:' : 'Your Rating:'}
                      </label>
                      <div className="flex gap-1 justify-start">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 cursor-pointer hover:scale-110 transition"
                          >
                            <Star 
                              className={`w-5 h-5 ${
                                star <= rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-zinc-300'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review comments */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                        {isRtl ? 'رأيك بكل صراحة:' : 'Comment:'}
                      </label>
                      <textarea
                        value={textareaValue}
                        onChange={(e) => setTextareaValue(e.target.value)}
                        placeholder={isRtl ? 'هل الطعم جميل؟ الكمية كافية؟...' : 'How does it taste? Share your love...'}
                        className="w-full h-20 px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-200 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none font-medium resize-none"
                        maxLength={250}
                      />
                    </div>

                    {/* Error / Success logs */}
                    {errorMessage && (
                      <p className="text-[10px] font-extrabold text-red-600 font-sans">
                        ⚠️ {errorMessage}
                      </p>
                    )}

                    {successMessage && (
                      <p className="text-[10px] font-black text-green-600 font-sans">
                        🎉 {isRtl ? '✓ تم نشر مراجعتك بنجاح!' : '✓ Review posted!'}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2 bg-red-600 font-bold hover:bg-red-700 text-white rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                    >
                      {isSubmitting ? (
                        <span>...</span>
                      ) : (
                        <span>{isRtl ? 'أنشر رأيي' : 'Publish Review'}</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Feed column (7 cols) */}
                <div className="md:col-span-7 space-y-3.5">
                  <h4 className="font-black text-xs text-zinc-800 flex items-center gap-1.5 justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-zinc-900 rounded-xs" />
                      {isRtl ? 'تغذية التعليقات المباشرة 💬' : 'Live Reviews Feed 💬'}
                    </span>
                    {loading && <span className="text-[10px] text-zinc-400 font-mono animate-pulse">loading...</span>}
                  </h4>

                  {loading ? (
                    <div className="py-12 text-center text-zinc-400 text-xs font-semibold">
                      {isRtl ? 'جاري السحب والتحميل من السحابة...' : 'Loading reviews...'}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-zinc-150 rounded-2xl text-center text-zinc-400 space-y-1">
                      <p className="text-xs font-black">{isRtl ? 'لا يوجد تعليقات حتى الآن لهذا المنتج' : 'No comments yet for this product'}</p>
                      <p className="text-[10px] font-medium">{isRtl ? 'كن أول أكيل يترك بصمته ويقيم الوجبة!' : 'Be the first foodie to share your opinion!'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {comments.map((comm) => (
                        <div 
                          key={comm.id} 
                          className="bg-zinc-50 hover:bg-zinc-100/70 p-3 rounded-2xl border border-zinc-100 text-right relative group transition"
                        >
                          {/* Admin Trash Command Action */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(comm.id)}
                              className="absolute top-2.5 left-2.5 p-1.5 hover:bg-red-100 text-zinc-400 hover:text-red-600 rounded-lg transition"
                              title={isRtl ? 'مسح التعليق' : 'Delete comment'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Top row with name & rating */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50">
                            {/* Stars rating evaluation */}
                            <div className="flex gap-0.5 text-yellow-500 font-semibold text-xs">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star 
                                  key={idx} 
                                  className={`w-3 h-3 ${idx < comm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-205'}`} 
                                />
                              ))}
                            </div>

                            {/* Name info with optional admin verification */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-black text-zinc-850">
                                {comm.userName}
                              </span>
                              <div className="p-0.5 bg-zinc-200 text-zinc-500 rounded-md">
                                <User className="w-3 h-3" />
                              </div>
                            </div>
                          </div>

                          {/* Comment speech bubble text with lovely typography */}
                          <p className="text-xs font-bold text-zinc-700 leading-relaxed mt-2 pr-0.5">
                            {comm.comment}
                          </p>

                          {/* Footer with elapsed date time */}
                          <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-400 font-bold mt-2 pt-1 border-t border-zinc-100/50">
                            <span />
                            <div className="flex items-center gap-1 text-[9px] text-zinc-400">
                              <Clock className="w-2.5 h-2.5" />
                              <span className="font-mono">
                                {new Date(comm.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal disclaimer footer */}
            <div className="p-3 bg-zinc-100 border-t border-zinc-200/60 flex items-center justify-center gap-1 text-[9px] sm:text-xs text-zinc-500">
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                {isRtl 
                  ? 'أراء الأكيلة تعبر عن أصحابها ويحق للمشرفين حذف التعليقات الخارجة لسلامة مجتمع هامر.' 
                  : 'Product reviews are public logs. Inappropriate reviews are eligible for admin cleanup.'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
