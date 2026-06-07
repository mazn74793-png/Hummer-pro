import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Plus, Trash2, Edit2, Upload, AlertCircle, Maximize2, Minimize2, 
  Settings, Loader2, ChefHat, Bell, Wifi, ArrowDown, ArrowUp, RefreshCw, Eye,
  MapPin, Edit, EyeOff, LayoutTemplate, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, OrderState, OrderStep, FoodCategory, SizeOption, Branch, SiteSettings } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  orders: OrderState[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStep) => void;
  onDeleteOrder: (orderId: string) => void;
  menuItems: MenuItem[];
  onUpdateMenuItems: (newItems: MenuItem[]) => void;
  onClearAllOrders: () => void;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (newSettings: SiteSettings) => void;
  branches: Branch[];
  onUpdateBranches: (newBranches: Branch[]) => void;
}

export default function AdminDashboard({
  isOpen,
  onClose,
  lang,
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  menuItems,
  onUpdateMenuItems,
  onClearAllOrders,
  siteSettings,
  onUpdateSiteSettings,
  branches,
  onUpdateBranches
}: AdminDashboardProps) {
  const isRtl = lang === 'ar';
  
  // Tabs: 'orders' | 'menu-manager' | 'site-settings' | 'cloudinary-settings'
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'menu-manager' | 'site-settings' | 'cloudinary-settings'>('orders');

  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cloudinary configuration states (saving to LocalStorage so they persist)
  const [cloudName, setCloudName] = useState(() => {
    return localStorage.getItem('hummer_cloudinary_cloud_name') || 'duvsy8pzn';
  });
  const [uploadPreset, setUploadPreset] = useState(() => {
    return localStorage.getItem('hummer_cloudinary_upload_preset') || 'hummer_preset';
  });

  // Food Item Form states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formPrice, setFormPrice] = useState<number>(100);
  const [formCategory, setFormCategory] = useState<FoodCategory>('crepes');
  const [formSpicy, setFormSpicy] = useState(true);
  const [formTags, setFormTags] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  
  // Sizes additions
  const [formSizesList, setFormSizesList] = useState<SizeOption[]>([]);
  const [sizeNameAr, setSizeNameAr] = useState('');
  const [sizeNameEn, setSizeNameEn] = useState('');
  const [sizeExtraPrice, setSizeExtraPrice] = useState<number>(0);

  // Upload feedback states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  // Site settings editing states
  const [editedSettings, setEditedSettings] = useState<SiteSettings>({ ...siteSettings });

  // Update whenever siteSettings prop changes
  useEffect(() => {
    setEditedSettings({ ...siteSettings });
  }, [siteSettings]);

  // Branches states
  const [editedBranches, setEditedBranches] = useState<Branch[]>(() => [...branches]);
  useEffect(() => {
    setEditedBranches([...branches]);
  }, [branches]);

  // Selected branch to edit form (null for list, "new" for fresh, or ID)
  const [siteEditorSubSection, setSiteEditorSubSection] = useState<'content' | 'branches'>('content');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchFormNameAr, setBranchFormNameAr] = useState('');
  const [branchFormNameEn, setBranchFormNameEn] = useState('');
  const [branchFormAddressAr, setBranchFormAddressAr] = useState('');
  const [branchFormAddressEn, setBranchFormAddressEn] = useState('');
  const [branchFormPhone, setBranchFormPhone] = useState('');
  const [branchFormHoursAr, setBranchFormHoursAr] = useState('');
  const [branchFormHoursEn, setBranchFormHoursEn] = useState('');

  const handleSaveSiteSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings(editedSettings);
    toastNotification(isRtl ? 'تم حفظ وتحديث محتوى الموقع بنجاح!' : 'Homepage layout content updated successfully!');
  };

  const handleSetupEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setBranchFormNameAr(branch.nameAr);
    setBranchFormNameEn(branch.nameEn);
    setBranchFormAddressAr(branch.addressAr || '');
    setBranchFormAddressEn(branch.addressEn || '');
    setBranchFormPhone(branch.phone || '');
    setBranchFormHoursAr(branch.hoursAr || '');
    setBranchFormHoursEn(branch.hoursEn || '');
  };

  const handleSetupNewBranch = () => {
    setEditingBranchId('new');
    setBranchFormNameAr('');
    setBranchFormNameEn('');
    setBranchFormAddressAr('');
    setBranchFormAddressEn('');
    setBranchFormPhone('');
    setBranchFormHoursAr('');
    setBranchFormHoursEn('');
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchFormNameAr || !branchFormNameEn) {
      toastNotification(isRtl ? 'برجاء ملء اسم الفرع بالعربي والإنجليزي!' : 'Branch Name in English & Arabic is required');
      return;
    }
    let updatedBranches: Branch[] = [];
    if (editingBranchId === 'new') {
      const newBranch: Branch = {
        id: `branch-${Date.now()}`,
        nameAr: branchFormNameAr.trim(),
        nameEn: branchFormNameEn.trim(),
        addressAr: branchFormAddressAr.trim(),
        addressEn: branchFormAddressEn.trim(),
        phone: branchFormPhone.trim(),
        hoursAr: branchFormHoursAr.trim(),
        hoursEn: branchFormHoursEn.trim()
      };
      updatedBranches = [...editedBranches, newBranch];
    } else {
      updatedBranches = editedBranches.map(b => {
        if (b.id === editingBranchId) {
          return {
            ...b,
            nameAr: branchFormNameAr.trim(),
            nameEn: branchFormNameEn.trim(),
            addressAr: branchFormAddressAr.trim(),
            addressEn: branchFormAddressEn.trim(),
            phone: branchFormPhone.trim(),
            hoursAr: branchFormHoursAr.trim(),
            hoursEn: branchFormHoursEn.trim()
          };
        }
        return b;
      });
    }
    onUpdateBranches(updatedBranches);
    setEditingBranchId(null);
    toastNotification(isRtl ? 'تم حفظ بيانات الفرع بنجاح! 📍' : 'Branch details stored successfully! 📍');
  };

  const handleDeleteBranch = (branchId: string) => {
    if (confirm(isRtl ? 'هل متأكد من رغبتك في حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?')) {
      const updated = editedBranches.filter(b => b.id !== branchId);
      onUpdateBranches(updated);
      toastNotification(isRtl ? 'تم حذف الفرع بنجاح.' : 'Branch deleted successfully.');
    }
  };

  // Order alerts sound & visual trackers
  const [lastOrderCount, setLastOrderCount] = useState(orders.length);

  // Sound Synth for live cashier chime alert
  const playCashierChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Chime note 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.35);

      // Chime note 2 slightly staggered
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain2.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.55);
      }, 150);

    } catch (e) {
      console.warn('Audio synthesis blocked by user interaction restrictions', e);
    }
  };

  // Monitor newly coming live orders and play kitchen bell chime!
  useEffect(() => {
    if (orders.length > lastOrderCount) {
      playCashierChime();
    }
    setLastOrderCount(orders.length);
  }, [orders, lastOrderCount]);

  // Fullscreen toggle action
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen to fullscreen changes outside standard triggers
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Save Cloudinary configurations
  const handleSaveCloudinaryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hummer_cloudinary_cloud_name', cloudName.trim());
    localStorage.setItem('hummer_cloudinary_upload_preset', uploadPreset.trim());
    toastNotification(
      isRtl ? 'تم حفظ إعدادات خادم كلاودنري بنجاح!' : 'Cloudinary configuration stored successfully!'
    );
  };

  // Cloudinary Image Unsigned Upload Logic
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(10); // initial jump for feedback

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset.trim());

    try {
      setUploadProgress(35);
      const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(80);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Upload HTTP request failed');
      }

      const resJson = await response.json();
      setUploadProgress(100);
      if (resJson.secure_url) {
        setFormImageUrl(resJson.secure_url);
        toastNotification(isRtl ? 'تم رفع الصورة وحفظ الرابط بنجاح!' : 'Image uploaded to Cloudinary successfully!');
      } else {
        throw new Error('Secure URL is missing in Cloudinary response');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(
        isRtl 
          ? `فشل رفع الملف! برجاء مراجعة الـ Cloud Name والـ Preset وتفعيل الرفع غير المشفر Unsigned Upload في لوحة كلاودنري. التفاصيل: ${err.message}`
          : `Upload failed! Kindly verify Cloud Name and Unsigned Preset settings. Error: ${err.message}`
      );
    } finally {
      setIsUploading(false);
      // Reset progress feedback delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLogoUploading(true);
    
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = cloudName && cloudName !== 'duvsy8pzn' && uploadPreset && uploadPreset !== 'hummer_preset';
    
    if (isCloudinaryConfigured) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset.trim());
        const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`;
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.secure_url) {
            setEditedSettings(prev => ({ ...prev, logoUrl: data.secure_url }));
            toastNotification(isRtl ? 'تم رفع اللوجو إلى السحابة بنجاح!' : 'Logo uploaded to Cloudinary successfully!');
            setIsLogoUploading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Cloudinary logo upload failed, falling back to local Base64", err);
      }
    }
    
    // Fallback to Base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditedSettings(prev => ({ ...prev, logoUrl: reader.result }));
        toastNotification(isRtl ? 'تم تحويل وحفظ اللوجو بنجاح!' : 'Logo loaded and saved successfully!');
      }
      setIsLogoUploading(false);
    };
    reader.onerror = () => {
      setIsLogoUploading(false);
      toastNotification(isRtl ? 'فشل قراءة ملف اللوجو!' : 'Failed to read Logo file!');
    };
    reader.readAsDataURL(file);
  };

  const handleIntroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
      toastNotification(isRtl ? 'حجم الفيديو كبير جداً! اختر ملف أقل من 20 ميجابايت لضمان عمله من الهاتف.' : 'Video size is large! Select under 20MB for best phone support.');
    }
    
    setIsVideoUploading(true);
    const isCloudinaryConfigured = cloudName && cloudName !== 'duvsy8pzn' && uploadPreset && uploadPreset !== 'hummer_preset';
    
    if (isCloudinaryConfigured) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset.trim());
        const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/video/upload`;
        const res = await fetch(url, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.secure_url) {
            setEditedSettings(prev => ({ ...prev, introVideoUrl: data.secure_url }));
            toastNotification(isRtl ? 'تم رفع الفيديو والربط بنجاح!' : 'Video uploaded successfully to your Cloud!');
            setIsVideoUploading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Cloudinary video upload failed, trying local Base64 inline", err);
      }
    }
    
    // Fallback to Base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditedSettings(prev => ({ ...prev, introVideoUrl: reader.result }));
        toastNotification(isRtl ? 'تم تحميل وحفظ فيديو الافتتاح بنجاح!' : 'Intro video saved offline successfully!');
      }
      setIsVideoUploading(false);
    };
    reader.onerror = () => {
      setIsVideoUploading(false);
      toastNotification(isRtl ? 'فشل قراءة ملف الفيديو!' : 'Failed to read video file!');
    };
    reader.readAsDataURL(file);
  };

  // Custom alert utility
  const [toastText, setToastText] = useState('');
  const toastNotification = (text: string) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  // Size Options Form addition
  const handleAddSizeOption = () => {
    if (!sizeNameAr || !sizeNameEn) {
      toastNotification(isRtl ? 'اكتب اسم الحجم بالعربي والإنجليزي' : 'Please fill both size labels');
      return;
    }
    const newSize: SizeOption = {
      id: `sz-opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nameAr: sizeNameAr.trim(),
      nameEn: sizeNameEn.trim(),
      extraPrice: Math.round(Number(sizeExtraPrice)) || 0
    };
    setFormSizesList([...formSizesList, newSize]);
    setSizeNameAr('');
    setSizeNameEn('');
    setSizeExtraPrice(0);
  };

  const handleRemoveSizeOptionLocal = (sizeId: string) => {
    setFormSizesList(formSizesList.filter(s => s.id !== sizeId));
  };

  // Create or Update Menu Item
  const handleSaveFoodItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameAr || !formNameEn || !formImageUrl) {
      toastNotification(isRtl ? 'برجاء كتابة الاسم ورفع أو إدخال رابط الصورة فبل الحفظ!' : 'Name and Image links are mandatory!');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const priceNum = Math.round(Number(formPrice)) || 0;

    let updatedList: MenuItem[];

    if (editingItem) {
      // Edit mode
      updatedList = menuItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            nameAr: formNameAr.trim(),
            nameEn: formNameEn.trim(),
            descriptionAr: formDescAr.trim(),
            descriptionEn: formDescEn.trim(),
            price: priceNum,
            category: formCategory,
            spicyOption: formSpicy,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            sizes: formSizesList.length > 0 ? formSizesList : undefined,
            image: formImageUrl
          };
        }
        return item;
      });
      toastNotification(isRtl ? 'تم تعديل الوجبة في المنيو بنجاح!' : 'Dish updated successfully!');
    } else {
      // Create mode
      const newItem: MenuItem = {
        id: `food-item-${Date.now()}`,
        nameAr: formNameAr.trim(),
        nameEn: formNameEn.trim(),
        descriptionAr: formDescAr.trim(),
        descriptionEn: formDescEn.trim(),
        price: priceNum,
        category: formCategory,
        spicyOption: formSpicy,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        sizes: formSizesList.length > 0 ? formSizesList : undefined,
        image: formImageUrl
      };
      updatedList = [newItem, ...menuItems];
      toastNotification(isRtl ? 'تمت إضافة الوجبة الجديدة للمنيو بنجاح!' : 'New dish created successfully!');
    }

    onUpdateMenuItems(updatedList);
    resetFoodForm();
  };

  const resetFoodForm = () => {
    setEditingItem(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormPrice(100);
    setFormCategory('crepes');
    setFormSpicy(true);
    setFormTags('');
    setFormImageUrl('');
    setFormSizesList([]);
    setSizeNameAr('');
    setSizeNameEn('');
    setSizeExtraPrice(0);
  };

  const startEditFoodItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormNameAr(item.nameAr);
    setFormNameEn(item.nameEn);
    setFormDescAr(item.descriptionAr);
    setFormDescEn(item.descriptionEn);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormSpicy(!!item.spicyOption);
    setFormTags(item.tags?.join(', ') || '');
    setFormImageUrl(item.image);
    setFormSizesList(item.sizes || []);
    // Switch to form area for editing
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteFoodItem = (itemId: string) => {
    if (confirm(isRtl ? 'هل تريد بالتأكيد حذف هذا الصنف بالكامل من قائمة الطعام؟' : 'Are you sure you want to delete this dish from the menu?')) {
      const filtered = menuItems.filter(item => item.id !== itemId);
      onUpdateMenuItems(filtered);
      toastNotification(isRtl ? 'تم حذف الصنف من المنيو!' : 'Dish deleted from the menu!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950 text-[#e4e4e7] flex flex-col font-sans" id="admin-viewport">
      {/* Top Bar for System Command & Full Screen Trigger */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 lg:px-12 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left Section: Active Feed indicators */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>{isRtl ? 'إغلاق لوحة الأدمن ✕' : 'Exit Admin ✕'}</span>
          </button>

          <div className="flex items-center gap-1 bg-green-950/60 border border-green-800 px-3 py-1.5 rounded-xl text-xs text-green-400 font-bold">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping pointer-events-none" />
            <span>{isRtl ? 'بث حي ومباشر (لايف)' : 'LIVE STREAM ACTIVE'}</span>
          </div>

          <button
            onClick={() => {
              playCashierChime();
              toastNotification(isRtl ? 'تم اختبار جرس التنبيه للمطبخ 🔔' : 'Kitchen bell test fired 🔔');
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
            title="اختبار الصوت"
          >
            <Bell className="w-3.5 h-3.5 text-yellow-500 animate-bounce" />
            <span className="hidden sm:inline">{isRtl ? 'اختبار الجرس' : 'Test Bell'}</span>
          </button>
        </div>

        {/* Center Section: App Title */}
        <div className="text-center">
          <h2 className="text-lg font-black text-white flex items-center gap-2 justify-center tracking-normal">
            <ChefHat className="w-5 h-5 text-red-500" />
            <span>{isRtl ? 'لوحة تحكم كاشير ومطبخ همر 🍔' : 'Hummer POS & Kitchen Radar'}</span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono">STATION ID: #CAIRO-19033-MAIN</p>
        </div>

        {/* Right Section: Core Fullscreen Enforce Trigger */}
        <div className="flex items-center gap-3">
          {/* Forcing Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="bg-gradient-to-r from-red-655 from-red-600 to-amber-500 hover:brightness-110 text-white py-2 px-4 rounded-xl text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5 border border-red-700 select-none animate-pulse-slow"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="uppercase text-[11px]">
              {isFullscreen 
                ? (isRtl ? 'تقليص الشاشة' : 'Exit Fullscreen') 
                : (isRtl ? 'تفعيل كامل الشاشة إجباري 📺' : 'FORCE FULLSCREEN 📺')}
            </span>
          </button>
        </div>

      </div>

      {/* Main Container */}
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-12 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Admin Sub Tabs block */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-1.5 shadow-sm text-right">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2 mb-2">
              {isRtl ? 'تصفح الأقسام:' : 'Control Areas:'}
            </h3>
            
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'orders'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'الطلبات المباشرة (لايف)' : 'Live Orders Queue'}</span>
              <span className="bg-zinc-950 text-white font-mono text-[10px] py-0.5 px-2 rounded-full font-black">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('menu-manager');
                resetFoodForm();
              }}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'menu-manager'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'إدارة قائمة الطعام (المنيو)' : 'Menu Items Manager'}</span>
              <span className="bg-zinc-950 text-white font-mono text-[10px] py-0.5 px-2 rounded-full font-black">
                {menuItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('site-settings')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'site-settings'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'تعديل كلام الموقع والفروع ⚙️' : 'Edit Pages & Branches ⚙️'}</span>
              <LayoutTemplate className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => setActiveSubTab('cloudinary-settings')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'cloudinary-settings'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'إعدادات الرفع (Cloudinary)' : 'Cloudinary Config'}</span>
              <Settings className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Setup Cloudinary Credentials Mini Hint Summary card */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl text-right space-y-3 shadow-md">
            <h4 className="text-[11px] font-black text-amber-500 uppercase flex items-center gap-1.5 justify-end">
              <span>{isRtl ? 'كيفية تغيير صور الموقع؟' : 'How to alter local images?'}</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
              {isRtl 
                ? 'لو عايز ترفع صور المنيو وتغير صور البطاطس والكريب لصور مطعمك الحقيقية، افتح حساب مجاني على موقع Cloudinary وفعل ميزة الرفع غير المشفر Unsigned Upload من الـ Upload Presets، وحط الـ Cloud Name والـ Preset في قسم الإعدادات هنا!' 
                : 'To upload real photos, set up a free Cloudinary account, enable Unsigned Upload in Upload Presets, and paste Cloud Name / Preset in Settings here.'}
            </p>
            <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 overflow-x-auto text-left">
              <p>CLOUD: {cloudName || 'N/A'}</p>
              <p className="mt-1">PRESET: {uploadPreset || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Content Screens Grid */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Audio & Alert Banner portal inline */}
          {toastText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-red-950 border border-red-800 text-red-300 rounded-2xl text-xs font-black text-right flex items-center gap-2 justify-end"
            >
              <span>{toastText}</span>
              <Bell className="w-4 h-4 text-yellow-300 animate-swing" />
            </motion.div>
          )}

          {/* 1. SCREEN: LIVE ORDERS radar */}
          {activeSubTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {orders.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(isRtl ? 'هل تريد مسح وأرشفة جميع الطلبات المسجلة بالأدمن حالياً؟' : 'Clear all archived orders?')) {
                        onClearAllOrders();
                        toastNotification(isRtl ? 'تم تصفير لوحة الطلبات!' : 'Orders cleared!');
                      }
                    }}
                    className="py-1.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-red-400 hover:text-red-500 cursor-pointer border border-zinc-700 transition"
                  >
                    {isRtl ? 'تصفير وأرشفة كافة الطلبات 🧹' : 'Clear All Orders 🧹'}
                  </button>
                )}

                <div className="text-right">
                  <h3 className="text-xl font-black text-white font-sans">{isRtl ? 'طابور تجهيز الطلبات بالمطبخ 🍕' : 'Kitchen active tickets queue'}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{isRtl ? `لديك عدد (${orders.length}) طلبات في الانتظار أو الطبخ.` : `Currently hosting (${orders.length}) total recorded active request(s)`}</p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center p-16 border-2 border-dashed border-zinc-850 bg-zinc-900/40 rounded-[2.5rem] space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                    <Wifi className="w-8 h-8 animate-pulse text-red-500" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{isRtl ? 'مستنيين الزباين تطلب! 🥩' : 'Waiting for incoming client cravings!'}</p>
                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed font-semibold">
                      {isRtl 
                        ? 'مفيش أي طلبات طلبتها لسه في التطبيق الحالي. بمجرد ما العميل يدخل عنوانه ويأكد أوردره من سلة مشترياته، الطلب هيظهر قدامك هنا مع جرس في المطبخ فوراً وبدون ريفريش!' 
                        : 'No orders submitted yet in the current localStorage session. Go place some on the site, they will pop here in real-time.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence initial={false}>
                    {orders.map((order, idx) => {
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`bg-zinc-900 border rounded-[2rem] overflow-hidden shadow-md flex flex-col justify-between ${
                            order.status === 'completed'
                              ? 'border-zinc-800'
                              : order.status === 'delivering'
                              ? 'border-amber-600/50'
                              : 'border-red-600/40'
                          }`}
                        >
                          {/* Ticket Header */}
                          <div className="bg-zinc-850 p-4 border-b border-zinc-800 flex items-center justify-between text-xs font-bold">
                            <button
                              onClick={() => onDeleteOrder(order.id)}
                              className="text-zinc-500 hover:text-red-400 font-bold p-1 cursor-pointer transition-all"
                              title={isRtl ? 'حذف الفاتورة' : 'Delete Invoice'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded text-white text-[10px]">
                                {order.id}
                              </span>
                              <span className="text-zinc-400 font-mono italic">
                                {order.createdAt}
                              </span>
                            </div>
                          </div>

                          {/* Ticket body elements */}
                          <div className="p-5 flex-1 space-y-4 text-right">
                            {/* Client card info */}
                            <div className="border border-zinc-800 bg-zinc-950 p-3.5 rounded-2xl text-xs space-y-1 block">
                              <p className="font-black text-white text-[13px]">
                                {order.customerName} - <span className="font-mono text-amber-500 text-xs">{order.phone}</span>
                              </p>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
                                {order.deliveryAddress}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-bold">
                                {isRtl ? 'السداد المطلوب للاعب:' : 'Requested method:'}{' '}
                                <span className="text-cyan-400 font-black">
                                  {order.paymentMethod === 'cash' ? (isRtl ? 'كاش مع المندوب 💵' : 'Cash on delivery') : (isRtl ? 'فيزا مع المندوب 💳' : 'Card on delivery')}
                                </span>
                              </p>
                            </div>

                            {/* Dish items ordered */}
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                                {isRtl ? 'أصناف الوجبات المفرودة:' : 'Items breakdown list:'}
                              </h4>
                              <div className="space-y-1.5 text-xs text-zinc-200">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center bg-zinc-950/40 border border-zinc-850 p-2 rounded-xl">
                                    <span className="font-mono font-black text-zinc-405 text-zinc-400">
                                      {item.pricePerUnit * item.quantity} ج.م
                                    </span>
                                    <div className="text-right">
                                      <p className="font-black text-zinc-100">
                                        {isRtl ? item.nameAr : item.nameEn}{' '}
                                        <span className="text-red-500 font-black">x{item.quantity}</span>
                                      </p>
                                      {item.selectedSizeAr && (
                                        <p className="text-[9px] text-zinc-500 font-bold mt-0.5">
                                          - {isRtl ? 'الحجم:' : 'Size:'} {isRtl ? item.selectedSizeAr : item.selectedSize}
                                          {item.isSpicy && ' | سبايسي نار 🔥'}
                                        </p>
                                      )}
                                      {item.notes && (
                                        <p className="text-[9px] text-amber-500 font-black mt-0.5">
                                          📝 {isRtl ? 'ملاحظة:' : 'Note:'} "{item.notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Order actions footer */}
                          <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
                            <div className="flex justify-between text-xs font-black">
                              <span className="text-green-400 font-mono text-sm">{order.totalPrice} ج.م</span>
                              <span className="text-zinc-550 text-zinc-500">{isRtl ? 'إجمالي الحساب المطلوب:' : 'PAYABLE PAYMENT TOTAL:'}</span>
                            </div>

                            {/* Status Stepper Progression Controllers */}
                            <div className="space-y-1 text-right">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                                {isRtl ? 'نقل حالة وتجهيز الطلب بالمطبخ:' : 'STEP UP STATUS TO CARRIER:'}
                              </span>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {[
                                  { status: 'received', label: isRtl ? 'تلقي 📥' : 'Received' },
                                  { status: 'cooking', label: isRtl ? 'طبخ 🍳' : 'Cooking' },
                                  { status: 'wrapping', label: isRtl ? 'تعبئة 📦' : 'Wrapping' },
                                  { status: 'delivering', label: isRtl ? 'توصيل 🛵' : 'Delivery' },
                                  { status: 'completed', label: isRtl ? 'اكتمل ✅' : 'Complete' }
                                ].map((step) => {
                                  const isCurrent = order.status === step.status;
                                  return (
                                    <button
                                      key={step.status}
                                      onClick={() => onUpdateOrderStatus(order.id, step.status as OrderStep)}
                                      className={`py-1 px-2.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                        isCurrent
                                          ? 'bg-red-600 text-white font-extrabold ring-2 ring-red-300'
                                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                      }`}
                                    >
                                      {step.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* 2. SCREEN: MENU MANAGER */}
          {activeSubTab === 'menu-manager' && (
            <div className="space-y-8 text-right">
              
              {/* Form Block: Add or Edit Menu Item */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-6">
                <div className="pb-4 border-b border-zinc-800 flex justify-between items-center">
                  {editingItem && (
                    <button
                      onClick={resetFoodForm}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-300 cursor-pointer"
                    >
                      {isRtl ? 'إلغاء التعديل ✕' : 'Cancel Edit ✕'}
                    </button>
                  )}
                  <h3 className="text-base font-black text-white font-sans flex items-center gap-1.5">
                    <span>
                      {editingItem
                        ? (isRtl ? `تعديل الصنف: ${editingItem.nameAr} 📝` : `Edit item: ${editingItem.nameAr} 📝`)
                        : (isRtl ? 'إضافة صنف جديد بالخلطة السحرية 💥' : 'Create new dynamic dish 💥')}
                    </span>
                  </h3>
                </div>

                <form onSubmit={handleSaveFoodItem} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">
                  {/* Name Ar */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'اسم الصنف بالعربية:' : 'Dish Name (AR):'}</label>
                    <input
                      type="text"
                      required
                      value={formNameAr}
                      onChange={(e) => setFormNameAr(e.target.value)}
                      placeholder="كريب سوبر همر المقرمش..."
                      className="w-full text-right p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 text-xs"
                    />
                  </div>

                  {/* Name En */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'اسم الصنف بالإنجليزية:' : 'Dish Name (EN):'}</label>
                    <input
                      type="text"
                      required
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      placeholder="Super Crispy Hummer Crepe..."
                      className="w-full text-left p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 text-xs text-left"
                    />
                  </div>

                  {/* Desc Ar */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'الوصف بالعربية:' : 'Description (AR):'}</label>
                    <textarea
                      value={formDescAr}
                      onChange={(e) => setFormDescAr(e.target.value)}
                      placeholder="وجبة متكاملة محشوة بصدور الدجاج الكريسبي الطازجة مع شرائح الموزاريلا..."
                      className="w-full text-right p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 text-xs min-h-[80px]"
                    />
                  </div>

                  {/* Desc En */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'الوصف بالإنجليزية:' : 'Description (EN):'}</label>
                    <textarea
                      value={formDescEn}
                      onChange={(e) => setFormDescEn(e.target.value)}
                      placeholder="Golden deep dried strips packed in dual moisture toasted wrap with liquid cheese..."
                      className="w-full text-left p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 text-xs text-left min-h-[80px]"
                    />
                  </div>

                  {/* Price & Category */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'السعر العادي (ج.م):' : 'Price in EGP:'}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full text-center p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'اختر فئة الطعام للصنف:' : 'Food Category:'}</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as FoodCategory)}
                      className="w-full p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 text-xs"
                    >
                      <option value="crepes">{isRtl ? 'الكريب (Crepes)' : 'Crepes'}</option>
                      <option value="fried-chicken">{isRtl ? 'الدجاج المقلي (Fried Chicken)' : 'Fried Chicken'}</option>
                      <option value="combos">{isRtl ? 'العروض والكومبو (Combos)' : 'Combos'}</option>
                      <option value="sides">{isRtl ? 'الأطباق الجانبية (Appetizers)' : 'Sides & Appetizers'}</option>
                      <option value="drinks">{isRtl ? 'المشروبات المثلجة (Drinks)' : 'Drinks'}</option>
                    </select>
                  </div>

                  {/* Spicy Option & Tags */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'علامات الوجبة (مفصولة بفواصل):' : 'Tags / Badges (comma separated):'}</label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="مثال: الأكثر طلباً, حارق, جديد"
                      className="w-full text-right p-3 bg-zinc-950 text-white font-bold rounded-xl border border-zinc-800 outline-none focus:border-red-600 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 flex items-center justify-end pt-6 gap-3">
                    <input
                      type="checkbox"
                      id="opt-spicy-check"
                      checked={formSpicy}
                      onChange={(e) => setFormSpicy(e.target.checked)}
                      className="w-5 h-5 rounded-md border-zinc-800 accent-red-600 bg-zinc-950 text-white"
                    />
                    <label htmlFor="opt-spicy-check" className="text-xs font-black text-zinc-200 cursor-pointer select-none">
                      {isRtl ? 'إمكانية الاختيار حار (سبايسي نار 🔥)' : 'Offer Spicy Options Choice'}
                    </label>
                  </div>

                  {/* Core CLOUDINARY UPLOADER UI widget */}
                  <div className="col-span-1 md:col-span-2 border-2 border-dashed border-zinc-800 bg-zinc-950/40 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      
                      {/* Upload Input Button */}
                      <div className="relative">
                        <input
                          type="file"
                          id="cloudinary-file-uploader-admin"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={isUploading}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl border border-red-700 cursor-pointer flex items-center gap-2 transition"
                        >
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4" />}
                          <span>{isRtl ? 'رفع صورة عبر Cloudinary 📸' : 'Upload image via Cloudinary'}</span>
                        </button>
                      </div>

                      <div className="text-right">
                        <h4 className="text-xs font-black text-white">{isRtl ? 'صورة الصنف الأساسية (Cloudinary / URL):' : 'Dish Illustration Image Link:'}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">{isRtl ? 'يمكنك الرفع لـ Cloudinary مباشرة، أو لصق رابط صورة خارجي جاهز في حقل الإدخال بالأسفل.' : 'Directly select file to host in Cloudinary or paste web link.'}</p>
                      </div>
                    </div>

                    {/* Progress indicators */}
                    {isUploading && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                          <span>{uploadProgress}%</span>
                          <span>{isRtl ? 'جاري بث الصورة لخادم السحاب...' : 'Uploading file chunks...'}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-[11px] text-red-300 font-semibold leading-relaxed text-right flex items-start gap-1 p-2">
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Image URL text field */}
                    <div className="space-y-1 text-right">
                      <label className="text-[9px] font-black text-zinc-500 block uppercase">{isRtl ? 'رابط الصورة النشط حالياً:' : 'CURRENT APPLIED URL LINK:'}</label>
                      <input
                        type="text"
                        required
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="w-full p-2 bg-zinc-950 text-zinc-400 font-mono rounded-xl border border-zinc-850 outline-none text-[10px]"
                      />
                    </div>

                    {/* Image Preview box if exists */}
                    {formImageUrl && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 mx-auto sm:mx-0">
                        <img 
                          src={formImageUrl} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>

                  {/* SIZES MANAGEMENT WIDGET (Nested list for crepe monster sizes) */}
                  <div className="col-span-1 md:col-span-2 border border-zinc-800 bg-zinc-950/20 p-4 rounded-2xl text-right space-y-4">
                    <h4 className="text-xs font-black text-zinc-300 border-b border-zinc-800 pb-2">
                      {isRtl ? 'إدارة الأحجام المتوفرة لهذا الصنف (اختياري):' : 'Item Sizing & Pricing customization options (Optional):'}
                    </h4>

                    {/* Sizing inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-zinc-400 font-black">{isRtl ? 'اسم الحجم بالعربي:' : 'Size (AR):'}</label>
                        <input 
                          type="text" 
                          value={sizeNameAr}
                          onChange={(e) => setSizeNameAr(e.target.value)}
                          placeholder="مستردة همر عملاق" 
                          className="w-full pr-3 pl-1 py-2 rounded-lg bg-zinc-950 border border-zinc-850 text-white text-xs text-right font-bold"
                        />
                      </div>
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-zinc-400 font-black">{isRtl ? 'اسم الحجم بالإنجليزي:' : 'Size (EN):'}</label>
                        <input 
                          type="text" 
                          value={sizeNameEn}
                          onChange={(e) => setSizeNameEn(e.target.value)}
                          placeholder="Monster size" 
                          className="w-full pr-1 pl-3 py-2 rounded-lg bg-zinc-950 border border-zinc-850 text-white text-xs text-left font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-zinc-400 font-black">{isRtl ? 'زيادة السعر (ج.م):' : 'Added Surcharge (EGP):'}</label>
                        <input 
                          type="number" 
                          value={sizeExtraPrice}
                          onChange={(e) => setSizeExtraPrice(Number(e.target.value))}
                          className="w-full text-center py-2 rounded-lg bg-zinc-950 border border-zinc-850 text-white text-xs font-mono font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSizeOption}
                        className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-black cursor-pointer text-center border border-zinc-700"
                      >
                        + {isRtl ? 'إدراج الحجم' : 'Add Size'}
                      </button>
                    </div>

                    {/* Current listed Sizes */}
                    {formSizesList.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formSizesList.map((sz) => (
                          <div 
                            key={sz.id}
                            className="bg-zinc-900 border border-zinc-800 pl-2 pr-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 justify-end"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeOptionLocal(sz.id)}
                              className="text-red-500 hover:text-red-400 transition"
                            >
                              ✕
                            </button>
                            <span>
                              {isRtl ? sz.nameAr : sz.nameEn} (زيادة {sz.extraPrice} ج.م)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Submit Row */}
                  <div className="col-span-1 md:col-span-2 pt-4 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-red-656 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black border border-red-700 shadow transition cursor-pointer text-center"
                    >
                      {editingItem 
                        ? (isRtl ? 'حفظ التعديلات الطارئة 💾' : 'Save Dish Edits 💾')
                        : (isRtl ? 'إدراج الوجبة الجديدة للمنيو 🚀' : 'Create & Push Food Item 🚀')}
                    </button>
                    <button
                      type="button"
                      onClick={resetFoodForm}
                      className="py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      {isRtl ? 'تفريغ Fields' : 'Reset Form'}
                    </button>
                  </div>

                </form>
              </div>

              {/* Grid List of current menu items to Edit / Delete */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white font-sans">{isRtl ? 'استعراض وتعديل أصناف المنيو الحالية:' : 'Manage existing dishes:'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex gap-4 text-xs items-center justify-between"
                    >
                      {/* Left: actions to edit / delete */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditFoodItem(item)}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition cursor-pointer"
                          title={isRtl ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFoodItem(item.id)}
                          className="p-2 bg-zinc-800 hover:bg-red-950 text-red-500 rounded-xl transition cursor-pointer"
                          title={isRtl ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Right info */}
                      <div className="flex-1 text-right pr-4 space-y-1">
                        <div className="flex justify-end gap-2 items-center">
                          <span className="font-mono bg-zinc-950 text-red-400 py-0.5 px-2 rounded-md font-black">
                            {item.price} ج.م
                          </span>
                          <h4 className="font-black text-white max-w-[150px] line-clamp-1">{isRtl ? item.nameAr : item.nameEn}</h4>
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-1">{isRtl ? item.descriptionAr : item.descriptionEn}</p>
                        <div className="flex gap-1 justify-end pt-1">
                          <span className="text-[8px] bg-red-955 text-red-500 px-2 py-0.5 rounded-full font-black border border-red-950">
                            {item.category}
                          </span>
                          {item.sizes && item.sizes.length > 0 && (
                            <span className="text-[8px] bg-zinc-950 text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                              {item.sizes.length} {isRtl ? 'أحجام' : 'Sizes'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Far right product view photo */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.nameAr} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 3. SCREEN: SITE CONTENT & BRANCHES SETTINGS */}
          {activeSubTab === 'site-settings' && (
            <div className="space-y-6 text-right">
              {/* Site Settings Sub Header */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white font-sans text-right">
                    {isRtl ? 'تعديل وتخصيص محتوى الموقع والفروع ⚙️' : 'Customize Pages & Restaurant Branches ⚙️'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold text-right">
                    {isRtl ? 'تحكم في كافة الكلمات والشعارات والعناوين المكتوبة في الموقع والفروع بشكل فوري.' : 'Manage site slogans, titles, hotline numbers, and physical branches dynamically.'}
                  </p>
                </div>
                {/* Switcher buttons */}
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1 select-none">
                  <button
                    onClick={() => {
                      setSiteEditorSubSection('content');
                      setEditingBranchId(null);
                    }}
                    className={`py-1.5 px-4 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      siteEditorSubSection === 'content'
                        ? 'bg-red-600 text-white shadow font-extrabold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تعديل نصوص الصفحة' : 'Edit Text Slogans'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSiteEditorSubSection('branches');
                      setEditingBranchId(null);
                    }}
                    className={`py-1.5 px-4 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      siteEditorSubSection === 'branches'
                        ? 'bg-red-600 text-white shadow font-extrabold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إدارة الفروع والعناوين' : 'Manage Branches'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: GENERAL SITE TEXT CONTENT EDITING */}
              {siteEditorSubSection === 'content' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 text-right">
                  <div className="border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">{isRtl ? 'تعديل نصوص الصفحة الرئيسية:' : 'HOMEPAGE FIELDS EDITOR:'}</h4>
                  </div>

                  <form onSubmit={handleSaveSiteSettings} className="space-y-6 text-right">
                    
                    {/* Part A: Promo Banner ticker header */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4">
                      <h5 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <span>{isRtl ? '١. شريط الإعلانات المتحرك العلوي' : '1. Top Moving Promo Banner Ticker'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الإعلان باللغة العربية:' : 'Arabic Ticker Text:'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.promoBannerAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, promoBannerAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الإعلان باللغة الإنجليزية:' : 'English Ticker Text:'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.promoBannerEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, promoBannerEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-left ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part B: Hero Badge & Slogans */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4">
                      <h5 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <span>{isRtl ? '٢. واجهة العرض الرئيسية للترحيب (الـ Hero)' : '2. Hero Welcome Title & Badges'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Badge Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'شارة همر الصغيرة (عربي):' : 'Mini Badge Title (Arabic):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.heroBadgeAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroBadgeAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650"
                          />
                        </div>
                        {/* Badge En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'شارة همر الصغيرة (إنجليزي):' : 'Mini Badge Title (English):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.heroBadgeEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroBadgeEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-left ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Title Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'العنوان الرئيسي الضخم (عربي):' : 'Huge Bold Title (Arabic):'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.heroTitleAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroTitleAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650"
                          />
                        </div>
                        {/* Title En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'العنوان الرئيسي الضخم (إنجليزي):' : 'Huge Bold Title (English):'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.heroTitleEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroTitleEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-left ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Description Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الوصف التعريفي للوجبات (عربي):' : 'Paragraph Description (Arabic):'}</label>
                          <textarea
                            rows={3}
                            value={editedSettings?.heroSubAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroSubAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655"
                          />
                        </div>
                        {/* Description En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الوصف التعريفي للوجبات (إنجليزي):' : 'Paragraph Description (English):'}</label>
                          <textarea
                            rows={3}
                            value={editedSettings?.heroSubEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroSubEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655 text-left ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part C: Delivery Stat & Contact & Delivery Notice banner */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4">
                      <h5 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 justify-end font-sans">
                        <span>{isRtl ? '٣. إحصائيات التوصيل والخط الساخن والفرع الرئيسي' : '3. Speeds, Hotline & Delivery Notice'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        {/* Hotline */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رقم الدليفري / الخط الساخن:' : 'Hotline Number:'}</label>
                          <input
                            type="text"
                            value={editedSettings?.hotline || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, hotline: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 font-mono text-center"
                          />
                        </div>
                        {/* Delivery Time stat Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'وقت التوصيل التقديري (عربي):' : 'Estimated Delivery Time (AR):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.deliveryTimeAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, deliveryTimeAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-center"
                          />
                        </div>
                        {/* Delivery Time stat En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'وقت التوصيل التقديري (إنجليزي):' : 'Estimated Delivery Time (EN):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.deliveryTimeEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, deliveryTimeEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 font-mono text-center text-left ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Delivery notice Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'تنويه خدمة التوصيل الإضافي (عربي):' : 'Delivery Slogan Notice (Arabic):'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.deliveryNoticeAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, deliveryNoticeAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650"
                          />
                        </div>
                        {/* Delivery notice En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'تنويه خدمة التوصيل الإضافي (إنجليزي):' : 'Delivery Slogan Notice (English):'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.deliveryNoticeEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, deliveryNoticeEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-left ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part D: Footer Content layout */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4 text-right">
                      <h5 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <span>{isRtl ? '٤. نبذة تذييل الصفحة والملاحظة القانونية (Footer)' : '4. Footer Slogans & Info'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Footer desc Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'نبذة كاتب الموقع بالفوتر (عربي):' : 'Footer Slogan Paragraph (Arabic):'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.footerDescAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, footerDescAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650"
                          />
                        </div>
                        {/* Footer desc En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'نبذة كاتب الموقع بالفوتر (إنجليزي):' : 'Footer Slogan Paragraph (English):'}</label>
                          <textarea
                            rows={2}
                            value={editedSettings?.footerDescEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, footerDescEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-left ltr"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Part E: Custom brand logo url link & direct phone file uploader */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4 text-right">
                      <h5 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <span>{isRtl ? '٥. لوجو المحل المخصص (Logo)' : '5. Custom Brand Logo'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      </h5>

                      <div className="flex flex-col sm:flex-row-reverse gap-4 items-center bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                        {/* Current Logo Circular Preview */}
                        <div className="relative shrink-0 w-16 h-16 rounded-2xl border border-zinc-700 bg-zinc-950 flex items-center justify-center overflow-hidden">
                          {editedSettings?.logoUrl ? (
                            <img 
                              src={editedSettings.logoUrl} 
                              alt="Logo preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-bold">{isRtl ? 'افتراضي' : 'Default'}</span>
                          )}
                        </div>

                        {/* Interactive File Selector */}
                        <div className="flex-1 w-full text-right space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 block pb-1">
                            {isRtl ? 'ارفع شعار جديد مباشرة من هاتفك أو الكمبيوتر:' : 'Upload new Logo directly from phone/PC:'}
                          </label>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <label className="relative cursor-pointer py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-lg shadow-sm border border-red-700 transition flex items-center justify-center gap-1.5">
                              {isLogoUploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{isRtl ? 'اختر صورة وارفعها' : 'Choose Logo Photo'}</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoUpload} 
                                disabled={isLogoUploading}
                                className="hidden" 
                              />
                            </label>

                            {editedSettings?.logoUrl && (
                              <button
                                type="button"
                                onClick={() => setEditedSettings({ ...editedSettings, logoUrl: '' })}
                                className="py-2 px-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-[11px] font-bold rounded-lg border border-zinc-750 transition cursor-pointer"
                              >
                                {isRtl ? 'استعادة الافتراضي' : 'Reset to Default'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 block">
                          {isRtl ? 'أو أدخل رابط اللوجو مباشرة:' : 'Or fill Direct Logo Image URL:'}
                        </label>
                        <input
                          type="text"
                          value={editedSettings?.logoUrl || ''}
                          onChange={(e) => setEditedSettings({ ...editedSettings, logoUrl: e.target.value })}
                          placeholder="/src/assets/images/hummer_logo_1780839326548.png"
                          className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                        />
                        <p className="text-[9px] text-zinc-500 font-bold mt-1">
                          {isRtl ? 'ملاحظة: اللوجو المرفوع سيتغير تلقائيا في ترويسة الموقع وكافة الأقسام.' : 'Note: Uploaded logo updates immediately as custom assets.'}
                        </p>
                      </div>
                    </div>

                    {/* Part F: Intro Cinematic Video (Plays ONLY on first-ever load) */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4 text-right">
                      <h5 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <span>{isRtl ? '٦. فيديو مقدمة الموقع التشويقية (Intro Video)' : '6. Welcome Video Intro'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      </h5>

                      <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between flex-row-reverse pb-2 border-b border-zinc-800">
                          <span className="text-[10px] font-black text-zinc-400">{isRtl ? 'تفعيل انترو للموقع الأول' : 'Enable Welcome Video Intro'}</span>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={!editedSettings?.disableIntro} 
                              onChange={(e) => setEditedSettings({ ...editedSettings, disableIntro: !e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-white after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>

                        {!editedSettings?.disableIntro && (
                          <div className="space-y-3 pt-1">
                            {/* Selected file preview indicators */}
                            {editedSettings?.introVideoUrl && (
                              <div className="w-full h-28 bg-black rounded-lg overflow-hidden border border-zinc-800 relative flex items-center justify-center">
                                <video 
                                  src={editedSettings.introVideoUrl} 
                                  className="w-full h-full object-cover opacity-60 pointer-events-none" 
                                  muted 
                                  loop 
                                  playsInline 
                                  autoPlay
                                />
                                <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                                  <span className="bg-black/70 py-1.5 px-3 rounded-lg border border-zinc-700 text-[10px] font-black text-white">
                                    {isRtl ? 'عرض فيديو الانترو الحالي' : 'Current Intro Video Active'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Mobile phone direct video upload */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-zinc-400 block">
                                {isRtl ? 'ارفع فيديو انترو مخصص مباشرة من المعرض:' : 'Upload custom Intro MP4 video directly from camera roll:'}
                              </label>
                              <div className="flex gap-2 justify-end">
                                <label className="relative cursor-pointer py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black rounded-lg shadow-sm border border-black transition flex items-center gap-1.5">
                                  {isVideoUploading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isRtl ? 'اختر فيديو وارفق انترو' : 'Choose and Upload Video'}</span>
                                  <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={handleIntroVideoUpload} 
                                    disabled={isVideoUploading}
                                    className="hidden" 
                                  />
                                </label>
                                {editedSettings?.introVideoUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setEditedSettings({ ...editedSettings, introVideoUrl: '' })}
                                    className="py-2 px-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-[11px] font-bold rounded-lg border border-zinc-750 transition cursor-pointer"
                                  >
                                    {isRtl ? 'مسح الانترو' : 'Clear Intro Video'}
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Manual link input */}
                            <div className="space-y-1 pt-1">
                              <label className="text-[10px] font-black text-zinc-400 block">
                                {isRtl ? 'أو أدخل رابط فيديو MP4 مباشر:' : 'Or fill direct MP4 Video link URL:'}
                              </label>
                              <input
                                type="text"
                                value={editedSettings?.introVideoUrl || ''}
                                onChange={(e) => setEditedSettings({ ...editedSettings, introVideoUrl: e.target.value })}
                                placeholder="https://your-public-server.com/intro.mp4"
                                className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                              />
                            </div>
                          </div>
                        )}
                        
                        <p className="text-[9px] text-zinc-500 font-bold leading-relaxed">
                          {isRtl 
                            ? 'معلومة: لتوفير استهلاك باقة الجوال، سيعمل هذا الفيديو في الخلفية عندما يفتح العميل الموقع لأول مرة فقط، ثم سنحفظ حالة المشاهدة لكي لا يظهر مجدداً.'
                            : 'Hint: To preserve mobile data, this intro launches strictly on first-time opens only, saving play status inside client storage.'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="submit"
                        className="py-3 px-8 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl border border-red-700 shadow shrink-0 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 animate-pulse" />
                        <span>{isRtl ? 'حفظ كافة التعديلات وتثبيت النصوص' : 'Store and Publish Main Words'}</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Sub-tab 2: PHYSICAL ADDRESSES & BRANCHES MANAGEMENT */}
              {siteEditorSubSection === 'branches' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 text-right">
                  
                  {/* Inner Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 justify-end font-sans">
                      <Building className="w-5 h-5 text-amber-500 animate-pulse" />
                      <span>{isRtl ? 'قائمة فروع مطاعم همر:' : 'Physical Outlets & Warehouses:'}</span>
                    </h4>
                    {editingBranchId === null && (
                      <button
                        onClick={handleSetupNewBranch}
                        className="py-1.5 px-3.5 bg-zinc-850 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition border border-zinc-700 active:scale-95"
                      >
                        <Plus className="w-4 h-4 animate-pulse" />
                        <span>{isRtl ? 'إضافة فرع جديد' : 'Add New Branch'}</span>
                      </button>
                    )}
                  </div>

                  {/* BRANCH EDIT/CREATE FORM */}
                  {editingBranchId !== null ? (
                    <form onSubmit={handleSaveBranch} className="bg-zinc-950 p-5 rounded-3xl border border-zinc-850 space-y-5 animate-fadeIn text-right">
                      <div className="border-b border-zinc-850 pb-2 flex justify-between items-center bg-zinc-900/50 p-3 -mx-5 -mt-5 rounded-t-3xl text-right">
                        <span className="text-xs font-black text-red-500 font-sans">
                          {editingBranchId === 'new' ? (isRtl ? 'إضافة فرع جديد للمطعم 📍' : 'Add New Branch 📍') : (isRtl ? 'تعديل فرع حالي 🛠️' : 'Edit Branch details 🛠️')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingBranchId(null)}
                          className="w-6 h-6 bg-zinc-900 text-zinc-400 hover:text-white rounded-full flex items-center justify-center border border-zinc-800 scale-95 hover:scale-105 active:scale-90 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Branch Name Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'اسم الفرع باللغة العربية:' : 'Branch Name (Arabic):'}</label>
                          <input
                            type="text"
                            required
                            placeholder="مثل: المعادي شارع 9"
                            value={branchFormNameAr}
                            onChange={(e) => setBranchFormNameAr(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-855 border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655"
                          />
                        </div>
                        {/* Branch Name En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'اسم الفرع باللغة الإنجليزية:' : 'Branch Name (English):'}</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Maadi Road 9"
                            value={branchFormNameEn}
                            onChange={(e) => setBranchFormNameEn(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-855 border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655 text-left ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        {/* Branch Address Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'العنوان وتوجيه التوصيل (عربي):' : 'Full Slogan Address (Arabic):'}</label>
                          <input
                            type="text"
                            placeholder="بجوار مترو المعادي، أمام كوك دور"
                            value={branchFormAddressAr}
                            onChange={(e) => setBranchFormAddressAr(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-855 border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655"
                          />
                        </div>
                        {/* Branch Address En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'العنوان وتوجيه التوصيل (إنجليزي):' : 'Full Slogan Address (English):'}</label>
                          <input
                            type="text"
                            placeholder="e.g. Near Maadi metro station, Cairo"
                            value={branchFormAddressEn}
                            onChange={(e) => setBranchFormAddressEn(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-855 border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655 text-left ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        {/* Hotline/Direct Phone */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الرقم المباشر أو الموبايل للفرع:' : 'Direct Phone Contact:'}</label>
                          <input
                            type="text"
                            placeholder="012XXXXXXXX"
                            value={branchFormPhone}
                            onChange={(e) => setBranchFormPhone(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655 font-mono text-center"
                          />
                        </div>
                        {/* Opening hours Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'ساعات العمل بالفرع (عربي):' : 'Operating Hours (AR):'}</label>
                          <input
                            type="text"
                            placeholder="١١:٠٠ ص - ٤:٠٠ ص"
                            value={branchFormHoursAr}
                            onChange={(e) => setBranchFormHoursAr(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655 text-center"
                          />
                        </div>
                        {/* Opening hours En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'ساعات العمل بالفرع (إنجليزي):' : 'Operating Hours (EN):'}</label>
                          <input
                            type="text"
                            placeholder="e.g. 11:00 AM - 04:00 AM"
                            value={branchFormHoursEn}
                            onChange={(e) => setBranchFormHoursEn(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-655 font-mono text-center text-left ltr"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-3">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl cursor-pointer shadow transition"
                        >
                          {isRtl ? 'حفظ الفرع وتحديث الدليل 💾' : 'Save Branch 💾'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBranchId(null)}
                          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>

                    </form>
                  ) : (
                    <div className="space-y-4 text-right">
                      {editedBranches.length === 0 ? (
                        <div className="text-center p-8 bg-zinc-950 rounded-2xl border border-zinc-850">
                          <p className="text-zinc-500 font-bold text-xs">{isRtl ? 'لم يضاف أي فروع حتى الآن!' : 'No custom branches listed.'}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                          {editedBranches.map((br) => (
                            <div 
                              key={br.id}
                              className="bg-zinc-950 border border-zinc-850 p-5 rounded-3xl flex items-start justify-between relative shadow-md text-right border-r-4 border-r-amber-500"
                            >
                              <div className="flex flex-col gap-1.5 leading-relaxed text-right flex-1">
                                <h5 className="text-xs font-black text-white">{isRtl ? br.nameAr : br.nameEn}</h5>
                                <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">{isRtl ? br.addressAr : br.addressEn}</p>
                                <div className="space-y-1 font-mono text-[9px] text-zinc-500 mt-1">
                                  <p>{isRtl ? `☎️ تليفون: ${br.phone || 'N/A'}` : `☎️ Direct: ${br.phone || 'N/A'}`}</p>
                                  <p>{isRtl ? `⏰ مواعيد: ${br.hoursAr || 'N/A'}` : `⏰ Clock: ${br.hoursEn || 'N/A'}`}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0 pr-3">
                                <button
                                  type="button"
                                  onClick={() => handleSetupEditBranch(br)}
                                  className="w-8 h-8 bg-zinc-900 border border-zinc-800 text-amber-500 hover:text-white hover:bg-amber-600 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBranch(br.id)}
                                  className="w-8 h-8 bg-zinc-900 border border-zinc-800 text-red-500 hover:text-white hover:bg-red-600 rounded-xl flex items-center justify-center cursor-pointer transition active:scale-95"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* 3. SCREEN: CLOUDINARY SETTINGS FORM */}
          {activeSubTab === 'cloudinary-settings' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 text-right">
              
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-base font-black text-white font-sans">{isRtl ? 'إعدادات رفع الصور إلى Cloudinary ⚙️' : 'Configure Cloudinary Cloud Workspace ⚙️'}</h3>
                <p className="text-xs text-zinc-500 mt-1">{isRtl ? 'تحتاج لتفعيل الـ Unsigned Upload في حسابك على كلاودنري لتحصل على Direct Web Preset.' : 'We require direct unsigned uploads from clients to save your bandwidth.'}</p>
              </div>

              <form onSubmit={handleSaveCloudinaryConfig} className="space-y-5">
                
                {/* Cloudname */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'اسم سحابة كلاودنري (Cloud Name):' : 'Cloud Name:'}</label>
                  <input
                    type="text"
                    required
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    placeholder="shafey_cloud_name..."
                    className="w-full text-left p-3 bg-zinc-950 text-white font-mono font-bold rounded-xl border border-zinc-850 outline-none focus:border-red-650"
                  />
                </div>

                {/* Upload preset */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-zinc-400 block">{isRtl ? 'بريسيت الرفع غير المشفر (Unsigned Upload Preset):' : 'Unsigned Upload Preset Name:'}</label>
                  <div className="text-[10px] text-amber-500 font-bold mb-1">
                    {isRtl 
                      ? '⚠️ هام: يجب أن تكون الـ Preset من النوع (Unsigned) في إعدادات الرفع على لوحة مطور كلاودنري وإلا سيرفض خادم كلاودنري استلام الصور.'
                      : '⚠️ Critical: Secure Cloudinary settings requires setting this upload preset option as Unsigned on Cloudinary Dashboard.'}
                  </div>
                  <input
                    type="text"
                    required
                    value={uploadPreset}
                    onChange={(e) => setUploadPreset(e.target.value)}
                    placeholder="unsigned_preset_name..."
                    className="w-full text-left p-3 bg-zinc-950 text-white font-mono font-bold rounded-xl border border-zinc-850 outline-none focus:border-red-650"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-8 bg-red-655 bg-red-600 hover:bg-red-750 text-white text-xs font-black rounded-xl border border-red-700 shadow cursor-pointer transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Check className="w-4 h-4 animate-pulse" />
                  <span>{isRtl ? 'حفظ إعدادات كلاودنري وتحديث النظام' : 'Save Config & Update Workspace'}</span>
                </button>

              </form>

              {/* Helpful Steps */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 text-xs space-y-3 leading-relaxed">
                <h4 className="font-black text-white">{isRtl ? '💡 خطوات سريعة للتشغيل:' : '💡 Fast instructions to run:'}</h4>
                <ol className="list-decimal list-inside space-y-2 text-zinc-400 font-semibold text-[11px]">
                  <li>{isRtl ? 'افتح موقع Cloudinary.com وسجل حساب مجاني بالكامل.' : 'Open Cloudinary website and create a free developer account.'}</li>
                  <li>{isRtl ? 'انسخ الـ Cloud Name والصقه الحقل بالأعلى.' : 'Locate and copy the Cloud Name from Dashboard and paste above.'}</li>
                  <li>{isRtl ? 'اذهب إلى الإعدادات (Settings) -> ثم تبويب الرفع (Upload) -> انزل لخانة Upload presets.' : 'Go to Cloudinary Settings -> Upload tab -> scroll down to Upload presets.'}</li>
                  <li>{isRtl ? 'اضغط (Add upload preset) وغير الـ Signing Mode من Signed لـ Unsigned وأكد الباقي.' : 'Click Add write preset, change mode to Unsigned, name it, and save.'}</li>
                  <li>{isRtl ? 'انسخ اسم الـ Preset وضعه في الحقل الثاني بالأعلى ثم احفظ ومبروك!' : 'Input preset name here, save, and enjoy direct uploading.'}</li>
                </ol>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
