import React, { useState, useEffect } from 'react';
import { ChefHat, Flame, CheckCircle, Clock, Truck, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
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
    descEn: 'Our kitchen registered your request and is sorting fresh ingredients.',
    icon: CheckCircle
  },
  {
    status: 'cooking',
    labelAr: 'القلي الناري الجبار',
    labelEn: 'Sizzling Kitchen',
    descAr: 'فراخ الكريسبي حالياً في زيت القرمشة المغلي مع توابل هامر، وصاج الكريب سخن جداً.',
    descEn: 'Crunchy chicken pieces are sizzling, and crepes are being flipped.',
    icon: ChefHat
  },
  {
    status: 'wrapping',
    labelAr: 'تغليف دبل حافظ للحرارة',
    labelEn: 'Super Wrap',
    descAr: 'يتم الآن وضع وجبتك في بوكسات التظليل المزدوج ومكس الصوصات بداخل الحقيبة الحرارية.',
    descEn: 'Your active order is double-wrapped with temperature safeguards.',
    icon: Flame
  },
  {
    status: 'delivering',
    labelAr: 'السواق طار بالطلب',
    labelEn: 'Speedy Delivery',
    descAr: 'الكابتن استلم الوجبة، شغل الدراجة وطائر في طريق التوصيل السريع بـمكس الصوصات.',
    descEn: 'Captain has locked the thermal bag and is zooming straight to you.',
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
  const currentStep = order.status;
  const [eta, setEta] = useState<number>(order.estimatedMinutes);
  const [showReceipt, setShowReceipt] = useState<boolean>(true);

  // Sync ETA changes
  useEffect(() => {
    setEta(order.estimatedMinutes);
  }, [order.estimatedMinutes]);

  useEffect(() => {
    if (currentStep === 'completed') {
      setEta(0);
    }
  }, [currentStep]);

  const stepIndex = STEPS.findIndex(s => s.status === currentStep);
  const activeStepObj = STEPS[stepIndex !== -1 ? stepIndex : 0];

  const discountAmt = Number(order.discountAmount) || 0;
  const deliveryF = Number(order.deliveryFee) || 0;
  const totalP = Number(order.totalPrice) || 0;
  const couponC = order.couponCode || '';
  const calculatedSubtotal = Math.max(0, totalP - deliveryF + discountAmt);

  return (
    <div className="w-full bg-zinc-50 border border-zinc-200 rounded-[2.5rem] overflow-hidden relative shadow-sm animate-fadeIn" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Brand Navigation Header inside the order card */}
      <header className="bg-white border-b border-zinc-200 py-5 px-6 md:px-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            H
          </div>
          <h1 className="font-sans font-black text-xs md:text-sm tracking-tight text-zinc-950">
            {isRtl ? 'تتبع طلبك مباشر • مطعم هامر' : 'Live Order Tracking • Hummer App'}
          </h1>
        </div>
        <button
          onClick={onCloseOrder}
          type="button"
          className="px-4 py-2 text-xs font-black bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-red-600 rounded-xl transition cursor-pointer flex items-center gap-1 border border-zinc-200"
        >
          <span>{isRtl ? 'العودة للمنيو الرئيسي ➔' : 'Main Menu ➔'}</span>
        </button>
      </header>

      {/* Main Full-Size Tracking Container */}
      <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="w-full bg-white border border-zinc-150 rounded-[2rem] overflow-hidden relative shadow-sm">
          {/* Top Header Live Badge */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 py-4 px-6 flex items-center justify-between text-white font-sans">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="text-xs md:text-sm font-black tracking-wide">
                {isRtl ? 'رادار المتابعة الفورية والتجهيز المباشر' : 'LIVE KITCHEN RADAR STATION'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 bg-white/10 rounded-lg text-white font-black uppercase tracking-wider">
              ID: {order.id}
            </span>
          </div>

          {/* Content Wrapper */}
          <div className="p-6 space-y-6 text-right">
            
            {/* Tracker Card Details */}
            <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Countdown Block */}
              <div className="p-4 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-center items-center text-center order-2 md:order-none">
                {order.scheduledDeliveryTime ? (
                  <>
                    <span className="text-[10px] text-zinc-400 font-black tracking-wider block mb-1">
                      {isRtl ? '⏱️ موعد التوصيل المجدول والمستهدف:' : '⏱️ TARGET SCHEDULED TIME:'}
                    </span>
                    <p className="text-sm font-sans font-black text-red-600 px-2 py-1.5 bg-red-50 rounded-xl border border-red-100 mb-2">
                      {order.scheduledDeliveryTime}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-zinc-400 font-black tracking-wider block mb-1">
                      {isRtl ? 'الوقت المتبقي المقدر للوصول:' : 'ESTIMATED ARRIVAL TIME:'}
                    </span>
                    <p className="text-3xl font-display font-black text-red-600 tracking-wider">
                      {currentStep === 'completed' ? '00' : eta}{' '}
                      <span className="text-xs font-sans text-zinc-400">
                        {isRtl ? 'دقيقة' : 'Mins'}
                      </span>
                    </p>
                  </>
                )}
                <div className="mt-2 text-[10px] text-zinc-600 font-black bg-zinc-100 rounded-full border border-zinc-200 flex items-center gap-1.5 justify-center font-mono px-3 py-1">
                  <Truck className="w-3 h-3 text-red-600" />
                  <span>
                    {isRtl ? `كابتن التوصيل: ${order.captainName}` : `Delivery Agent: ${order.captainName}`}
                  </span>
                </div>
              </div>

              {/* Status overview */}
              <div className="space-y-2 text-right">
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

            {/* Banner of active promo coupon code info */}
            {couponC && (
              <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-right">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
                    %
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 font-sans">
                      {isRtl ? 'تفعيل العرض والخصم بنجاح! 🎟️' : 'Promo coupon applied & processed! 🎟️'}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-extrabold mt-0.5">
                      {isRtl 
                        ? `العرض المفعل بطلبك: كود (${couponC}) ${discountAmt > 0 ? `| قيمة الخصم المباشر: ${discountAmt} ج.م` : ' | هدية مجانية مدمجة بطلبك!'}` 
                        : `Promo: Code (${couponC}) ${discountAmt > 0 ? `| Direct Discount: -${discountAmt} EGP` : ' | Free bonus included!'}`}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-600 text-white font-mono text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-700">
                  {couponC}
                </div>
              </div>
            )}

            {/* Timeline Visual Progress steps */}
            <div className="space-y-4 text-right">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {isRtl ? 'خطوات التحضير الجاري:' : 'PREPARATION TIMELINE STEPPERS:'}
              </h3>
              
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 px-2">
                {/* Steps Nodes */}
                {STEPS.map((step, idx) => {
                  const isPassed = idx <= stepIndex;
                  const isActive = step.status === currentStep;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex md:flex-col items-center gap-3 md:gap-2.5 z-10 w-full md:w-auto justify-start md:justify-center">
                      {/* Circle Node */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                          isActive
                            ? 'bg-red-600 border-red-700 text-white shadow ring-4 ring-red-100'
                            : isPassed
                            ? 'bg-zinc-900 border-zinc-950 text-white'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {/* Node Text Label */}
                      <div className="text-right md:text-center w-full md:w-auto">
                        <p className={`text-xs font-black leading-tight ${isActive ? 'text-red-605 text-red-600' : isPassed ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {isRtl ? step.labelAr : step.labelEn}
                        </p>
                        <span className="text-[9px] font-bold text-zinc-400 block md:block">
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
                <div className="space-y-3 pt-3 border-t border-zinc-200 animate-fadeIn text-right">
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
                            {item.notes && ` | 📝 ${item.notes}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Calculations */}
                  <div className="pt-2 border-t border-zinc-200 space-y-1 text-zinc-400 font-bold text-right">
                    <div className="flex justify-between">
                      <span className="font-mono text-zinc-900 font-black">{calculatedSubtotal.toFixed(1)} ج.م</span>
                      <span>{isRtl ? 'المجموع الأساسي:' : 'Subtotal:'}</span>
                    </div>
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-green-600 font-black">
                        <span className="font-mono">-{discountAmt.toFixed(1)} ج.م</span>
                        <span>
                          {isRtl ? 'الخصومات المطبقة:' : 'Promo discount:'}
                          {couponC && (
                            <span className="mr-1.5 px-2 py-0.5 bg-green-500/10 text-green-700 font-mono text-[9px] rounded-md font-black border border-green-500/20 uppercase tracking-wider">
                              Code: {couponC}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {couponC && discountAmt === 0 && (
                      <div className="flex justify-between text-green-600 font-black">
                        <span>{isRtl ? 'هدية مفعلة ✔️' : 'Free Gift Active ✔️'}</span>
                        <span>
                          {isRtl ? 'العرض المطبق:' : 'Applied Promo:'}
                          <span className="mr-1.5 px-2 py-0.5 bg-green-500/10 text-green-700 font-mono text-[9px] rounded-md font-black border border-green-500/20 uppercase tracking-wider">
                            Code: {couponC}
                          </span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-mono text-zinc-900 font-black">+{deliveryF} ج.م</span>
                      <span>{isRtl ? 'توصيل هامر الصاروخي:' : 'Sonic Delivery Fee:'}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-red-600 font-black pt-1.5 border-t border-zinc-200">
                      <span className="font-mono text-base">{totalP} ج.م</span>
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
                className="w-full py-3 bg-green-600 hover:bg-green-750 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow border border-green-700 active:scale-95 text-center leading-none"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                <span>{isRtl ? 'تحتاج مساعدة بخصوص طلبك؟ اسأل الكاشير على واتساب 💬' : 'Need live order support? Chat on WhatsApp 💬'}</span>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={onCloseOrder}
                type="button"
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-250 border border-zinc-200 text-zinc-700 hover:text-black rounded-xl text-xs font-black transition cursor-pointer text-center"
              >
                {isRtl ? 'استمر في استعراض المنيو' : 'Keep browsing food menu'}
              </button>
              <button
                onClick={onCloseOrder}
                type="button"
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center border border-red-705"
              >
                {isRtl ? 'العودة لمتابعة الطلب لاحقاً' : 'Return to Active Radar'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
