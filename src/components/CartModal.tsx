import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Tag, ChevronLeft, MapPin, Phone, User, CheckCircle2, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

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
  }) => void;
  lang: 'ar' | 'en';
  couponCodeFromWheel?: string;
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
  couponCodeFromWheel = ''
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
  
  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

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

    if (code === 'HUMMER10') {
      setDiscountPercent(10);
      setDiscountPercentState(true, isRtl ? 'تم تطبيق خصم همر ١٠٪ بنجاح!' : '10% Hummer discount applied successfully!');
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
  const handleCheckoutSubmit = (e: React.FormEvent) => {
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

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 8) {
      tempErrors.address = isRtl ? 'اكتب عنوان مفصل (الشارع، رقم العمارة، الشقة)' : 'Detailed address is too short';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    onCheckout({
      customerName: customerName.trim(),
      phone: phone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
      items: cartItems
    });

    setShowCheckoutForm(false);
    setCustomerName('');
    setPhone('');
    setDeliveryAddress('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#ffffff] border-l border-zinc-200 shadow-2xl flex flex-col justify-between font-sans text-[#18181b]">
      
      {/* Drawer Overlay backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs -z-10 cursor-pointer"
      />

      {/* Header */}
      <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between text-right">
        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[10px] text-red-650 text-red-600 hover:text-red-700 font-black flex items-center gap-1 cursor-pointer"
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
            <span>{isRtl ? 'سلة طلبات همر 🛒' : "Your Basket 🛒"}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 px-3 rounded-lg border border-zinc-250 border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 text-[11px] font-black leading-relaxed cursor-pointer transition"
          >
            {isRtl ? 'العودة للمينو ✕' : 'Close ✕'}
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
              <p className="text-xs text-zinc-500 mt-1 max-w-[250px] leading-relaxed font-bold">
                {isRtl 
                  ? 'تصفح منيو كريبات وفراخ همر النارية وصمم كريبك المبتكر الآن ليتحضر ساخناً ولذيت!' 
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
                          <span className="text-red-600 font-extrabold block">
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
                      className="text-[10px] text-zinc-400 hover:text-red-600 flex items-center gap-1 self-start font-black cursor-pointer py-1.5 transition duration-150"
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
        <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-4">
          
          {/* 1. Coupon Widget (Only if checkout form not active) */}
          {!showCheckoutForm && (
            <form onSubmit={handleApplyClick} className="flex gap-2">
              <button
                type="submit"
                className="px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl border border-red-700 transition cursor-pointer"
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
                  placeholder={isRtl ? 'اكتب رمز كوبون خصم همر...' : 'Promo coupon e.g. HUMMER10'}
                  className="w-full text-right pr-9 pl-3 py-2.5 bg-white text-zinc-950 rounded-xl text-xs border border-zinc-200 focus:border-red-600 uppercase font-sans font-bold outline-none shadow-xs"
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
              <span>{isRtl ? 'دليفري همر دقة وسرعة:' : 'Sonic Delivery:'}</span>
            </div>
            
            <div className="flex justify-between text-sm text-red-604 text-red-600 font-black border-t border-zinc-200 pt-2 pb-1">
              <span className="font-mono text-base">{finalTotal.toFixed(1)} {isRtl ? 'ج.م' : 'EGP'}</span>
              <span>{isRtl ? 'الحساب الإجمالي الكلي:' : 'Payable Amount:'}</span>
            </div>
          </div>

          {/* 3. Checkout Portal Form toggles */}
          <AnimatePresence>
            {showCheckoutForm ? (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCheckoutSubmit}
                className="space-y-3 pt-3 border-t border-zinc-200 text-right"
              >
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">
                    {isRtl ? 'اسم العميل ثلاثي:' : 'Customer Full Name:'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute top-2.5 right-3" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={isRtl ? 'احمد الشافعي ...' : 'e.g. John Doe'}
                      className="w-full text-right pr-9 pl-3 py-2 bg-white text-zinc-950 font-bold rounded-xl text-xs border border-zinc-200 outline-none focus:border-red-605 focus:border-red-600"
                    />
                  </div>
                  {errors.name && <p className="text-[9px] text-red-600 font-black">{errors.name}</p>}
                </div>

                {/* Telephone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">
                    {isRtl ? 'رقم الهاتف للتوصيل (11 رقم):' : 'Egyptian Mobile Number (11 Digits):'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute top-2.5 right-3" />
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // numbers only
                      placeholder={isRtl ? '01023456789' : '01012345678'}
                      className="w-full pr-9 pl-3 py-2 bg-white text-zinc-950 rounded-xl text-xs border border-zinc-200 outline-none focus:border-red-600 font-mono text-center font-bold"
                    />
                  </div>
                  {errors.phone && <p className="text-[9px] text-red-600 font-black">{errors.phone}</p>}
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase tracking-wide">
                    {isRtl ? 'العنوان التفصيلي ومكان التسليم:' : 'Detailed Delivery Address:'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute top-2.5 right-3" />
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder={isRtl ? 'مثال: عباس العقاد، عمارة 15، شقة 4، الدور الـ 3' : 'e.g. 15 Abbas Akkad St, Floor 3, App 4'}
                      className="w-full text-right pr-9 pl-3 py-2 bg-white text-zinc-950 font-bold rounded-xl text-xs border border-zinc-200 outline-none focus:border-red-600"
                    />
                  </div>
                  {errors.address && <p className="text-[9px] text-red-600 font-black">{errors.address}</p>}
                </div>

                {/* Payment method */}
                <div className="space-y-1.5 text-right">
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
                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black border border-green-700 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>
                    {isRtl ? 'تأكيد وشغل متتبع الأكل المباشر 🛰️' : 'Confirm Order & Fire Live Radar'}
                  </span>
                </button>
              </motion.form>
            ) : (
              <button
                onClick={() => setShowCheckoutForm(true)}
                className="w-full py-3 bg-red-656 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs text-center uppercase tracking-wide block border border-red-700 duration-200"
              >
                {isRtl ? 'الذهاب لتأكيد الطلب والعنوان 🍗' : 'Go to checkout and details 🍗'}
              </button>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
