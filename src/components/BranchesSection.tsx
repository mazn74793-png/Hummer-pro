import React, { useState } from 'react';
import { MapPin, Clock, Phone, AlertCircle, Check, Copy } from 'lucide-react';
import { Branch, SiteSettings } from '../types';

interface BranchesSectionProps {
  lang: 'ar' | 'en';
  branches: Branch[];
  siteSettings: SiteSettings;
}

export default function BranchesSection({ lang, branches, siteSettings }: BranchesSectionProps) {
  const isRtl = lang === 'ar';
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="branches" className="py-16 bg-zinc-50 border-t border-zinc-200 overflow-hidden text-[#18181b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-black mb-4">
            <MapPin className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="text-red-700 tracking-wide uppercase">{isRtl ? 'فروع همر - نصلك أينما كنت!' : 'Hummer Branches - Delivered Everywhere!'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-sans tracking-tight">
            {isRtl ? 'عناوين فروع همر ومناطق الدليفري 📍' : 'Our Physical Branches & Delivery Grid'}
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-2 leading-relaxed">
            {isRtl 
              ? 'نهبط بـ ٣ فروع رئيسية تغطي القاهرة والجيزة بسرعة هائلة للتوصيل، صالات همر مكيفة ودايماً منورة بلمتكم وعشاق الكريسبي!'
              : 'Our 3 premium flagship locations cover Cairo and Giza with quick delivery. Fully chilled, comfortable dine-in parlors are always open!'}
          </p>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(branches || []).map((branch) => (
            <div
              key={branch.id}
              className="p-6 bg-white border border-zinc-200 hover:border-zinc-900 rounded-[2.5rem] transition-all duration-300 relative group flex flex-col justify-between space-y-6 shadow-xs text-right"
            >
              {/* Card top flare decoration */}
              <div className="absolute top-0 right-10 w-20 h-0.5 bg-gradient-to-l from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
              
              <div className="space-y-4">
                {/* Visual Location Icon badge */}
                <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600">
                  <MapPin className="w-5 h-5" />
                </div>

                {/* Branch name */}
                <div>
                  <h3 className="text-base font-black text-zinc-900 font-sans">
                    {isRtl ? branch.nameAr : branch.nameEn}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-bold mt-1.5 flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isRtl ? branch.hoursAr : branch.hoursEn}</span>
                  </p>
                </div>

                {/* Address representation */}
                <p className="text-zinc-500 text-xs font-bold leading-relaxed">
                  {isRtl ? branch.addressAr : branch.addressEn}
                </p>
              </div>

              {/* Action Contact buttons */}
              <div className="space-y-2 pt-4 border-t border-zinc-200 font-sans text-xs">
                {/* Delivery Hotline direct */}
                <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-xl">
                  <span className="text-zinc-400 font-bold">
                    {isRtl ? 'الخط الساخن الموحد:' : 'Delivery Hotline:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-red-600 font-mono tracking-wider">
                      {branch.deliveryHotline}
                    </span>
                    <button
                      onClick={() => handleCopy(`${branch.id}-hl`, branch.deliveryHotline)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 transition cursor-pointer"
                      title={isRtl ? 'نسخ الخط الساخن' : 'Copy Hotline'}
                    >
                      {copiedId === `${branch.id}-hl` ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile direct branch contact */}
                <div className="flex items-center justify-between p-2 bg-zinc-50 rounded-xl">
                  <span className="text-zinc-400 font-bold">
                    {isRtl ? 'تواصل مع الفرع مباشرة:' : 'Direct Phone:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-zinc-900 font-mono tracking-wider select-all">
                      {branch.phone}
                    </span>
                    <button
                      onClick={() => handleCopy(`${branch.id}-ph`, branch.phone)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 transition cursor-pointer"
                      title={isRtl ? 'نسخ رقم الفرع' : 'Copy phone number'}
                    >
                      {copiedId === `${branch.id}-ph` ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Ticker bottom note */}
        <div className="mt-8 p-4 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center gap-2 max-w-3xl mx-auto">
          <AlertCircle className="w-5 h-5 text-zinc-500 flex-shrink-0 animate-pulse-slow" />
          <p className="text-[11px] sm:text-xs text-zinc-600 font-sans leading-relaxed text-right font-bold">
            {isRtl
              ? (siteSettings?.deliveryNoticeAr || 'ملاحظة: خدمة الدليفري والتوصيل تعمل على مدار الساعة طوال أيام الأسبوع حتى الساعة الرابعة فجراً في أي طقس!')
              : (siteSettings?.deliveryNoticeEn || 'Notice: Delivery service and takeout runs 24/7 in extreme weather conditions until 04:00 AM!')}
          </p>
        </div>

      </div>
    </section>
  );
}
