import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Tag, ChevronLeft, MapPin, Phone, User, CheckCircle2, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, SiteSettings } from '../types';
import { auth, db, cleanFirestoreData } from '../firebase';
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfileData } from './UserProfileModal';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: (orderDetails: {
    customerName: string;
    phone: string;
    deliveryAddress: string;
    paymentMethod: 'cash' | 'card';
    items: CartItem[];
    scheduledDeliveryTime?: string;
    couponCode?: string;
  }) => Promise<void> | void;
  lang: 'ar' | 'en';
  couponCodeFromWheel?: string;
  siteSettings?: SiteSettings;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  lang,
  couponCodeFromWheel = '',
  siteSettings
}: CartModalProps) {
  const isRtl = lang === 'ar';

  // State management
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');

  // Checkout info
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSubmitError, setOrderSubmitError] = useState('');
  
  // Scheduled Delivery States
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledDay, setScheduledDay] = useState<'today' | 'tomorrow'>('today');
  const [scheduledTime, setScheduledTime] = useState<string>('08:00 PM');
  
  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  // Dynamic Auth and user profiles loaded from Firestore
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fast login fields within the cart
  const [fastName, setFastName] = useState('');
  const [fastPhone, setFastPhone] = useState('');
  const [fastError, setFastError] = useState('');
  const [isFastRegistering, setIsFastRegistering] = useState(false);

  // Different delivery address override
  const [isDifferentAddress, setIsDifferentAddress] = useState(false);
  const [alternativeAddress, setAlternativeAddress] = useState('');

  // Disable body scroll when open (Prevent background shifting/scrolling)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Monitor Auth Changes
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onAuthStateChanged(auth, (usr) => {
      if (usr) {
        setCurrentUser(usr);
        loadUserProfile(usr.uid);
      } else {
        // Fallback: check if there is a virtual local user in localStorage
        const savedVirtual = localStorage.getItem('hummer_virtual_user');
        if (savedVirtual) {
          try {
            const parsed = JSON.parse(savedVirtual);
            setCurrentUser(parsed);
            loadUserProfile(parsed.uid);
          } catch (e) {
            setCurrentUser(null);
            setProfileData(null);
          }
        } else {
          setCurrentUser(null);
          setProfileData(null);
        }
      }
    });
    return unsub;
  }, [isOpen]);

  const loadUserProfile = async (uid: string) => {
    setIsLoadingProfile(true);
    let loaded = false;
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfileData;
        setProfileData(data);
        // Pre-fill checkout details immediately
        setCustomerName(data.name || '');
        setPhone(data.phone || '');
        if (data.addresses && data.addresses.length > 0) {
          setDeliveryAddress(data.addresses[0]);
        }
        localStorage.setItem('hummer_virtual_profile', JSON.stringify(data));
        loaded = true;
      }
    } catch (e) {
      console.error('Error loading profile in Cart from Firestore:', e);
    }

    if (!loaded) {
      // Offline / virtual context fallback to retrieve stored info 
      const cached = localStorage.getItem('hummer_virtual_profile');
      if (cached) {
        try {
          const data = JSON.parse(cached) as UserProfileData;
          if (data.uid === uid) {
            setProfileData(data);
            setCustomerName(data.name || '');
            setPhone(data.phone || '');
            if (data.addresses && data.addresses.length > 0) {
              setDeliveryAddress(data.addresses[0]);
            }
          }
        } catch (e) {
          console.error('Error reading cached profile:', e);
        }
      }
    }
    setIsLoadingProfile(false);
  };

  const handleFastRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFastError('');

    const nameVal = fastName.trim();
    const phoneVal = fastPhone.trim();

    if (!nameVal) {
      setFastError(isRtl ? 'من فضلك أدخل اسمك الثنائي أو الثلاثي' : 'Please enter your full name');
      return;
    }

    if (phoneVal.length < 11 || !/^\d+$/.test(phoneVal)) {
      setFastError(isRtl ? 'برجاء كتابة رقم موبايل صحيح من ١١ رقم' : 'Please enter a valid 11-digit mobile number');
      return;
    }

    setIsFastRegistering(true);
    try {
      let uid = '';
      let isVirtual = false;

      try {
        const credential = await signInAnonymously(auth);
        uid = credential.user.uid;
      } catch (authErr: any) {
        console.warn('signInAnonymously failed, defaulting to virtual device session:', authErr);
        let savedVirtualUid = localStorage.getItem('hummer_virtual_uid');
        if (!savedVirtualUid) {
          savedVirtualUid = 'virt-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
          localStorage.setItem('hummer_virtual_uid', savedVirtualUid);
        }
        uid = savedVirtualUid;
        isVirtual = true;
      }

      const newProfile: UserProfileData = {
        uid,
        name: nameVal,
        phone: phoneVal,
        email: 'fastfoodie@hummer.app',
        addresses: [],
        createdAt: new Date().toISOString()
      };

      // Set user profile in local cache immediately for offline/bypass resilience
      localStorage.setItem('hummer_virtual_profile', JSON.stringify(newProfile));

      if (isVirtual) {
        const virtualUser = {
          uid,
          email: 'fastfoodie@hummer.app',
          displayName: nameVal,
          isAnonymous: true,
          emailVerified: false
        };
        localStorage.setItem('hummer_virtual_user', JSON.stringify(virtualUser));
        setCurrentUser(virtualUser as any);
      }

      // Safe Firestore set doc - catch permission denied silently in virtual/offline cases
      try {
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, cleanFirestoreData(newProfile));
      } catch (dbErr: any) {
        console.warn('Could not write profile to Firestore users:', dbErr);
      }

      setProfileData(newProfile);
      setCustomerName(newProfile.name);
      setPhone(newProfile.phone);
      setShowCheckoutForm(true); // advance to checkout fields directly!
    } catch (err: any) {
      console.error('Fast login failure inside cart:', err);
      setFastError(isRtl ? `عذراً، فشل التسجيل: ${err.message}` : `Fast login failed: ${err.message}`);
    } finally {
      setIsFastRegistering(false);
    }
  };

  // Synchronize dynamic promo code triggered from wheel of fortune
  useEffect(() => {
    if (couponCodeFromWheel) {
      setCouponCode(couponCodeFromWheel);
      applyCoupon(couponCodeFromWheel);
    }
  }, [couponCodeFromWheel]);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const deliveryFee = subtotal > 0 ? 25 : 0; // 25 EGP flat rate delivery in Egypt
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const applyCoupon = (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;

    // Check custom dynamic coupons list first
    const dynamicCoupons = siteSettings?.coupons || [];
    const matchedDynamic = dynamicCoupons.find(c => c.code.trim().toUpperCase() === code);

    if (matchedDynamic) {
      const todayStr = new Date().toISOString().split('T')[0];
      const isExpired = matchedDynamic.expiryDate && todayStr > matchedDynamic.expiryDate;
      const isLimitExceeded = matchedDynamic.limit > 0 && matchedDynamic.usedCount >= matchedDynamic.limit;

      if (isExpired) {
        setCouponError(isRtl ? 'هذا الكوبون منتهي الصلاحية!' : 'This coupon has expired!');
        setCouponApplied(false);
        setDiscountPercent(0);
        return;
      }

      if (isLimitExceeded) {
        setCouponError(isRtl ? 'هذا الكوبون استنفذ عدد الاستخدامات الأقصى!' : 'This coupon has reached its limit!');
        setCouponApplied(false);
        setDiscountPercent(0);
        return;
      }

      // Valid dynamic coupon!
      if (matchedDynamic.giftType === 'discount') {
        setDiscountPercent(matchedDynamic.discountPercent);
        setDiscountPercentState(true, isRtl 
          ? `تم تطبيق خصم بقيمة ${matchedDynamic.discountPercent}% بنجاح! 🎉` 
          : `${matchedDynamic.discountPercent}% OFF coupon applied successfully! 🎉`
        );
      } else {
        setDiscountPercent(0);
        setDiscountPercentState(true, isRtl 
          ? `كفو! كود الهدية فعال (${matchedDynamic.giftItem}) سيتم إرفاقها مجاناً بطلبك!` 
          : `Awesome! Free gift (${matchedDynamic.giftItem}) will be wrapped with your meal!`
        );
      }
      return;
    }

    if (code === 'HUMMER10') {
      setDiscountPercent(10);
      setDiscountPercentState(true, isRtl ? 'تم تطبيق خصم هامر ١٠٪ بنجاح!' : '10% Hummer discount applied successfully!');
    } else if (code === 'MEGA20') {
      setDiscountPercent(20);
      setDiscountPercentState(true, isRtl ? 'يا ريس! تم تطبيق عرض ميجا خصم ٢٠٪!' : 'Wow! 20% Mega Promo discount applied!');
    } else if (code === 'PEPSI' || code === 'COLESLAW' || code === 'FRIES') {
      setDiscountPercent(0);
      setDiscountPercentState(true, isRtl ? `كفو! كود الهدية فعال (${code}) سيتم إرفاقها مجاناً بطلبك!` : `Awesome! Free gift (${code}) will be wrapped with your meal!`);
    } else {
      setCouponError(isRtl ? 'الكود ده مش فعال، دير عجلة الحظ الكسبانة!' : 'Promo code invalid or expired!');
      setCouponApplied(false);
      setDiscountPercent(0);
    }
  };

  const setDiscountPercentState = (applied: boolean, msg: string) => {
    setCouponApplied(applied);
    setCouponSuccessMsg(msg);
    setCouponError('');
  };

  const handleApplyClick = (e: React.FormEvent) => {
    e.preventDefault();
    applyCoupon(couponCode);
  };

  // Checkout inputs validation
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: typeof errors = {};

    if (!customerName.trim()) {
      tempErrors.name = isRtl ? 'اسم العميل مطلوب لبوكس الطلب' : 'Name is required';
    }
    
    const pTrim = phone.trim();
    if (!pTrim) {
      tempErrors.phone = isRtl ? 'رقم الهاتف ضروري للتواصل مع الدليفري' : 'Phone is required';
    } else if (pTrim.length < 11) {
      tempErrors.phone = isRtl ? 'الرقم ده قصير، اكتب ١١ رقم (مثال: 010...)' : 'Phone must be exactly 11 digits';
    }

    const finalAddress = isDifferentAddress ? alternativeAddress.trim() : deliveryAddress.trim();

    if (!finalAddress || finalAddress.length < 8) {
      tempErrors.address = isRtl ? 'اكتب عنوان مفصل بدقة (الشارع، رقم العمارة، الشقة أو العلامة المميزة)' : 'Detailed address is too short';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});

    // Auto-save the checkout address to their Firestore profile if it is a new address!
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const existingAddresses = profileData?.addresses || [];
        if (!existingAddresses.includes(finalAddress)) {
          const updatedAddresses = [...existingAddresses, finalAddress];
          const updatedProfile = {
            ...(profileData || {
              uid: currentUser.uid,
              name: customerName,
              phone: phone,
              email: currentUser.email || 'fastfoodie@hummer.app',
              createdAt: new Date().toISOString()
            }),
            addresses: updatedAddresses
          };
          await setDoc(docRef, cleanFirestoreData(updatedProfile));
          setProfileData(updatedProfile as UserProfileData);
        }
      } catch (err) {
        console.error('Error auto-saving customer address to Firestore:', err);
      }
    }

    const finalScheduledTime = deliveryMode === 'scheduled'
      ? `${scheduledDay === 'today' ? (isRtl ? 'اليوم' : 'Today') : (isRtl ? 'غداً' : 'Tomorrow')} - ${scheduledTime}`
      : undefined;

    setIsSubmittingOrder(true);
    setOrderSubmitError('');

    try {
      await onCheckout({
        customerName: customerName.trim(),
        phone: phone.trim(),
        deliveryAddress: finalAddress,
        paymentMethod,
        items: cartItems,
        scheduledDeliveryTime: finalScheduledTime,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined
      });

      setShowCheckoutForm(false);
      setIsDifferentAddress(false);
      setAlternativeAddress('');
      onClose();
    } catch (err: any) {
      console.error('Error submitting order on checkout:', err);
      // Construct a premium descriptive error message
      setOrderSubmitError(
        isRtl 
          ? `عذراً، فشل إرسال الطلب لقاعدة البيانات: ${err.message || err}` 
          : `Sorry, order could not be registered: ${err.message || err}`
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950 cursor-pointer"
      />

      {/* Slide-in cart panel */}
      <motion.div
        initial={{ x: isRtl ? '-100%' : '100%', opacity: 0.95 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: isRtl ? '-100%' : '100%', opacity: 0.95 }}
        transition={{ type: 'spring', damping: 26, stiffness: 230 }}
        className="relative h-full w-full max-w-md bg-[#ffffff] border-l border-zinc-200 shadow-2xl flex flex-col justify-between font-sans text-[#18181b] z-10"
      >

        {/* Header */}
        <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between text-right">
          {cartItems.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-[10px] text-red-600 hover:text-red-700 font-black flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مسح الكل' : 'Clear Basket'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[#181a1b] text-[10px] bg-zinc-200 px-2 py-0.5 rounded-md font-mono font-black">
              {cartItems.length}
            </span>
            <h3 className="text-sm font-black text-zinc-950 flex items-center gap-1.5">
              <span>{isRtl ? 'سلة طلبات هامر 🛒' : "Your Basket 🛒"}</span>
            </h3>
            <button 
              onClick={onClose} 
              className="p-1 px-3 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 text-[11px] font-black leading-relaxed cursor-pointer transition"
            >
              {isRtl ? 'العودة للمنيو ✕' : 'Close ✕'}
            </button>
          </div>
        </div>

        {/* Cart Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full space-y-4">
              <ShoppingCart className="w-16 h-16 text-zinc-300 animate-pulse" />
              <div>
                <p className="text-zinc-950 font-black text-sm">{isRtl ? 'السلة بتاعتك لسه مفيهاش أكل!' : 'Empty Gastronomy!'}</p>
                <p className="text-xs text-zinc-550 mt-1 max-w-[250px] leading-relaxed font-bold">
                  {isRtl 
                    ? 'تصفح منيو كريبات وفراخ هامر النارية وصمم كريبك المبتكر الآن ليتحضر ساخناً ولذيذاً!' 
                    : 'Start adding crispy strips and double-cheese folded crepes to feed your absolute hunger!'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-red-650 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-black cursor-pointer border border-red-700 transition"
              >
                {isRtl ? 'تصفح المنيو الآن' : 'Explore Menu'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-3 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 flex justify-between gap-3 text-xs shadow-xs"
                  >
                    {/* Left block (Quantities / clear actions) */}
                    <div className="flex flex-col justify-between items-center bg-zinc-55 bg-zinc-100 border border-zinc-200 rounded-xl px-1.5 py-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="text-zinc-700 hover:text-black font-black text-sm w-4 h-4 flex items-center justify-center cursor-pointer transition"
                      >
                        +
                      </button>
                      <span className="font-mono font-black text-zinc-900 text-xs py-1 select-none">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="text-zinc-700 hover:text-black font-black text-sm w-4 h-4 flex items-center justify-center cursor-pointer transition"
                      >
                        -
                      </button>
                    </div>

                    {/* Right block: Title, extras descriptions, prices */}
                    <div className="flex-1 flex flex-col justify-between text-right">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-mono font-black text-zinc-900">
                            {item.pricePerUnit * item.quantity} ج.م
                          </span>
                          
                          <h4 className="font-black text-zinc-950 leading-tight line-clamp-1 max-w-[160px]">
                            {isRtl ? item.nameAr : item.nameEn}
                          </h4>
                        </div>

                        {/* Size, Spicy levels or customization item lists */}
                        <div className="text-[10px] text-zinc-500 font-bold mt-1 space-y-0.5">
                          {item.selectedSizeAr && (
                            <span className="block text-zinc-500">
                              📌 {isRtl ? 'الحجم:' : 'Size:'} {isRtl ? item.selectedSizeAr : item.selectedSize}
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="text-red-650 font-extrabold block">
                              🔥 {isRtl ? 'نار سبايسي جداً' : 'Hot Spicy Fire'}
                            </span>
                          )}
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="line-clamp-2 max-w-[200px] leading-relaxed text-zinc-500 font-bold">
                              🧪 {isRtl ? 'إضافات:' : 'Addons:'} {item.customizations.map(c => isRtl ? c.nameAr : c.nameEn).join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-amber-600 font-black">
                              ✍️ {isRtl ? 'ملاحظتك:' : 'Request:'} "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Single trash removal trigger */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[10px] text-zinc-400 hover:text-red-650 flex items-center gap-1 self-start font-black cursor-pointer py-1.5 transition duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إزالة السندوتش' : 'Remove item'}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer Checkout action blocks if items exist */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-4 max-h-[60%] overflow-y-auto">
            
            {/* 1. Coupon Widget (Only if checkout form not active) */}
            {!showCheckoutForm && (
              <form onSubmit={handleApplyClick} className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 bg-red-600 hover:bg-red-750 text-white text-xs font-black rounded-xl border border-red-700 transition cursor-pointer"
                >
                  {isRtl ? 'تطبيق الكود' : 'Apply'}
                </button>
                <div className="relative flex-1 text-right">
                  <Ticket className="w-4 h-4 text-red-600 absolute top-3.5 right-3 pointer-events-none" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError('');
                    }}
                    placeholder={isRtl ? 'اكتب رمز كوبون خصم هامر...' : 'Promo coupon e.g. HUMMER10'}
                    className="w-full text-right pr-9 pl-3 py-2.5 bg-white text-zinc-950 rounded-xl text-xs border border-zinc-200 focus:border-red-650 uppercase font-sans font-bold outline-none shadow-xs"
                  />
                </div>
              </form>
            )}

            {/* Render Coupon status responses */}
            {couponError && <p className="text-[10px] text-red-600 font-extrabold text-right">{couponError}</p>}
            {couponApplied && <p className="text-[10px] text-green-600 font-black text-right flex items-center gap-1 justify-end">
              <CheckCircle2 className="w-3 h-3 text-green-650" />
              <span>{couponSuccessMsg}</span>
            </p>}

            {/* 2. Receipt pricing breakdown info list */}
            <div className="space-y-1.5 text-xs text-zinc-500 font-bold text-right pt-1">
              <div className="flex justify-between">
                <span className="font-mono text-zinc-900 font-black">{subtotal} {isRtl ? 'ج.م' : 'EGP'}</span>
                <span>{isRtl ? 'المجموع الأساسي للوجبات:' : 'Items Subtotal:'}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-600 font-black">
                  <span className="font-mono">-{discountAmount.toFixed(1)} {isRtl ? 'ج.م' : 'EGP'}</span>
                  <span>{isRtl ? 'خصومات الكود المفعّل:' : 'Coupon Savings:'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-mono text-zinc-900 font-black">+{deliveryFee} {isRtl ? 'ج.م' : 'EGP'}</span>
                <span>{isRtl ? 'دليفري هامر داقة وسرعة:' : 'Sonic Delivery:'}</span>
              </div>
              
              <div className="flex justify-between text-sm text-red-600 font-black border-t border-zinc-200 pt-2 pb-1">
                <span className="font-mono text-base">{finalTotal.toFixed(1)} {isRtl ? 'ج.م' : 'EGP'}</span>
                <span>{isRtl ? 'الحساب الإجمالي الكلي:' : 'Payable Amount:'}</span>
              </div>
            </div>

            {/* 3. Checkout Portal Form toggles with login enforcement */}
            <AnimatePresence>
              {!currentUser ? (
                /* MANDATORY REGISTRATION BARRIER */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-zinc-100 border border-zinc-200 p-4 rounded-2xl text-right space-y-3"
                >
                  <h4 className="text-xs font-black text-red-600 flex items-center gap-1 justify-end">
                    <span>{isRtl ? 'يجب تسجيل الدخول لإتمام الطلب ⚠️' : 'Registration required to order ⚠️'}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {isRtl 
                      ? 'لكي نتمكن من حفظ حسابك وتتبع خطوات طبخ الدليفري حيًا على الخريطة، من فضلك سجل ثنائيًا في ثانية واحدة!' 
                      : 'To track cooking times and delivery in real-time on our map, please complete a fast 1-second login!'}
                  </p>

                  <form onSubmit={handleFastRegistration} className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-400 block">{isRtl ? 'اسمك الكريم (ثنائي أو ثلاثي):' : 'Enter your name:'}</label>
                      <input
                        type="text"
                        required
                        value={fastName}
                        onChange={(e) => setFastName(e.target.value)}
                        placeholder={isRtl ? 'اكتب اسمك للمندوب...' : 'Enter your name here...'}
                        className="w-full text-right p-2 border border-zinc-350 rounded-xl bg-white text-xs font-bold outline-none focus:border-red-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-400 block">{isRtl ? 'رقم موبايل التوصيل (١١ رقم):' : 'Mobile number (11 digits):'}</label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        value={fastPhone}
                        onChange={(e) => setFastPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="01xxxxxxxxx"
                        className="w-full text-center p-2 border border-zinc-350 rounded-xl bg-white text-xs font-semibold font-mono tracking-wider outline-none focus:border-red-600"
                      />
                    </div>

                    {fastError && <p className="text-[10px] font-bold text-red-600 text-center animate-pulse">{fastError}</p>}

                    <button
                      type="submit"
                      disabled={isFastRegistering}
                      className="w-full py-2 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md border border-red-700 transition"
                    >
                      {isFastRegistering ? (
                        <span>{isRtl ? 'جاري تسجيل حسابك الفوري...' : 'Creating immediate session...'}</span>
                      ) : (
                        <span>{isRtl ? 'سجل حسابك واطلب الآن ⚡' : 'Register & Order Instantly ⚡'}</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : showCheckoutForm ? (
                /* AUTHENTICATED USER CHECKOUT FORM */
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCheckoutSubmit}
                  className="space-y-3 pt-3 border-t border-zinc-200 text-right"
                >
                  {/* Prefilled Profile Name (Read only to avoid mistake mixups as requested) */}
                  <div className="space-y-1 bg-zinc-100 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[9px] font-black text-zinc-400 block uppercase tracking-wide">
                      {isRtl ? '👤 بيانات المستلم المعتمدة:' : '👤 Confirmed recipient info:'}
                    </span>
                    <p className="text-xs font-black text-zinc-950 mt-1">
                      {customerName}
                    </p>
                    <p className="text-xs font-bold font-mono text-zinc-650 mt-0.5">
                      {phone}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-bold">
                      {isRtl 
                        ? 'تتم تعبئة بيانات الهاتف والاسم والملف الشخصي تلقائيًا لتسريع الشحن ⚡' 
                        : 'Contact credentials are preloaded directly from your secure epicure file ⚡'}
                    </p>
                  </div>

                  {/* Saved Addresses dropdown menu */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">
                      {isRtl ? '📍 عنوان التوصيل الأساسي الحائز:' : '📍 Primary target delivery address:'}
                    </label>

                    {profileData?.addresses && profileData.addresses.length > 0 ? (
                      <select
                        disabled={isDifferentAddress}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full text-right p-2.5 bg-white text-zinc-950 rounded-xl text-xs font-bold border border-zinc-200 outline-none focus:border-red-650 disabled:bg-zinc-50 disabled:text-zinc-400"
                      >
                        {profileData.addresses.map((addr, idx) => (
                          <option key={idx} value={addr}>{addr}</option>
                        ))}
                      </select>
                    ) : (
                      /* No addresses saved yet: let user write their address directly (it will be auto-saved) */
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-zinc-400 absolute top-2.5 right-3" />
                        <input
                          type="text"
                          required={!isDifferentAddress}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder={isRtl ? 'اكتب عنوان التوصيل بدقة (الشارع، العمارة، الشقة)' : 'e.g. Abbas El Akkad St, Build 4, Apt 11'}
                          className="w-full text-right pr-9 pl-3 py-2 bg-white text-zinc-950 font-bold rounded-xl text-xs border border-zinc-200 outline-none focus:border-red-600"
                        />
                      </div>
                    )}
                    {errors.address && <p className="text-[9px] text-red-600 font-black">{errors.address}</p>}
                  </div>

                  {/* Optional address different override */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 justify-end cursor-pointer select-none">
                      <span className="text-[11px] font-bold text-zinc-600">
                        {isRtl ? '🏡 التوصيل لعنوان مختلف أو بديل؟' : '🏡 Ship to a different alternative address?'}
                      </span>
                      <input
                        type="checkbox"
                        checked={isDifferentAddress}
                        onChange={(e) => setIsDifferentAddress(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded bg-zinc-100 border-zinc-300 focus:ring-red-500 cursor-pointer"
                      />
                    </label>

                    {isDifferentAddress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-1"
                      >
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-zinc-400 absolute top-2.5 right-3" />
                          <input
                            type="text"
                            required
                            value={alternativeAddress}
                            onChange={(e) => setAlternativeAddress(e.target.value)}
                            placeholder={isRtl ? 'اكتب العنوان البديل بالتفصيل...' : 'Enter alternative address detailed...'}
                            className="w-full text-right pr-9 pl-3 py-2 bg-white text-zinc-900 font-bold rounded-xl text-xs border border-zinc-350 outline-none focus:border-red-600"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Scheduled Delivery Section */}
                  <div className="space-y-2 text-right pt-2 border-t border-zinc-150">
                    <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">
                      {isRtl ? '⏱️ وقت وتوقيت التوصيل المفضل:' : '⏱️ Preferred Delivery Timing:'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMode('now');
                        }}
                        className={`p-2.5 rounded-xl text-xs font-black border text-center cursor-pointer transition-all duration-150 ${
                          deliveryMode === 'now'
                            ? 'border-red-600 bg-red-50 text-red-600 shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:text-black font-bold'
                        }`}
                      >
                        {isRtl ? '⚡ فوري (بأسرع وقت)' : '⚡ Immediate Now'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMode('scheduled');
                        }}
                        className={`p-2.5 rounded-xl text-xs font-black border text-center cursor-pointer transition-all duration-150 ${
                          deliveryMode === 'scheduled'
                            ? 'border-red-600 bg-red-50 text-red-600 shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:text-black font-bold'
                        }`}
                      >
                        {isRtl ? '📅 جدولة وقت لاحق' : '📅 Schedule for later'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {deliveryMode === 'scheduled' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl overflow-hidden"
                        >
                          {/* Choose Day Toggle */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setScheduledDay('today')}
                              className={`p-2 rounded-xl text-[11px] font-black text-center cursor-pointer border ${
                                scheduledDay === 'today'
                                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                                  : 'bg-white border-zinc-200 text-zinc-650 font-bold'
                              }`}
                            >
                              {isRtl ? 'اليوم (Today)' : 'Today'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setScheduledDay('tomorrow')}
                              className={`p-2 rounded-xl text-[11px] font-black text-center cursor-pointer border ${
                                scheduledDay === 'tomorrow'
                                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                                  : 'bg-white border-zinc-200 text-zinc-650 font-bold'
                              }`}
                            >
                              {isRtl ? 'غداً (Tomorrow)' : 'Tomorrow'}
                            </button>
                          </div>

                          {/* Choose Hour Slot Dropdown */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-400 block">{isRtl ? 'اختر الفترة الزمنية المناسبة:' : 'Select preferred timeframe:'}</label>
                            <select
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full text-right p-2.5 bg-white text-zinc-950 rounded-xl text-xs font-black border border-zinc-200 outline-none focus:border-red-650"
                            >
                              <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                              <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM</option>
                              <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                              <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                              <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                              <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                              <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                              <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                              <option value="08:00 PM - 09:00 PM">08:00 PM - 09:00 PM</option>
                              <option value="09:00 PM - 10:00 PM">09:00 PM - 10:00 PM</option>
                              <option value="10:00 PM - 11:00 PM">10:00 PM - 11:00 PM</option>
                              <option value="11:00 PM - 12:00 AM">11:00 PM - 12:00 AM</option>
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-1.5 text-right pt-1">
                    <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">{isRtl ? 'حدد طريقة الدفع للجباية:' : 'Payment Option:'}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-2.5 rounded-xl text-xs font-black border text-center cursor-pointer transition-all duration-150 ${
                          paymentMethod === 'cash'
                            ? 'border-red-600 bg-red-50 text-red-600 shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:text-black font-bold'
                        }`}
                      >
                        {isRtl ? '💵 كاش للمندوب' : 'Cash on Delivery'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2.5 rounded-xl text-xs font-black border text-center cursor-pointer transition-all duration-150 ${
                          paymentMethod === 'card'
                            ? 'border-red-600 bg-red-50 text-red-600 shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:text-black font-bold'
                        }`}
                      >
                        {isRtl ? '💳 فيزا مع المندوب' : 'Card on Delivery'}
                      </button>
                    </div>
                  </div>

                  {/* Confirm order submit button */}
                  {orderSubmitError && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[11px] font-black text-red-600 text-center bg-red-50 p-2.5 rounded-xl border border-red-200"
                    >
                      ⚠️ {orderSubmitError}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full mt-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black border border-green-700 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingOrder ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>{isRtl ? 'جاري إرسال طلبك هاساً...' : 'Submitting order...'}</span>
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" />
                        <span>
                          {isRtl ? 'تأكيد الطلب وشغل متتبع الأكل المباشر 🛰️' : 'Confirm Order & Fire Live Radar'}
                        </span>
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs text-center uppercase tracking-wide block border border-red-700 duration-200"
                >
                  {isRtl ? 'الذهاب لتأكيد الطلب والعنوان 🍗' : 'Go to checkout and details 🍗'}
                </button>
              )}
            </AnimatePresence>
          </div>
        )}

      </motion.div>
    </div>
  );
}
