import React, { useState, useEffect } from 'react';
import { ChefHat, Flame, CheckCircle, Clock, Truck, ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderState, OrderStep } from '../types';

interface OrderTrackerProps {
  order: OrderState;
  onCloseOrder: () => void;
  lang: 'ar' | 'en';
}

const STEPS: { status: OrderStep; labelAr: string; labelEn: string; descAr: string; descEn: string; icon: any }[] = [
  {
    status: 'received',
    labelAr: 'تم استلام الطلب',
    labelEn: 'Order Received',
    descAr: 'مطبخ هامر سجل طلبك وبدأ في تجهيز المقادير الطازة ونخل دقيق القرمشة.',
    descEn: 'Our terminal registered your request and is sorting fresh local seasonings.',
    icon: CheckCircle
  },
  {
    status: 'cooking',
    labelAr: 'القلي الناري الجبار',
    labelEn: 'Bubbling Frying Lab',
    descAr: 'فراخ الكريسبي حالياً في زيت القرمشة المغلي مع توابل هامر، وصاج الكريب سخن جداً.',
    descEn: 'Crunchy chicken pieces are sizzling on the grill, and crepes are being flipped.',
    icon: ChefHat
  },
  {
    status: 'wrapping',
    labelAr: 'تغليف دبل حافظ للحرارة',
    labelEn: 'Super Double-Wrap',
    descAr: 'يتم الآن وضع وجبتك في بوكسات التظليل المزدوج ومكس الصوصات بداخل الحقيبة الحرارية.',
    descEn: 'Your dynamic order is double-wrapped into thermal boxes with heavy dip piles.',
    icon: Flame
  },
  {
    status: 'delivering',
    labelAr: 'السواق طار بالطلب',
    labelEn: 'Speedy Captain Flying',
    descAr: 'الكابتن أبو حميد استلم الوجبة، شغل الدراجة النارية وطائر في طريق التوصيل السريع.',
    descEn: 'Captain Abu Humaid has locked the thermal bag, kickstarted his bike, and is zooming.',
    icon: Truck
  },
  {
    status: 'completed',
    labelAr: 'تم التوصيل بالعافية!',
    labelEn: 'Enjoy the Crunch!',
    descAr: 'الطلب في يدك دافئ ومقرمش! لا تنسى تعطينا رأيك وتقييمك على الموقع يا بطل.',
    descEn: 'Delivered dry, steaming hot and flaky! Leave us a review on your favorite crepe combo!',
    icon: CheckCircle
  }
];

export default function OrderTracker({ order, onCloseOrder, lang }: OrderTrackerProps) {
  const isRtl = lang === 'ar';
  const [currentStep, setCurrentStep] = useState<OrderStep>(order.status);
  const [eta, setEta] = useState<number>(order.estimatedMinutes);
  const [showReceipt, setShowReceipt] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 640 : false;
  });

  // Auto progression of order status simulator for extremely satisfying UX
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const stepsList: OrderStep[] = ['received', 'cooking', 'wrapping', 'delivering', 'completed'];
    const currentIndex = stepsList.indexOf(currentStep);

    if (currentIndex < stepsList.length - 1) {
      // Elevate step every 12 seconds
      intervalId = setInterval(() => {
        const nextIndex = currentIndex + 1;
        const nextStep = stepsList[nextIndex];
        setCurrentStep(nextStep);

        // Deduct remaining minutes dynamically
        setEta((prev) => Math.max(3, prev - Math.floor(Math.random() * 8 + 3)));
      }, 12000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStep]);

  const activeStepObj = STEPS.find((s) => s.status === currentStep) || STEPS[0];
  const stepIndex = STEPS.findIndex((s) => s.status === currentStep);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden relative shadow-lg text-[#18181b]"
      >
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-red-655 from-red-600 via-orange-600 to-amber-500 py-3.5 px-6 flex items-center justify-between text-white font-sans">
          <button
            onClick={onCloseOrder}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition flex items-center justify-center cursor-pointer"
            title={isRtl ? 'إغلاق ومتابعة التسوق' : 'Close and shop'}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wide">
              {isRtl ? 'بث مباشر لتجهيز طلب هامر الخاص بك' : 'LIVE HUMMER ORDER RADER'}
            </span>
            <Clock className="w-5 h-5 text-yellow-300 animate-pulse animate-bounce" />
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="p-6 space-y-6 text-right">
          
          {/* Tracker Card Details */}
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Countdown Block */}
            <div className="p-4 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-center items-center text-center order-2 md:order-none">
              <span className="text-[10px] text-zinc-400 font-black tracking-wider block mb-1">
                {isRtl ? 'الوقت المتبقي المقدر للوصول:' : 'ESTIMATED ARRIVAL TIME:'}
              </span>
              <p className="text-3xl font-display font-black text-red-600 tracking-wider">
                {currentStep === 'completed' ? '00' : eta}{' '}
                <span className="text-xs font-sans text-zinc-400">
                  {isRtl ? 'دقيقة' : 'Mins'}
                </span>
              </p>
              <div className="mt-2 text-[10px] text-zinc-650 font-black bg-zinc-50 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200 flex items-center gap-1.5 justify-center font-mono">
                <Truck className="w-3 h-3 text-red-600" />
                <span>
                  {isRtl ? `كابتن التوصيل: ${order.captainName}` : `Delivery Agent: ${order.captainName}`}
                </span>
              </div>
            </div>

            {/* Status overview */}
            <div className="space-y-2">
              <span className="text-[10px] text-red-600 font-black uppercase tracking-widest block">
                {isRtl ? 'الحالة الحالية المقدرة:' : 'CURRENT STATUS DETAILS:'}
              </span>
              <h2 className="text-xl font-black text-zinc-950 font-sans">
                {isRtl ? activeStepObj.labelAr : activeStepObj.labelEn}
              </h2>
              <p className="text-xs text-zinc-500 font-bold leading-relaxed font-sans mt-1">
                {isRtl ? activeStepObj.descAr : activeStepObj.descEn}
              </p>
            </div>

          </div>

          {/* Timeline Visual Progress steps (RTL/LTR handling) */}
          <div className="space-y-4 text-right">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              {isRtl ? 'خطوات التحضير الجاري:' : 'PREPARATION TIMELINE STEPPERS:'}
            </h3>
            
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 px-2">
              {/* Connector line for wide screens */}
              <div className="absolute left-[20px] sm:left-4 sm:right-4 top-4 bottom-4 sm:bottom-auto sm:top-1/2 h-full sm:h-0.5 bg-zinc-100 -z-10 w-0.5 sm:w-auto" />
              <div 
                className="absolute left-[20px] sm:left-4 top-4 sm:top-1/2 h-full sm:h-0.5 bg-gradient-to-r from-red-605 from-red-600 to-yellow-500 -z-10 transition-all duration-1000 w-0.5 sm:w-auto" 
                style={{ 
                  width: window.innerWidth > 640 ? `${(stepIndex / (STEPS.length - 1)) * 96}%` : '2px',
                  height: window.innerWidth <= 640 ? `${(stepIndex / (STEPS.length - 1)) * 90}%` : '2px'
                }}
              />

              {/* Steps Nodes */}
              {STEPS.map((step, idx) => {
                const isPassed = idx <= stepIndex;
                const isActive = step.status === currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex sm:flex-col items-center gap-3 sm:gap-2.5 z-10 w-full sm:w-auto justify-end sm:justify-start">
                    {/* Circle Node */}
                    <motion.div
                      animate={isActive ? { scale: [1, 1.12, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                        isActive
                          ? 'bg-red-600 border-red-700 text-white shadow ring-4 ring-red-100'
                          : isPassed
                          ? 'bg-zinc-900 border-zinc-950 text-white'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    {/* Node Text Label */}
                    <div className="text-right sm:text-center w-full sm:w-auto">
                      <p className={`text-xs font-black leading-tight ${isActive ? 'text-red-605 text-red-600' : isPassed ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        {isRtl ? step.labelAr : step.labelEn}
                      </p>
                      <span className="text-[9px] font-bold text-zinc-400 block sm:hidden md:block">
                        {isActive ? (isRtl ? 'جاري الآن' : 'In Progress') : isPassed ? (isRtl ? 'اكتملت' : 'Done') : (isRtl ? 'انتظار' : 'Pending')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Receipt collapse */}
          <div className="border border-zinc-200 rounded-2xl bg-zinc-50 p-4 space-y-3 font-sans text-xs">
            <button
              onClick={() => setShowReceipt(!showReceipt)}
              className="flex justify-between items-center w-full focus:outline-none cursor-pointer text-right"
              type="button"
            >
              <span className="text-[10px] font-mono text-center text-red-600 font-extrabold hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-lg px-2 py-1">
                {showReceipt ? (isRtl ? 'إخفاء التفاصيل ▲' : 'Hide Details ▲') : (isRtl ? 'عرض تفاصيل الطلب والفاتورة ▼' : 'Show Details ▼')}
              </span>
              <span className="font-black text-zinc-900 text-xs">{isRtl ? 'تفاصيل فاتورة الطلب:' : 'Receipt Breakdown:'}</span>
            </button>

            {showReceipt && (
              <div className="space-y-3 pt-3 border-t border-zinc-205 border-zinc-200 animate-fadeIn text-right">
                {/* Cart Item Row list */}
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-zinc-700">
                      <span className="font-mono font-black text-zinc-900 text-xs">
                        {item.pricePerUnit * item.quantity} ج.م
                      </span>
                      <div className="text-right space-y-0.5">
                        <p className="font-extrabold text-xs text-zinc-900">
                          {isRtl ? item.nameAr : item.nameEn} <span className="text-red-600 font-extrabold">x{item.quantity}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold">
                          {item.selectedSizeAr && `${isRtl ? 'حجم' : 'Size'}: ${isRtl ? item.selectedSizeAr : item.selectedSize}`}
                          {item.isSpicy && ` | ${isRtl ? 'نار سبايسي' : 'Spicy'}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Calculations */}
                <div className="pt-2 border-t border-zinc-200 space-y-1 text-zinc-400 font-bold text-right">
                  <div className="flex justify-between">
                    <span className="font-mono text-zinc-900 font-black">{(order.totalPrice - order.deliveryFee + order.discountAmount).toFixed(1)} ج.م</span>
                    <span>{isRtl ? 'المجموع الأساسي:' : 'Subtotal:'}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-black">
                      <span className="font-mono">-{order.discountAmount.toFixed(1)} ج.م</span>
                      <span>{isRtl ? 'الخصومات المطبقة:' : 'Promo discount:'}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-mono text-zinc-900 font-black">+{order.deliveryFee} ج.م</span>
                    <span>{isRtl ? 'توصيل هامر الصاروخي:' : 'Sonic Delivery Fee:'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-red-600 font-black pt-1.5 border-t border-zinc-200">
                    <span className="font-mono text-base">{order.totalPrice} ج.م</span>
                    <span>{isRtl ? 'المجموع النهائي المطلوب للفرن:' : 'Final Payable Amount:'}</span>
                  </div>
                </div>

                {/* Note Address overview */}
                <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-1 block mt-4 text-right">
                  <p className="text-[10px] text-zinc-400 font-black block uppercase tracking-wide">
                    {isRtl ? 'بيانات التوصيل والعنوان:' : 'DELIVERY INFORMATION:'}
                  </p>
                  <p className="font-black text-zinc-900 text-xs">
                    {order.customerName} - {order.phone}
                  </p>
                  <p className="text-zinc-500 text-[11px] leading-relaxed font-bold">
                    {order.deliveryAddress}
                  </p>
                  <p className="text-[10px] text-[#b45309] font-black mt-1 block uppercase">
                    {isRtl 
                      ? `طريقة السداد: الدفع نقداً عند الاستلام (${order.paymentMethod === 'cash' ? 'كاش' : 'بطاقة'})` 
                      : `Method: Cash on delivery (${order.paymentMethod === 'cash' ? 'Cash' : 'Card'})`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp direct customer helpline */}
          <div className="flex justify-center">
            <a
              href={`https://wa.me/201026040846?text=${encodeURIComponent(
                isRtl 
                  ? `أهلاً يا فندم، أبقى مستفسر بخصوص طلبي من مطعم هامر ورقم الأوردر بتاعي هو: ${order.id}` 
                  : `Hello, I would like to inquire about my order from Hummer. Order Reference ID: ${order.id}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow border border-green-700 active:scale-95 text-center leading-none"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{isRtl ? 'تحتاج مساعدة بخصوص طلبك؟ اسأل الكاشير على واتساب 💬' : 'Need live order support? Chat on WhatsApp 💬'}</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={onCloseOrder}
              className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-black transition cursor-pointer text-center"
            >
              {isRtl ? 'استمر في استعراض المنيو' : 'Keep browsing food menu'}
            </button>
            <button
              onClick={onCloseOrder}
              className="flex-1 py-3 bg-red-655 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center border border-red-700"
            >
              {isRtl ? 'العودة لمتابعة الطلب لاحقاً' : 'Return to Active Radar'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
