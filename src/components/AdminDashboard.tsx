import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Plus, Trash2, Edit2, Upload, AlertCircle, Maximize2, Minimize2, 
  Settings, Loader2, ChefHat, Bell, Wifi, ArrowDown, ArrowUp, RefreshCw, Eye,
  MapPin, Edit, EyeOff, LayoutTemplate, Building, TrendingUp, Users, Calendar, Award,
  Database, HardDrive, Key, Globe, Download, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';
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
  riders: any[];
  onAddRider: (name: string, phone: string) => void;
  onDeleteRider: (riderId: string) => void;
  onUpdateRiderStatus: (riderId: string, status: 'here' | 'out') => void;
  onAssignRiderToOrder: (orderId: string, riderId: string) => void;
  currentUser?: any;
  authorizedAdmins?: string[];
  onAddAdmin?: (email: string) => Promise<void>;
  onDeleteAdmin?: (email: string) => Promise<void>;
}

export default function AdminDashboard({
  isOpen,
  onClose,
  lang,
  orders,
  onUpdateOrderStatus: propOnUpdateOrderStatus,
  onDeleteOrder: propOnDeleteOrder,
  menuItems,
  onUpdateMenuItems: propOnUpdateMenuItems,
  onClearAllOrders: propOnClearAllOrders,
  siteSettings,
  onUpdateSiteSettings: propOnUpdateSiteSettings,
  branches,
  onUpdateBranches: propOnUpdateBranches,
  riders = [],
  onAddRider: propOnAddRider,
  onDeleteRider: propOnDeleteRider,
  onUpdateRiderStatus: propOnUpdateRiderStatus,
  onAssignRiderToOrder: propOnAssignRiderToOrder,
  currentUser,
  authorizedAdmins = [],
  onAddAdmin: propOnAddAdmin,
  onDeleteAdmin: propOnDeleteAdmin
}: AdminDashboardProps) {
  const isRtl = lang === 'ar';

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Firestore DB storage stats monitor
  const [dbStats, setDbStats] = useState({
    userCount: 0,
    ordersCount: orders.length,
    menuItemsCount: menuItems.length,
    ridersCount: riders.length,
    adminsCount: authorizedAdmins.length,
    totalDocs: 0,
    estimatedBytes: 0,
    loading: false,
    clearingState: ''
  });

  const scanDatabaseOverview = async () => {
    setDbStats(prev => ({ ...prev, loading: true }));
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs } = await import('firebase/firestore');

      let usersCount = 0;
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        usersCount = usersSnapshot.size;
      } catch (e) {
        console.warn('Could not list users dynamically:', e);
      }

      const orderCount = orders.length;
      const menuCount = menuItems.length;
      const riderCount = riders.length;
      const adminCount = authorizedAdmins.length;

      // Average size formulas (document wrapper + text fields overhead)
      const calculatedBytes = 
        (orderCount * 1430) + 
        (menuCount * 920) + 
        (riderCount * 410) + 
        (adminCount * 200) + 
        (usersCount * 610);

      const totalDocsCount = orderCount + menuCount + riderCount + adminCount + usersCount;

      setDbStats({
        userCount: usersCount,
        ordersCount: orderCount,
        menuItemsCount: menuCount,
        ridersCount: riderCount,
        adminsCount: adminCount,
        totalDocs: totalDocsCount,
        estimatedBytes: calculatedBytes,
        loading: false,
        clearingState: ''
      });
    } catch (err: any) {
      console.error('Error scanning database stats:', err);
      setDbStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      scanDatabaseOverview();
    }
  }, [isOpen, orders.length, menuItems.length, riders.length, authorizedAdmins.length]);

  const clearCompletedAndCanceledOrders = async () => {
    if (!confirm(isRtl 
      ? 'هل أنت متأكد من مسح وأرشفة جميع الطلبات المكتملة أو المكنسلة في قاعدة البيانات لتوفير المساحة؟' 
      : 'Are you sure you want to delete all completed or canceled orders in Firestore?')) return;
    
    setDbStats(prev => ({ ...prev, clearingState: 'orders' }));
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');

      const snapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      let countDeleted = 0;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'completed' || data.status === 'canceled' || !data.status) {
          batch.delete(docSnap.ref);
          countDeleted++;
        }
      });

      if (countDeleted > 0) {
        await batch.commit();
      }

      alert(isRtl ? `تم تفريغ مساحة ومسح عدد (${countDeleted}) أوردر من داتا بيس الموقع!` : `Successfully deleted (${countDeleted}) completed orders from Firestore!`);
      // Update local storage representation too
      onClearAllOrders();
      scanDatabaseOverview();
    } catch (err: any) {
      console.error('Error clearing old orders:', err);
      alert(isRtl ? 'فشل المسح: عذراً قد لا تمتلك صلاحيات الآدمن الكافية في Firestore حالياً.' : `Deletion failed: ${err.message || err}`);
    } finally {
      setDbStats(prev => ({ ...prev, clearingState: '' }));
    }
  };

  const clearInactiveGuestUsers = async () => {
    if (!confirm(isRtl 
      ? 'هل أنت متأكد من مسح وتنظيف حسابات الأعضاء المؤقتين والزوار غير النشطين؟ هذا الإجراء أمن ولا يؤثر على المشرفين.' 
      : 'Are you sure you want to wipe inactive guest profile logs? This preserves full admins.')) return;

    setDbStats(prev => ({ ...prev, clearingState: 'users' }));
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs, writeBatch } = await import('firebase/firestore');

      const snapshot = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let countDeleted = 0;

      const activeUserIds = new Set(orders.map(o => o.userId));

      snapshot.docs.forEach((docSnap) => {
        const uid = docSnap.id;
        const data = docSnap.data();
        const email = (data.email || '').toLowerCase().trim();
        const isUserAdmin = email === 'motaem23y@gmail.com' || authorizedAdmins.some(adm => adm.toLowerCase().trim() === email);

        if (!activeUserIds.has(uid) && !isUserAdmin) {
          batch.delete(docSnap.ref);
          countDeleted++;
        }
      });

      if (countDeleted > 0) {
        await batch.commit();
      }

      alert(isRtl ? `تم بنجاح كنس وتفريغ عدد (${countDeleted}) حساب زائر مؤقت!` : `Successfully wiped (${countDeleted}) inactive user documents!`);
      scanDatabaseOverview();
    } catch (err: any) {
      console.error('Error clearing guest docs:', err);
      alert(isRtl ? 'فشل كنس الزوار: ' + err.message : 'Sweep failed: ' + err.message);
    } finally {
      setDbStats(prev => ({ ...prev, clearingState: '' }));
    }
  };
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      
      const snapshot = await getDocs(collection(db, 'orders'));
      const allOrders: any[] = [];
      snapshot.forEach(docSnap => {
        allOrders.push({ id: docSnap.id, ...docSnap.data() });
      });

      const finalData = allOrders.length > 0 ? allOrders : orders;

      // Sort by creation desc
      finalData.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `hummer_restaurant_orders_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      alert(isRtl 
        ? `✓ تم تصدير عدد (${finalData.length}) سجل طلبات بنجاح بصيغة JSON!` 
        : `✓ Successfully exported (${finalData.length}) total order records in JSON!`);
    } catch (err: any) {
      console.error("Backup trigger failed:", err);
      try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `hummer_active_orders_fallback_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert(isRtl ? 'تم تصدير سجلات طابور المطبخ كملف بديل.' : 'Exported active dashboard queue orders as fallback.');
      } catch (innerErr) {
        alert(isRtl ? 'حدث خطأ أثناء تصدير الملف الاحتياطي' : 'An error occurred while exporting backup file');
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(isRtl 
      ? '⚠️ تحذير: هل أنت متأكد من استعادة الطلبات من هذا الملف الاحتياطي السحابي؟ سيتم دمجها مع الطلبات الحالية وتثبيتها حياً في Firestore.' 
      : '⚠️ WARNING: Are you sure you want to restore and upload orders from this offline file? They will merge with live Firestore database records.')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const text = await file.text();
      const parsedOrders = JSON.parse(text);

      if (!Array.isArray(parsedOrders)) {
        throw new Error(isRtl ? 'صيغة الملف غير صالحة. الملف يجب أن يحتوي على مصفوفة JSON للطلبات.' : 'Invalid file format. Must be a valid JSON array of orders.');
      }

      for (const order of parsedOrders) {
        if (!order.id || !order.customerName || !order.createdAt) {
          throw new Error(isRtl ? 'بيانات تالفة أو ناقصة في ملف النسخ الاحتياطي.' : 'Missing required properties in backup structures.');
        }
      }

      const { db, cleanFirestoreData } = await import('../firebase');
      const { doc, setDoc } = await import('firebase/firestore');

      let restoredCount = 0;
      for (const order of parsedOrders) {
        const cleanData = cleanFirestoreData({ ...order });
        await setDoc(doc(db, 'orders', order.id), cleanData);
        restoredCount++;
      }

      alert(isRtl 
        ? `✓ تم بنجاح استعادة ورفع عدد (${restoredCount}) طلب لقسم الأرشيف في قاعدة البيانات!` 
        : `✓ Successfully restored and uploaded (${restoredCount}) history orders to live database!`);
      
      scanDatabaseOverview();
    } catch (err: any) {
      console.error('Error during restoration:', err);
      alert(isRtl 
        ? `فشل الاستعادة: يرجى التأكد من اختيار ملف JSON أصل وصحيح تم تنزيله مسبقاً.\nالتفاصيل: ${err.message || err}` 
        : `Restoration failed: Please make sure the JSON file matches correctly.\nDetail: ${err.message || err}`);
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  // Tabs: 'orders' | 'menu-manager' | 'site-settings' | 'cloudinary-settings' | 'riders' | 'analytics' | 'admins' | 'coupons-wheel'
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'menu-manager' | 'site-settings' | 'cloudinary-settings' | 'riders' | 'analytics' | 'admins' | 'coupons-wheel'>('orders');

  // Admin PIN configuration (2200)
  const [isAdminPinUnlocked, setIsAdminPinUnlocked] = useState(false);
  const [pinInputValue, setPinInputValue] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<'orders' | 'menu-manager' | 'site-settings' | 'cloudinary-settings' | 'riders' | 'analytics' | 'admins' | 'coupons-wheel' | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: string; execute: () => void } | null>(null);

  const checkPinAndExecute = (action: () => void, tabToSet?: any) => {
    if (isAdminPinUnlocked) {
      if (tabToSet) {
        setActiveSubTab(tabToSet);
      } else {
        action();
      }
    } else {
      setPendingTabChange(tabToSet || null);
      setPendingAction(tabToSet ? null : { type: 'custom', execute: action });
      setPinInputValue('');
      setPinErrorMsg('');
      setShowPinPrompt(true);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (pinInputValue === '2200') {
      setIsAdminPinUnlocked(true);
      setShowPinPrompt(false);
      setPinErrorMsg('');
      if (pendingTabChange) {
        setActiveSubTab(pendingTabChange);
        setPendingTabChange(null);
      }
      if (pendingAction) {
        pendingAction.execute();
        setPendingAction(null);
      }
    } else {
      setPinErrorMsg(isRtl ? 'الرمز غير صحيح! الرجاء المحاولة مرة أخرى.' : 'Incorrect PIN! Please try again.');
    }
  };

  // Shadow callback functions securely
  const onUpdateOrderStatus = (orderId: string, nextStatus: OrderStep) => checkPinAndExecute(() => propOnUpdateOrderStatus(orderId, nextStatus));
  const onDeleteOrder = (orderId: string) => checkPinAndExecute(() => propOnDeleteOrder(orderId));
  const onUpdateMenuItems = (newItems: MenuItem[]) => checkPinAndExecute(() => propOnUpdateMenuItems(newItems));
  const onClearAllOrders = () => checkPinAndExecute(() => propOnClearAllOrders());
  const onUpdateSiteSettings = (newSettings: SiteSettings) => checkPinAndExecute(() => propOnUpdateSiteSettings(newSettings));
  const onUpdateBranches = (newBranches: Branch[]) => checkPinAndExecute(() => propOnUpdateBranches(newBranches));
  const onAddRider = (name: string, phone: string) => checkPinAndExecute(() => propOnAddRider(name, phone));
  const onDeleteRider = (riderId: string) => checkPinAndExecute(() => propOnDeleteRider(riderId));
  const onUpdateRiderStatus = (riderId: string, status: 'here' | 'out') => checkPinAndExecute(() => propOnUpdateRiderStatus(riderId, status));
  const onAssignRiderToOrder = (orderId: string, riderId: string) => checkPinAndExecute(() => propOnAssignRiderToOrder(orderId, riderId));
  const onAddAdmin = (email: string) => checkPinAndExecute(() => propOnAddAdmin(email));
  const onDeleteAdmin = propOnDeleteAdmin ? (email: string) => checkPinAndExecute(() => propOnDeleteAdmin(email)) : undefined;

  // Date filter controls (default to filtering by current day's business transactions)
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'all' | 'custom'>('today');
  const [customSelectedDate, setCustomSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const getOrderDateString = (createdAtStr?: string) => {
    if (!createdAtStr) return '';
    try {
      return createdAtStr.substring(0, 10);
    } catch {
      return '';
    }
  };

  const todayStr = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const activeInvoices = orders.filter(order => {
    const orderDate = getOrderDateString(order.createdAt);
    if (selectedDateFilter === 'today') {
      return orderDate === todayStr;
    } else if (selectedDateFilter === 'custom') {
      return orderDate === customSelectedDate;
    }
    return true; // 'all'
  });

  const uniqueOrderedDays = Array.from(new Set(orders.map(o => getOrderDateString(o.createdAt)).filter(Boolean))).sort().reverse();
  const totalFilteredSales = activeInvoices.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Rider/Driver WhatsApp states
  const [defaultRiderPhone, setDefaultRiderPhone] = useState(() => {
    return localStorage.getItem('hummer_default_rider_phone') || '';
  });
  const [riderPhones, setRiderPhones] = useState<Record<string, string>>({});

  const getWhatsAppLink = (phone: string, text?: string) => {
    let clean = phone.replace(/\D/g, '');
    if (!clean) return '#';
    if (clean.length === 11 && clean.startsWith('0')) {
      clean = '2' + clean;
    } else if (clean.length === 10 && clean.startsWith('1')) {
      clean = '20' + clean;
    }
    return `https://wa.me/${clean}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  };

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

  // Admin expansion form states
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  // Coupon creation states
  const [newCouponCode, setNewCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'discount' | 'gift'>('discount');
  const [couponDiscount, setCouponDiscount] = useState<number>(15);
  const [couponGiftItem, setCouponGiftItem] = useState('FRIES');
  const [couponLimit, setCouponLimit] = useState<number>(100);
  const [couponExpiry, setCouponExpiry] = useState('');

  // Rider creation form states
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');

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
  const [branchFormDeliveryHotline, setBranchFormDeliveryHotline] = useState('');
  const [branchFormHoursAr, setBranchFormHoursAr] = useState('');
  const [branchFormHoursEn, setBranchFormHoursEn] = useState('');

  const handleSaveSiteSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings(editedSettings);
    if (!editedSettings.disableIntro && editedSettings.introVideoUrl) {
      toastNotification(isRtl ? 'تم حفظ وعرض الانترو 🎬' : 'Intro saved and displayed successfully! 🎬');
    } else {
      toastNotification(isRtl ? 'تم حفظ وتحديث محتوى الموقع بنجاح!' : 'Homepage layout content updated successfully!');
    }
  };

  const handleSetupEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setBranchFormNameAr(branch.nameAr);
    setBranchFormNameEn(branch.nameEn);
    setBranchFormAddressAr(branch.addressAr || '');
    setBranchFormAddressEn(branch.addressEn || '');
    setBranchFormPhone(branch.phone || '');
    setBranchFormDeliveryHotline(branch.deliveryHotline || '');
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
    setBranchFormDeliveryHotline('');
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
        deliveryHotline: branchFormDeliveryHotline.trim(),
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
            deliveryHotline: branchFormDeliveryHotline.trim(),
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

  // Real-time sales and popular dishes aggregations
  const analyticsData = React.useMemo(() => {
    const daily: Record<string, { date: string; revenue: number; count: number }> = {};
    const monthly: Record<string, { month: string; revenue: number; count: number }> = {};
    const itemSells: Record<string, { name: string; count: number }> = {};

    orders.forEach((o) => {
      const cost = Number(o.totalPrice) || 0;
      let dateStr = 'N/A';
      let monthStr = 'N/A';
      try {
        if (o.createdAt) {
          const d = new Date(o.createdAt);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0];
            monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          } else {
            // fallback parser
            dateStr = o.createdAt.split(' ')[0] || 'N/A';
            monthStr = o.createdAt.substring(0, 7) || 'N/A';
          }
        }
      } catch (err) {
        console.warn(err);
      }

      if (!daily[dateStr]) {
        daily[dateStr] = { date: dateStr, revenue: 0, count: 0 };
      }
      daily[dateStr].revenue += cost;
      daily[dateStr].count += 1;

      if (!monthly[monthStr]) {
        monthly[monthStr] = { month: monthStr, revenue: 0, count: 0 };
      }
      monthly[monthStr].revenue += cost;
      monthly[monthStr].count += 1;

      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const dishName = isRtl ? item.nameAr : item.nameEn;
          if (!itemSells[dishName]) {
            itemSells[dishName] = { name: dishName, count: 0 };
          }
          itemSells[dishName].count += Number(item.quantity) || 0;
        });
      }
    });

    const dailyList = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
    const monthlyList = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    const topItemsList = Object.values(itemSells).sort((a, b) => b.count - a.count).slice(0, 5);

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const totalCompletedCount = orders.filter(o => o.status === 'completed').length;

    return {
      dailyList,
      monthlyList,
      topItemsList,
      totalRevenue,
      totalCompletedCount
    };
  }, [orders, isRtl]);

  // Order alerts sound & visual trackers
  const [lastOrderCount, setLastOrderCount] = useState(orders.length);
  const isInitialOrderLoad = useRef(true);

  // Sound Synth for live cashier buzzer whistle warning (صفارة تنبيه هامر)
  const playCashierChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (startTime: number, frequency: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        // Triangle yields a perfect high-pitch electronic buzzy alert
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.03); // Quick rise
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.02); // Clean fade
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // We will beep 3 times in quick, urgent succession (high whistle-buzz)
      playBeep(now, 1046.50, 0.15);       // C6 note
      playBeep(now + 0.20, 1174.66, 0.15); // D6 note
      playBeep(now + 0.40, 1318.51, 0.25); // E6 note (Slightly longer third note)
      
    } catch (e) {
      console.warn('Audio synthesis blocked by user interaction restrictions', e);
    }
  };

  // Monitor newly coming live orders and play kitchen bell chime!
  useEffect(() => {
    if (orders.length > 0) {
      if (isInitialOrderLoad.current) {
        isInitialOrderLoad.current = false;
        setLastOrderCount(orders.length);
        return;
      }
      if (orders.length > lastOrderCount) {
        playCashierChime();
      }
      setLastOrderCount(orders.length);
    }
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
            <span>{isRtl ? 'لوحة تحكم كاشير ومطبخ هامر 🍔' : 'Hummer POS & Kitchen Radar'}</span>
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
                checkPinAndExecute(() => {
                  setActiveSubTab('menu-manager');
                  resetFoodForm();
                }, 'menu-manager');
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
              onClick={() => checkPinAndExecute(() => {}, 'site-settings')}
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
              onClick={() => checkPinAndExecute(() => {}, 'cloudinary-settings')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'cloudinary-settings'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'إعدادات الرفع (Cloudinary)' : 'Cloudinary Config'}</span>
              <Settings className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => checkPinAndExecute(() => {}, 'riders')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'riders'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'إدارة الطيارين المسجلين 🏍️' : 'Rider Captains 🏍️'}</span>
              <span className="bg-zinc-950 text-white font-mono text-[10px] py-0.5 px-2 rounded-full font-black">
                {riders.length}
              </span>
            </button>

            <button
              onClick={() => checkPinAndExecute(() => {}, 'analytics')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'analytics'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'تقارير المبيعات والأرباح 📊' : 'Sales Analytics Reports 📊'}</span>
              <TrendingUp className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => checkPinAndExecute(() => {}, 'admins')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'admins'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'صلاحيات الإدارة والمديرين 🔑' : 'Manage Admin Credentials 🔑'}</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => checkPinAndExecute(() => {}, 'coupons-wheel')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black text-right transition-all flex items-center justify-between cursor-pointer ${
                activeSubTab === 'coupons-wheel'
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{isRtl ? 'الكوبونات وعجلة الحظ 🎡' : 'Coupons & Lucky Wheel 🎡'}</span>
              <Award className="w-4 h-4 text-zinc-400" />
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

          {/* High-Fidelity Firestore Database Space Indicator with Clean-up Utilities */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl text-right space-y-4 shadow-xl relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500" />
            
            <div className="flex items-center justify-between">
              <button 
                onClick={scanDatabaseOverview}
                disabled={dbStats.loading}
                className="p-1.5 bg-zinc-850 hover:bg-zinc-800 hover:text-white rounded-xl text-zinc-400 transition"
                title={isRtl ? 'تحديث الإحصائيات' : 'Refresh stats'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dbStats.loading ? 'animate-spin text-green-500' : ''}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wide text-zinc-200">
                  {isRtl ? 'سعة قاعدة البيانات 🛰️' : 'Live DB Storage Capacity'}
                </span>
                <Database className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            {/* Storage Progress bar representation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>{((dbStats.estimatedBytes / (1024 * 1024 * 1024)) * 100).toFixed(4)}%</span>
                <span className="font-bold text-emerald-400">
                  {formatBytes(dbStats.estimatedBytes)} / 1 GB
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(1, (dbStats.estimatedBytes / (1024 * 1024 * 1024)) * 100))}%` }}
                />
              </div>
              <p className="text-[9px] text-zinc-400 leading-normal">
                {isRtl 
                  ? 'توفر لك Google سعة مجانية بالكامل قدرها 1 جيجابايت (1,024 ميجابايت) في قاعدة بيانات Firestore، وهي كافية لتخزين أكثر من مليون طلب طعام مجاناً!' 
                  : 'Google provides a fully free capacity of 1 GB (1,024 MB) in Firestore Spark tier, which is enough to register over 1,000,000 customer orders for free!'}
              </p>
            </div>

            {/* Accurate detailed metrics table (بيانات دقيقة) */}
            <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60 text-[10px] space-y-2 font-semibold text-right" dir="rtl">
              <div className="flex justify-between border-b border-zinc-850/50 pb-1 text-zinc-500 font-black">
                <span>{isRtl ? 'السعة المقدرة' : 'Est. Weight'}</span>
                <span>{isRtl ? 'المجموعة والسجلات' : 'Collection & Docs'}</span>
              </div>
              
              <div className="flex justify-between text-zinc-300">
                <span className="font-mono text-zinc-400">{formatBytes(dbStats.ordersCount * 1430)}</span>
                <span className="text-right">📦 {isRtl ? 'الطلبات' : 'Orders'}: <strong className="text-white font-mono">{dbStats.ordersCount}</strong></span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span className="font-mono text-zinc-400">{formatBytes(dbStats.userCount * 610)}</span>
                <span className="text-right">👥 {isRtl ? 'الأعضاء والزوار' : 'Users'}: <strong className="text-white font-mono">{dbStats.userCount}</strong></span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span className="font-mono text-zinc-400">{formatBytes(dbStats.menuItemsCount * 920)}</span>
                <span className="text-right">🍕 {isRtl ? 'المنيو والأصناف' : 'Menu'}: <strong className="text-white font-mono">{dbStats.menuItemsCount}</strong></span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span className="font-mono text-zinc-400">{formatBytes((dbStats.ridersCount * 410) + (dbStats.adminsCount * 200))}</span>
                <span className="text-right">🛠️ {isRtl ? 'الطيارين والمشرفين' : 'Riders & Admins'}: <strong className="text-white font-mono">{dbStats.ridersCount + dbStats.adminsCount}</strong></span>
              </div>

              <div className="flex justify-between text-zinc-200 border-t border-zinc-850/50 pt-1.5 font-bold">
                <span className="font-mono text-emerald-400">{formatBytes(dbStats.estimatedBytes)}</span>
                <span>📊 {isRtl ? 'إجمالي المستندات:' : 'Total docs:'} <strong className="font-mono text-white">{dbStats.totalDocs}</strong></span>
              </div>
            </div>

            {/* DB Clearing and Optimization actions (مسح البيانات لتوفير المساحة) */}
            <div className="space-y-2 pt-1 font-sans">
              <button
                onClick={clearCompletedAndCanceledOrders}
                disabled={dbStats.clearingState !== ''}
                className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/40 text-[10px] font-black rounded-xl transition cursor-pointer flex items-center justify-between disabled:opacity-50"
              >
                <span>{dbStats.clearingState === 'orders' ? '...' : (isRtl ? 'تنفيذ الحذف 🗑️' : 'Execute')}</span>
                <span>{isRtl ? '🗑️ مسح أرشيف الطلبات' : 'Clear completed orders'}</span>
              </button>

              <button
                onClick={clearInactiveGuestUsers}
                disabled={dbStats.clearingState !== ''}
                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-750 text-[10px] font-black rounded-xl transition cursor-pointer flex items-center justify-between disabled:opacity-50"
              >
                <span>{dbStats.clearingState === 'users' ? '...' : (isRtl ? 'تنفيذ الفرز 🧹' : 'Execute')}</span>
                <span>{isRtl ? '🧹 مسح حسابات الزوار المؤقتة' : 'Wipe guest accounts'}</span>
              </button>

              {/* Offline Backup & Restore Section */}
              <div className="border-t border-zinc-850/60 pt-2.5 mt-2 space-y-1.5" dir="rtl">
                <span className="text-[9px] font-black text-amber-500 block text-right">
                  {isRtl ? '💾 النسخ الاحتياطي للطوارئ (JSON):' : '💾 Emergency Data Backup (JSON):'}
                </span>
                
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={isBackingUp}
                  className="w-full py-2 px-3 bg-zinc-950 hover:bg-zinc-900 text-amber-200 hover:text-white border border-zinc-800 text-[10px] font-black rounded-xl transition cursor-pointer flex items-center justify-between disabled:opacity-50"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{isRtl ? 'تنزيل نسخة احتياطية لكافة الطلبات' : 'Download Complete Orders Backup'}</span>
                </button>

                <label className="w-full py-2 px-3 bg-zinc-950 hover:bg-zinc-905 text-zinc-300 hover:text-white border border-zinc-800 text-[10px] font-black rounded-xl transition cursor-pointer flex items-center justify-between disabled:opacity-50 select-none">
                  {isRestoring ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-emerald-550" />
                  )}
                  <span>{isRtl ? 'رفع واستعادة نسخة احتياطية مسبقة' : 'Restore and Upload From JSON File'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    disabled={isRestoring}
                    className="hidden"
                  />
                </label>
                
                <p className="text-[8px] text-zinc-500 leading-normal text-right font-medium">
                  {isRtl 
                    ? 'نصيحة: يمكنك تحميل كافة المبيعات والطلبات محلياً ومسح أرشيفها لتفريغ القيمة السحابية، ورفعها مجدداً في أي وقت لاحق بسهولة تامة!'
                    : 'Tip: Safely backup all database orders offline to free up cloud storage capacity, then merge and re-upload any time down the road!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Screens Grid */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Admin Database Real-time Authorization Alert */}
          {currentUser?.email !== 'motaem23y@gmail.com' && (
            <div className="p-4 bg-amber-950/45 border border-amber-800/60 rounded-3xl text-right space-y-3 shadow-md" dir="rtl">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-black text-amber-200 font-sans">
                    {isRtl ? 'حالة المزامنة السحابية غير مفعلة ⚠️' : 'Cloud Synchronization Off ⚠️'}
                  </h4>
                  <p className="text-xs text-amber-300 font-bold leading-relaxed font-sans">
                    {isRtl 
                      ? 'أنت تتصفح لوحة التحكم المحلية بالبينات المؤقتة. لمزامنة وتلقي الطلبات حياً (Live) من الهواتف الأخرى والزبائن بجودة واحترافية متكاملة للعمل التجاري، يرجى تسجيل الدخول بحساب المسؤول Google المعتمد (motaem23y@gmail.com).'
                      : 'You are browsing the local dashboard. To securely sync and receive orders live from other devices in real-time, please sign in with the authorized Admin Google account (motaem23y@gmail.com).'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { auth, googleProvider } = await import('../firebase');
                      const { signInWithPopup } = await import('firebase/auth');
                      const result = await signInWithPopup(auth, googleProvider);
                      if (result.user.email === 'motaem23y@gmail.com') {
                        toastNotification(isRtl ? 'تم تسجيل الدخول بنجاح كمدير مسؤول معتمد! 🔥' : 'Authorized Admin Google Login Success! 🔥');
                      } else {
                        toastNotification(
                          isRtl 
                            ? 'عذراً، هذا الحساب ليس الحساب المسؤول المعتمد (motaem23y@gmail.com)!' 
                            : 'This email is not the authorized admin email (motaem23y@gmail.com)!'
                        );
                      }
                    } catch (err: any) {
                      console.error('Admin Dashboard sign in error:', err);
                      toastNotification(isRtl ? 'فشل تسجيل الدخول، يرجى المحاولة مرة أخرى.' : 'Login failed, please retry.');
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 hover:text-black rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-2 cursor-pointer shadow-md select-none"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isRtl ? 'ربط لوحة التحكم همر سحابياً بالحساب المعتمد 🔑' : 'Sync Hummer Dashboard with Authorized Google Account 🔑'}</span>
                </button>
              </div>
            </div>
          )}

          {currentUser?.email === 'motaem23y@gmail.com' && (
            <div className="p-4 bg-green-950/40 border border-green-800/50 rounded-3xl text-right flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs" dir="rtl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-black text-green-300 font-sans">
                  {isRtl ? '✓ لوحة التحكم متصلة بقاعدة البيانات السحابية الحية (motaem23y@gmail.com)' : '✓ Dashboard fully synced with live cloud database (motaem23y@gmail.com)'}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold font-mono">ROLE: AUTHENTICATED_STORE_ADMIN</span>
            </div>
          )}

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
              {/* Header & Day Clean Button Layout */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {orders.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(isRtl ? 'هل تريد مسح وأرشفة جميع الطلبات المسجلة بالأدمن حالياً؟' : 'Clear all archived orders?')) {
                          onClearAllOrders();
                          toastNotification(isRtl ? 'تم تصفير لوحة الطلبات!' : 'Orders cleared!');
                        }
                      }}
                      className="py-1.5 px-3.5 bg-zinc-800 hover:bg-zinc-750 text-red-400 hover:text-red-500 rounded-xl text-xs font-black cursor-pointer border border-zinc-700 transition"
                    >
                      {isRtl ? 'تصفير وأرشفة كافة الطلبات 🧹' : 'Clear All Orders 🧹'}
                    </button>
                  )}

                  {activeInvoices.length > 0 && (
                    <button
                      onClick={async () => {
                        if (confirm(isRtl 
                          ? `تحذير: هل أنت متأكد من مسح وتصفية عدد (${activeInvoices.length}) فاتورة لليوم المختار فقط بشكل نهائي؟` 
                          : `Warning: Clean (${activeInvoices.length}) invoices for this day only?`)) {
                          for (const o of activeInvoices) {
                            await onDeleteOrder(o.id);
                          }
                          toastNotification(isRtl ? 'تم تنظيف فواتير اليوم المختار بنجاح!' : 'Invoices deleted!');
                        }
                      }}
                      className="py-1.5 px-3.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-300 hover:text-red-400 rounded-xl text-xs font-black cursor-pointer transition"
                    >
                      {isRtl ? 'حذف فواتير الفلتر الحالي فقط 🧼' : 'Wipe Only Filtered Invoices'}
                    </button>
                  )}
                </div>

                <div className="text-right">
                  <h3 className="text-xl font-black text-white font-sans">{isRtl ? 'طابور تجهيز الطلبات بالمطبخ 🍕' : 'Kitchen active tickets queue'}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isRtl 
                      ? `لديك إجمالي (${orders.length}) طلبات مسجلة في قاعدة البيانات.` 
                      : `Currently hosting (${orders.length}) total recorded active request(s)`}
                  </p>
                </div>
              </div>

              {/* Day Selector and Sales Organizer Widget */}
              <div className="bg-zinc-950 p-5 rounded-[2rem] border border-zinc-850 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-3" dir="rtl">
                  <div className="text-right">
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5 justify-end">
                      <Calendar className="w-4 h-4 text-red-500" />
                      <span>منظم فواتير وجدول المبيعات اليومية</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {isRtl 
                        ? 'تصفح فواتير اليوم، أو اختر يوماً سابقاً لمراجعته وحذف قديمه لضمان سرعة السيستم والاستقرار' 
                        : 'Browse today’s bills, review older sales, or wipe records to keep cache lightweight.'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDateFilter('today')}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition ${
                        selectedDateFilter === 'today'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isRtl ? 'أوردرات اليوم فقط 📅' : 'Today Only'}
                    </button>
                    <button
                      onClick={() => setSelectedDateFilter('all')}
                      className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition ${
                        selectedDateFilter === 'all'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isRtl ? 'عرض كل الأيام 🗄️' : 'All Days'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center" dir="rtl">
                  {/* Unique days list to click instantly */}
                  <div className="md:col-span-8 space-y-2 text-right">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">
                      {isRtl ? 'أيام مبيعات سابقة مسجلة بالسيستم (اختر لتصفيتهم):' : 'Pre-recorded sales days (Click to inspect):'}
                    </span>
                    {uniqueOrderedDays.length === 0 ? (
                      <p className="text-xs text-zinc-600 font-semibold italic">{isRtl ? 'لا توجد أيام سابقة مسجلة بالأرشيف' : 'No prior sales dates recorded'}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueOrderedDays.map((dayStr) => {
                          const isSelected = selectedDateFilter === 'custom' && customSelectedDate === dayStr;
                          const isToday = dayStr === todayStr;
                          // count orders for this day
                          const dayCount = orders.filter(o => getOrderDateString(o.createdAt) === dayStr).length;

                          return (
                            <button
                              key={dayStr}
                              onClick={() => {
                                setCustomSelectedDate(dayStr);
                                setSelectedDateFilter('custom');
                              }}
                              className={`py-1 px-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-600/50'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:bg-zinc-800 hover:text-zinc-205'
                              }`}
                            >
                              <span className={isToday ? "text-red-500" : "text-zinc-500"}>■</span>
                              <span>{dayStr}</span>
                              <span className="bg-zinc-950/80 text-[10px] px-1 rounded text-zinc-300 font-sans font-black">
                                ({dayCount})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Custom Calendar date picker input */}
                  <div className="md:col-span-4 bg-zinc-900 border border-zinc-850 p-2.5 rounded-2xl flex flex-col items-stretch space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 text-right block">
                      {isRtl ? '📅 تاريخ مخصص مستهدف بالتقويم:' : '📅 Pick custom manual date:'}
                    </label>
                    <input
                      type="date"
                      value={customSelectedDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCustomSelectedDate(e.target.value);
                          setSelectedDateFilter('custom');
                        }
                      }}
                      className="w-full bg-zinc-950 text-white text-xs font-bold border border-zinc-800 rounded-lg p-1.5 mt-1 outline-none focus:border-red-600 text-right"
                    />
                  </div>
                </div>

                {/* Filter Status summary card */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-850 p-3 flex flex-wrap items-center justify-between gap-3 text-right" dir="rtl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <p className="text-xs text-zinc-400 font-bold">
                      {isRtl ? 'وضع تصفية الفواتير النشط حالياً:' : 'Active filter option:'}{' '}
                      <span className="text-white font-black underline">
                        {selectedDateFilter === 'today' && (isRtl ? `اليوم (${todayStr})` : `Today (${todayStr})`)}
                        {selectedDateFilter === 'all' && (isRtl ? 'كل فترات المبيعات مدى الحياة' : 'All lifetime sales')}
                        {selectedDateFilter === 'custom' && (isRtl ? `يوم مخصص (${customSelectedDate})` : `Custom selected date (${customSelectedDate})`)}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-black block leading-none uppercase">{isRtl ? 'عدد طلبات الفلتر' : 'Filter orders count'}</span>
                      <span className="text-sm font-black text-white font-mono">{activeInvoices.length}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-zinc-800" />
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-black block leading-none uppercase">{isRtl ? 'مبيعات هذا الفلتر' : 'Total sales on filter'}</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{totalFilteredSales} ج.م</span>
                    </div>
                  </div>
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
              ) : activeInvoices.length === 0 ? (
                <div className="text-center p-16 border border-zinc-850 bg-zinc-900/20 rounded-[2.5rem] space-y-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-550 border border-zinc-800">
                    <Calendar className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{isRtl ? 'لا توجد فواتير أو أوردرات لهذا اليوم! 📅' : 'No records for this selected date'}</p>
                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed font-semibold">
                      {isRtl 
                        ? 'لم يتم استلام أو تسجيل أي فواتير في التاريخ المختار أعلى. يمكنك اختيار تاريخ آخر أو النقر على "عرض كل الأيام" لمراجعة كامل الأرشيف المتاح.' 
                        : 'No entries recorded for this day. Switch to other dates or select All Days to inspect cached logs.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence initial={false}>
                    {activeInvoices.map((order, idx) => {
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
                            <div className="border border-zinc-800 bg-zinc-950 p-3.5 rounded-2xl text-xs space-y-2 block">
                              <div className="flex justify-between items-center gap-2">
                                <a
                                  href={getWhatsAppLink(order.phone, isRtl ? `أهلاً يا فندم، أنا من مطعم هامر وبخصوص طلبك رقم ${order.id}...` : `Hello, I'm from Hummer Restaurant regarding your order ${order.id}...`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-green-600/20 hover:bg-green-600/35 border border-green-500/30 text-green-400 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
                                  title={isRtl ? 'فتح واتساب العميل' : 'Open customer WhatsApp'}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                  <span>{isRtl ? 'واتساب العميل 💬' : 'Client WA 💬'}</span>
                                </a>
                                <p className="font-black text-white text-[13px] text-right">
                                  {order.customerName} - <span className="font-mono text-amber-500 text-xs">{order.phone}</span>
                                </p>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
                                {order.deliveryAddress}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-bold">
                                {isRtl ? 'السداد المطلوب للاعب:' : 'Requested method:'}{' '}
                                <span className="text-cyan-400 font-black">
                                  {order.paymentMethod === 'cash' ? (isRtl ? 'كاش مع المندوب 💵' : 'Cash on delivery') : (isRtl ? 'فيزا مع المندوب 💳' : 'Card on delivery')}
                                </span>
                              </p>

                              {order.scheduledDeliveryTime ? (
                                <p className="text-[10px] bg-red-950/40 border border-red-900/60 p-1.5 rounded-lg text-red-400 font-black mt-1.5 inline-block">
                                  ⏳ {isRtl ? '⏱️ وقت التوصيل المجدول والمستقبلي:' : '⏱️ Scheduled Future Delivery:'}{' '}
                                  <span className="underline font-sans text-xs text-white">{order.scheduledDeliveryTime}</span>
                                </p>
                              ) : (
                                <p className="text-[10px] text-green-500 font-bold mt-1 inline-block">
                                  ⚡ {isRtl ? '⚡ طلب فوري (بأسرع وقت)' : '⚡ Express immediate delivery'}
                                </p>
                              )}
                            </div>

                            {/* Dish items ordered */}
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                                {isRtl ? 'أصناف الوجبات المفرودة:' : 'Items breakdown list:'}
                              </h4>
                              <div className="space-y-1.5 text-xs text-zinc-200">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center bg-zinc-950/40 border border-zinc-850 p-2 rounded-xl">
                                    <span className="font-mono font-black text-zinc-400">
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

                            {/* Rider dispatch center */}
                            <div className="mt-4 border-t border-zinc-850 pt-3.5 space-y-2 text-right">
                              <div className="flex justify-between items-center">
                                <span className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                                  {isRtl ? 'مشاركة وتذكرة الطيار 🛵:' : 'DISPATCH RIDER TICKET 🛵:'}
                                </span>
                                {order.captainName && (
                                  <span className="text-[9px] font-bold text-zinc-500">
                                    {isRtl ? `الطيار الإفتراضي: ${order.captainName}` : `Default rider: ${order.captainName}`}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black block text-right text-zinc-400">
                                    {isRtl ? 'اختر طياراً من الطاقم المسجل بالسيستم:' : 'Select Registered Store Rider:'}
                                  </label>
                                  <select
                                    value={order.riderId || ''}
                                    onChange={(e) => {
                                      const selectedRiderId = e.target.value;
                                      if (selectedRiderId) {
                                        onAssignRiderToOrder(order.id, selectedRiderId);
                                        const selected = riders.find(r => r.id === selectedRiderId);
                                        if (selected) {
                                          setRiderPhones(prev => ({ ...prev, [order.id]: selected.phone }));
                                        }
                                      }
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-850 text-xs px-3 py-2 text-white rounded-xl outline-none focus:border-green-600 font-bold text-right"
                                  >
                                    <option value="">
                                      {isRtl ? '-- اختر من الطيارين المتسجلين 🛵 --' : '-- Choose Crew Rider 🛵 --'}
                                    </option>
                                    {riders.map(r => (
                                      <option key={r.id} value={r.id} className="text-zinc-900 bg-white">
                                        {r.name} ({r.phone}) - {r.status === 'here' ? (isRtl ? '🏠 بالصالة متاح' : '🏠 Free at store') : (isRtl ? '🏍️ برا بالمشوار' : '🏍️ Out delivering')}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex gap-2 items-center">
                                  <input
                                    type="tel"
                                    placeholder={isRtl ? 'أو اكتب رقم هاتف يدوياً...' : 'Rider WhatsApp phone...'}
                                    value={riderPhones[order.id] !== undefined ? riderPhones[order.id] : (order.riderPhone || defaultRiderPhone)}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setRiderPhones(prev => ({ ...prev, [order.id]: val }));
                                      setDefaultRiderPhone(val);
                                      localStorage.setItem('hummer_default_rider_phone', val);
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-xs px-3 py-2 text-white rounded-xl outline-none focus:border-green-600 ltr text-center font-mono font-bold"
                                  />

                                  <a
                                    href={getWhatsAppLink(
                                      riderPhones[order.id] !== undefined ? riderPhones[order.id] : (order.riderPhone || defaultRiderPhone),
                                      `*طلب توصيل جديد من مطعم هامر 🛵*\n\n` +
                                      `*رقم الأوردر:* ${order.id}\n` +
                                      `*العميل:* ${order.customerName}\n` +
                                      `*تليفون العميل:* ${order.phone}\n` +
                                      `*العنوان بالتفصيل:* ${order.deliveryAddress}\n` +
                                      `*طريقة الدفع:* ${order.paymentMethod === 'cash' ? 'كاش مع المندوب 💵' : 'فيزا مع المندوب 💳'}\n` +
                                      `*إجمالي الفاتورة المطلوب تحصيلها:* ${order.totalPrice} ج.م\n` +
                                      (order.couponCode ? `*الكوبون المستخدم:* ${order.couponCode}\n` : '') +
                                      (order.discountAmount > 0 ? `*قيمة الخصم:* -${order.discountAmount} ج.م\n` : '') +
                                      `\n*تفاصيل علبة الأوردر:*\n` +
                                      order.items.map((item, idx) => {
                                        let itemText = `• ${item.nameAr || item.nameEn} (عدد: ${item.quantity})`;
                                        if (item.selectedSizeAr) {
                                          itemText += ` [حجم: ${item.selectedSizeAr}]`;
                                        }
                                        if (item.isSpicy) {
                                          itemText += ` (سبايسي)`;
                                        }
                                        if (item.notes) {
                                          itemText += `\n   ملاحظة: ${item.notes}`;
                                        }
                                        return itemText;
                                      }).join('\n') + `\n\n_شكراً يا بطل! طِر بالطلب وحافظ على السخونة والقرمشة! 🔥_`
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => {
                                      toastNotification(isRtl ? 'جاري توجيهك إلى واتساب لإرسال تذكرة الطيار!' : 'Redirecting to WhatsApp with Rider dispatch details!');
                                    }}
                                    className="px-3.5 py-2 bg-green-600 hover:bg-green-750 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 shadow-md border border-green-700"
                                  >
                                    <span>{isRtl ? 'إرسال للطيار 🛵' : 'Send'}</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order actions footer */}
                          <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3">
                            {order.couponCode && (
                              <div className="flex justify-between text-[11px] font-black text-cyan-400">
                                <span className="font-mono bg-cyan-950/50 px-1.5 py-0.5 rounded text-cyan-300 font-bold">{order.couponCode}</span>
                                <span>{isRtl ? 'الكوبون المستخدم:' : 'Coupon applied:'}</span>
                              </div>
                            )}
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-[11px] font-black text-red-400">
                                <span className="font-mono">-{order.discountAmount} ج.م</span>
                                <span>{isRtl ? 'قيمة الخصم:' : 'Discount value:'}</span>
                              </div>
                            )}
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
                      placeholder="كريب سوبر هامر المقرمش..."
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
                          placeholder="مستردة هامر عملاق" 
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
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'شارة هامر الصغيرة (عربي):' : 'Mini Badge Title (Arabic):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.heroBadgeAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, heroBadgeAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650"
                          />
                        </div>
                        {/* Badge En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'شارة هامر الصغيرة (إنجليزي):' : 'Mini Badge Title (English):'}</label>
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
                        {/* Address Summary Ar */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'ملخص عناوين الفروع (عربي):' : 'Branches Address Summary (AR):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.addressSummaryAr || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, addressSummaryAr: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-right"
                          />
                        </div>
                        {/* Address Summary En */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'ملخص عناوين الفروع (إنجليزي):' : 'Branches Address Summary (EN):'}</label>
                          <input
                            type="text"
                            value={editedSettings?.addressSummaryEn || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, addressSummaryEn: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 text-left ltr"
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

                    {/* Part D.2: Social Media Pages Links */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4 text-right">
                      <h5 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 justify-end">
                        <span>{isRtl ? '٤.٢. صفحات التواصل الاجتماعي (Social Media)' : '4.2. Social Media Links'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        {/* Facebook */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رابط صفحة الفيس بوك:' : 'Facebook Page Link:'}</label>
                          <input
                            type="text"
                            placeholder="e.g. https://facebook.com/hummer"
                            value={editedSettings?.socialFacebook || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, socialFacebook: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                          />
                        </div>
                        {/* Instagram */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رابط صفحة الانستجرام:' : 'Instagram Page Link:'}</label>
                          <input
                            type="text"
                            placeholder="e.g. https://instagram.com/hummer"
                            value={editedSettings?.socialInstagram || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, socialInstagram: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                          />
                        </div>
                        {/* TikTok */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رابط صفحة التيك توك:' : 'TikTok Page Link:'}</label>
                          <input
                            type="text"
                            placeholder="e.g. https://tiktok.com/@hummer"
                            value={editedSettings?.socialTiktok || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, socialTiktok: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
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
                          placeholder="https://example.com/images/logo.png"
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
                        
                        <p className="text-[9px] text-amber-500/90 font-bold leading-relaxed">
                          {isRtl 
                            ? '💡 تنبيه هام للغاية: لكي يظهر الانترو لكل الناس ويعمل على هواتف الآيفون (iOS) بكفاءة، يرجى دائماً استخدام زر الرفع (المربوط بكلاودنري) أو أدخل رابط مباشر للفيديو ينتهي بـ mp4.. رفع الملف كملف محلي سيعمل عندك أنت فقط.'
                            : '💡 iPhone & Global Compatibility: To ensure the video works for everyone and streams successfully on iPhones (iOS Safari), please use the Cloudinary upload button above or enter a direct MP4 link.'}
                        </p>
                      </div>
                    </div>

                    {/* Part G: POS & RESTAURANT CASHIER SYSTEM INTEGRATION (ربط نظام الكاشير والمستودعات) */}
                    <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-850 space-y-4 text-right">
                      <h5 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 justify-end font-sans">
                        <span>{isRtl ? '٧. ربط أنظمة الكاشير الخارجية والمستودعات (POS / ERP Integration)' : '7. POS & ERP Cashier Integration'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </h5>

                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {isRtl 
                          ? 'يمكنك ربط موقعك الإلكتروني بنظام الكاشير الداخلي للمطعم أو نظام محاسبي خارجي مباشرة. عند تعيين الرابط والمفتاح ستقوم المنصة بإحالة بيانات كل طلب جديد تلقائياً كـ Webhook Payload لحظياً وبثوانٍ معدودة!' 
                          : 'Connect your store directly with your physical POS cashier machine or custom ERP. When configured, newly placed orders will be instantly dispatched as standard Webhook REST payloads!'}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right" dir="rtl">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-300 block flex items-center gap-1 justify-end">
                            <span>{isRtl ? 'مفتاح النظام البرمجي (Integration API Key):' : 'Integration API Key:'}</span>
                            <Key className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                          </label>
                          <input
                            type="text"
                            value={editedSettings?.systemApiKey || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, systemApiKey: e.target.value })}
                            placeholder="e.g. hummer_pos_live_key_xyz123..."
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-semibold text-white rounded-xl outline-none focus:border-emerald-500 ltr text-left"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-300 block flex items-center gap-1 justify-end font-sans">
                            <span>{isRtl ? 'رابط استقبال الطلبات (Webhook endpoint URL):' : 'Webhook Endpoint URL:'}</span>
                            <Globe className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                          </label>
                          <input
                            type="text"
                            value={editedSettings?.systemWebhookUrl || ''}
                            onChange={(e) => setEditedSettings({ ...editedSettings, systemWebhookUrl: e.target.value })}
                            placeholder="https://your-pos-system.com/api/v1/orders"
                            className="w-full bg-zinc-950 border border-zinc-800 p-3 text-xs font-semibold text-white rounded-xl outline-none focus:border-emerald-500 ltr text-left"
                          />
                        </div>
                      </div>

                      {/* Webhook tester / developer tools info */}
                      <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-[10px] font-semibold text-zinc-400 space-y-1 text-right">
                        <p className="text-zinc-300 font-bold flex items-center gap-1 justify-end font-sans">
                          <span>{isRtl ? '📡 آلية نقل الطلبات التلقائية:' : '📡 Automated POS Dispatch Engine:'}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        </p>
                        <p className="leading-relaxed">
                          {isRtl
                            ? 'بمجرد إدخال البيانات وحفظ التعديلات، تترجم الواجهة الخلفية كل طلب من الزبون، شامل كافة محتويات السلة والوجبات، والأسعار وخصومات الأكواد، وتفاصيل الطيار والموقع الجغرافي، وترسله بصيغة JSON تفاعلية عبر بروتوكول POST آمن.'
                            : 'On checkout confirmation, the engine translates client selections, active codes, delivery tags, and precise locations, dispatching them securely via standard JSON HTTPS POST transactions.'}
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
                      <span>{isRtl ? 'قائمة فروع مطاعم هامر:' : 'Physical Outlets & Warehouses:'}</span>
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
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
                        {/* Delivery Hotline */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الخط الساخن للتوصيل بالتحديد:' : 'Branch Delivery Hotline:'}</label>
                          <input
                            type="text"
                            placeholder="e.g. 19033"
                            value={branchFormDeliveryHotline}
                            onChange={(e) => setBranchFormDeliveryHotline(e.target.value)}
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

          {/* 4. SCREEN: RIDERS MANAGEMENT PANEL */}
          {activeSubTab === 'riders' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 space-y-6 text-right">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-base font-black text-white font-sans mt-1">
                  {isRtl ? 'إدارة الطيارين المسجلين بالمطعم 🏍️' : 'Registered Store Riders 🏍️'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {isRtl 
                    ? 'أضف طيارين دائمين ليرتبطوا تلقائياً بالأوردرات، وتتبع حضورهم وعودتهم من الأوردرات متاحين وبرا.' 
                    : 'Manage your logistics crew. View who is out delivering or here at the store.'}
                </p>
              </div>

              {/* Add New Rider Form */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest block border-b border-zinc-800/60 pb-1.5">
                  {isRtl ? 'تسجيل طيار جديد في النظام:' : 'Register New Store Rider:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'اسم الكابتن/الطيار:' : 'Rider Full Name:'}</label>
                    <input
                      type="text"
                      value={newRiderName}
                      onChange={(e) => setNewRiderName(e.target.value)}
                      placeholder={isRtl ? 'مثال: الكابتن هاني التورتورا...' : 'Captain Hany...'}
                      className="w-full text-right p-2.5 bg-zinc-900 text-white rounded-xl border border-zinc-800 text-xs font-bold outline-none focus:border-red-600 focus:border-red-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رقم موبايل الواتساب:' : 'WhatsApp Mobile:'}</label>
                    <input
                      type="tel"
                      maxLength={11}
                      value={newRiderPhone}
                      onChange={(e) => setNewRiderPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full text-left p-2.5 bg-zinc-900 text-white rounded-xl border border-zinc-800 text-xs font-bold outline-none focus:border-red-650 ltr font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newRiderName.trim() || !newRiderPhone.trim()) {
                        alert(isRtl ? 'يرجى ملء جميع خانات اسم وهاتف الطيار' : 'Please fill all elements');
                        return;
                      }
                      if (newRiderPhone.length < 11 || !/^\d+$/.test(newRiderPhone)) {
                        alert(isRtl ? 'رقم الهاتف يجب أن يكون كود مصر ١١ رقم' : 'Egyptian phone must be 11 digits');
                        return;
                      }
                      onAddRider(newRiderName.trim(), newRiderPhone.trim());
                      setNewRiderName('');
                      setNewRiderPhone('');
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-black rounded-xl border border-red-700 cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-white shrink-0" />
                    <span>{isRtl ? 'تثبيت الطيار بالسيستم' : 'Register Captain'}</span>
                  </button>
                </div>
              </div>

              {/* Registered Riders List Display */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest pb-1.5 block border-b border-zinc-800/60">
                  {isRtl ? 'قائمة الطيارين المتاحين وبالمشاوير:' : 'Active Store Logistics Team:'}
                </h4>

                {riders.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-bold text-center py-6">
                    {isRtl ? '⚠️ لم تقم بتسجيل أي طيارين في السيستم بعد! أضف طياراً في النموذج بالأعلى.' : 'No registered store logistics captains found.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riders.map((r) => (
                      <div key={r.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 flex items-center justify-between gap-4 text-xs font-bold">
                        <button
                          onClick={() => onDeleteRider(r.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition shrink-0"
                          title={isRtl ? 'حذف الطيار' : 'Delete Rider'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex gap-2 items-center shrink-0">
                          <button
                            onClick={() => {
                              const nextStatus = r.status === 'here' ? 'out' : 'here';
                              onUpdateRiderStatus(r.id, nextStatus);
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer select-none border ${
                              r.status === 'here'
                                ? 'bg-green-600/10 text-green-500 border-green-500/30'
                                : 'bg-red-600/10 text-red-500 border-red-500/30 font-black'
                            }`}
                          >
                            {r.status === 'here' ? (isRtl ? 'هنا بالصالة 🏠' : 'Here 🏠') : (isRtl ? 'برا بالمشوار 🏍️' : 'Out 🏍️')}
                          </button>
                        </div>

                        <div className="text-right flex-1 select-none">
                          <h5 className="font-sans font-black text-white text-xs">{r.name}</h5>
                          <p className="text-[10px] text-zinc-500 font-mono font-bold mt-0.5">{r.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'analytics' && (
            <div className="space-y-6 text-right" id="subtab-analytics">
              {/* Total Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="w-5 h-5 text-green-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{isRtl ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{analyticsData.totalRevenue.toLocaleString()} <span className="text-xs text-zinc-400">{isRtl ? 'ج.م' : 'EGP'}</span></p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{isRtl ? 'إجمالي عدد الطلبات' : 'Total Orders Placed'}</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{orders.length} <span className="text-xs text-zinc-400">{isRtl ? 'أوردر' : 'Orders'}</span></p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <Award className="w-5 h-5 text-red-500" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{isRtl ? 'طلبات مكتملة التوصيل' : 'Completed Deliveries'}</span>
                  </div>
                  <p className="text-2xl font-black text-white font-mono">{analyticsData.totalCompletedCount} <span className="text-xs text-zinc-400">{isRtl ? 'ناجح' : 'Done'}</span></p>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Revenue Chart */}
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-4">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? '📈 الإيرادات اليومية (آخر ١٠ أيام)' : 'Daily Sales Trend'}</h4>
                  {analyticsData.dailyList.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-zinc-500 text-xs font-bold">{isRtl ? 'لا توجد مبيعات متوفرة للرسم' : 'No sales registered yet'}</div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.dailyList}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                          <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                          <YAxis stroke="#666" fontSize={10} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', stroke: '#333', border: '1px solid #222', color: '#fff' }} />
                          <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} name={isRtl ? 'الإيرادات اليومية' : 'Revenue'} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Popular Dishes Bestsellers Chart */}
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-4">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? '⭐ الأصناف الأكثر مبيعاً (كميات مطلوبة)' : 'Bestsellers Dishes'}</h4>
                  {analyticsData.topItemsList.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-zinc-500 text-xs font-bold">{isRtl ? 'لا توجد بيانات أصناف متاحة' : 'No menu item sold yet'}</div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={analyticsData.topItemsList}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                          <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} />
                          <YAxis type="category" dataKey="name" stroke="#fff" fontSize={9} tickLine={false} width={100} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', stroke: '#333', border: '1px solid #222', color: '#fff' }} />
                          <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} name={isRtl ? 'العدد المبيوع' : 'Quantity Sold'} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'admins' && (
            <div className="space-y-6 text-right" id="subtab-admins">
              {/* Add Admin Form Card */}
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? '🔑 إضافة أدمن جديد بالنظام' : 'Register New Manager Credentials'}</h4>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-end">
                  <button
                    onClick={async () => {
                      const email = newAdminEmail.trim();
                      if (!email) {
                        alert(isRtl ? 'الرجاء إدخال إيميل بالكامل أولاً!' : 'Please enter email first!');
                        return;
                      }
                      setIsAdminSaving(true);
                      try {
                        if (onAddAdmin) {
                          await onAddAdmin(email);
                          setNewAdminEmail('');
                          toastNotification(isRtl ? 'تم إضافة الأدمن بنجاح! 🎉' : 'New Admin registered successfully! 🎉');
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsAdminSaving(false);
                      }
                    }}
                    disabled={isAdminSaving}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 justify-center shrink-0 disabled:opacity-50"
                  >
                    {isAdminSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isRtl ? 'إضافة وتثبيت كمسؤول' : 'Register Admin'}</span>
                  </button>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder={isRtl ? 'اكتب إيميل غوغل للأدمن الجديد (مثال: master@gmail.com)' : 'Enter google email for new admin...'}
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs font-bold outline-none focus:border-red-600 text-right"
                  />
                </div>
              </div>

              {/* Dynamic Authorized Admins List */}
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? '🛡️ قائمة المديرين المعتمدين حالياً:' : 'Active System Administrators List:'}</h4>
                {authorizedAdmins.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-bold text-center py-6">
                    {isRtl ? 'لا يوجد مدراء ديناميكيين مضافين بعد. (الأدمن الأساسي هو المالك)' : 'Only primary system owner registers currently.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {authorizedAdmins.map((admEmail) => (
                      <div key={admEmail} className="bg-zinc-900 p-3 rounded-2xl border border-zinc-850 flex items-center justify-between text-xs font-mono text-zinc-300">
                        <button
                          onClick={async () => {
                            if (confirm(isRtl ? 'هل تريد سحب صلاحية الأدمن من هذا البريد الإلكتروني؟' : 'Are you sure you want to revoke admin authority?')) {
                              if (onDeleteAdmin) {
                                await onDeleteAdmin(admEmail);
                                toastNotification(isRtl ? 'تم سحب الصلاحيات بنجاح.' : 'Admin authorities revoked.');
                              }
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold">{admEmail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'coupons-wheel' && (
            <div className="space-y-6 text-right" id="subtab-coupons-wheel">
              {/* Form to Add Coupon */}
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  {isRtl ? '🎡 إضافة كوبون خصم أو جائزة لعجلة الحظ' : 'Create Coupon & Lucky Wheel Prize'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right" dir="rtl">
                  {/* Coupon Code */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-300 block">
                      {isRtl ? 'رمز الكوبون (Code):' : 'Coupon Code:'}
                    </label>
                    <input
                      type="text"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="e.g. EXTRA15"
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                    />
                  </div>

                  {/* Coupon Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-300 block">
                      {isRtl ? 'نوع الجائزة / الكوبون:' : 'Prize Type:'}
                    </label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value as 'discount' | 'gift')}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-bold text-white rounded-xl outline-none"
                    >
                      <option value="discount">{isRtl ? 'خصم مئوي (%)' : 'Percentage Discount (%)'}</option>
                      <option value="gift">{isRtl ? 'هدية وجبة/مشروب مجاني' : 'Free Food / Soft Drink Gift'}</option>
                    </select>
                  </div>

                  {/* Discount percentage or gift item */}
                  {couponType === 'discount' ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-300 block">
                        {isRtl ? 'نسبة الخصم المئوية (%):' : 'Discount Percentage (%):'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={couponDiscount}
                        onChange={(e) => setCouponDiscount(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-300 block">
                        {isRtl ? 'نوع الهدية (مثال: بيبسي أو بطاطس):' : 'Gift Item Code / Name:'}
                      </label>
                      <select
                        value={couponGiftItem}
                        onChange={(e) => setCouponGiftItem(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-bold text-white rounded-xl outline-none"
                      >
                        <option value="PEPSI">{isRtl ? 'بيبسي مثلج مجاناً (PEPSI)' : 'Free Pepsi (PEPSI)'}</option>
                        <option value="FRIES">{isRtl ? 'بطاطس مقلية مجانية (FRIES)' : 'Free Fries (FRIES)'}</option>
                        <option value="COLESLAW">{isRtl ? 'سلطة كول سلو هدية (COLESLAW)' : 'Free Coleslaw (COLESLAW)'}</option>
                      </select>
                    </div>
                  )}

                  {/* Limit of uses */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-300 block font-sans">
                      {isRtl ? 'العدد الأقصى للاستخدام (Limit):' : 'Max Allowed Uses (Limit):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={couponLimit}
                      onChange={(e) => setCouponLimit(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                    />
                    <p className="text-[8px] text-zinc-500 font-bold">
                      {isRtl ? 'أي عدد استخدامات مسموحة قبل تعطيل هذا الكوبون.' : 'Usage limitation of this promotion code.'}
                    </p>
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-300 block">
                      {isRtl ? 'تاريخ نهاية الكوبون (Expiry Date):' : 'Expiration End Date:'}
                    </label>
                    <input
                      type="date"
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-bold text-white rounded-xl outline-none focus:border-red-650 ltr text-left"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const code = newCouponCode.trim().toUpperCase();
                      if (!code) {
                        alert(isRtl ? 'الرجاء كتابة رمز الكوبون!' : 'Please write coupon code!');
                        return;
                      }
                      if (!couponExpiry) {
                        alert(isRtl ? 'الرجاء اختيار تاريخ انتهاء الكوبون!' : 'Please set coupon expiry date!');
                        return;
                      }

                      const newCoupon = {
                        code,
                        discountPercent: couponType === 'discount' ? couponDiscount : 0,
                        limit: couponLimit,
                        usedCount: 0,
                        expiryDate: couponExpiry,
                        giftType: couponType,
                        giftItem: couponType === 'gift' ? couponGiftItem : undefined
                      };

                      const currentCoupons = siteSettings.coupons || [];
                      // Prevent duplicates
                      if (currentCoupons.some(c => c.code.toUpperCase() === code)) {
                        alert(isRtl ? 'هذا الكود مضاف بالفعل!' : 'Self-same promo code exists!');
                        return;
                      }

                      const updatedCoupons = [...currentCoupons, newCoupon];
                      
                      try {
                        onUpdateSiteSettings({
                          ...siteSettings,
                          coupons: updatedCoupons
                        });
                        // Reset forms
                        setNewCouponCode('');
                        setCouponExpiry('');
                        toastNotification(isRtl ? 'تم إضافة الكوبون بنجاح وجاهز للتشغيل! 🎡' : 'Coupon listed successfully into the system! 🎡');
                      } catch (err) {
                        console.error('Error saving coupon settings:', err);
                      }
                    }}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'حفظ وإدراج الكوبون بالنظام' : 'Add Promo Code'}</span>
                  </button>
                </div>
              </div>

              {/* List of Registered/Active Coupons in Firestore */}
              <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-850 shadow-lg space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  {isRtl ? '🛡️ قائمة الكوبونات وجوائز عجلات الحظ الفعالة' : 'Active Registered Coupons & Wheel Prizes'}
                </h4>

                {(!siteSettings.coupons || siteSettings.coupons.length === 0) ? (
                  <p className="text-xs text-zinc-500 font-bold text-center py-8">
                    {isRtl 
                      ? 'لا توجد كوبونات ديناميكية في قاعدة البيانات. (سيتم استخدام الكوبونات الافتراضية لعجلة الحظ)' 
                      : 'No custom coupons defined. Default fallbacks running.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
                    {siteSettings.coupons.map((coupon) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isExpired = coupon.expiryDate && todayStr > coupon.expiryDate;
                      const isLimitExceeded = coupon.limit > 0 && coupon.usedCount >= coupon.limit;
                      const isActive = !isExpired && !isLimitExceeded;

                      return (
                        <div key={coupon.code} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative space-y-3 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <button
                              onClick={() => {
                                if (confirm(isRtl ? 'هل تريد حذف هذا الكوبون بالكامل من قاعدة البيانات؟' : 'Are you sure you want to remove this promo code?')) {
                                  const updated = (siteSettings.coupons || []).filter(c => c.code !== coupon.code);
                                  onUpdateSiteSettings({
                                    ...siteSettings,
                                    coupons: updated
                                  });
                                  toastNotification(isRtl ? 'تم حذف الكوبون بنجاح.' : 'Promo coupon code deleted.');
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-red-500/80 rounded-lg cursor-pointer transition shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-right flex-1">
                              <span className="font-mono text-sm font-black text-white bg-zinc-800 px-2 py-0.5 rounded tracking-wider block w-fit mr-auto mb-1">
                                {coupon.code}
                              </span>
                              <p className="text-xs font-bold text-zinc-300">
                                {coupon.giftType === 'discount' 
                                  ? (isRtl ? `خصم بقيمة ${coupon.discountPercent}%` : `${coupon.discountPercent}% OFF`) 
                                  : (isRtl ? `هدية مجانية: ${coupon.giftItem}` : `Free Gift: ${coupon.giftItem}`)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-zinc-850 text-[10px] font-semibold text-zinc-400">
                            <div className="flex justify-between">
                              <span>{isRtl ? 'تاريخ الانتهاء:' : 'Expiry Date:'}</span>
                              <span className={isExpired ? 'text-red-500 font-bold' : 'text-zinc-200'}>{coupon.expiryDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{isRtl ? 'الاستخدام الحقيقي:' : 'Usage Track:'}</span>
                              <span className={isLimitExceeded ? 'text-red-500 font-bold' : 'text-zinc-200'}>
                                {coupon.usedCount} / {coupon.limit}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full ${isLimitExceeded ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${Math.min(100, (coupon.usedCount / coupon.limit) * 100)}%` }} 
                              />
                            </div>
                          </div>

                          <div className="pt-2 text-[10px] flex justify-between items-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black ${
                              isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {isActive ? (isRtl ? 'فعال ومفعل' : 'Active') : (isRtl ? 'منتهي/مستنفذ' : 'Expired/Exhausted')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Dynamic PIN Prompt Overlay Modal */}
      <AnimatePresence>
        {showPinPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-sm p-6 rounded-3xl shadow-2xl space-y-6 relative text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPinPrompt(false);
                  setPendingTabChange(null);
                  setPendingAction(null);
                  setPinInputValue('');
                  setPinErrorMsg('');
                }}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 pt-2">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-white">
                  {isRtl ? 'قسم مغلق برمز أمان' : 'Protected Admin Zone'}
                </h3>
                <p className="text-xs text-zinc-400 font-bold max-w-xs mx-auto">
                  {isRtl
                    ? 'يجب إدخال الرمز السري للمتابعة.'
                    : 'A secure security PIN is required to continue.'}
                </p>
              </div>

              {/* Status/Error Indicator */}
              {pinErrorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl text-xs text-red-400 font-bold"
                >
                  {pinErrorMsg}
                </motion.div>
              )}

              {/* PIN Display Circles */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const hasDigit = pinInputValue.length > idx;
                  return (
                    <motion.div
                      key={idx}
                      animate={{
                        scale: hasDigit ? [1, 1.15, 1] : 1,
                        backgroundColor: hasDigit ? '#dc2626' : 'rgba(39, 39, 42, 0.6)'
                      }}
                      transition={{ duration: 0.15 }}
                      className="w-5 h-5 rounded-full border border-zinc-700 shadow-inner flex items-center justify-center"
                    >
                      {hasDigit && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Keypad Buttons */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pinInputValue.length < 4) {
                        const nextVal = pinInputValue + num;
                        setPinInputValue(nextVal);
                        setPinErrorMsg('');
                        if (nextVal.length === 4) {
                          setTimeout(() => {
                            if (nextVal === '2200') {
                              setIsAdminPinUnlocked(true);
                              setShowPinPrompt(false);
                              if (pendingTabChange) {
                                setActiveSubTab(pendingTabChange);
                                setPendingTabChange(null);
                              }
                              if (pendingAction) {
                                pendingAction.execute();
                                setPendingAction(null);
                              }
                            } else {
                              setPinErrorMsg(isRtl ? 'الرمز غير صحيح! الرجاء المحاولة مرة أخرى.' : 'Incorrect PIN! Please try again.');
                              setPinInputValue('');
                            }
                          }, 250);
                        }
                      }
                    }}
                    className="h-12 bg-zinc-800/60 hover:bg-zinc-850 active:scale-95 text-xl font-bold text-white rounded-2xl flex items-center justify-center transition cursor-pointer"
                  >
                    {num}
                  </button>
                ))}

                {/* Backspace/Clear Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPinInputValue('');
                    setPinErrorMsg('');
                  }}
                  className="h-12 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold rounded-2xl flex items-center justify-center transition cursor-pointer text-xs"
                >
                  {isRtl ? 'مسح' : 'CLEAR'}
                </button>

                {/* Number 0 */}
                <button
                  type="button"
                  onClick={() => {
                    if (pinInputValue.length < 4) {
                      const nextVal = pinInputValue + '0';
                      setPinInputValue(nextVal);
                      setPinErrorMsg('');
                      if (nextVal.length === 4) {
                        setTimeout(() => {
                          if (nextVal === '2200') {
                            setIsAdminPinUnlocked(true);
                            setShowPinPrompt(false);
                            if (pendingTabChange) {
                              setActiveSubTab(pendingTabChange);
                              setPendingTabChange(null);
                            }
                            if (pendingAction) {
                              pendingAction.execute();
                              setPendingAction(null);
                            }
                          } else {
                            setPinErrorMsg(isRtl ? 'الرمز غير صحيح! الرجاء المحاولة مرة أخرى.' : 'Incorrect PIN! Please try again.');
                            setPinInputValue('');
                          }
                        }, 250);
                      }
                    }
                  }}
                  className="h-12 bg-zinc-800/60 hover:bg-zinc-850 active:scale-95 text-xl font-bold text-white rounded-2xl flex items-center justify-center transition cursor-pointer"
                >
                  0
                </button>

                {/* Submit/Verify Button */}
                <button
                  type="button"
                  onClick={() => handlePinSubmit()}
                  className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center transition cursor-pointer"
                >
                  {isRtl ? 'تأكيد' : 'CONFIRM'}
                </button>
              </div>

              {/* Secure footer badge */}
              <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest pt-2">
                🛡️ LEVEL-ACCESS AUTH SECURITY
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
