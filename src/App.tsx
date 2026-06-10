/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Utensils, Search, Flame, MapPin, PhoneCall, Clock, HelpCircle, Gift, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import MenuCard from './components/MenuCard';
import LuckyWheel from './components/LuckyWheel';
import BranchesSection from './components/BranchesSection';
import ReviewsSection from './components/ReviewsSection';
import OrderTracker from './components/OrderTracker';
import CartModal from './components/CartModal';
import AdminDashboard from './components/AdminDashboard';
import IntroVideoOverlay from './components/IntroVideoOverlay';
import { saveLargeAsset, getLargeAsset, deleteLargeAsset } from './utils/indexedDB';

// Firebase Integrators
import { auth, db, googleProvider, cleanFirestoreData } from './firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import UserProfileModal from './components/UserProfileModal';

// Types
import { MenuItem, CartItem, OrderState, SizeOption, OrderStep, Branch, SiteSettings } from './types';

// Static Data
import { MENU_ITEMS, HUMMER_BRANCHES } from './menuData';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroTitleAr: 'كريب وقرمشة\nملوك هامر!',
  heroTitleEn: "Crunch\nThe King",
  heroSubAr: 'أقوى كريبات ووجبات فراخ بروستد كريسبي نارية بالبهارات السحرية والجبنة السايحة المحضرة طازجة فور طلبك!',
  heroSubEn: 'The most powerful fried chicken and folded crepes in the city. Sizzling hot, freshly pressed, and made daily.',
  heroBadgeAr: 'هامر الأصلي دايماً يكسب 🏆',
  heroBadgeEn: 'Original Hummer Taste 🏆',
  deliveryTimeAr: '٣٥ دقيقة',
  deliveryTimeEn: '35 MIN',
  deliveryTimeSubAr: 'سرعة التوصيل وعمر الجريء طيار',
  deliveryTimeSubEn: 'Average Delivery Time',
  hotline: '19033',
  addressSummaryAr: 'شارع عباس العقاد | المعادي شارع 9 | المنيل',
  addressSummaryEn: 'Road 9, Maadi | Abbas Akkad St, Cairo',
  deliveryNoticeAr: 'ملاحظة: خدمة الدليفري والتوصيل تعمل على مدار الساعة طوال أيام الأسبوع حتى الساعة الرابعة فجراً في أي طقس!',
  deliveryNoticeEn: 'Notice: Delivery service and takeout runs 24/7 in extreme weather conditions until 04:00 AM!',
  footerDescAr: 'موقع مطاعم هامر الرسمي لكافة كريبات مصر الشهيرة، فراخ بروستد كريسبي على أصولها، تتبيلة سحرية لا غنى عنها!',
  footerDescEn: 'The official platform of Hummer restaurant. Firing standard crunchy meals, savory folded street crepes, and elite appetizers across Cairo and Giza.',
  promoBannerAr: 'عروض الصيف من هامر! خصم ١٠٪ على كل الكريبات بـ كود HUMMER10',
  promoBannerEn: 'Summer Deals! 10% OFF all crepes with code HUMMER10',
  introVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-fresh-vegetable-salad-41611-large.mp4',
  disableIntro: false,
};

// High Fidelity Audio Synthesis for premium interactive sounds with 100% reliability (bypasses static files)
export const playCheckoutSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Arpeggio rising success chime
    playTone(523.25, now, 0.5, 0.15); // C5
    playTone(659.25, now + 0.1, 0.5, 0.15); // E5
    playTone(783.99, now + 0.2, 0.5, 0.15); // G5
    playTone(1046.50, now + 0.3, 0.8, 0.2); // C6
  } catch (err) {
    console.warn('Audio check-out play error:', err);
  }
};

export const playIncomingOrderBell = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playBellTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator(); // Subharmonic resonance
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, start);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq / 2, start); // Deep underlying bell resonance

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + duration);
      osc2.stop(start + duration);
    };

    // Traditional kitchen dynamic double-ring bell
    playBellTone(880, now, 1.2, 0.3); // High A5
    playBellTone(880, now + 0.15, 1.5, 0.25); // Repeat ring
  } catch (err) {
    console.warn('Incoming admin order audio alert failed:', err);
  }
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<string>('hero');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWheelOpen, setIsWheelOpen] = useState<boolean>(false);
  const [chosenCouponCode, setChosenCouponCode] = useState<string>('');
  
  // User Profile & Rider database states
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [riders, setRiders] = useState<any[]>([]);
  
  // Admin states
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hummer_admin_open') === 'true' : false;
  });
  const [isPasscodePromptOpen, setIsPasscodePromptOpen] = useState<boolean>(false);
  const [enteredPasscode, setEnteredPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('hummer_admin_open', isAdminOpen ? 'true' : 'false');
  }, [isAdminOpen]);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('hummer_site_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SITE_SETTINGS;
  });

  // Dynamically synchronize the browser tab favicon to match the chosen custom siteSettings logo
  useEffect(() => {
    let logoUrl = '/logo.png';
    const currentLogo = siteSettings?.logoUrl;
    if (currentLogo && currentLogo.trim() !== '' && currentLogo !== 'local-db:logoUrl' && !currentLogo.startsWith('local-db:')) {
      logoUrl = currentLogo.trim();
    }
    
    // Update all link[rel*='icon'] tags to make logo appear next to site name on browser tab
    const faviconElements = document.querySelectorAll("link[rel*='icon']");
    faviconElements.forEach((el) => {
      el.setAttribute('href', logoUrl);
    });
    
    // Update Apple touch icon as well
    const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (appleIcon) {
      appleIcon.setAttribute('href', logoUrl);
    }
  }, [siteSettings?.logoUrl]);

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('hummer_branches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return HUMMER_BRANCHES;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('hummer_menu_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return MENU_ITEMS;
  });

  const [orders, setOrders] = useState<OrderState[]>(() => {
    const saved = localStorage.getItem('hummer_orders_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Menu filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Simulated tracker order
  const [activeOrder, setActiveOrder] = useState<OrderState | null>(null);
  const [justPlacedOrder, setJustPlacedOrder] = useState<OrderState | null>(null);

  // Real-time Order Alert sound trackers
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialOrdersLoadRef = useRef<boolean>(true);
  const lastActiveOrderStatusRef = useRef<string | undefined>(undefined);

  // Dynamic authorized admin emails list
  const [authorizedAdmins, setAuthorizedAdmins] = useState<string[]>([]);

  const isRealAdmin = !!(
    currentUser?.email === 'motaem23y@gmail.com' ||
    (currentUser?.email && authorizedAdmins.includes(currentUser.email.toLowerCase().trim()))
  );

  // Listen to authorized admins in Firestore
  useEffect(() => {
    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const emailList = snapshot.docs.map(doc => doc.id.toLowerCase().trim());
        setAuthorizedAdmins(emailList);
      },
      (err) => {
        // Silently catch expected permission errors for guest clients to avoid noise
      }
    );
    return unsubAdmins;
  }, []);

  // Set up real-time Firebase Auth listener with offline fallback
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (usr) => {
      if (usr) {
        setCurrentUser(usr);
      } else {
        const savedVirtual = localStorage.getItem('hummer_virtual_user');
        if (savedVirtual) {
          try {
            setCurrentUser(JSON.parse(savedVirtual));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });
    return unsubAuth;
  }, []);

  // Set up context-aware real-time Firestore database listeners
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const isAdmin = isAdminOpen || isRealAdmin;

    if (isAdmin) {
      // 1. Admin reads all riders with secure error handling
      const unsubRiders = onSnapshot(
        collection(db, 'riders'),
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRiders(list);
        },
        (err) => {
          console.error("Error syncing riders collection for admin:", err);
        }
      );
      unsubscribers.push(unsubRiders);

      // 2. Admin reads all orders with secure error handling
      const unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          let hasNewIncoming = false;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const id = change.doc.id;
              if (!knownOrderIdsRef.current.has(id)) {
                knownOrderIdsRef.current.add(id);
                if (!isInitialOrdersLoadRef.current) {
                  hasNewIncoming = true;
                }
              }
            }
          });

          isInitialOrdersLoadRef.current = false;

          if (hasNewIncoming) {
            playIncomingOrderBell();
          }

          setOrders(list);

          // Update active order if visible
          if (activeOrder) {
            const matching = list.find(o => o.id === activeOrder.id);
            if (matching) {
              setActiveOrder(matching);
            }
          }
        },
        (err) => {
          console.error("Error syncing orders collection for admin:", err);
        }
      );
      unsubscribers.push(unsubOrders);

    } else {
      // Non-admin flow: Only listen to the user's own orders if they are logged in
      if (currentUser) {
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const unsubUserOrders = onSnapshot(
          q,
          (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(list);

            if (activeOrder) {
              const matching = list.find(o => o.id === activeOrder.id);
              if (matching) {
                setActiveOrder(matching);
              }
            }
          },
          (err) => {
            console.error("Error syncing user's orders:", err);
          }
        );
        unsubscribers.push(unsubUserOrders);
      }

      // Guest or logged-in active tracked order single document listener
      if (activeOrder && activeOrder.id) {
        const unsubActive = onSnapshot(
          doc(db, 'orders', activeOrder.id),
          (snapshot) => {
            if (snapshot.exists()) {
              setActiveOrder({ id: snapshot.id, ...snapshot.data() } as any);
            }
          },
          (err) => {
            console.error("Error syncing tracking details for active order:", err);
          }
        );
        unsubscribers.push(unsubActive);
      }
    }

    // 3. Real-time global site settings listener (visible to everyone)
    const unsubGlobalSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      async (snapshot) => {
        if (snapshot.exists()) {
          const remoteSettings = snapshot.data() as SiteSettings;
          let logoUrl = remoteSettings.logoUrl;
          let introVideoUrl = remoteSettings.introVideoUrl;

          if (logoUrl === 'local-db:logoUrl') {
            const storedLogo = await getLargeAsset('logoUrl');
            if (storedLogo) {
              logoUrl = storedLogo;
            }
          }

          if (introVideoUrl === 'local-db:introVideoUrl') {
            const storedVideo = await getLargeAsset('introVideoUrl');
            if (storedVideo) {
              introVideoUrl = storedVideo;
            }
          }

          setSiteSettings(prev => ({
            ...prev,
            ...remoteSettings,
            logoUrl: logoUrl || prev.logoUrl,
            introVideoUrl: introVideoUrl || prev.introVideoUrl
          }));
        }
      },
      (err) => {
        console.error("Error syncing global settings:", err);
      }
    );
    unsubscribers.push(unsubGlobalSettings);

    // 4. Real-time global menu items listener (visible to everyone)
    const unsubGlobalMenu = onSnapshot(
      doc(db, 'menu', 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.items)) {
            setMenuItems(data.items);
          }
        }
      },
      (err) => {
        console.error("Error syncing global menu items:", err);
      }
    );
    unsubscribers.push(unsubGlobalMenu);

    // 5. Real-time global branches listener (visible to everyone)
    const unsubGlobalBranches = onSnapshot(
      doc(db, 'branches', 'global'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.items)) {
            setBranches(data.items);
          }
        }
      },
      (err) => {
        console.error("Error syncing global branches:", err);
      }
    );
    unsubscribers.push(unsubGlobalBranches);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser, activeOrder?.id, isAdminOpen, isRealAdmin]);

  // Sync state modifications live across tabs/views using standard BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('hummer_orders_sync');
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_ORDERS') {
        const payloadOrders = event.data.orders as OrderState[];
        setOrders(payloadOrders);
        // Also update active tracker for the current user if its status changed
        if (activeOrder) {
          const matching = payloadOrders.find(o => o.id === activeOrder.id);
          if (matching && matching.status !== activeOrder.status) {
            setActiveOrder(matching);
          }
        }
      } else if (event.data && event.data.type === 'UPDATE_MENU') {
        setMenuItems(event.data.menuItems);
      } else if (event.data && event.data.type === 'UPDATE_SETTINGS') {
        setSiteSettings(event.data.siteSettings);
      } else if (event.data && event.data.type === 'UPDATE_BRANCHES') {
        setBranches(event.data.branches);
      }
    };
    channel.addEventListener('message', handleMessage);

    // Sync localStorage event changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hummer_orders_list' && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
      if (e.key === 'hummer_menu_items' && e.newValue) {
        setMenuItems(JSON.parse(e.newValue));
      }
      if (e.key === 'hummer_site_settings' && e.newValue) {
        setSiteSettings(JSON.parse(e.newValue));
      }
      if (e.key === 'hummer_branches' && e.newValue) {
        setBranches(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeOrder]);

  // Push Notifications when tracking order's status transitions
  useEffect(() => {
    if (activeOrder && activeOrder.id) {
      const currentStatus = activeOrder.status;
      const lastStatus = lastActiveOrderStatusRef.current;
      
      if (lastStatus && lastStatus !== currentStatus) {
        if (typeof Notification !== 'undefined') {
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
          
          if (Notification.permission === 'granted') {
            const statusLabelsAr: Record<string, string> = {
              'received': 'تم استلامه بنجاح 🎟️',
              'cooking': 'يتم تحضيره وطهيه بالمطبخ الآن 👨‍🍳',
              'wrapping': 'يتم تغليفه وترتيبه بالبوكس المعقم 🎁',
              'delivering': 'خرج مع دليفري هامر السريع في الطريق إليك! 🏍️',
              'completed': 'تم توصيل الطلب بالهناء والشفاء! ❤️'
            };
            const statusLabelsEn: Record<string, string> = {
              'received': 'Received 🎟️',
              'cooking': 'Cooking in Kitchen 👨‍🍳',
              'wrapping': 'Packaging with Care 🎁',
              'delivering': 'Out for Delivery on the road! 🏍️',
              'completed': 'Delivered successfully! ❤️'
            };
            
            const label = lang === 'ar' ? (statusLabelsAr[currentStatus] || currentStatus) : (statusLabelsEn[currentStatus] || currentStatus);
            
            try {
              new Notification(lang === 'ar' ? 'تحديث حالة أوردر هامر 🍔' : 'Hummer Order Status Update 🍔', {
                body: `${lang === 'ar' ? 'أوردرك الآن أصبح:' : 'Your order is now:'} ${label}`,
                icon: (siteSettings.logoUrl && siteSettings.logoUrl !== 'local-db:logoUrl') ? siteSettings.logoUrl : undefined,
                tag: `hummer-order-idx-${activeOrder.id}`,
                requireInteraction: true
              });
            } catch (err) {
              console.warn('Native alert notification failed:', err);
            }
          }
        }
      }
      lastActiveOrderStatusRef.current = currentStatus;
    } else {
      lastActiveOrderStatusRef.current = undefined;
    }
  }, [activeOrder, lang, siteSettings.logoUrl]);

  // Load large media assets from IndexedDB asynchronously on startup to circumvent localstorage limits
  useEffect(() => {
    const resolveLargeAssetReferences = async () => {
      let changed = false;
      const updatedSettings = { ...siteSettings };

      if (siteSettings.logoUrl === 'local-db:logoUrl') {
        const storedLogo = await getLargeAsset('logoUrl');
        if (storedLogo) {
          updatedSettings.logoUrl = storedLogo;
          changed = true;
        }
      }

      if (siteSettings.introVideoUrl === 'local-db:introVideoUrl') {
        const storedVideo = await getLargeAsset('introVideoUrl');
        if (storedVideo) {
          updatedSettings.introVideoUrl = storedVideo;
          changed = true;
        }
      }

      if (changed) {
        setSiteSettings(updatedSettings);
      }
    };
    resolveLargeAssetReferences();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStep) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: nextStatus });
    } catch (err) {
      console.error('Error updating order status in Firestore:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Error deleting order from Firestore:', err);
    }
  };

  const handleClearAllOrders = async () => {
    try {
      for (const order of orders) {
        await deleteDoc(doc(db, 'orders', order.id));
      }
    } catch (err) {
      console.error('Error clearing all orders:', err);
    }
  };

  // Rider logistics crew CRUD handlers for Firestore database
  const handleAddRider = async (name: string, phone: string) => {
    try {
      await addDoc(collection(db, 'riders'), {
        name,
        phone,
        status: 'here',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error adding rider to Firestore:', err);
    }
  };

  const handleDeleteRider = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'riders', id));
    } catch (err) {
      console.error('Error deleting rider from Firestore:', err);
    }
  };

  const handleAddAdmin = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return;
    try {
      await setDoc(doc(db, 'admins', cleanEmail), {
        email: cleanEmail,
        addedBy: currentUser?.email || 'motaem23y@gmail.com',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error adding direct admin:', err);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return;
    try {
      await deleteDoc(doc(db, 'admins', cleanEmail));
    } catch (err) {
      console.error('Error deleting direct admin:', err);
    }
  };

  const handleUpdateRiderStatus = async (id: string, status: 'here' | 'out') => {
    try {
      await updateDoc(doc(db, 'riders', id), { status });
    } catch (err) {
      console.error('Error updating rider status in Firestore:', err);
    }
  };

  const handleAssignRiderToOrder = async (orderId: string, riderId: string) => {
    try {
      const selected = riders.find(r => r.id === riderId);
      if (selected) {
        await updateDoc(doc(db, 'orders', orderId), {
          riderId,
          riderName: selected.name,
          riderPhone: selected.phone,
          captainName: selected.name // fallback for system
        });
        // Set the rider status to out deliveries
        await updateDoc(doc(db, 'riders', riderId), { status: 'out' });
      }
    } catch (err) {
      console.error('Error assigning rider to order:', err);
    }
  };

  const handleUpdateMenuItems = async (newItems: MenuItem[]) => {
    setMenuItems(newItems);
    localStorage.setItem('hummer_menu_items', JSON.stringify(newItems));

    try {
      await setDoc(doc(db, 'menu', 'global'), cleanFirestoreData({ items: newItems }));
    } catch (err) {
      console.error("Failed saving menu items to Firestore:", err);
    }

    const channel = new BroadcastChannel('hummer_orders_sync');
    channel.postMessage({ type: 'UPDATE_MENU', menuItems: newItems });
    channel.close();
  };

  const handleUpdateSiteSettings = async (newSettings: SiteSettings) => {
    const settingsToSave = { ...newSettings };
    
    // intercept logo if base64
    if (newSettings.logoUrl && newSettings.logoUrl.startsWith('data:')) {
      await saveLargeAsset('logoUrl', newSettings.logoUrl);
      settingsToSave.logoUrl = 'local-db:logoUrl';
    } else if (newSettings.logoUrl === '') {
      await deleteLargeAsset('logoUrl');
    }

    // intercept video if base64
    if (newSettings.introVideoUrl && newSettings.introVideoUrl.startsWith('data:')) {
      await saveLargeAsset('introVideoUrl', newSettings.introVideoUrl);
      settingsToSave.introVideoUrl = 'local-db:introVideoUrl';
    } else if (newSettings.introVideoUrl === '') {
      await deleteLargeAsset('introVideoUrl');
    }

    setSiteSettings(newSettings);

    try {
      localStorage.setItem('hummer_site_settings', JSON.stringify(settingsToSave));
    } catch (err) {
      console.warn("localStorage write exceeded quota, storing clean reference instead:", err);
      // Clean large parts to force pass
      const fallbackSettings = { 
        ...settingsToSave, 
        logoUrl: newSettings.logoUrl?.startsWith('data:') ? 'local-db:logoUrl' : newSettings.logoUrl,
        introVideoUrl: newSettings.introVideoUrl?.startsWith('data:') ? 'local-db:introVideoUrl' : newSettings.introVideoUrl 
      };
      try {
        localStorage.setItem('hummer_site_settings', JSON.stringify(fallbackSettings));
      } catch (innerErr) {
        console.error("Local storage failed entirely:", innerErr);
      }
    }

    try {
      await setDoc(doc(db, 'settings', 'global'), cleanFirestoreData(settingsToSave));
    } catch (err) {
      console.error("Failed saving site settings to Firestore:", err);
    }

    const channel = new BroadcastChannel('hummer_orders_sync');
    channel.postMessage({ type: 'UPDATE_SETTINGS', siteSettings: newSettings });
    channel.close();
  };

  const handleUpdateBranches = async (newBranches: Branch[]) => {
    setBranches(newBranches);
    localStorage.setItem('hummer_branches', JSON.stringify(newBranches));

    try {
      await setDoc(doc(db, 'branches', 'global'), cleanFirestoreData({ items: newBranches }));
    } catch (err) {
      console.error("Failed saving branches to Firestore:", err);
    }

    const channel = new BroadcastChannel('hummer_orders_sync');
    channel.postMessage({ type: 'UPDATE_BRANCHES', branches: newBranches });
    channel.close();
  };

  // Sync RTL visual structure to index body
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const isRtl = lang === 'ar';

  // Load cart on start
  useEffect(() => {
    const savedCart = localStorage.getItem('hummer_active_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to load local cart", err);
      }
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('hummer_active_cart', JSON.stringify(items));
  };

  // 1. Add normal menu item
  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedSize?: SizeOption,
    isSpicy?: boolean,
    notes?: string
  ) => {
    const configId = `${item.id}-${selectedSize?.id || 'standard'}-${isSpicy ? 'spicy' : 'regular'}-${notes ? Math.abs(hashCode(notes)) : 'none'}`;

    const existingIndex = cartItems.findIndex((ci) => ci.id === configId);
    
    const sizeSurcharge = selectedSize ? selectedSize.extraPrice : 0;
    const pricePerUnit = item.price + sizeSurcharge;

    let updatedCart: CartItem[];

    if (existingIndex > -1) {
      updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [
        ...cartItems,
        {
          id: configId,
          menuItemId: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          basePrice: item.price,
          pricePerUnit,
          quantity,
          selectedSize: selectedSize?.nameEn,
          selectedSizeAr: selectedSize?.nameAr,
          isSpicy,
          notes: notes?.trim() || undefined
        }
      ];
    }

    saveCart(updatedCart);
  };

  // Helper hash function for distinct notes
  function hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  // 2. Add custom crepe crafted in Lab
  const handleAddCustomCrepe = (customDetails: {
    nameAr: string;
    nameEn: string;
    totalPrice: number;
    description: string;
    items: { nameAr: string; nameEn: string; price: number }[];
  }) => {
    const customId = `custom-crepe-${Date.now()}`;
    const newCartItem: CartItem = {
      id: customId,
      menuItemId: 'custom-crepe',
      nameAr: customDetails.nameAr,
      nameEn: customDetails.nameEn,
      basePrice: customDetails.totalPrice,
      pricePerUnit: customDetails.totalPrice,
      quantity: 1,
      notes: customDetails.description,
      customizations: customDetails.items
    };

    saveCart([...cartItems, newCartItem]);
  };

  // 3. Edit quantities from cart modal
  const handleUpdateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    const updated = cartItems.map((ci) => (ci.id === id ? { ...ci, quantity: newQty } : ci));
    saveCart(updated);
  };

  // 4. Remove single element
  const handleRemoveCartItem = (id: string) => {
    const filtered = cartItems.filter((ci) => ci.id !== id);
    saveCart(filtered);
  };

  // 5. Clear basket totally
  const handleClearCart = () => {
    saveCart([]);
  };

  // 6. Handle successful checkout order placing
  const handleCheckout = async (orderDetails: {
    customerName: string;
    phone: string;
    deliveryAddress: string;
    paymentMethod: 'cash' | 'card';
    items: CartItem[];
    scheduledDeliveryTime?: string;
  }) => {
    let discountVal = 0;
    const subtotal = orderDetails.items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);

    if (chosenCouponCode === 'HUMMER10') {
      discountVal = subtotal * 0.10;
    } else if (chosenCouponCode === 'MEGA20') {
      discountVal = subtotal * 0.20;
    }

    const deliveryFee = 25;
    const finalPrice = Math.max(0, subtotal - discountVal + deliveryFee);

    // List of Egyptian captain names
    const captainsList = ['أبو حميد الطيار', 'أبو كرم الجريء', 'عمر الدليفري', 'سيد الدراج المجهول'];
    const captainName = captainsList[Math.floor(Math.random() * captainsList.length)];

    const docId = `HMR-${Math.floor(Math.random() * 90000 + 10000)}`;
    const placedOrder: OrderState = {
      id: docId,
      customerName: orderDetails.customerName,
      phone: orderDetails.phone,
      deliveryAddress: orderDetails.deliveryAddress,
      paymentMethod: orderDetails.paymentMethod,
      items: orderDetails.items,
      discountAmount: discountVal,
      deliveryFee,
      totalPrice: Math.round(finalPrice),
      status: 'received',
      createdAt: new Date().toISOString(),
      estimatedMinutes: Math.floor(Math.random() * 10 + 35), // 35 - 45 mins
      captainName,
      userId: currentUser?.uid || 'guest',
      scheduledDeliveryTime: orderDetails.scheduledDeliveryTime || null
    };

    // Write directly to our relational-structured persistent Firestore database
    try {
      const orderPayloadToSave = cleanFirestoreData({
        ...placedOrder,
        riderId: '',
        riderName: '',
        riderPhone: ''
      });
      await setDoc(doc(db, 'orders', docId), orderPayloadToSave);
      
      // Only set success states and empty the basket if database write compiles successfully
      setJustPlacedOrder(placedOrder);
      playCheckoutSuccessSound();
      saveCart([]); // Empty active cart upon ordering!
      setChosenCouponCode(''); // Clear applied coupon
    } catch (err: any) {
      console.error('Error saving order to Firestore:', err);
      throw err;
    }
  };

  // Apply Coupon won from lucky wheel
  const handleApplyGiftCode = (code: string, giftName: string) => {
    setChosenCouponCode(code);
    setIsCartOpen(true); // Open cart immediately to show discount loading!
  };

  // Filter Menu List
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotalQty = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);

  if (isAdminOpen) {
    return (
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        lang={lang}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        menuItems={menuItems}
        onUpdateMenuItems={handleUpdateMenuItems}
        onClearAllOrders={handleClearAllOrders}
        siteSettings={siteSettings}
        onUpdateSiteSettings={handleUpdateSiteSettings}
        branches={branches}
        onUpdateBranches={handleUpdateBranches}
        riders={riders}
        onAddRider={handleAddRider}
        onDeleteRider={handleDeleteRider}
        onUpdateRiderStatus={handleUpdateRiderStatus}
        onAssignRiderToOrder={handleAssignRiderToOrder}
        currentUser={currentUser}
        authorizedAdmins={authorizedAdmins}
        onAddAdmin={handleAddAdmin}
        onDeleteAdmin={handleDeleteAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans bg-zinc-50 text-[#18181b]" id="root-viewport">
      {/* 0. Cinematic Welcome Intro Showcase */}
      <IntroVideoOverlay siteSettings={siteSettings} lang={lang} />

      {/* 1. Sticky Navigation Header */}
      <Header
        cartCount={cartTotalQty}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWheel={() => setIsWheelOpen(true)}
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        siteSettings={siteSettings}
        onOpenProfile={() => setIsProfileOpen(true)}
        isRealAdmin={isRealAdmin}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* 2. Hero Presentation Banner */}
      <HeroSection 
        onOpenWheel={() => setIsWheelOpen(true)} 
        lang={lang} 
        siteSettings={siteSettings}
      />

      {/* 3. MENU DISHES BOARD WORKSPACE */}
      <section id="menu" className="py-16 bg-zinc-50 relative z-10 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-650 text-xs font-black mb-4">
              <Utensils className="w-4 h-4 text-red-605 text-red-600 animate-pulse" />
              <span className="text-red-700 uppercase tracking-wide">{isRtl ? 'قائمة الطعام الحصرية - جرب قرمشتنا' : 'Our Delicious Crispy Masterpieces'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 font-sans tracking-tight">
              {isRtl ? 'منيو هامر لأقوى كريبات وفراخ كريسبي' : 'Hummer Grand Taste Menu'}
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-2 leading-relaxed">
              {isRtl
                ? 'استكشف الوجبات والكريبات والكومبو الأكثر طلباً بخلطة هامر السرية المقلية والمحشوة بالجبن الموزاريلا السايح، طعم يستحق التجربة!'
                : 'Browse our signature handwired categories filled with gooey cheeses, thick chicken breast crispy strips, and icy refreshments custom-cooked just for you!'}
            </p>
          </div>

          {/* Search Box & Category Filters Row */}
          <div className="mb-10 space-y-5">
            {/* Search Frame */}
            <div className="relative max-w-lg mx-auto">
              <Search className="w-5 h-5 text-zinc-400 absolute top-3.5 right-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث عن كريب مفضل أو وجبة الفراخ المقرمشة...' : 'Search delicious crepes, strips meals, family buckets...'}
                className="w-full pr-11 pl-4 py-3 bg-white border border-zinc-200 hover:border-zinc-950 text-zinc-950 rounded-2xl text-xs sm:text-sm font-bold outline-none focus:border-red-600 font-sans tracking-wide shadow-xs transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-4 top-4 text-xs font-black text-red-600 hover:text-red-700"
                >
                  {isRtl ? 'مسح' : 'Clear'}
                </button>
              )}
            </div>

            {/* Scrolling Category Pill-Filters Grid */}
            <div className="flex overflow-x-auto pb-2 scrollbar-none sm:flex-wrap items-center sm:justify-center gap-2 max-w-4xl mx-auto py-1 px-4 justify-start">
              {[
                { id: 'all', ar: 'الكل دايماً الكسبان', en: 'Show All Meals' },
                { id: 'crepes', ar: 'الـ كريبات', en: 'Premium Crepes' },
                { id: 'fried-chicken', ar: 'الفراخ المقلية', en: 'Fried Chicken' },
                { id: 'combos', ar: 'العروض الموفرة', en: 'Combos & Saving Deals' },
                { id: 'sides', ar: 'المقبلات والنقنقة', en: 'Appetizers & Fries' },
                { id: 'drinks', ar: 'المشروبات المثلجة', en: 'Cold Drinks' }
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-2.5 px-4.5 rounded-xl text-xs font-black transition-all border duration-200 transform active:scale-95 cursor-pointer flex items-center ${
                      isActive
                        ? 'bg-red-600 border-red-700 text-white shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-[#18181b]'
                    }`}
                  >
                    <span>{isRtl ? cat.ar : cat.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Grid Results */}
          {filteredMenuItems.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-[2rem] border border-zinc-200 max-w-md mx-auto space-y-3 shadow-xs">
              <HelpCircle className="w-12 h-12 text-zinc-300 mx-auto animate-bounce" />
              <p className="text-zinc-900 font-black text-sm">
                {isRtl ? 'ملقناش وجبات مطابقة لبحثك!' : 'No dishes match criteria!'}
              </p>
              <p className="text-xs text-zinc-500 font-bold leading-relaxed">
                {isRtl ? 'جرب البحث بكلمة أخري مثل "سوبر هامر"، "كريسبي" أو "كريب".' : 'Try searching for other words like "Zinger", "Crepe" or "Loaded"'}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-black text-zinc-700 hover:text-black rounded-xl cursor-pointer"
              >
                {isRtl ? 'إعادة تعيين وبدء تصفح' : 'Reset filters'}
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredMenuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MenuCard
                      item={item}
                      onAddToCart={handleAddToCart}
                      lang={lang}
                      isAdmin={isRealAdmin}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </section>

      {/* 5. PHYSICAL BRANCHES DETAILS SECTION */}
      <BranchesSection 
        lang={lang} 
        branches={branches}
        siteSettings={siteSettings}
      />

      {/* 6. SOCIAL FEEDBACK CUSTOMER REVIEWS BOARD */}
      <ReviewsSection 
        lang={lang} 
      />

      {/* 7. APP SIDEBAR DRAWER AND PORTALS OVERLAYS */}
      <AnimatePresence>
        {isCartOpen && (
          <CartModal
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            lang={lang}
            couponCodeFromWheel={chosenCouponCode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWheelOpen && (
          <LuckyWheel
            onApplyGiftCode={handleApplyGiftCode}
            lang={lang}
            onClose={() => setIsWheelOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* active tracking radar overlay */}
      <AnimatePresence>
        {activeOrder && (
          <OrderTracker
            order={activeOrder}
            onCloseOrder={() => setActiveOrder(null)}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* 8. ELEGANT URBAN FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-12 text-[#f3f4f6] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* brand summary */}
          <div className="space-y-4 text-right">
            <h3 className="text-lg font-black text-white flex items-center gap-2 justify-end">
              <span>{isRtl ? 'مطعم هامر' : 'Hummer Restaurant'}</span>
              <span className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center font-display text-white text-base">H</span>
            </h3>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              {isRtl 
                ? (siteSettings?.footerDescAr || 'موقع مطاعم هامر الرسمي لكافة كريبات مصر الشهيرة، فراخ بروستد كريسبي على أصولها، تتبيلة سحرية لا غنى عنها!') 
                : (siteSettings?.footerDescEn || 'The official platform of Hummer restaurant. Firing standard crunchy meals, savory folded street crepes, and elite appetizers across Cairo and Giza.')}
            </p>
            <p className="text-[10px] text-zinc-550 text-zinc-500 font-extrabold select-none">
              <span 
                onClick={() => setIsPasscodePromptOpen(true)}
                className="cursor-pointer hover:text-red-500 hover:scale-125 inline-block transition-transform duration-200"
                title="⚙️"
              >
                ©
              </span>{' '}
              {new Date().getFullYear()} {isRtl ? 'هامر الدولية للوجبات السريعة. جميع الحقوق حتمية.' : 'Hummer International Fast-Foods. All Rights Reserved.'}
            </p>
          </div>

          {/* Opening times block */}
          <div className="space-y-2 text-right">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? 'أوقات تشغيل الأفران:' : 'WORKING TIMING:'}</h4>
            <div className="space-y-1.5 text-xs text-zinc-400 font-medium">
              <p className="flex items-center gap-1.5 justify-end">
                <span>{isRtl ? '١١:٠٠ ص - ٤:٠٠ فجراً (الأحد - السبت)' : '11:00 AM - 04:00 AM (Sun - Sat)'}</span>
                <Clock className="w-3.5 h-3.5 text-red-600" />
              </p>
              <p className="font-extrabold text-red-500">
                {isRtl ? (siteSettings?.deliveryTimeSubAr || 'التوصيل دايماً سغّال وقت الشتاء والحر!') : (siteSettings?.deliveryTimeSubEn || 'Delivery is robust in heat or cold!')}
              </p>
            </div>
          </div>

          {/* hotline copies */}
          <div className="space-y-2 text-right">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? 'الرقم الموحد الموصل:' : 'ONE DIAL HOTLINE:'}</h4>
            <div className="space-y-1.5 text-xs text-zinc-400 font-medium">
              <p className="flex items-center gap-1.5 justify-end text-sm font-black text-white">
                <span className="text-red-500 font-mono text-base">{siteSettings?.hotline || '19033'}</span>
                <PhoneCall className="w-3.5 h-3.5 text-red-500" />
              </p>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-bold">
                {isRtl 
                  ? 'طلبك يتم طباعته فورا وتوصيله في بوكسات هامر الدبل الحافظة للبخار.' 
                  : 'Orders dispatch instantly using double insulation thermal packaging.'}
              </p>
            </div>
          </div>

          {/* Social icons */}
          <div className="space-y-2 text-right">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{isRtl ? 'تابع قرمشتنا:' : 'STAY TUNED WITH CRUNCH:'}</h4>
            <p className="text-xs text-zinc-400 font-bold leading-relaxed">
              {isRtl ? 'انضم إلى مليون هامر من أكيلية الكريبات لمتابعة أقوى مسابقاتنا السنوية وعروض الـ 1+1 المجانية!' : 'Follow our official media channels to grab daily codes.'}
            </p>
            <div className="flex gap-2 justify-end pt-1">
              {['Facebook', 'Instagram', 'TikTok'].map((sc) => (
                <span key={sc} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-black text-zinc-400 hover:text-red-600 rounded-lg cursor-pointer transition">
                  {sc}
                </span>
              ))}
            </div>
          </div>

        </div>
      </footer>

      {/* Dynamic Passcode Prompt Dialog overlay */}
      <AnimatePresence>
        {isPasscodePromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-850 text-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full relative space-y-5 shadow-2xl text-right"
              dir="rtl"
            >
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 mb-2">
                  <Sparkles className="w-8 h-8 animate-pulse text-red-500" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-white font-sans">
                  {isRtl ? 'تسجيل دخول الإدارة هامر 🛠️' : 'Hummer Admin Unlock'}
                </h3>
                <p className="text-xs text-zinc-400 font-bold leading-relaxed">
                  {isRtl ? 'يرجى إدخال رمز الأمان السري للوصول إلى لوحة التحكم' : 'Please enter the authorization security key to proceed'}
                </p>
              </div>

              <div className="space-y-1.5 text-right font-sans">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? 'كلمة المرور:' : 'SECURITY PASSCODE:'}
                </label>
                <input
                  type="password"
                  value={enteredPasscode}
                  onChange={(e) => {
                    setEnteredPasscode(e.target.value);
                    setPasscodeError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (enteredPasscode === 'hammer22') {
                        setIsAdminOpen(true);
                        setIsPasscodePromptOpen(false);
                        setEnteredPasscode('');
                        setPasscodeError('');
                      } else {
                        setPasscodeError(isRtl ? 'الباسورد غير صحيح! جرب تاني 🚫' : 'Incorrect security credential. Try again!');
                      }
                    }
                  }}
                  placeholder={isRtl ? '••••••••' : '••••••••'}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl py-3 px-4 outline-none focus:border-red-600 text-center font-black tracking-widest text-lg font-mono placeholder-zinc-700 transition"
                />
                
                {passcodeError && (
                  <motion.p
                    initial={{ x: -10 }}
                    animate={{ x: [0, -10, 10, -10, 0] }}
                    className="text-red-500 text-xs font-black text-center mt-1"
                  >
                    {passcodeError}
                  </motion.p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    if (enteredPasscode === 'hammer22') {
                      setIsAdminOpen(true);
                      setIsPasscodePromptOpen(false);
                      setEnteredPasscode('');
                      setPasscodeError('');
                    } else {
                      setPasscodeError(isRtl ? 'الباسورد غير صحيح! جرب تاني 🚫' : 'Incorrect security credential. Try again!');
                    }
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl cursor-pointer transition active:scale-95 text-center"
                >
                  {isRtl ? 'تأكيد الدخول 🔑' : 'Unlock Admin 🔑'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasscodePromptOpen(false);
                    setEnteredPasscode('');
                    setPasscodeError('');
                  }}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              {/* Google Secure OAuth Direct Way */}
              <div className="border-t border-zinc-800 pt-4 mt-2 text-center">
                <p className="text-[10px] text-zinc-500 font-bold mb-2">
                  {isRtl ? 'أمان وسرعة ومزامنة حية كاملة:' : 'Ultra-secure live synchronization:'}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const result = await signInWithPopup(auth, googleProvider);
                      if (result.user.email === 'motaem23y@gmail.com') {
                        setIsAdminOpen(true);
                        setIsPasscodePromptOpen(false);
                        setEnteredPasscode('');
                        setPasscodeError('');
                      } else {
                        setPasscodeError(
                          isRtl 
                            ? 'هذا الحساب ليس المسؤول المعتمد (motaem23y@gmail.com)!' 
                            : 'This is not the authorized admin email (motaem23y@gmail.com)!'
                        );
                      }
                    } catch (err: any) {
                      console.error('Google Admin Login failed', err);
                      setPasscodeError(isRtl ? 'تفاصيل الاتصال بجوجل غير مكتملة، يرجى المحاولة.' : 'Google authentication aborted.');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white text-xs font-black rounded-xl cursor-pointer transition active:scale-95 border border-zinc-800"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>{isRtl ? 'تسجيل دخول همر بـ Google 🛡️' : 'Sign in as Hummer Admin via Google 🛡️'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. User Profile Overlay Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        lang={lang}
        userOrders={orders.filter(o => o.userId === currentUser?.uid)}
        isRealAdmin={isRealAdmin}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onTrackOrder={(order) => {
          setActiveOrder(order);
          setIsProfileOpen(false);
        }}
      />

      {/* 9. HIGH-FIDELITY ORDER SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {justPlacedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 font-sans text-right" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border-2 border-green-500/30 text-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full relative space-y-6 shadow-[0_0_50px_rgba(34,197,94,0.15)] overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-3 text-center relative z-10">
                <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/30 mb-2 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-green-400 font-sans">
                  {lang === 'ar' ? 'تم استلام طلبك بنجاح! 🥳🍔' : 'Order Received Successfully! 🥳🍔'}
                </h3>
                <p className="text-xs text-zinc-350 font-bold leading-relaxed max-w-sm mx-auto font-sans">
                  {lang === 'ar' 
                    ? 'تهانينا! تم إرسال طلبك مباشرة لمطبخ كالهامر السحابي. وجبتك الساخنة المقرمشة جاري تجهيزها الآن بكل شغف.' 
                    : 'Congratulations! Your order is fired up on the grill right now at Hummer Kitchen. Get ready for the ultimate crunch!'}
                </p>
              </div>

              {/* Order Essentials Box */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 text-xs font-semibold relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                  <span className="text-zinc-400">{lang === 'ar' ? 'رقم الطلب المعتمد:' : 'Order ID:'}</span>
                  <span className="font-mono font-black text-white px-2 py-0.5 bg-zinc-800 rounded">{justPlacedOrder.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span>
                  <span className="text-white font-bold">{justPlacedOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{lang === 'ar' ? 'رقم التلفون:' : 'Phone:'}</span>
                  <span className="text-white font-mono">{justPlacedOrder.phone}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-zinc-400 shrink-0">{lang === 'ar' ? 'عنوان التوصيل السريع:' : 'Delivery Address:'}</span>
                  <span className="text-white text-right text-[11px] leading-tight font-sans font-medium pl-4">{justPlacedOrder.deliveryAddress}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-850">
                  <span className="text-zinc-300 font-black">{lang === 'ar' ? 'المجموع الكلي الفعلي:' : 'Total Price:'}</span>
                  <span className="text-red-500 font-black text-sm">{justPlacedOrder.totalPrice} {lang === 'ar' ? 'جنيه مصري' : 'EGP'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveOrder(justPlacedOrder);
                    setJustPlacedOrder(null);
                  }}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-zinc-950 text-xs font-black rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{lang === 'ar' ? 'تتبع خطوات كريبك حيّاً على الخريطة 🏍️' : 'Track cooking & delivery live 🏍️'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJustPlacedOrder(null)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95"
                >
                  {lang === 'ar' ? 'إغلاق ومتابعة تصفح الموقع 🍕' : 'Close & continue browsing'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
