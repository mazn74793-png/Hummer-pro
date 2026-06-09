import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, Phone, User, LogOut, Check, Plus, 
  MapPinHouse, History, Clock, Ship, Flame, Star, 
  Trash2, ShieldCheck, ShoppingBag
} from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  onTrackOrder: (order: any) => void;
  userOrders: any[];
}

export interface UserProfileData {
  uid: string;
  name: string;
  phone: string;
  email: string;
  addresses: string[];
  createdAt: string;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  lang,
  onTrackOrder,
  userOrders
}: UserProfileModalProps) {
  const isRtl = lang === 'ar';
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  
  // Registration / profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fast login fields
  const [fastLoginName, setFastLoginName] = useState('');
  const [fastLoginPhone, setFastLoginPhone] = useState('');
  const [fastLoginError, setFastLoginError] = useState('');

  // Lock body scroll when open
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

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((usr) => {
      setCurrentUser(usr);
      if (usr) {
        loadUserProfile(usr.uid, usr.email || '', usr.displayName || '');
      } else {
        setProfileData(null);
      }
    });
    return unsub;
  }, []);

  const loadUserProfile = async (uid: string, email: string, defaultName: string) => {
    setIsLoadingProfile(true);
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfileData;
        setProfileData(data);
        setFormName(data.name);
        setFormPhone(data.phone || '');
        // If profile details are missing phone, prompt editing
        if (!data.phone) {
          setIsEditing(true);
        }
      } else {
        // Create initial default profile on first-time login
        const newProfile: UserProfileData = {
          uid,
          name: defaultName || 'همر أكيل جديد',
          phone: '',
          email: email,
          addresses: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newProfile);
        setProfileData(newProfile);
        setFormName(newProfile.name);
        setFormPhone('');
        setIsEditing(true); // Forced edit on first login to complete details!
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Error during Google Sign-In:', err);
    }
  };

  const handleAnonymousSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFastLoginError('');

    const nameVal = fastLoginName.trim();
    const phoneVal = fastLoginPhone.trim();

    if (!nameVal) {
      setFastLoginError(isRtl ? 'من فضلك أدخل اسمك الثنائي أو الثلاثي' : 'Please enter your full name');
      return;
    }

    if (phoneVal.length < 11 || !/^\d+$/.test(phoneVal)) {
      setFastLoginError(isRtl ? 'برجاء كتابة رقم موبايل صحيح من ١١ رقم' : 'Please enter a valid 11-digit mobile number');
      return;
    }

    setIsLoadingProfile(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      const docRef = doc(db, 'users', uid);
      const newProfile: UserProfileData = {
        uid,
        name: nameVal,
        phone: phoneVal,
        email: 'fastfoodie@hummer.app',
        addresses: [],
        createdAt: new Date().toISOString()
      };

      await setDoc(docRef, newProfile);
      setProfileData(newProfile);
      setFormName(newProfile.name);
      setFormPhone(newProfile.phone);
      setIsEditing(false); // registered successfully!
    } catch (err: any) {
      console.error('Fast anonymous login failed:', err);
      setFastLoginError(isRtl ? `فشل الدخول السريع: ${err.message}` : `Fast login failed: ${err.message}`);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileData) return;
    
    // Validate Egyptian phone number (11 digits generally starts with 01)
    const phoneTrim = formPhone.trim();
    if (phoneTrim.length < 11 || !/^\d+$/.test(phoneTrim)) {
      alert(isRtl ? 'يرجى إدخال رقم هاتف كود مصر صحيح مكون من ١١ رقم' : 'Please enter a valid 11 digit mobile number');
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const updatedFields = {
        name: formName.trim() || currentUser.displayName || 'أكيل هامر',
        phone: phoneTrim
      };
      await updateDoc(docRef, updatedFields);
      setProfileData({
        ...profileData,
        ...updatedFields
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async () => {
    const addr = newAddress.trim();
    if (!addr) return;
    if (!currentUser || !profileData) return;

    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        addresses: arrayUnion(addr)
      });
      setProfileData({
        ...profileData,
        addresses: [...(profileData.addresses || []), addr]
      });
      setNewAddress('');
    } catch (err) {
      console.error('Error adding address:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addrToDelete: string) => {
    if (!currentUser || !profileData) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        addresses: arrayRemove(addrToDelete)
      });
      setProfileData({
        ...profileData,
        addresses: profileData.addresses.filter(a => a !== addrToDelete)
      });
    } catch (err) {
      console.error('Error removing address:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Black backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Main card Dialog container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative z-10 border border-zinc-200 text-right font-sans"
      >
        {/* Header Block with custom colors */}
        <div className="bg-zinc-950 p-6 text-white flex items-center justify-between border-b border-zinc-800">
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-normal">
              {isRtl ? 'حساب أكيل هامر 🍔' : 'Hummer Foodie Account'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-650 bg-red-600 flex items-center justify-center text-xs font-black select-none">H</div>
          </div>
        </div>

        {/* Content body with custom overflow scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-900">
          {!currentUser ? (
            /* 1. UNAUTHENTICATED STATE PROMPT */
            <div className="py-2 space-y-6">
              
              {/* Option A: Fast 1-Click Phone/Name Login */}
              <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl text-right">
                <h4 className="text-sm font-black text-red-650 text-red-600 flex items-center gap-1.5 justify-end">
                  <span>{isRtl ? 'تسجيل دخول سريع وثوري بـ ثانية واحدة ⚡' : 'Instant 1-Second Speed Login ⚡'}</span>
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1 mb-4 leading-relaxed">
                  {isRtl 
                    ? 'اكتب اسمك وهاتفك للتسجيل فوراً وتتبع أكيلك مباشرة بدون باسورد وبدون أي تأخير!' 
                    : 'Enter your name & phone to register instantly and track your food without password delays!'}
                </p>

                <form onSubmit={handleAnonymousSignIn} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الاسم الكامل:' : 'Your Name:'}</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={fastLoginName}
                          onChange={(e) => setFastLoginName(e.target.value)}
                          placeholder={isRtl ? 'اكتب اسمك هنا...' : 'Enter your name...'}
                          className="w-full text-right pr-3 pl-3 py-2.5 border border-zinc-300 rounded-xl bg-white text-xs font-bold outline-none focus:border-red-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رقم الهاتف (١١ رقم):' : 'Phone (11 digits):'}</label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          maxLength={11}
                          value={fastLoginPhone}
                          onChange={(e) => setFastLoginPhone(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="w-full text-right pr-3 pl-3 py-2.5 border border-zinc-300 rounded-xl bg-white text-xs font-bold outline-none focus:border-red-600 text-left font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {fastLoginError && (
                    <p className="text-right text-[11px] font-bold text-red-600 animate-pulse">{fastLoginError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoadingProfile}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition duration-150 cursor-pointer border border-red-700"
                  >
                    {isLoadingProfile ? (
                      <span className="animate-pulse">{isRtl ? 'جاري الدخول السريع...' : 'Logging in fast...'}</span>
                    ) : (
                      <>
                        <span>{isRtl ? 'دخول فوري كأكيل متميز ⚡' : 'Instant Login & Order ⚡'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Separator line */}
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
                <span className="relative px-3 bg-white text-xs font-bold text-zinc-450 text-zinc-400">{isRtl ? 'أو سجل بحساب جوجل' : 'OR SIGN IN WITH GOOGLE'}</span>
              </div>

              {/* Option B: Standard Google Social Login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="mx-auto px-6 py-3 bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-md active:scale-95 transition cursor-pointer border border-zinc-900"
                >
                  {/* Google SVG icon */}
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.46 1.64l2.484-2.483C17.4 1.7 14.97 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.9 0 10.13-4.14 10.13-10.13 0-.68-.08-1.35-.22-1.99H12.24z"/>
                  </svg>
                  <span>{isRtl ? 'تسجيل دخول سريع بواسطة Google' : 'Log in with Google Account'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* 2. AUTHENTICATED USER DASHBOARD */
            <div className="space-y-6">
              
              {/* Profile Card Summary */}
              <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200">
                {isLoadingProfile ? (
                  <div className="text-center py-4 text-xs font-bold text-zinc-500 animate-pulse">
                    {isRtl ? 'جاري تحميل ملف الأكيل...' : 'Loading foodie profile...'}
                  </div>
                ) : isEditing ? (
                  /* Form to complete Name & Phone (especially on 1st login) */
                  <form onSubmit={handleSaveProfile} className="space-y-3.5">
                    <h4 className="text-xs font-black text-red-600 uppercase tracking-widest block border-b border-zinc-200 pb-1.5">
                      {isRtl ? 'تحديث البيانات الأساسية:' : 'Complete Profile Setup:'}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'الاسم الكامل:' : 'Full Name:'}</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full text-right pr-9 pl-3 py-2 border border-zinc-350 rounded-xl bg-white text-xs font-bold outline-none focus:border-red-600"
                            placeholder={isRtl ? 'أحمد محمد...' : 'John Doe...'}
                          />
                          <User className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 block">{isRtl ? 'رقم التليفون (١١ رقم للاتصال):' : 'Phone Number (11 digits):'}</label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            maxLength={11}
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            className="w-full text-right pr-9 pl-3 py-2 border border-zinc-350 rounded-xl bg-white text-xs font-bold outline-none focus:border-red-600 text-left font-mono"
                            placeholder="01xxxxxxxxx"
                          />
                          <Phone className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      {profileData?.phone && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 rounded-lg text-[10px] font-black text-zinc-700 cursor-pointer"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs"
                      >
                        {isSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الحساب' : 'Save Details')}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard profile view display text */
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-amber-400 uppercase text-black px-2 py-0.5 rounded-md">
                          {isRtl ? 'زبون دائم' : 'Premium Customer'}
                        </span>
                        <h4 className="text-sm font-black text-zinc-950 font-sans">{profileData?.name}</h4>
                      </div>
                      <p className="text-zinc-[500] text-xs font-bold font-mono text-zinc-500">{profileData?.email}</p>
                      
                      <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-bold pt-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono">{profileData?.phone || (isRtl ? 'غير مسجل' : 'Not setup')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[10.5px] font-black rounded-lg cursor-pointer transition"
                      >
                        {isRtl ? 'تعديل البيانات' : 'Edit Info'}
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 text-[10.5px] font-black rounded-lg cursor-pointer transition flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>{isRtl ? 'تسجيل خروج' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Physical Address Management section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{isRtl ? 'العناوين المحفوظة للشحن:' : 'SHIPPING SAVED OUTLETS:'}</span>
                  <MapPinHouse className="w-4 h-4 text-red-600" />
                </div>

                {/* List of saved destination addresses */}
                {profileData && (profileData.addresses || []).length === 0 ? (
                  <p className="text-xs text-zinc-400 font-bold text-center py-2">
                    {isRtl ? 'لم تقم بتسجيل أي عناوين توصيل للوجبات حتى الآن!' : 'No custom delivery destinations registered yet!'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profileData?.addresses.map((addr, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-150 text-xs">
                        <button
                          onClick={() => handleDeleteAddress(addr)}
                          disabled={isSaving}
                          className="text-zinc-400 hover:text-red-600 transition shrink-0 cursor-pointer p-1"
                          title={isRtl ? 'مسح العنوان' : 'Delete Address'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-1.5 text-right font-medium text-zinc-600 pr-2">
                          <span>{addr}</span>
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new shipping address inputs */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAddress}
                    disabled={isSaving || !newAddress.trim()}
                    className="px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs flex items-center justify-center cursor-pointer disabled:opacity-50 transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder={isRtl ? 'مثال: المعادي، شارع ٩، عمارة ٤٤، شقة ٣...' : 'e.g. Abbas Akkad, Building 5, Floor 2...'}
                    className="w-full text-right p-3 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl text-xs font-bold outline-none focus:border-red-650 focus:border-red-600"
                  />
                </div>
              </div>

              {/* Genuine dynamic order tracking history panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{isRtl ? 'سجل طلباتي وتتبع التوصيل الحي:' : 'LIVE DELIVERIES & ORDER HISTORY:'}</span>
                  <History className="w-4 h-4 text-red-600" />
                </div>

                {userOrders.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-bold text-center py-4">
                    {isRtl ? 'لم تقم بـ أي طلبات شراء تحت هذا الحساب بعد!' : 'No recorded transactions under this account yet!'}
                  </p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {userOrders.map((ord) => {
                      const orderTime = new Date(ord.createdAt).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                      const orderDate = new Date(ord.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
                      
                      // Status styling and translations
                      let statusText = 'مستلم';
                      let statusColor = 'bg-zinc-500/10 text-zinc-650';
                      if (ord.status === 'cooking') {
                        statusText = isRtl ? 'نار الطبخ 🔥' : 'Cooking';
                        statusColor = 'bg-amber-500/10 text-amber-650 border border-amber-300/30';
                      } else if (ord.status === 'wrapping') {
                        statusText = isRtl ? 'تغليف دبل 📦' : 'Wrapping';
                        statusColor = 'bg-blue-500/10 text-blue-650 border border-blue-400/30';
                      } else if (ord.status === 'delivering') {
                        statusText = isRtl ? 'بالطريق مع الطيار 🏍️' : 'In Transit';
                        statusColor = 'bg-red-500/10 text-red-650 border border-red-300/30';
                      } else if (ord.status === 'completed') {
                        statusText = isRtl ? 'تم التوصيل بنجاح' : 'Completed';
                        statusColor = 'bg-green-600/10 text-green-600 border border-green-300/30 font-black';
                      }

                      return (
                        <div key={ord.id} className="bg-white border border-zinc-200 rounded-2xl p-3.5 space-y-2 relative shadow-xs">
                          {/* Top Row with ID and Status */}
                          <div className="flex justify-between items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${statusColor}`}>
                              {statusText}
                            </span>
                            <div className="text-right">
                              <span className="font-mono font-black text-xs text-zinc-950">#{ord.id.slice(0, 8)}</span>
                              <span className="text-[9px] text-zinc-400 font-bold block mt-0.5">{orderDate} - {orderTime}</span>
                            </div>
                          </div>

                          {/* Items summary */}
                          <div className="text-[10px] text-zinc-500 font-bold overflow-hidden text-ellipsis line-clamp-1">
                            {ord.items.map((it: any) => `${it.quantity}x ${isRtl ? it.nameAr : it.nameEn}`).join(' - ')}
                          </div>

                          {/* Price and assigned Rider details */}
                          <div className="flex justify-between items-center gap-4 text-xs border-t border-zinc-100 pt-2 mt-1.5">
                            {ord.riderName ? (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 font-black">
                                <span>{isRtl ? `الطيار: ${ord.riderName}` : `Rider: ${ord.riderName}`}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'جاري تجهيز الطباخ' : 'Kitchen prep...'}</span>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-zinc-900">{ord.finalTotal} ج.م</span>
                              {ord.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => onTrackOrder(ord)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black transition active:scale-95 cursor-pointer shadow-xs"
                                >
                                  {isRtl ? 'متابعة لايف' : 'Track Live'}
                                </button>
                              )}
                            </div>
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

        {/* Footer info screen */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-150 text-center text-[9px] text-zinc-400 font-bold flex items-center justify-center gap-1 flex-wrap">
          <span>{isRtl ? 'تتم مزامنة الطلبات حيًا ومباشرةً مع مطبخ هامر' : 'Sizzling orders synchronized in real time with the kitchen'}</span>
          <span className="h-1 w-1 bg-zinc-300 rounded-full"></span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </motion.div>
    </div>
  );
}
