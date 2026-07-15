import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDoc, getDocs, setDoc, addDoc, updateDoc, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebaseAvailable } from './firebase';
import { translations, sampleLocations } from './translations';
import { JobPost, WorkerPost, BrokerPost, AppLanguage, isJobExpired } from './types';
import JobCard from './components/JobCard';
import WorkerCard from './components/WorkerCard';
import BrokerCard from './components/BrokerCard';
import JobPostForm from './components/JobPostForm';
import WorkerPostForm from './components/WorkerPostForm';
import BrokerPostForm from './components/BrokerPostForm';
import CompanyRecruitmentForm from './components/CompanyRecruitmentForm';
import BrokerPortal from './components/BrokerPortal';
import DetailModal from './components/DetailModal';
import OnboardingScreen from './components/OnboardingScreen';
import { FastInput } from './components/FastInput';
import PersonalProfileWebsite from './components/PersonalProfileWebsite';
import InstallPrompt from './components/InstallPrompt';
import AdminDashboard from './components/AdminDashboard';
import { regionsData, otherOption, getRegionName } from './data/regions';

// Generated 3D illustration assets for Quick Actions
import dailyWageImg from './assets/images/daily_wage_illustration_1782879759387.jpg';
import clothWorkImg from './assets/images/cloth_work_illustration_1782879772763.jpg';
import deliveryPartnerImg from './assets/images/delivery_partner_illustration_1782879786169.jpg';
import freelanceImg from './assets/images/freelance_illustration_1782879797429.jpg';
import appLogo from './assets/images/app_logo_1782990663986.jpg';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  User, 
  Plus, 
  Globe, 
  Sparkles, 
  TrendingUp, 
  Phone,
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  Home,
  Heart,
  MessageSquare,
  Coins,
  Hammer,
  Building2,
  Truck,
  Video,
  Users,
  ArrowRight,
  UserCheck,
  Star,
  UserPlus,
  Send,
  MessageCircle,
  ShieldCheck,
  Bookmark,
  Map,
  Navigation,
  Bell,
  Trash2,
  LogOut,
  X,
  Settings,
  ChevronRight,
  ClipboardList,
  Package,
  Pencil,
  LifeBuoy,
  HelpCircle,
  Headphones,
  Share2,
  Copy,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom interface for the mockup messaging system
interface Message {
  id: string;
  sender: 'user' | 'other';
  text: string;
  time: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  time: string;
  phone: string;
  unread: boolean;
  messages: Message[];
}

const worldLanguages = [
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const getLiveAppUrl = (): string => {
  if (typeof window === 'undefined') return 'https://ais-pre-55lcm7k3wjpians7p6ok5a-435585945077.asia-southeast1.run.app';
  const origin = window.location.origin;
  if (!origin || origin === 'null' || origin.includes('ai.studio') || (origin.includes('localhost') && origin !== 'http://localhost:3000')) {
    return 'https://ais-pre-55lcm7k3wjpians7p6ok5a-435585945077.asia-southeast1.run.app';
  }
  return origin;
};

function getTransliteratedName(name: string, currentLang: string): string {
  if (!name) return "";
  if (currentLang === 'bn') return name;

  // Dictionary of exact matches or common names/words
  const commonDict: { [key: string]: string } = {
    'ইউজার': 'User',
    'রাজেশ কুমার': 'Rajesh Kumar',
    'দালাল': 'Broker',
    'কর্মী': 'Worker',
    'মালিক': 'Owner',
    'কাজের লোক': 'Helper',
    'মোবাইল': 'Mobile',
    'ইমেইল': 'Email'
  };

  if (commonDict[name]) return commonDict[name];

  // Simple phonetic transliteration map for Bengali characters
  const charMap: { [key: string]: string } = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
    'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
    'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo',
    'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ৎ': 't'
  };

  let result = '';
  // Iterate through characters and convert
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (charMap[char]) {
      result += charMap[char];
    } else if (char === ' ') {
      result += ' ';
    } else if (/[a-zA-Z0-9]/.test(char)) {
      result += char;
    }
  }

  // Capitalize first letters of each word
  return result ? result.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : name;
}

export const CURRENT_VERSION = "1.0.0";

export default function App() {
  const helpChatEndRef = useRef<HTMLDivElement>(null);

  // App-wide remote control config state (for real-time auto updates and notifications)
  const [remoteConfig, setRemoteConfig] = useState<{
    appVersion: string;
    minRequiredVersion: string;
    forceUpdateUrl: string;
    forceUpdateMessageBn: string;
    forceUpdateMessageEn: string;
    globalAlertBn: string;
    globalAlertEn: string;
    systemStatus: 'active' | 'maintenance';
  }>(() => {
    try {
      const saved = localStorage.getItem('app_remote_config_cache');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      appVersion: '1.0.0',
      minRequiredVersion: '1.0.0',
      forceUpdateUrl: '',
      forceUpdateMessageBn: '',
      forceUpdateMessageEn: '',
      globalAlertBn: '',
      globalAlertEn: '',
      systemStatus: 'active'
    };
  });

  // Check if force update is required
  const isUpdateRequired = (): boolean => {
    try {
      const minVer = remoteConfig.minRequiredVersion || '1.0.0';
      const curVer = CURRENT_VERSION;
      if (minVer !== curVer) {
        const minParts = minVer.split('.').map(Number);
        const curParts = curVer.split('.').map(Number);
        for (let i = 0; i < Math.max(minParts.length, curParts.length); i++) {
          const m = minParts[i] || 0;
          const c = curParts[i] || 0;
          if (m > c) return true;
          if (m < c) return false;
        }
      }
    } catch (_) {}
    return false;
  };

  // Check if running inside installed app / standalone mode
  const [isStandaloneApp, setIsStandaloneApp] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneNav = (window.navigator as any).standalone === true;
      const isAndroidTWA = document.referrer.includes('android-app://');
      const hasStandaloneParam = new URLSearchParams(window.location.search).has('standalone');
      const savedStandalone = localStorage.getItem('is_standalone_installed') === 'true';
      
      if (isStandaloneMedia || isStandaloneNav || isAndroidTWA || hasStandaloneParam || savedStandalone) {
        localStorage.setItem('is_standalone_installed', 'true');
        return true;
      }
    }
    return false;
  });

  // URL Query Parameters Detection for Promo/Download Landing Page
  const [showPromoLanding, setShowPromoLanding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // ONLY show the promo page if explicitly requested via URL parameter
      if (params.has('promo') || params.has('download_landing')) {
        return true;
      }
      return false;
    }
    return false;
  });
  const [activePromoFaq, setActivePromoFaq] = useState<number | null>(null);
  const [promoTab, setPromoTab] = useState<'workers' | 'employers' | 'brokers'>('workers');

  // Direct profile website link check
  const [directProfile, setDirectProfile] = useState<{ type: 'worker' | 'job' | 'broker'; id: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const profileType = params.get('profileType');
      const id = params.get('id');
      if ((profileType === 'worker' || profileType === 'job' || profileType === 'broker') && id) {
        return { type: profileType, id };
      }
    }
    return null;
  });

  // Localization & Language Switch
  const [lang, setLang] = useState<AppLanguage>(() => {
    return (localStorage.getItem('app_google_lang') || 'bn') as AppLanguage;
  });
  const t = translations[lang] || translations['bn'] || translations['en'] || {};

  // Responsive Sticky Bottom Navigation Tab State
  // 'home' = Dashboard (Banners, Quick Actions grid, categorized panels)
  // 'jobs' = Full Jobs Feed with Search & Filters
  // 'workers' = Full Workers Directory with Search & Filters
  // 'saved' = Saved bookmarked items
  // 'messages' = Simulated live chat mockup from black mobile
  const [activeView, setActiveView] = useState<'home' | 'jobs' | 'workers' | 'saved' | 'messages' | 'google-search' | 'app-website'>('home');

  // Database Data States (Cloud-synchronized)
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [workers, setWorkers] = useState<WorkerPost[]>([]);
  const [brokers, setBrokers] = useState<BrokerPost[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [activeSystemTab, setActiveSystemTab] = useState<'jobs' | 'workers' | 'brokers'>('jobs');

  // Local storage backup states (to ensure offline or declined Firebase setup works gracefully)
  const [localJobs, setLocalJobs] = useState<JobPost[]>([]);
  const [localWorkers, setLocalWorkers] = useState<WorkerPost[]>([]);
  const [localBrokers, setLocalBrokers] = useState<BrokerPost[]>([]);

  // Onboarding Screen state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem('app_onboarding_completed');
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem('app_onboarding_country') || 'india';
  });
  const [selectedState, setSelectedState] = useState(() => {
    return localStorage.getItem('app_onboarding_state') || 'west_bengal';
  });
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    return localStorage.getItem('app_onboarding_district') || 'kolkata';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form Modal States
  const [showJobForm, setShowJobForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showBrokerForm, setShowBrokerForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBrokerPortal, setShowBrokerPortal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'settings' | 'history' | 'app_details'>('settings');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAdminControl, setShowAdminControl] = useState(false);
  const [isAdminWebsiteView, setIsAdminWebsiteView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('admin') || window.location.pathname === '/admin' || window.location.pathname === '/admin-portal';
    }
    return false;
  });
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  const formatAppliedDateTime = (timestamp: number) => {
    const dateObj = new Date(timestamp);
    if (lang === 'bn') {
      const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const day = dateObj.getDate();
      const month = monthsBn[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month}, ${year} - ${hours}:${minutes} ${ampm}`;
    } else {
      return dateObj.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const handleAdminDeletePost = async (collectionName: 'jobs' | 'workers' | 'brokers', id: string) => {
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই পোস্টটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this post?')) {
      return;
    }
    try {
      if (isFirebaseAvailable) {
        await deleteDoc(doc(db, collectionName, id));
        handleSuccess(lang === 'bn' ? '✓ সফলভাবে মুছে ফেলা হয়েছে!' : '✓ Successfully deleted!');
      } else {
        // Fallback for local storage
        if (collectionName === 'jobs') {
          setLocalJobs(prev => prev.filter(p => p.id !== id));
        } else if (collectionName === 'workers') {
          setLocalWorkers(prev => prev.filter(p => p.id !== id));
        } else if (collectionName === 'brokers') {
          setLocalBrokers(prev => prev.filter(p => p.id !== id));
        }
        handleSuccess(lang === 'bn' ? '✓ লোকাল ডাটা থেকে মুছে ফেলা হয়েছে!' : '✓ Deleted from local storage!');
      }
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }
  };

  useEffect(() => {
    if (isAdminWebsiteView) {
      // Auto-populate form settings state
      setAdminAppVersion(remoteConfig.appVersion || '1.0.0');
      setAdminMinRequiredVersion(remoteConfig.minRequiredVersion || '1.0.0');
      setAdminForceUpdateUrl(remoteConfig.forceUpdateUrl || '');
      setAdminForceUpdateMessageBn(remoteConfig.forceUpdateMessageBn || '');
      setAdminForceUpdateMessageEn(remoteConfig.forceUpdateMessageEn || '');
      setAdminGlobalAlertBn(remoteConfig.globalAlertBn || '');
      setAdminGlobalAlertEn(remoteConfig.globalAlertEn || '');
      setAdminSystemStatus(remoteConfig.systemStatus || 'active');

      fetchRawSmsLogs();
      fetchPaymentAttempts();
    }
  }, [isAdminWebsiteView, remoteConfig]);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminAppVersion, setAdminAppVersion] = useState('');
  const [adminMinRequiredVersion, setAdminMinRequiredVersion] = useState('');
  const [adminForceUpdateUrl, setAdminForceUpdateUrl] = useState('');
  const [adminForceUpdateMessageBn, setAdminForceUpdateMessageBn] = useState('');
  const [adminForceUpdateMessageEn, setAdminForceUpdateMessageEn] = useState('');
  const [adminGlobalAlertBn, setAdminGlobalAlertBn] = useState('');
  const [adminGlobalAlertEn, setAdminGlobalAlertEn] = useState('');
  const [adminSystemStatus, setAdminSystemStatus] = useState<'active' | 'maintenance'>('active');

  // Admin logs troubleshooting states
  const [logoClicks, setLogoClicks] = useState(0);
  const [adminActiveTab, setAdminActiveTab] = useState<'settings' | 'sms' | 'payments'>('settings');
  const [rawSmsLogs, setRawSmsLogs] = useState<any[]>([]);
  const [paymentAttempts, setPaymentAttempts] = useState<any[]>([]);
  const [adminPaymentAlert, setAdminPaymentAlert] = useState<string | null>(null);
  const previousPendingOrdersRef = useRef<Set<string>>(new Set());

  const playNotificationBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.error("Audio beep failed:", e);
    }
  };
  const [loadingSmsLogs, setLoadingSmsLogs] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const fetchRawSmsLogs = async () => {
    setLoadingSmsLogs(true);
    try {
      const res = await fetch('/api/admin/raw-sms-logs');
      const data = await res.json();
      if (data.success) {
        setRawSmsLogs(data.logs);
      } else {
        console.error("Failed to load SMS logs:", data.error);
      }
    } catch (err) {
      console.error("Error loading SMS logs:", err);
    } finally {
      setLoadingSmsLogs(false);
    }
  };

  const fetchPaymentAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const res = await fetch('/api/admin/payment-attempts');
      const data = await res.json();
      if (data.success) {
        setPaymentAttempts(data.attempts);

        // Check for new pending attempts
        let hasNewPending = false;
        const currentPending = new Set<string>();
        data.attempts.forEach((attempt: any) => {
          if (attempt.status === 'pending') {
            currentPending.add(attempt.orderId);
            if (!previousPendingOrdersRef.current.has(attempt.orderId)) {
              hasNewPending = true;
            }
          }
        });

        if (hasNewPending && previousPendingOrdersRef.current.size > 0) {
          playNotificationBeep();
          const lastNewPending = data.attempts.find((a: any) => a.status === 'pending' && !previousPendingOrdersRef.current.has(a.orderId));
          const nameStr = lastNewPending ? `${lastNewPending.brokerName} (${lastNewPending.brokerPhone})` : '';
          setAdminPaymentAlert(lang === 'bn' 
            ? `🔔 দালাল ${nameStr} পেমেন্ট করে ভেরিফাই করার জন্য অনুরোধ পাঠিয়েছেন!` 
            : `🔔 Broker ${nameStr} has submitted a payment verification request!`
          );
          setTimeout(() => {
            setAdminPaymentAlert(null);
          }, 8000);
        }
        previousPendingOrdersRef.current = currentPending;
      } else {
        console.error("Failed to load payment attempts:", data.error);
      }
    } catch (err) {
      console.error("Error loading payment attempts:", err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleApprovePayment = async (orderId: string, status: 'success' | 'rejected', reasonInput?: string) => {
    const reason = reasonInput?.trim() || (status === 'rejected' ? "Incorrect UTR / Payment not received" : "");
    const reasonBn = reasonInput?.trim() || (status === 'rejected' ? "ভুল UTR নম্বর / আমাদের ব্যাংক একাউন্টে পেমেন্ট পাওয়া যায়নি।" : "");

    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, reason, reasonBn })
      });
      const data = await res.json();
      if (data.success) {
        fetchPaymentAttempts();
      } else {
        console.error("Failed to update payment status:", data.error);
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };

  // Online / Offline System Connection state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA/APK AssetLinks States
  const [adminPackageName, setAdminPackageName] = useState('com.bharatkakaam.app');
  const [adminSha256Fingerprint, setAdminSha256Fingerprint] = useState('14:6D:E9:83:C5:EC:37:54:64:9B:21:03:52:A3:22:92:C5:6B:03:12:F1:C3:58:63:CE:22:38:F2:F2:C1:23:45');

  useEffect(() => {
    fetch('/.well-known/assetlinks.json')
      .then(res => res.json())
      .then(data => {
        if (data && data[0] && data[0].target) {
          if (data[0].target.package_name) {
            setAdminPackageName(data[0].target.package_name);
          }
          if (data[0].target.sha256_cert_fingerprints && data[0].target.sha256_cert_fingerprints[0]) {
            setAdminSha256Fingerprint(data[0].target.sha256_cert_fingerprints[0]);
          }
        }
      })
      .catch(err => console.log('Error loading assetlinks:', err));
  }, []);

  // Keep form inputs in sync with remoteConfig when modal opens
  useEffect(() => {
    if (showAdminControl) {
      setAdminAppVersion(remoteConfig.appVersion || '1.0.0');
      setAdminMinRequiredVersion(remoteConfig.minRequiredVersion || '1.0.0');
      setAdminForceUpdateUrl(remoteConfig.forceUpdateUrl || '');
      setAdminForceUpdateMessageBn(remoteConfig.forceUpdateMessageBn || '');
      setAdminForceUpdateMessageEn(remoteConfig.forceUpdateMessageEn || '');
      setAdminGlobalAlertBn(remoteConfig.globalAlertBn || '');
      setAdminGlobalAlertEn(remoteConfig.globalAlertEn || '');
      setAdminSystemStatus(remoteConfig.systemStatus || 'active');
      
      // Fetch troubleshooting logs for real-time overview
      fetchRawSmsLogs();
      fetchPaymentAttempts();
    }
  }, [showAdminControl, remoteConfig]);

  const [storyBoxTab, setStoryBoxTab] = useState<'jobs' | 'workers'>('jobs');

  // User Profile ID State
  const [userProfile, setUserProfile] = useState<{ name: string; phone: string } | null>(() => {
    const name = localStorage.getItem('app_user_name');
    const phone = localStorage.getItem('app_user_phone');
    if (name && phone) return { name, phone };
    return null;
  });

  // Device Lock & Secondary Login Verification System States
  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem('app_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      localStorage.setItem('app_device_id', id);
    }
    return id;
  });
  const [deviceLockStatus, setDeviceLockStatus] = useState<'checking' | 'authorized' | 'pending' | 'rejected'>('checking');
  const [deviceLoginRequests, setDeviceLoginRequests] = useState<any[]>([]);

  // Effect 1: Verify current device is authorized for this phone profile
  useEffect(() => {
    if (!isFirebaseAvailable || !userProfile?.phone) {
      setDeviceLockStatus('authorized');
      return;
    }

    let unsubscribeRequestDoc: (() => void) | null = null;

    const checkLockAndRegister = async () => {
      setDeviceLockStatus('checking');
      const profileRef = doc(db, 'user_profiles', userProfile.phone);
      
      try {
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const profileData = snap.data();
          const authDevId = profileData.authorizedDeviceId;

          if (!authDevId) {
            // No device registered yet. Bind this device as the primary/authorized device.
            await setDoc(profileRef, { authorizedDeviceId: deviceId }, { merge: true });
            setDeviceLockStatus('authorized');
          } else if (authDevId === deviceId) {
            // Authorized device matches this browser/device!
            setDeviceLockStatus('authorized');
          } else {
            // Device mismatch! This device is trying to login but is locked out.
            setDeviceLockStatus('pending');

            // Send a login request to Firestore
            const reqRef = doc(db, 'login_requests', userProfile.phone);
            await setDoc(reqRef, {
              phone: userProfile.phone,
              requestingDeviceId: deviceId,
              requestingDeviceName: navigator.userAgent.substring(0, 100),
              status: 'pending',
              timestamp: Date.now()
            });

            // Listen in real-time to the request status for approval
            unsubscribeRequestDoc = onSnapshot(reqRef, (docSnap) => {
              if (docSnap.exists()) {
                const reqData = docSnap.data();
                if (reqData.status === 'approved') {
                  // Approved! Bind this new device as the authorized device.
                  setDoc(profileRef, { authorizedDeviceId: deviceId }, { merge: true }).then(() => {
                    setDeviceLockStatus('authorized');
                    handleSuccess(lang === 'bn' ? '✓ লগইন অনুমোদন সম্পন্ন হয়েছে!' : '✓ Login authorized successfully!');
                  });
                } else if (reqData.status === 'denied') {
                  setDeviceLockStatus('rejected');
                }
              }
            });
          }
        } else {
          // Profile document doesn't exist, register this device as primary
          await setDoc(profileRef, {
            phone: userProfile.phone,
            name: userProfile.name,
            role: localStorage.getItem('app_user_role') || 'job_seeker',
            authorizedDeviceId: deviceId,
            createdAt: new Date().toISOString()
          }, { merge: true });
          setDeviceLockStatus('authorized');
        }
      } catch (err) {
        console.error("Device lock check failed, defaulting to authorized to keep app online:", err);
        setDeviceLockStatus('authorized');
      }
    };

    checkLockAndRegister();

    return () => {
      if (unsubscribeRequestDoc) unsubscribeRequestDoc();
    };
  }, [userProfile?.phone]);

  // Effect 2: Listen for secondary device login requests directed to this user's phone
  useEffect(() => {
    if (!isFirebaseAvailable || !userProfile?.phone || deviceLockStatus !== 'authorized') {
      setDeviceLoginRequests([]);
      return;
    }

    const q = query(
      collection(db, 'login_requests'),
      where('phone', '==', userProfile.phone),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: any[] = [];
      snapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      setDeviceLoginRequests(reqs);
      if (reqs.length > 0) {
        playNotificationBeep();
      }
    });

    return () => unsubscribe();
  }, [userProfile?.phone, deviceLockStatus]);

  // Sync profile when localStorage changes or event fires
  useEffect(() => {
    const handleProfileSync = () => {
      const name = localStorage.getItem('app_user_name');
      const phone = localStorage.getItem('app_user_phone');
      if (name && phone) {
        setUserProfile({ name, phone });
      } else {
        setUserProfile(null);
      }
    };
    window.addEventListener('app_user_profile_updated', handleProfileSync);
    return () => window.removeEventListener('app_user_profile_updated', handleProfileSync);
  }, []);

  // PWA Installation states and listeners
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [apkTab, setApkTab] = useState<'direct' | 'pwa' | 'builder'>('direct');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
      handleSuccess(lang === 'bn' ? '✓ অ্যাপটি সফলভাবে ইনস্টল করা হয়েছে!' : '✓ App installed successfully!');
    });

    // Check if on iOS and not standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isIOS && !isStandalone) {
      setShowInstallBtn(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [lang]);

  const handleInstallApp = async () => {
    setShowApkModal(true);
  };

  const handleTriggerPWAInstall = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        setShowIOSInstallGuide(true);
      } else {
        handleSuccess(lang === 'bn' ? 'আপনার ব্রাউজারের মেনু থেকে "Install App" বা "Add to Home Screen" সিলেক্ট করুন।' : 'Please click on your browser menu (3 dots) and select "Install App" or "Add to Home Screen".');
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  // Custom AppNotification interface
  interface AppNotification {
    id: string;
    title: string;
    text: string;
    time: string;
    read: boolean;
    jobPost?: JobPost;
    companyPhone?: string;
    workerWage?: number;
    brokerCharge?: number;
    targetBrokerName?: string;
    uploadedPhotos?: string[];
  }

  // Live in-app notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const defaultNotifs = [
      {
        id: 'notif-1',
        title: '💼 নতুন কর্মী নিয়োগ চাহিদা!',
        text: 'স্টাইলক্রাফট গার্মেন্টস লিমিটেড নতুন কাজের লোক খুঁজছে! "সিনিয়র দর্জি ও গার্মেন্টস হেল্পার" পদে লোক লাগবে।',
        time: '২ ঘণ্টা আগে',
        read: false
      },
      {
        id: 'notif-2',
        title: '🛵 ডেলিভারি পার্টনার লোক প্রয়োজন',
        text: 'ফুডপান্ডা বাংলাদেশ-এর তরফ থেকে নতুন ডেলিভারি রাইডার নেওয়া হচ্ছে। কাজের এলাকা: রাজশাহী।',
        time: '৫ ঘণ্টা আগে',
        read: true
      }
    ];
    try {
      const stored = localStorage.getItem('local_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = [...parsed, ...defaultNotifs];
        const seen = new Set();
        return merged.filter(item => {
          const id = (item as any).id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      }
    } catch (e) {
      console.error("Failed to load initial notifications from localStorage", e);
    }
    return defaultNotifs;
  });

  // Check if current user is registered as a broker
  const isUserRegisteredBroker = useMemo(() => {
    if (!userProfile?.phone) return false;
    const combined = [...brokers, ...localBrokers];
    return combined.some(b => b.phone === userProfile.phone);
  }, [userProfile, brokers, localBrokers]);

  // Filter notifications based on whether they are private sourcing requests
  const visibleNotifications = useMemo(() => {
    const userPhoneClean = userProfile?.phone ? userProfile.phone.replace(/[^0-9]/g, '') : '';
    const matchedBroker = [...brokers, ...localBrokers].find(b => {
      const bPhoneClean = b.phone ? b.phone.replace(/[^0-9]/g, '') : '';
      return bPhoneClean && (bPhoneClean.endsWith(userPhoneClean) || userPhoneClean.endsWith(bPhoneClean));
    });

    return notifications.filter((n) => {
      const isRecruitment = !!n.companyPhone || !!n.targetBrokerId;
      if (isRecruitment) {
        if (!matchedBroker) return false;
        const matchesId = n.targetBrokerId && n.targetBrokerId === matchedBroker.id;
        const matchesName = n.targetBrokerName && matchedBroker.name && n.targetBrokerName.toLowerCase() === matchedBroker.name.toLowerCase();
        const matchesPhone = n.companyPhone && matchedBroker.phone && n.companyPhone === matchedBroker.phone;
        return !!(matchesId || matchesName || matchesPhone);
      }
      return true;
    });
  }, [notifications, userProfile, brokers, localBrokers]);

  // Detail Modal States
  const [selectedPost, setSelectedPost] = useState<JobPost | WorkerPost | BrokerPost | null>(null);
  const [detailType, setDetailType] = useState<'job' | 'worker' | 'broker'>('job');

  // Success Notification toast state
  const [successToast, setSuccessToast] = useState('');
  
  // Profile editing states (for Rajesh Kumar mockup update)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [editProfileRole, setEditProfileRole] = useState('job_seeker');
  const [editProfileSkills, setEditProfileSkills] = useState('Wiring, Repair, Maintenance');

  // Currency States
  const [currencySymbol, setCurrencySymbol] = useState(() => {
    return localStorage.getItem('app_currency_symbol') || (localStorage.getItem('app_onboarding_country') === 'india' ? '₹' : '৳');
  });
  const [currencyName, setCurrencyName] = useState(() => {
    return localStorage.getItem('app_currency_name') || (localStorage.getItem('app_onboarding_country') === 'india' ? 'INR' : 'BDT');
  });
  const [editProfileCurrencySymbol, setEditProfileCurrencySymbol] = useState('৳');
  const [editProfileCurrencyName, setEditProfileCurrencyName] = useState('BDT');

  // Custom persistent photo and credentials states
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    return localStorage.getItem('app_user_photo_url') || '';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('app_user_email') || '';
  });
  const [userPassword, setUserPassword] = useState<string>(() => {
    return localStorage.getItem('app_user_password') || '';
  });

  // Login Modal & Password Recovery states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginFormPassword, setLoginFormPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // AI Help Center states
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [helpMessages, setHelpMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {
      role: 'assistant',
      content: 'হ্যালো! আমি "ভারত কা কাম" হেল্প সেন্টারের এআই সহকারী। অ্যাপ ব্যবহার বা কোনো সমস্যায় পড়লে আমাকে জিজ্ঞেস করুন, আমি সাহায্য করব।'
    }
  ]);
  const [helpInput, setHelpInput] = useState('');
  const [isHelpGenerating, setIsHelpGenerating] = useState(false);

  // Scroll Help Center chat to bottom on new messages
  useEffect(() => {
    if (helpChatEndRef.current) {
      setTimeout(() => {
        helpChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [helpMessages, showHelpCenter]);

  // Sync profile editing states when showProfileSettings is opened
  useEffect(() => {
    if (showProfileSettings && userProfile) {
      setEditProfileName(userProfile.name);
      setEditProfilePhone(userProfile.phone);
      setEditProfileRole(localStorage.getItem('app_user_role') || 'job_seeker');
      setEditProfileSkills(localStorage.getItem('app_user_skills') || '');
      setEditProfileCurrencySymbol(localStorage.getItem('app_currency_symbol') || '৳');
      setEditProfileCurrencyName(localStorage.getItem('app_currency_name') || 'BDT');
    }
  }, [showProfileSettings, userProfile]);

  // Interactive OTP Recovery States
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp'>('phone');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryOtpInput, setRecoveryOtpInput] = useState('');
  const [recoveryGeneratedOtp, setRecoveryGeneratedOtp] = useState('');
  const [recoveryUserData, setRecoveryUserData] = useState<any>(null);
  const [recoveryIsVerifying, setRecoveryIsVerifying] = useState(false);

  // Editable credentials states in Settings row
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [credentialsEmail, setCredentialsEmail] = useState('');
  const [credentialsPassword, setCredentialsPassword] = useState('');

  const [sourcingBroker, setSourcingBroker] = useState<BrokerPost | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  // Native translation state handler
  const [selectedGlobalLang, setSelectedGlobalLang] = useState<string>(() => {
    return localStorage.getItem('app_google_lang') || 'bn';
  });

  const handleGlobalLanguageChange = (langCode: string) => {
    setSelectedGlobalLang(langCode);
    localStorage.setItem('app_google_lang', langCode);
    setLang(langCode);

    setHelpMessages(prev => {
      if (prev.length === 1) {
        return [
          {
            role: 'assistant',
            content: langCode === 'bn' 
              ? 'হ্যালো! আমি "ভারত কা কাম" হেল্প সেন্টারের এআই সহকারী। অ্যাপ ব্যবহার বা কোনো সমস্যায় পড়লে আমাকে জিজ্ঞেস করুন, আমি সাহায্য করব।'
              : langCode === 'hi'
                ? 'नमस्ते! मैं "भारत का काम" हेल्प सेंटर का एआई सहायक हूँ। ऐप के इस्तेमाल या किसी समस्या के बारे में मुझसे पूछें, मैं आपकी मदद करूँगा।'
                : 'Hello! I am the AI Assistant for "Bharat Ka Kaam" Help Center. Ask me any questions or tell me if you are facing any issues, and I will help you solve them!'
          }
        ];
      }
      return prev;
    });

    handleSuccess(
      langCode === 'bn'
        ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে!'
        : langCode === 'hi'
          ? 'ভাষা बदलकर हिंदी कर दी गई है!'
          : `Language changed to ${worldLanguages.find(l => l.code === langCode)?.name || langCode}!`
    );
  };

  const handleSendHelpMessage = async (customText?: string) => {
    const textToSend = customText || helpInput;
    if (!textToSend.trim() || isHelpGenerating) return;
    const userMsg = textToSend.trim();
    if (!customText) {
      setHelpInput('');
    }
    
    const updatedMessages = [...helpMessages, { role: 'user' as const, content: userMsg }];
    setHelpMessages(updatedMessages);
    setIsHelpGenerating(true);

    try {
      const response = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await response.json();
      if (data.text) {
        setHelpMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error(data.error || "No response text");
      }
    } catch (err) {
      console.error(err);
      setHelpMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: lang === 'bn'
            ? 'দুঃখিত, সংযোগ স্থাপন করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Sorry, having trouble connecting to the helper. Please try again.'
        }
      ]);
    } finally {
      setIsHelpGenerating(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'bn' ? '⚠️ ছবি ২ মেগাবাইটের কম সাইজের হতে হবে।' : '⚠️ Photo must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          localStorage.setItem('app_user_photo_url', result);
          setProfilePhoto(result);
          handleSuccess(lang === 'bn' ? '✓ ছবি সফলভাবে আপলোড করা হয়েছে!' : '✓ Photo uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrPhone.trim()) {
      alert(lang === 'bn' ? '⚠️ অনুগ্রহ করে আপনার মোবাইল নম্বরটি লিখুন।' : '⚠️ Please enter your mobile number.');
      return;
    }

    const savedEmail = localStorage.getItem('app_user_email') || '';
    const savedPassword = localStorage.getItem('app_user_password') || '';
    const savedPhone = localStorage.getItem('app_user_phone') || '';
    const savedName = localStorage.getItem('app_user_name') || 'Rajesh Kumar';
    const savedRole = localStorage.getItem('app_user_role') || 'job_seeker';

    const inputClean = loginEmailOrPhone.trim().toLowerCase();
    const cleanSavedEmail = savedEmail.trim().toLowerCase();

    const emailMatch = savedEmail && inputClean === cleanSavedEmail;
    const phoneMatch = savedPhone && loginEmailOrPhone.replace(/\D/g, '') === savedPhone.replace(/\D/g, '');

    if ((emailMatch || phoneMatch) && loginFormPassword === savedPassword) {
      localStorage.setItem('app_user_logged_in', 'true');
      setUserProfile({ name: savedName, phone: savedPhone || '9876543210' });
      setShowLoginModal(false);
      handleSuccess(lang === 'bn' ? '✓ সফলভাবে লগইন সম্পন্ন হয়েছে!' : '✓ Logged in successfully!');
      window.dispatchEvent(new Event('app_user_profile_updated'));
    } else {
      const mockPhone = loginEmailOrPhone.includes('@') ? '9876543210' : loginEmailOrPhone.replace(/\s+/g, '');
      const mockName = loginEmailOrPhone.includes('@') ? loginEmailOrPhone.split('@')[0] : 'ইউজার';
      
      localStorage.setItem('app_user_name', mockName);
      localStorage.setItem('app_user_phone', mockPhone);
      localStorage.setItem('app_user_logged_in', 'true');
      localStorage.setItem('app_user_role', 'job_seeker');
      if (loginEmailOrPhone.includes('@')) {
        localStorage.setItem('app_user_email', loginEmailOrPhone);
      }
      if (loginFormPassword) {
        localStorage.setItem('app_user_password', loginFormPassword);
      }

      setUserProfile({ name: mockName, phone: mockPhone });
      setShowLoginModal(false);
      handleSuccess(lang === 'bn' ? '✓ নতুন প্রোফাইল তৈরি ও লগইন সফল হয়েছে!' : '✓ New profile created and logged in successfully!');
      window.dispatchEvent(new Event('app_user_profile_updated'));
    }
  };

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim() || !editProfilePhone.trim()) {
      alert(lang === 'bn' ? '⚠️ অনুগ্রহ করে নাম এবং মোবাইল নম্বর উভয়ই লিখুন।' : '⚠️ Please fill in both name and mobile number.');
      return;
    }

    const cleanPhone = editProfilePhone.replace(/\s+/g, '');
    
    // Save to local storage
    localStorage.setItem('app_user_name', editProfileName.trim());
    localStorage.setItem('app_user_phone', cleanPhone);
    localStorage.setItem('app_user_role', editProfileRole);
    localStorage.setItem('app_user_skills', editProfileSkills);
    localStorage.setItem('app_currency_symbol', editProfileCurrencySymbol);
    localStorage.setItem('app_currency_name', editProfileCurrencyName);
    localStorage.setItem('app_google_lang', lang);
    localStorage.setItem('app_onboarding_country', selectedCountry);
    localStorage.setItem('app_onboarding_state', selectedState);
    localStorage.setItem('app_onboarding_district', selectedDistrict);
    
    // Sync states
    setUserProfile({ name: editProfileName.trim(), phone: cleanPhone });
    setCurrencySymbol(editProfileCurrencySymbol);
    setCurrencyName(editProfileCurrencyName);
    
    // Write profile to Firestore
    if (isFirebaseAvailable) {
      try {
        await setDoc(doc(db, 'user_profiles', cleanPhone), {
          name: editProfileName.trim(),
          phone: cleanPhone,
          role: editProfileRole,
          country: selectedCountry,
          state: selectedState,
          district: selectedDistrict,
          lang: lang,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("Profile updated in Firestore");
      } catch (err) {
        console.error("Profile update failed in Firestore:", err);
      }
    }

    window.dispatchEvent(new Event('app_user_profile_updated'));

    logUserActivity(
      'profile_update',
      'প্রোফাইল সেটিংস পরিবর্তন করা হয়েছে।',
      'Profile settings were updated.',
      { name: editProfileName.trim(), role: editProfileRole }
    );

    setShowProfileSettings(false);
    handleSuccess(lang === 'bn' ? '✓ প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : '✓ Profile updated successfully!');
  };

  const handleProfileLogout = () => {
    localStorage.removeItem('app_user_logged_in');
    localStorage.removeItem('app_user_name');
    localStorage.removeItem('app_user_phone');
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('app_user_photo_url');
    localStorage.removeItem('app_user_email');
    localStorage.removeItem('app_user_password');
    
    setUserProfile(null);
    setProfilePhoto('');
    setShowProfileSettings(false);
    window.dispatchEvent(new Event('app_user_profile_updated'));
    handleSuccess(lang === 'bn' ? '✓ প্রোফাইল লগ-আউট সম্পন্ন হয়েছে!' : '✓ Profile logged out successfully!');
  };

  const handleForgotCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = forgotInput.replace(/\s+/g, '');
    if (!cleanPhone.trim()) {
      alert(lang === 'bn' ? '⚠️ অনুগ্রহ করে আপনার মোবাইল নম্বরটি লিখুন।' : '⚠️ Please enter your mobile number.');
      return;
    }

    setRecoveryIsVerifying(true);
    setForgotMessage('');

    try {
      let foundData = null;

      if (isFirebaseAvailable) {
        // 1. Try exact match first
        const docRef = doc(db, 'user_profiles', cleanPhone);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundData = docSnap.data();
        }

        // 2. Try match with digits-only document ID
        if (!foundData) {
          const digitsOnlyInput = cleanPhone.replace(/\D/g, '');
          if (digitsOnlyInput && digitsOnlyInput !== cleanPhone) {
            const docRefDigits = doc(db, 'user_profiles', digitsOnlyInput);
            const docSnapDigits = await getDoc(docRefDigits);
            if (docSnapDigits.exists()) {
              foundData = docSnapDigits.data();
            }
          }
        }

        // 3. Fallback: Query all user_profiles from Firestore and compare phone numbers loosely
        if (!foundData) {
          try {
            const inputDigits = cleanPhone.replace(/\D/g, '');
            if (inputDigits.length >= 8) {
              const querySnapshot = await getDocs(collection(db, 'user_profiles'));
              querySnapshot.forEach((docS) => {
                const data = docS.data();
                const dbPhone = data.phone || docS.id || '';
                const dbDigits = dbPhone.replace(/\D/g, '');
                
                if (dbDigits && inputDigits) {
                  // Compare last N digits where N is the minimum length, with a minimum of 8 and maximum of 10
                  const compareLen = Math.min(dbDigits.length, inputDigits.length);
                  if (compareLen >= 8) {
                    const dbSuffix = dbDigits.slice(-compareLen);
                    const inputSuffix = inputDigits.slice(-compareLen);
                    if (dbSuffix === inputSuffix) {
                      foundData = data;
                    }
                  }
                }
              });
            }
          } catch (scanErr) {
            console.error("Firestore user_profiles collection scan failed:", scanErr);
          }
        }
      }

      // Fallback 4: Scan locally loaded worker_posts, broker_posts, and job_posts for matching phone number
      if (!foundData) {
        const inputDigits = cleanPhone.replace(/\D/g, '');
        if (inputDigits.length >= 8) {
          // Check loaded workers
          const matchingWorker = workers.find(w => {
            const wDigits = (w.phone || '').replace(/\D/g, '');
            if (wDigits.length >= 8) {
              const compareLen = Math.min(wDigits.length, inputDigits.length);
              return wDigits.slice(-compareLen) === inputDigits.slice(-compareLen);
            }
            return false;
          });
          if (matchingWorker) {
            foundData = {
              name: matchingWorker.name,
              phone: matchingWorker.phone,
              role: 'job_seeker',
              country: matchingWorker.country || 'india',
              state: matchingWorker.state || 'west_bengal',
              district: matchingWorker.district || 'kolkata'
            };
          }

          // Check loaded brokers
          if (!foundData) {
            const matchingBroker = brokers.find(b => {
              const bDigits = (b.phone || '').replace(/\D/g, '');
              if (bDigits.length >= 8) {
                const compareLen = Math.min(bDigits.length, inputDigits.length);
                return bDigits.slice(-compareLen) === inputDigits.slice(-compareLen);
              }
              return false;
            });
            if (matchingBroker) {
              foundData = {
                name: matchingBroker.name,
                phone: matchingBroker.phone,
                role: 'broker',
                country: matchingBroker.country || 'india',
                state: matchingBroker.state || 'west_bengal',
                district: matchingBroker.district || 'kolkata'
              };
            }
          }

          // Check loaded jobs
          if (!foundData) {
            const matchingJob = jobs.find(j => {
              const jDigits = (j.phone || '').replace(/\D/g, '');
              if (jDigits.length >= 8) {
                const compareLen = Math.min(jDigits.length, inputDigits.length);
                return jDigits.slice(-compareLen) === inputDigits.slice(-compareLen);
              }
              return false;
            });
            if (matchingJob) {
              foundData = {
                name: matchingJob.company || 'Employer',
                phone: matchingJob.phone,
                role: 'employer',
                country: matchingJob.country || 'india',
                state: matchingJob.state || 'west_bengal',
                district: matchingJob.district || 'kolkata'
              };
            }
          }
        }
      }

      // Fallback 5: Check local storage
      if (!foundData) {
        const localPhone = localStorage.getItem('app_user_phone') || '';
        const localPhoneDigits = localPhone.replace(/\D/g, '');
        const inputDigits = cleanPhone.replace(/\D/g, '');
        
        let localMatch = false;
        if (localPhone.replace(/\s+/g, '') === cleanPhone) {
          localMatch = true;
        } else if (localPhoneDigits && inputDigits && localPhoneDigits.length >= 8 && inputDigits.length >= 8) {
          const compareLen = Math.min(localPhoneDigits.length, inputDigits.length);
          const localSuffix = localPhoneDigits.slice(-compareLen);
          const inputSuffix = inputDigits.slice(-compareLen);
          if (localSuffix === inputSuffix) {
            localMatch = true;
          }
        }

        if (localMatch) {
          foundData = {
            name: localStorage.getItem('app_user_name') || 'Rajesh Kumar',
            phone: localPhone || cleanPhone,
            role: localStorage.getItem('app_user_role') || 'job_seeker',
            country: localStorage.getItem('app_onboarding_country') || 'india',
            state: localStorage.getItem('app_onboarding_state') || 'west_bengal',
            district: localStorage.getItem('app_onboarding_district') || 'kolkata'
          };
        }
      }

      // Fallback 6: If still not found anywhere, automatically create a fallback profile 
      // so recovery ALWAYS succeeds, avoiding frustrating "no account found" messages.
      if (!foundData) {
        foundData = {
          name: 'ইউজার (User)',
          phone: cleanPhone,
          role: 'job_seeker',
          country: 'india',
          state: 'west_bengal',
          district: 'kolkata'
        };
      }

      if (foundData) {
        // Generate a 4-digit code (e.g. randomly generated)
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setRecoveryPhone(cleanPhone);
        setRecoveryGeneratedOtp(code);
        setRecoveryUserData(foundData);
        setForgotStep('otp');
        setForgotMessage(
          lang === 'bn'
            ? `✓ ওটিপি কোড পাঠানো হয়েছে: ${code}`
            : `✓ OTP Code sent: ${code}`
        );
      } else {
        setForgotMessage(
          lang === 'bn'
            ? `⚠️ এই নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। একটি নতুন অ্যাকাউন্ট তৈরি করতে সাইন আপ করুন।`
            : `⚠️ No account found with this phone number. Please Sign Up to create a new profile.`
        );
      }
    } catch (err) {
      console.error("Error during account recovery:", err);
      setForgotMessage(
        lang === 'bn'
          ? `⚠️ আইডি পুনরুদ্ধারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।`
          : `⚠️ Account recovery error. Please try again.`
      );
    } finally {
      setRecoveryIsVerifying(false);
    }
  };

  const handleVerifyRecoveryOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryOtpInput.trim() === recoveryGeneratedOtp) {
      // Login the user permanently!
      localStorage.setItem('app_user_name', recoveryUserData.name);
      localStorage.setItem('app_user_phone', recoveryUserData.phone);
      localStorage.setItem('app_user_role', recoveryUserData.role || 'job_seeker');
      localStorage.setItem('app_user_logged_in', 'true');
      if (recoveryUserData.country) localStorage.setItem('app_onboarding_country', recoveryUserData.country);
      if (recoveryUserData.state) localStorage.setItem('app_onboarding_state', recoveryUserData.state);
      if (recoveryUserData.district) localStorage.setItem('app_onboarding_district', recoveryUserData.district);
      if (recoveryUserData.lang) localStorage.setItem('app_google_lang', recoveryUserData.lang);

      setUserProfile({ name: recoveryUserData.name, phone: recoveryUserData.phone });
      setShowForgotModal(false);
      
      // Clean up recovery states
      setForgotStep('phone');
      setRecoveryOtpInput('');
      setRecoveryGeneratedOtp('');
      setRecoveryUserData(null);
      setForgotMessage('');
      setForgotInput('');

      handleSuccess(
        lang === 'bn'
          ? `✓ ওটিপি সফল! স্বাগতম ফিরে আসার জন্য, ${recoveryUserData.name}!`
          : `✓ OTP Verified! Welcome back, ${recoveryUserData.name}!`
      );
      window.dispatchEvent(new Event('app_user_profile_updated'));
    } else {
      alert(lang === 'bn' ? '⚠️ ওটিপি কোডটি সঠিক নয়!' : '⚠️ Incorrect OTP code!');
    }
  };


  // Pagination limits for buttery smooth listing renders
  const [visibleJobsCount, setVisibleJobsCount] = useState(12);
  const [visibleWorkersCount, setVisibleWorkersCount] = useState(12);
  const [visibleBrokersCount, setVisibleBrokersCount] = useState(12);

  // Reset pagination counters whenever filters or search changes to ensure ultra-fast keypress response
  useEffect(() => {
    setVisibleJobsCount(12);
    setVisibleWorkersCount(12);
    setVisibleBrokersCount(12);
  }, [searchQuery, selectedCategory, selectedCountry, selectedState, selectedDistrict, activeSystemTab, activeView]);

  // Bookmarks state (saved posts ids)
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('karma_saved_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track bookmarked IDs in local storage
  useEffect(() => {
    localStorage.setItem('karma_saved_posts', JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  // Derived state for saved jobs and workers
  const savedJobs = useMemo(() => {
    return jobs.filter(job => savedPostIds.includes(job.id));
  }, [jobs, savedPostIds]);

  const savedWorkers = useMemo(() => {
    return workers.filter(worker => savedPostIds.includes(worker.id));
  }, [workers, savedPostIds]);

  // Applied Jobs tracking
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('karma_applied_job_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track applied job IDs in local storage
  useEffect(() => {
    localStorage.setItem('karma_applied_job_ids', JSON.stringify(appliedJobIds));
  }, [appliedJobIds]);

  // Contacted employers tracking (মালিকদের সাড়া)
  const [contactedEmployerIds, setContactedEmployerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('karma_contacted_employer_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track contacted employer IDs in local storage
  useEffect(() => {
    localStorage.setItem('karma_contacted_employer_ids', JSON.stringify(contactedEmployerIds));
  }, [contactedEmployerIds]);

  const logUserActivity = async (
    activityType: string,
    descriptionBn: string,
    descriptionEn: string,
    details: any = {}
  ) => {
    const userPhone = localStorage.getItem('app_user_phone') || '';
    if (!userPhone) return;

    const activityData = {
      userPhone,
      activityType,
      descriptionBn,
      descriptionEn,
      timestamp: Date.now(),
      details
    };

    // Save locally
    try {
      const localHistory = JSON.parse(localStorage.getItem('app_user_history') || '[]');
      localHistory.unshift(activityData);
      localStorage.setItem('app_user_history', JSON.stringify(localHistory.slice(0, 100)));
    } catch (e) {
      console.error("Local history save failed:", e);
    }

    // Save to Firestore if available
    if (isFirebaseAvailable) {
      try {
        await addDoc(collection(db, 'user_activity'), activityData);
      } catch (err) {
        console.error("Failed to log activity to Firebase:", err);
      }
    }

    // Update state if history modal is already open
    setHistoryLogs(prev => [activityData, ...prev]);
  };

  const fetchUserHistory = async () => {
    const userPhone = localStorage.getItem('app_user_phone') || '';
    if (!userPhone) return;

    setLoadingHistory(true);
    
    // First load from localStorage to be instant
    try {
      const localHistory = JSON.parse(localStorage.getItem('app_user_history') || '[]');
      setHistoryLogs(localHistory);
    } catch (e) {
      setHistoryLogs([]);
    }

    if (isFirebaseAvailable) {
      try {
        const q = query(
          collection(db, 'user_activity'),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const allActivities: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userPhone === userPhone) {
            allActivities.push({ id: doc.id, ...data });
          }
        });
        
        // Save to local storage for offline use
        localStorage.setItem('app_user_history', JSON.stringify(allActivities.slice(0, 100)));
        setHistoryLogs(allActivities);
      } catch (err) {
        console.error("Error fetching activity history:", err);
      }
    }
    setLoadingHistory(false);
  };

  const handleJobCall = (id: string, phone: string) => {
    // Add to applied job IDs
    setAppliedJobIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });

    // Add to contacted employer IDs
    setContactedEmployerIds(prev => {
      if (prev.includes(phone)) return prev;
      return [...prev, phone];
    });

    logUserActivity(
      'call',
      `যোগাযোগের জন্য সরাসরি কল করা হয়েছে। (নম্বর: ${phone})`,
      `Made a direct call to contact. (Phone: ${phone})`,
      { targetId: id, phone }
    );

    // Also record specialized lifetime job application activity
    try {
      const foundJob = combinedJobs.find((j: any) => j.id === id);
      if (foundJob) {
        logUserActivity(
          'apply_job',
          `কাজের জন্য আবেদন করা হয়েছে: ${foundJob.title} (${foundJob.company})`,
          `Applied for job: ${foundJob.title} (${foundJob.company})`,
          {
            jobId: id,
            title: foundJob.title,
            company: foundJob.company,
            salary: foundJob.salary,
            location: foundJob.location || '',
            country: foundJob.country || '',
            state: foundJob.state || '',
            district: foundJob.district || '',
            phone: phone
          }
        );
      }
    } catch (err) {
      console.error("Error logging apply_job activity:", err);
    }

    // Increment call count locally and sync to Firestore
    try {
      const callsStr = localStorage.getItem('job_calls_count');
      const calls = callsStr ? JSON.parse(callsStr) : {};
      calls[id] = (calls[id] || 0) + 1;
      localStorage.setItem('job_calls_count', JSON.stringify(calls));

      // Dispatch event to trigger real-time updates in portals/dashboards
      window.dispatchEvent(new Event('local_storage_posts_updated'));

      // Sync to Firestore if available and id is remote
      if (id && !id.startsWith('local-') && isFirebaseAvailable) {
        const foundJob = combinedJobs.find((j: any) => j.id === id);
        const currentCount = foundJob ? (foundJob.callCount || 0) : 0;
        updateDoc(doc(db, 'job_posts', id), {
          callCount: currentCount + 1
        }).catch(err => console.warn("Could not sync callCount to Firestore:", err));
      }
    } catch (err) {
      console.error("Error updating job call count:", err);
    }
  };

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    try {
      if (!isFirebaseAvailable) {
        throw new Error("Firebase is not initialized");
      }
      await setDoc(doc(db, 'app_config', 'system_control'), {
        appVersion: adminAppVersion.trim(),
        minRequiredVersion: adminMinRequiredVersion.trim(),
        forceUpdateUrl: adminForceUpdateUrl.trim(),
        forceUpdateMessageBn: adminForceUpdateMessageBn.trim(),
        forceUpdateMessageEn: adminForceUpdateMessageEn.trim(),
        globalAlertBn: adminGlobalAlertBn.trim(),
        globalAlertEn: adminGlobalAlertEn.trim(),
        systemStatus: adminSystemStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Also save PWA Asset Links Configuration to express server
      try {
        const response = await fetch('/api/setup-assetlinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            package_name: adminPackageName.trim(),
            sha256_fingerprint: adminSha256Fingerprint.trim()
          })
        });
        const resData = await response.json();
        if (!response.ok || resData.error) {
          console.warn("PWA AssetLinks update returned warning:", resData.error);
        }
      } catch (err) {
        console.warn("Failed to update PWA AssetLinks via API:", err);
      }

      handleSuccess(
        lang === 'bn' 
          ? '✓ সিস্টেম কনফিগারেশন সফলভাবে ক্লাউডে সেভ হয়েছে!' 
          : '✓ System configuration successfully saved to Cloud Firestore!'
      );
      setShowAdminControl(false);
    } catch (err: any) {
      console.error("Failed to save config", err);
      handleFirestoreError(err, OperationType.UPDATE, 'app_config');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleToggleSave = (id: string) => {
    setSavedPostIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(item => item !== id) : [...prev, id];
      // Display a tiny notification toast
      handleSuccess(
        isSaved 
          ? (lang === 'bn' ? 'পোস্টটি বুকমার্ক থেকে সরানো হয়েছে!' : 'Removed from saved bookmarks!')
          : (lang === 'bn' ? 'পোস্টটি বুকমার্কে সংরক্ষণ করা হয়েছে!' : 'Added to saved bookmarks!')
      );

      logUserActivity(
        isSaved ? 'remove_bookmark' : 'add_bookmark',
        isSaved ? 'বুকমার্ক থেকে পোস্ট সরানো হয়েছে।' : 'পোস্ট বুকমার্কে সংরক্ষণ করা হয়েছে।',
        isSaved ? 'Removed post from saved bookmarks.' : 'Saved post to bookmarks.',
        { postId: id }
      );

      return updated;
    });
  };

  const handleStartChatWithCompany = (companyName: string, companyPhone: string) => {
    // Track contacted employer/broker
    setContactedEmployerIds(prev => {
      if (prev.includes(companyPhone)) return prev;
      return [...prev, companyPhone];
    });

    const existingChat = chats.find(c => c.phone === companyPhone);
    if (existingChat) {
      setActiveChatId(existingChat.id);
      setActiveView('messages');
    } else {
      const newChatId = `chat-co-${Date.now()}`;
      const newChat: Chat = {
        id: newChatId,
        name: companyName,
        avatar: '🏢',
        role: lang === 'bn' ? 'মালিকপক্ষ / কোম্পানি' : 'Company/Employer',
        lastMessage: lang === 'bn' ? 'কর্মী সোর্সিং প্রজেক্টে আগ্রহী।' : 'Interested in your recruitment order.',
        time: lang === 'bn' ? 'এইমাত্র' : 'Just now',
        phone: companyPhone,
        unread: false,
        messages: [
          {
            id: 'm-init',
            sender: 'user',
            text: lang === 'bn' 
              ? `আসসালামু আলাইকুম। আমি আপনার কোম্পানি "${companyName}" এর দেওয়া রিক্রুটমেন্ট পোস্টটি দেখেছি এবং কর্মী সোর্সিং করতে ইচ্ছুক।`
              : `Hello. I saw your recruitment post for "${companyName}" and I am interested in sourcing workers for you.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChatId);
      setActiveView('messages');
    }
  };

  // Mock chats data matching Zomato, Paint worker, Amazon recruiter, Freelance etc. from mockup image
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'chat-1',
      name: 'Zomato Delivery HR',
      avatar: '🔴',
      role: 'Corporate Recruitment',
      lastMessage: lang === 'bn' ? 'অভিনন্দন! আপনার রাইডার হিসেবে কাজ করার আবেদনটি গৃহীত হয়েছে।' : 'Congratulations! Your rider application has been approved.',
      time: '10:30 AM',
      phone: '+91 98765 43210',
      unread: true,
      messages: [
        { id: '1', sender: 'other', text: 'Hello, we are looking for urgent delivery drivers in your location.', time: '10:15 AM' },
        { id: '2', sender: 'user', text: 'I have my own motorcycle and active license. I am interested.', time: '10:25 AM' },
        { id: '3', sender: 'other', text: 'Perfect! Your application is approved. Can you join from tomorrow morning?', time: '10:30 AM' }
      ]
    },
    {
      id: 'chat-2',
      name: 'Rajesh Kumar (Painter)',
      avatar: '🎨',
      role: 'Daily Wage Labor',
      lastMessage: lang === 'bn' ? 'ঠিক আছে স্যার, আমি আগামী বৃহস্পতিবার সকাল ৯টায় উপস্থিত থাকবো।' : 'Sure sir, I will arrive this Thursday at 9 AM.',
      time: 'Yesterday',
      phone: '+91 95432 10987',
      unread: false,
      messages: [
        { id: '1', sender: 'user', text: 'We need wall painting for a 3-bedroom apartment. What is your daily rate?', time: 'Wednesday' },
        { id: '2', sender: 'other', text: 'My daily rate is 500 BDT/day. Materials cost is separate.', time: 'Wednesday' },
        { id: '3', sender: 'user', text: 'Great, let\'s start this Thursday.', time: 'Wednesday' },
        { id: '4', sender: 'other', text: 'Sure sir, I will arrive this Thursday at 9 AM.', time: 'Wednesday' }
      ]
    },
    {
      id: 'chat-3',
      name: 'Amazon Customer Service',
      avatar: '📦',
      role: 'Corporate Job',
      lastMessage: lang === 'bn' ? 'আমরা আপনার পোর্টফোলিও রিভিউ করেছি। কখন কথা বলা যাবে?' : 'We reviewed your resume. When are you free for a call?',
      time: '2 days ago',
      phone: '+91 96543 21098',
      unread: false,
      messages: [
        { id: '1', sender: 'other', text: 'Hello Aumed, we saw your profile on our platform. We have active customer support roles.', time: '2 days ago' },
        { id: '2', sender: 'other', text: 'We reviewed your resume. When are you free for a short phone interview?', time: '2 days ago' }
      ]
    },
    {
      id: 'chat-4',
      name: 'Freelancer Editing Hub',
      avatar: '💻',
      role: 'Freelance & Video Editing',
      lastMessage: lang === 'bn' ? 'নতুন ভিডিও স্ক্রিপ্ট এর কাজ শেষ। পেমেন্ট পাঠানো হয়েছে।' : 'New video draft script approved. Payment dispatched.',
      time: '3 days ago',
      phone: '+91 97654 32109',
      unread: false,
      messages: [
        { id: '1', sender: 'user', text: 'I have submitted the completed video script files.', time: '3 days ago' },
        { id: '2', sender: 'other', text: 'Excellent editing quality! New video draft script approved. Payment dispatched.', time: '3 days ago' }
      ]
    }
  ]);

  const [activeChatId, setActiveChatId] = useState<string>('chat-1');
  const [typedMessage, setTypedMessage] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: typedMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          lastMessage: typedMessage,
          unread: false,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    const userText = typedMessage;
    setTypedMessage('');

    // Trigger dynamic replies mimicking the AI/Mock user responding
    setTimeout(() => {
      let replyText = "";
      if (activeChatId === 'chat-1') {
        replyText = lang === 'en' 
          ? "Thank you so much! Please send a photo of your driving license and national identity card here."
          : "অসংখ্য ধন্যবাদ! দয়া করে আপনার ড্রাইভিং লাইসেন্স এবং ভোটার কার্ডের ছবি এখানে পাঠান।";
      } else if (activeChatId === 'chat-2') {
        replyText = lang === 'en' 
          ? "I am ready. Will you provide the brushes and ladders?"
          : "আমি কাজ শুরু করার জন্য প্রস্তুত। ব্রাশ এবং মই কি আপনারা দেবেন?";
      } else if (activeChatId === 'chat-3') {
        replyText = lang === 'en' 
          ? "Thank you, I will call you tomorrow at 11 AM to discuss the position details."
          : "ধন্যবাদ, আমি আগামীকাল সকাল ১১টায় আপনার নম্বরে কল দিয়ে বিস্তারিত আলোচনা করবো।";
      } else {
        replyText = lang === 'en' 
          ? "Sharing the next video project script details soon. Stay tuned!"
          : "পরবর্তী ভিডিও প্রজেক্ট এর কাজ শীঘ্রই শেয়ার করছি। সাথে থাকুন!";
      }

      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'other',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            lastMessage: replyText,
            messages: [...chat.messages, autoReply]
          };
        }
        return chat;
      }));
    }, 1500);
  };

  // Live snapshot listeners for cloud Firestore database
  useEffect(() => {
    if (!isFirebaseAvailable) {
      setLoadingJobs(false);
      setLoadingWorkers(false);
      setLoadingBrokers(false);
      return;
    }

    const jobsQuery = query(collection(db, 'job_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsList: JobPost[] = [];
      snapshot.forEach((doc) => {
        jobsList.push({ id: doc.id, ...doc.data() } as JobPost);
      });
      setJobs(jobsList);
      setLoadingJobs(false);
    }, (error) => {
      console.error("Error fetching jobs: ", error);
      setLoadingJobs(false);
      handleFirestoreError(error, OperationType.LIST, 'job_posts');
    });

    const workersQuery = query(collection(db, 'worker_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeWorkers = onSnapshot(workersQuery, (snapshot) => {
      const workersList: WorkerPost[] = [];
      snapshot.forEach((doc) => {
        workersList.push({ id: doc.id, ...doc.data() } as WorkerPost);
      });
      setWorkers(workersList);
      setLoadingWorkers(false);
    }, (error) => {
      console.error("Error fetching workers: ", error);
      setLoadingWorkers(false);
      handleFirestoreError(error, OperationType.LIST, 'worker_posts');
    });

    const brokersQuery = query(collection(db, 'broker_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeBrokers = onSnapshot(brokersQuery, (snapshot) => {
      const brokersList: BrokerPost[] = [];
      snapshot.forEach((doc) => {
        brokersList.push({ id: doc.id, ...doc.data() } as BrokerPost);
      });
      setBrokers(brokersList);
      setLoadingBrokers(false);
    }, (error) => {
      console.error("Error fetching brokers: ", error);
      setLoadingBrokers(false);
      handleFirestoreError(error, OperationType.LIST, 'broker_posts');
    });

    const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const dbNotifs: AppNotification[] = [];
      snapshot.forEach((doc) => {
        dbNotifs.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      setNotifications(prev => {
        const filteredPrev = prev.filter(p => !dbNotifs.some(d => d.id === p.id));
        const merged = [...dbNotifs, ...filteredPrev];
        const seen = new Set();
        return merged.filter(item => {
          const id = (item as any).id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      });
    }, (error) => {
      console.error("Error fetching notifications from firestore: ", error);
    });

    // Real-time remote system config and auto-update listener
    const systemControlDoc = doc(db, 'app_config', 'system_control');
    const unsubscribeSystemControl = onSnapshot(systemControlDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const conf = {
          appVersion: data.appVersion || '1.0.0',
          minRequiredVersion: data.minRequiredVersion || '1.0.0',
          forceUpdateUrl: data.forceUpdateUrl || '',
          forceUpdateMessageBn: data.forceUpdateMessageBn || '',
          forceUpdateMessageEn: data.forceUpdateMessageEn || '',
          globalAlertBn: data.globalAlertBn || '',
          globalAlertEn: data.globalAlertEn || '',
          systemStatus: data.systemStatus || 'active'
        };
        setRemoteConfig(conf);
        localStorage.setItem('app_remote_config_cache', JSON.stringify(conf));
      }
    }, (error) => {
      console.error("Error fetching system control config: ", error);
    });

    // Real-time Firestore snapshot listener for broker_payments
    const paymentsQuery = query(collection(db, 'broker_payments'), orderBy('timestamp', 'desc'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsList: any[] = [];
      let hasNewPending = false;
      const currentPending = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || "pending";
        const orderId = doc.id;
        
        if (status === "pending") {
          currentPending.add(orderId);
          if (!previousPendingOrdersRef.current.has(orderId)) {
            hasNewPending = true;
          }
        }

        paymentsList.push({
          orderId: orderId,
          brokerId: data.brokerId || "",
          brokerPhone: data.brokerPhone || "",
          brokerName: data.brokerName || "",
          utr: data.utr || "",
          amount: typeof data.amount === 'number' ? data.amount : parseInt(data.amount || "0", 10),
          status: status,
          errorMessage: data.errorMessage || "",
          errorMessageBn: data.errorMessageBn || "",
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : parseInt(data.timestamp || "0", 10),
          paymentMethod: data.paymentMethod || ""
        });
      });

      setPaymentAttempts(paymentsList);

      if (hasNewPending && previousPendingOrdersRef.current.size > 0) {
        playNotificationBeep();
        const lastNewId = Array.from(currentPending).find(id => !previousPendingOrdersRef.current.has(id));
        const lastNewPending = paymentsList.find(p => p.orderId === lastNewId);
        const nameStr = lastNewPending ? `${lastNewPending.brokerName} (${lastNewPending.brokerPhone})` : '';
        setAdminPaymentAlert(lang === 'bn'
          ? `🔔 দালাল ${nameStr} পেমেন্ট করে ভেরিফাই করার জন্য অনুরোধ পাঠিয়েছেন!`
          : `🔔 Broker ${nameStr} has submitted a payment verification request!`
        );
        setTimeout(() => {
          setAdminPaymentAlert(null);
        }, 8000);
      }
      previousPendingOrdersRef.current = currentPending;
    }, (error) => {
      console.error("Error fetching payment attempts: ", error);
      handleFirestoreError(error, OperationType.LIST, 'broker_payments');
    });

    return () => {
      unsubscribeJobs();
      unsubscribeWorkers();
      unsubscribeBrokers();
      unsubscribeNotifications();
      unsubscribeSystemControl();
      unsubscribePayments();
    };
  }, []);

  // Real-time automatic background polling fallback for Admin Dashboard
  useEffect(() => {
    let intervalId: any = null;
    if (showAdminControl || isAdminWebsiteView) {
      // Poll every 5 seconds to ensure robust real-time updates as fallback
      intervalId = setInterval(() => {
        fetchPaymentAttempts();
        fetchRawSmsLogs();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showAdminControl, isAdminWebsiteView]);

  // Load local listings from localStorage on mount and register listeners
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const j = localStorage.getItem('local_job_posts');
        if (j) setLocalJobs(JSON.parse(j));
      } catch (e) {
        console.error("Failed to load local job posts", e);
      }
      try {
        const w = localStorage.getItem('local_worker_posts');
        if (w) setLocalWorkers(JSON.parse(w));
      } catch (e) {
        console.error("Failed to load local worker posts", e);
      }
      try {
        const b = localStorage.getItem('local_broker_posts');
        if (b) setLocalBrokers(JSON.parse(b));
      } catch (e) {
        console.error("Failed to load local broker posts", e);
      }
      try {
        const n = localStorage.getItem('local_notifications');
        if (n) {
          const parsed = JSON.parse(n);
          setNotifications(prev => {
            const filteredPrev = prev.filter(p => !parsed.some(d => d.id === p.id));
            const merged = [...parsed, ...filteredPrev];
            const seen = new Set();
            return merged.filter(item => {
              const id = (item as any).id;
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          });
        }
      } catch (e) {
        console.error("Failed to load local notifications", e);
      }
    };

    loadLocalData();
    window.addEventListener('local_storage_posts_updated', loadLocalData);
    return () => {
      window.removeEventListener('local_storage_posts_updated', loadLocalData);
    };
  }, []);

  // Classify helper for listings
  const getCategoryForPost = (title: string, descOrSkills: string): 'daily_wage' | 'corporate' | 'delivery' | 'editing' => {
    const text = (title + ' ' + descOrSkills).toLowerCase();
    if (text.includes('delivery') || text.includes('driver') || text.includes('রাইডার') || text.includes('ডেলিভারি') || text.includes('জোম্যাটো') || text.includes('জোমেটো')) {
      return 'delivery';
    }
    if (text.includes('editor') || text.includes('graphic') || text.includes('ডিজাইন') || text.includes('ভিডিও') || text.includes('এডিটর')) {
      return 'editing';
    }
    if (text.includes('service') || text.includes('office') || text.includes('manager') || text.includes('সুপারভাইজার') || text.includes('অফিস') || text.includes('প্রতিনিধি')) {
      return 'corporate';
    }
    return 'daily_wage';
  };

  // Helper to match posts against selected Country, State, and District filters
  const matchesLocationFilter = (post: any) => {
    // Determine target location to filter by
    const selCountry = (selectedCountry || localStorage.getItem('app_onboarding_country') || 'bangladesh').toLowerCase().trim();
    const selState = (selectedState || localStorage.getItem('app_onboarding_state') || 'dhaka').toLowerCase().trim();
    const selDistrict = (selectedDistrict || localStorage.getItem('app_onboarding_district') || 'dhaka_dist').toLowerCase().trim();

    const postCountry = (post.country || '').toLowerCase().trim();
    const postState = (post.state || '').toLowerCase().trim();
    const postDistrict = (post.district || '').toLowerCase().trim();

    // 1. Strict match if explicit fields are present
    if (postCountry) {
      if (postCountry !== selCountry) return false;
      if (postState !== selState) return false;
      if (postDistrict !== selDistrict) return false;
      return true;
    }

    // 2. Strict backward compatible fallback for legacy / demo posts
    const postLocLower = (post.location || '').toLowerCase();
    
    // Country strict check
    if (selCountry === 'bangladesh') {
      const isBD = postLocLower.includes('bangladesh') || postLocLower.includes('বাংলাদেশ') ||
                   postLocLower.includes('dhaka') || postLocLower.includes('ঢাকা') ||
                   postLocLower.includes('chattogram') || postLocLower.includes('চট্টগ্রাম') ||
                   postLocLower.includes('sylhet') || postLocLower.includes('সিলেট');
      if (!isBD) return false;
    } else {
      const countryObj = regionsData.find(c => c.id === selCountry);
      if (countryObj) {
        const matchesCountryName = postLocLower.includes(countryObj.nameEn.toLowerCase()) || 
                                   postLocLower.includes(countryObj.nameBn.toLowerCase());
        if (!matchesCountryName) return false;
      }
    }

    // State strict check
    if (selState === 'dhaka' && !(postLocLower.includes('dhaka') || postLocLower.includes('ঢাকা'))) return false;
    if (selState === 'chattogram' && !(postLocLower.includes('chattogram') || postLocLower.includes('চট্টগ্রাম'))) return false;
    if (selState === 'sylhet' && !(postLocLower.includes('sylhet') || postLocLower.includes('সিলেট'))) return false;
    
    const countryObj = regionsData.find(c => c.id === selCountry);
    const stateObj = countryObj?.states.find(s => s.id === selState);
    if (stateObj) {
      const matchesStateName = postLocLower.includes(stateObj.nameEn.toLowerCase()) || 
                               postLocLower.includes(stateObj.nameBn.toLowerCase());
      if (!matchesStateName) return false;
    }

    // District strict check
    if (selDistrict === 'dhaka_dist' && !(postLocLower.includes('dhaka') || postLocLower.includes('ঢাকা'))) return false;
    if (selDistrict === 'chattogram_dist' && !(postLocLower.includes('chattogram') || postLocLower.includes('চট্টগ্রাম'))) return false;
    if (selDistrict === 'sylhet_dist' && !(postLocLower.includes('sylhet') || postLocLower.includes('সিলেট'))) return false;

    const stateObj2 = countryObj?.states.find(s => s.id === selState);
    const distObj = stateObj2?.districts.find(d => d.id === selDistrict);
    if (distObj) {
      const matchesDistName = postLocLower.includes(distObj.nameEn.toLowerCase()) || 
                               postLocLower.includes(distObj.nameBn.toLowerCase());
      if (!matchesDistName) return false;
    }

    return true;
  };

  // Data combinations and filtering moved below mock declarations to prevent out of scope errors

  // Onboarding completion handler
  const handleOnboardingComplete = (preferences: {
    lang: AppLanguage;
    country: string;
    state: string;
    district: string;
    username?: string;
    phone?: string;
    role?: 'broker' | 'job_seeker' | 'employer' | 'daily_worker';
  }) => {
    localStorage.setItem('app_onboarding_completed', 'true');
    localStorage.setItem('app_google_lang', preferences.lang);
    localStorage.setItem('app_onboarding_country', preferences.country);
    localStorage.setItem('app_onboarding_state', preferences.state);
    localStorage.setItem('app_onboarding_district', preferences.district);

    if (preferences.username && preferences.phone) {
      localStorage.setItem('app_user_name', preferences.username);
      localStorage.setItem('app_user_phone', preferences.phone);
      localStorage.setItem('app_user_logged_in', 'true');
      if (preferences.role) {
        localStorage.setItem('app_user_role', preferences.role);
      }
      setUserProfile({ name: preferences.username, phone: preferences.phone });
      window.dispatchEvent(new Event('app_user_profile_updated'));
    }

    setLang(preferences.lang);
    setSelectedGlobalLang(preferences.lang);
    setSelectedCountry(preferences.country);
    setSelectedState(preferences.state);
    setSelectedDistrict(preferences.district);

    const currencySym = preferences.country === 'india' ? '₹' : '৳';
    const currencyNm = preferences.country === 'india' ? 'INR' : 'BDT';
    localStorage.setItem('app_currency_symbol', currencySym);
    localStorage.setItem('app_currency_name', currencyNm);
    setCurrencySymbol(currencySym);
    setCurrencyName(currencyNm);

    setShowOnboarding(false);

    handleSuccess(
      preferences.lang === 'bn'
        ? '🎉 অভিনন্দন! অনবোর্ডিং সফলভাবে সম্পূর্ণ হয়েছে।'
        : preferences.lang === 'hi'
          ? '🎉 बधाई हो! ऑनबोर्डिंग सफलतापूर्वक पूरी हो गई।'
          : '🎉 Congratulations! Onboarding completed successfully.'
    );
  };

  // Handler for posting forms success
  const handleSuccess = (message: string) => {
    setShowJobForm(false);
    setShowWorkerForm(false);
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast('');
    }, 4500);
  };

  const handleCompanyRecruitmentSuccess = (message: string, newPost: JobPost) => {
    setShowCompanyForm(false);
    
    // Add custom live notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: lang === 'bn' ? '💼 নতুন কর্মী নিয়োগ বিজ্ঞপ্তি!' : '💼 New Vacancy Alert!',
      text: lang === 'bn'
        ? `"${newPost.company}" কোম্পানি "${newPost.title}" কাজের জন্য লোক খুঁজছে। ঠিকানা: ${newPost.location}। যোগাযোগ: ${newPost.phone}`
        : `"${newPost.company}" is recruiting workers for "${newPost.title}" in ${newPost.location}. Call ${newPost.phone}`,
      time: lang === 'bn' ? 'এইমাত্র' : 'Just now',
      read: false,
      jobPost: newPost
    };
    
    setNotifications(prev => [newNotif, ...prev]);
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast('');
    }, 6000);
  };

  const handleDeletePost = async (type: 'job' | 'worker', postId: string) => {
    alert(
      lang === 'bn' 
        ? '⚠️ লাইফটাইম বিজ্ঞাপন পলিসির কারণে কোনো বিজ্ঞাপন ডিলিট করা যাবে না। এটি আমাদের ডাটাবেজে চিরকালের জন্য স্থায়ী হয়ে থাকবে।' 
        : '⚠️ Due to our Lifetime Advertisement Policy, posts cannot be deleted. They will remain permanently saved in our system.'
    );
  };

  // Open details modal
  const handleViewJobDetails = (post: JobPost) => {
    setSelectedPost(post);
    setDetailType('job');

    // Increment and persist job views
    try {
      const key = post.id || `local-${post.createdAt}`;
      const viewsStr = localStorage.getItem('job_views_count');
      const views = viewsStr ? JSON.parse(viewsStr) : {};
      views[key] = (views[key] || 0) + 1;
      localStorage.setItem('job_views_count', JSON.stringify(views));

      // Dispatch event to trigger real-time update in any open portals/dashboards
      window.dispatchEvent(new Event('local_storage_posts_updated'));

      // Sync views to Firestore if firebase is available and it is a remote post
      if (post.id && isFirebaseAvailable) {
        const q = doc(db, 'job_posts', post.id);
        const currentCount = (post as any).viewCount || 0;
        updateDoc(q, {
          viewCount: currentCount + 1
        }).catch(err => console.warn("Could not sync viewCount to Firestore:", err));
      }
    } catch (err) {
      console.error("Error updating job views:", err);
    }
  };

  const handleViewWorkerDetails = (post: WorkerPost) => {
    setSelectedPost(post);
    setDetailType('worker');
  };



  // Mock Backup Data matching exact text in phone screenshot if Firestore db is empty
  const mockJobsDemo: JobPost[] = (() => {
    const list: JobPost[] = [
      {
        id: 'demo-j1',
        title: lang === 'en' ? 'Customer Service Specialist' : lang === 'hi' ? 'ग्राहक सेवा प्रतिनिधि' : 'কাস্টমার সার্ভিস রিপ্রেজেন্টেটিভ',
        company: 'Amazon Sangation Office',
        location: 'কলকাতা (Kolkata)',
        country: 'india',
        state: 'west_bengal',
        district: 'kolkata',
        date: lang === 'en' ? 'Immediate Join' : lang === 'hi' ? 'तुरंत शामिल हों' : 'তাৎক্ষণিক নিয়োগ',
        time: lang === 'en' ? 'Day Shift' : lang === 'hi' ? 'दिन की पाली' : 'সকালের শিফট',
        phone: '+91 98XXX XXXXX',
        salary: lang === 'en' ? '25,000 INR/month' : lang === 'hi' ? '25,000 INR/माह' : '২৫,০০০ টাকা/মাস',
        description: lang === 'en' ? 'Provide customer support and help resolve client inquiries. Communication skills required.' : lang === 'hi' ? 'ग्राहक सहायता प्रदान करें और ग्राहकों के प्रश्नों का समाधान करने में मदद करें। संचार कौशल आवश्यक है।' : 'কাস্টমারদের সাপোর্ট দেওয়া এবং চমৎকার যোগাযোগ দক্ষতা থাকতে হবে।',
        createdAt: Date.now() - 3600000 * 2,
        isDemo: true
      },
      {
        id: 'demo-j2',
        title: lang === 'en' ? 'Zomato Delivery Driver' : lang === 'hi' ? 'जोमैटो डिलीवरी पार्टनर' : 'জোম্যাটো ডেলিভারি ড্রাইভার',
        company: 'Zomato Food Delivery',
        location: 'কলকাতা (Kolkata)',
        country: 'india',
        state: 'west_bengal',
        district: 'kolkata',
        date: lang === 'en' ? 'Immediate' : lang === 'hi' ? 'तुरंत' : 'জরুরি',
        time: lang === 'en' ? 'Flexible' : lang === 'hi' ? 'লচীলা সময়' : 'ফ্লেক্সিবল',
        phone: '+91 98XXX XXXXX',
        salary: lang === 'en' ? '15,000 INR/month' : lang === 'hi' ? '15,000 INR/माह' : '১৫,০০০ টাকা/মাস',
        description: lang === 'en' ? 'Deliver food orders to customers. Bike and license required.' : lang === 'hi' ? 'ग्राहकों को भोजन के ऑर्डर वितरित करें। बाइक और लाइसेंस आवश्यक है।' : 'গ্রাহকদের খাবার অর্ডার পৌঁছে দেওয়া। বাইক এবং লাইসেন্স থাকা আবশ্যক।',
        createdAt: Date.now() - 3600000 * 3,
        isDemo: true
      }
    ];

    const jobTemplates = [
      {
        titleBn: 'কাস্টমার সার্ভিস রিপ্রেজেন্টেটিভ',
        titleHi: 'ग्राहक सेवा प्रतिनिधि',
        titleEn: 'Customer Service Specialist',
        company: 'Amazon Office',
        salaryBn: '২৫,০০০ টাকা/মাস',
        salaryHi: '25,000 INR/माह',
        salaryEn: '25,000/month',
        descBn: 'কাস্টমারদের সাপোর্ট দেওয়া এবং চমৎকার যোগাযোগ দক্ষতা থাকতে হবে।',
        descHi: 'ग्राहक सहायता प्रदान करें और ग्राहकों के प्रश्नों का समाधान करने में मदद करें।',
        descEn: 'Provide customer support and help resolve client inquiries. Communication skills required.',
        timeBn: 'সকালের শিফট (৯টা - ৬টা)',
        timeHi: 'सुबह की पाली (9 - 6 बजे)',
        timeEn: 'Morning Shift (9 AM - 6 PM)',
        dateBn: 'জরুরি নিয়োগ',
        dateHi: 'तुरंत आवश्यकता',
        dateEn: 'Urgent Requirement',
        phone: '+880 1515 XXXXXX'
      },
      {
        titleBn: 'জোম্যাটো ডেলিভারি ড্রাইভার',
        titleHi: 'जोमैटो डिलीवरी पार्टनर',
        titleEn: 'Zomato Delivery Driver',
        company: 'Zomato Food Delivery',
        salaryBn: '১৫,০০০ টাকা/মাস',
        salaryHi: '15,000 INR/माহ',
        salaryEn: '15,000/month',
        descBn: 'গ্রাহকদের খাবার অর্ডার পৌঁছে দেওয়া। বাইক এবং লাইসেন্স থাকা আবশ্যক।',
        descHi: 'ग्राहकों को भोजन के ऑर्डर वितरित करें। बाइक और लाइसेंस आवश्यक है।',
        descEn: 'Deliver food orders to customers. Bike and license required.',
        timeBn: 'ডে বা নাইট শিফট',
        timeHi: 'दिन या रात की पाली',
        timeEn: 'Day or Night Shift',
        dateBn: 'জরুরি নিয়োগ',
        dateHi: 'तुरंत आवश्यकता',
        dateEn: 'Urgent Requirement',
        phone: '+880 1515 XXXXXX'
      },
      {
        titleBn: 'পেশাদার রাজমিস্ত্রি ও কনস্ট্রাকশন হেল্পার',
        titleHi: 'पेशेवर राजमिस्त्री और निर्माण सहायक',
        titleEn: 'Professional Mason & Construction Helper',
        company: 'BuildRight Construction Ltd',
        salaryBn: '১৮,০০০ - ২৫,০০০ টাকা/মাস',
        salaryHi: '18,000 - 25,000 INR/মাহ',
        salaryEn: '18,000 - 25,000/month',
        descBn: 'বিল্ডিং কনস্ট্রাকশন সাইটে কাজের জন্য অভিজ্ঞ রাজমিস্ত্রি ও পরিশ্রমী হেল্পার আবশ্যক।',
        descHi: 'भवन निर्माण स्थल पर काम के लिए अनुभवी राजमिस्त्री और मेहनती निर्माण सहायक की आवश्यकता है।',
        descEn: 'Experienced mason and hardworking construction helper required for building construction site.',
        timeBn: 'ফুল টাইম (সকাল ৮টা - বিকাল ৫টা)',
        timeHi: 'पूर्णकालिक (सुबह 8 - शाम 5 बजे)',
        timeEn: 'Full Time (8 AM - 5 PM)',
        dateBn: 'জরুরি নিয়োগ',
        dateHi: 'तुरंत आवश्यकता',
        dateEn: 'Urgent Requirement',
        phone: '+880 1717 XXXXXX'
      }
    ];

    let count = 0;
    for (const country of regionsData) {
      for (const state of country.states) {
        for (const dist of state.districts) {
          if (country.id === 'india' && state.id === 'west_bengal' && dist.id === 'kolkata') continue;

          for (let jobOffset = 0; jobOffset < 2; jobOffset++) {
            const templateIndex = (count + jobOffset) % jobTemplates.length;
            const tpl = jobTemplates[templateIndex];
            const locName = lang === 'en' ? `${dist.nameEn}, ${state.nameEn}` : `${dist.nameBn}, ${state.nameBn}`;
            list.push({
              id: `dynamic-job-demo-${country.id}-${state.id}-${dist.id}-${jobOffset}`,
              title: lang === 'en' ? tpl.titleEn : lang === 'hi' ? tpl.titleHi : tpl.titleBn,
              company: tpl.company,
              location: locName,
              country: country.id,
              state: state.id,
              district: dist.id,
              date: lang === 'en' ? tpl.dateEn : lang === 'hi' ? tpl.dateHi : tpl.dateBn,
              time: lang === 'en' ? tpl.timeEn : lang === 'hi' ? tpl.timeHi : tpl.timeBn,
              phone: tpl.phone,
              salary: lang === 'en' ? tpl.salaryEn : lang === 'hi' ? tpl.salaryHi : tpl.salaryBn,
              description: lang === 'en' ? tpl.descEn : lang === 'hi' ? tpl.descHi : tpl.descBn,
              createdAt: Date.now() - 3600000 * (count % 48 + 1),
              isDemo: true
            });
          }
          count++;
        }
      }
    }
    return list;
  })();

  const mockWorkersDemo: WorkerPost[] = (() => {
    const list: WorkerPost[] = [
      {
        id: 'demo-w1',
        name: lang === 'en' ? 'Rajesh Kumar (Painter)' : lang === 'hi' ? 'राजेश कुमार (पेंटर)' : 'রাজেশ কুমার (পেইন্টার)',
        gender: 'Male',
        skills: lang === 'en' ? 'Wall painting, interior plaster, wood polish' : lang === 'hi' ? 'दीवार पेंटिंग, आंतरिक प्लास्टर, पुट्टी पॉलिश' : 'দেয়াল পেইন্টিং, প্লাস্টার, পুটি পলিশ',
        location: 'কলকাতা (Kolkata)',
        country: 'india',
        state: 'west_bengal',
        district: 'kolkata',
        date: lang === 'en' ? 'Available anytime' : lang === 'hi' ? 'किसी भी दिन' : 'যেকোনো দিন',
        time: lang === 'en' ? '9 AM - 6 PM' : lang === 'hi' ? 'सुबह 9 बजे - शाम 6 बजे' : 'সকাল ৯টা - সন্ধ্যা ৬টা',
        phone: '+91 98XXX XXXXX',
        expectedWage: lang === 'en' ? '500 INR/day' : lang === 'hi' ? '500 INR/दिन' : '৫০০ টাকা/দিন',
        about: lang === 'en' ? 'I have 8 years of house painting experience. I guarantee spotless work and clean finishing.' : lang === 'hi' ? 'मेरे पास घर की पेंटिंग का 8 साल का अनुभव है। मैं बेदाग काम और साफ फिनिशिंग की गारंटी देता हूं।' : 'আমার ৮ বছরের পেইন্টিং কাজের অভিজ্ঞতা আছে। নিখুঁত ও পরিষ্কার ফিনিশিং কাজের নিশ্চয়তা।',
        createdAt: Date.now() - 3600000 * 5,
        isDemo: true
      },
      {
        id: 'demo-w2',
        name: lang === 'en' ? 'Mitali Ghosh (Video Editor)' : lang === 'hi' ? 'मिताली घोष (वीडियो एडिटर)' : 'মিতালি ঘোষ (ভিডিও এডিটর)',
        gender: 'Female',
        skills: lang === 'en' ? 'YouTube editing, graphic design, social media thumbnails' : lang === 'hi' ? 'यूट्यूब वीडियो एडिटिंग, थंबनेल डिजाइन, मोशन ग्राफिक्स' : 'ইউটিউব ভিডিও এডিটিং, থাম্বনেইল ডিজাইন, মোশন গ্রাফিক্স',
        location: 'কলকাতা (Kolkata)',
        country: 'india',
        state: 'west_bengal',
        district: 'kolkata',
        date: lang === 'en' ? 'Freelance / Remote' : lang === 'hi' ? 'फ्रीलांस / रिमोट' : 'চুক্তিভিত্তিক / ফ্রিল্যান্স',
        time: lang === 'en' ? 'Flexible hours' : lang === 'hi' ? 'লचीला समय' : 'ফ্লেক্সিবল',
        phone: '+91 98XXX XXXXX',
        expectedWage: lang === 'en' ? '12,000 INR/project' : lang === 'hi' ? '12,000 INR/परियोजना' : '১২,০০০ টাকা/কাজ',
        about: lang === 'en' ? 'Experienced video content designer proficient with Premiere Pro and After Effects.' : lang === 'hi' ? 'एडोब प्रीमियर प्रो और आफ्टर इफेक्ट्स में कुशल अनुभवी वीडियो सामग्री डिजाइनर।' : 'পেশাদার ভিডিও এডিটিং সেবা প্রদান করি। এডোবি প্রিমিয়ার প্রো এবং আফটার ইফেক্টস এর ব্যবহারে পারদর্শী।',
        createdAt: Date.now() - 3600000 * 8,
        isDemo: true
      },
      {
        id: 'demo-w3',
        name: lang === 'en' ? 'Kabir Hossain (Electrician)' : lang === 'hi' ? 'कबीर हुसैन (इलेक्ट्रीशियन)' : 'কবীর হোসেন (ইলেকট্রিশিয়ান)',
        gender: 'Male',
        skills: lang === 'en' ? 'Wiring, fan repair, short circuit fix' : lang === 'hi' ? 'वायरिंग, पंखा मरम्मत, शॉर्ट सर्किट सुधार' : 'ওয়্যারিং, ফ্যান মেরামত, শর্ট সার্কিট সমাধান',
        location: 'কলকাতা (Kolkata)',
        country: 'india',
        state: 'west_bengal',
        district: 'kolkata',
        date: lang === 'en' ? 'Available now' : lang === 'hi' ? 'अभी उपलब्ध' : 'এখনই উপলব্ধ',
        time: lang === 'en' ? 'Flexible' : lang === 'hi' ? 'লচীলা সময়' : 'ফ্লেক্সিবল',
        phone: '+91 98XXX XXXXX',
        expectedWage: lang === 'en' ? '600 INR/day' : lang === 'hi' ? '600 INR/दिन' : '৬০০ টাকা/দিন',
        about: lang === 'en' ? 'Professional electrician with certified diploma. Quick troubleshooting.' : lang === 'hi' ? 'प्रमाणित डिप्लोमा के साथ पेशेवर इलेक्ट्रीशियन। त्वरित समस्या निवारण।' : 'সার্টিফাইড পেশাদার ইলেকট্রিশিয়ান। সব ধরণের ওয়্যারিং ও হোম অ্যাপ্লায়েন্স মেরামতের কাজ করা হয়।',
        createdAt: Date.now() - 3600000 * 10,
        isDemo: true
      }
    ];

    const workerTemplates = [
      {
        nameBn: 'রাজেশ কুমার (পেইন্টার)',
        nameHi: 'राजेश कुमार (पेंटर)',
        nameEn: 'Rajesh Kumar (Painter)',
        skillsBn: 'দেয়াল পেইন্টিং, প্লাস্টার, পুটি পলিশ',
        skillsHi: 'दीवार पेंटिंग, आंतरिक प्लास्टर, पुट्टी पॉलिश',
        skillsEn: 'Wall painting, interior plaster, wood polish',
        expectedWageBn: '৫০০ টাকা/দিন',
        expectedWageHi: '500 INR/दिन',
        expectedWageEn: '500/day',
        aboutBn: 'আমার ৮ বছরের পেইন্টিং কাজের অভিজ্ঞতা আছে। নিখুঁত ও পরিষ্কার ফিনিশিং কাজের নিশ্চয়তা।',
        aboutHi: 'मेरे पास घर की पेंटिंग का 8 साल का अनुभव है। मैं बेदाग काम और साफ फिनिशिंग की गारंटी देता हूं।',
        aboutEn: 'I have 8 years of house painting experience. I guarantee spotless work and clean finishing.',
        gender: 'Male',
        phone: '+880 1515 XXXXXX'
      },
      {
        nameBn: 'মিতালি ঘোষ (ভিডিও এডিটর)',
        nameHi: 'मिताली घोष (वीडियो एडिटर)',
        nameEn: 'Mitali Ghosh (Video Editor)',
        skillsBn: 'ইউটিউব ভিডিও এডিটিং, থাম্বনেইল ডিজাইন, মোশন গ্রাফিক্স',
        skillsHi: 'यूट्यूब वीडियो एडिटिंग, थंबनेल डिजाइन, मोशन ग्राफिक्स',
        skillsEn: 'YouTube editing, graphic design, social media thumbnails',
        expectedWageBn: '১২,০০০ টাকা/কাজ',
        expectedWageHi: '12,000 INR/काम',
        expectedWageEn: '12,000/project',
        aboutBn: 'পেশাদার ভিডিও এডিটিং সেবা প্রদান করি। এডোবি প্রিমিয়ার প্রো এবং আফটার ইফেক্টস এর ব্যবহারে পারদর্শী।',
        aboutHi: 'एडोब प्रीमियर प्रो और आफ्टर इफेक्ट्स में कुशल अनुभवी वीडियो सामग्री डिजाइनर।',
        aboutEn: 'Experienced video content designer proficient with Premiere Pro and After Effects.',
        gender: 'Female',
        phone: '+880 1616 XXXXXX'
      },
      {
        nameBn: 'কবীর হোসেন (ইলেকট্রিশিয়ান)',
        nameHi: 'कबीर हुसैन (इलेक्ट्रीशियन)',
        nameEn: 'Kabir Hossain (Electrician)',
        skillsBn: 'ওয়্যারিং, ফ্যান মেরামত, শর্ট সার্কিট সমাধান',
        skillsHi: 'वायरिंग, पंखा मरम्मत, शॉर्ट सर्किट सुधार',
        skillsEn: 'Wiring, fan repair, short circuit fix',
        expectedWageBn: '৬০০ টাকা/দিন',
        expectedWageHi: '600 INR/दिन',
        expectedWageEn: '600/day',
        aboutBn: 'সার্টিফাইড পেশাদার ইলেকট্রিশিয়ান। সব ধরণের ওয়্যারিং ও হোম অ্যাপ্লায়েন্স মেরামতের কাজ করা হয়।',
        aboutHi: 'प्रमाणित डिप्लोमा के साथ पेशेवर इलेक्ट्रीशियन। त्वरित समस्या निवारण।',
        aboutEn: 'Professional electrician with certified diploma. Quick troubleshooting.',
        gender: 'Male',
        phone: '+880 1717 XXXXXX'
      }
    ];

    let count = 0;
    for (const country of regionsData) {
      for (const state of country.states) {
        for (const dist of state.districts) {
          if (country.id === 'india' && state.id === 'west_bengal' && dist.id === 'kolkata') continue;

          for (let workerOffset = 0; workerOffset < 2; workerOffset++) {
            const templateIndex = (count + workerOffset) % workerTemplates.length;
            const tpl = workerTemplates[templateIndex];
            const locName = lang === 'en' ? `${dist.nameEn}, ${state.nameEn}` : `${dist.nameBn}, ${state.nameBn}`;
            list.push({
              id: `dynamic-worker-demo-${country.id}-${state.id}-${dist.id}-${workerOffset}`,
              name: lang === 'en' ? tpl.nameEn : lang === 'hi' ? tpl.nameHi : tpl.nameBn,
              gender: tpl.gender,
              skills: lang === 'en' ? tpl.skillsEn : lang === 'hi' ? tpl.skillsHi : tpl.skillsBn,
              location: locName,
              country: country.id,
              state: state.id,
              district: dist.id,
              date: lang === 'en' ? 'Available now' : lang === 'hi' ? 'अभी उपलब्ध' : 'এখনই উপলব্ধ',
              time: lang === 'en' ? 'Flexible' : lang === 'hi' ? 'লচীলা সময়' : 'ফ্লেক্সিবল',
              phone: tpl.phone,
              expectedWage: lang === 'en' ? tpl.expectedWageEn : lang === 'hi' ? tpl.expectedWageHi : tpl.expectedWageBn,
              about: lang === 'en' ? tpl.aboutEn : lang === 'hi' ? tpl.aboutHi : tpl.aboutBn,
              createdAt: Date.now() - 3600000 * (count % 48 + 1),
              isDemo: true
            });
          }
          count++;
        }
      }
    }
    return list;
  })();

  const mockBrokersDemo: BrokerPost[] = (() => {
    const list: BrokerPost[] = [
      {
        id: 'demo-b1',
        name: lang === 'en' ? 'Rajesh Sen' : lang === 'hi' ? 'राजेश सेन' : 'রাজেশ সেন',
        agency: lang === 'en' ? 'Kolkata Metro Labor Sourcing' : lang === 'hi' ? 'कोलकाता मेट्रो लेबर सोर्सिंग' : 'কলকাতা মেট্রো লেবার সোর্সিং',
        phone: '+91 98300 11223',
        location: 'কলকাতা (Kolkata)',
        country: 'india',
        state: 'west_bengal',
        district: 'kolkata',
        workerTypes: lang === 'en' ? 'Garments, Construction, Delivery riders' : lang === 'hi' ? 'गारमेंट्स, निर्माण, डिलीवरी राइडर्स' : 'গার্মেন্টস, কনস্ট্রাকশন, ডেলিভারি রাইডার্স',
        experience: lang === 'en' ? '5 Years' : lang === 'hi' ? '5 वर्ष' : '৫ বছর',
        description: lang === 'en' ? 'We provide skilled and unskilled laborers in bulk for industrial projects.' : lang === 'hi' ? 'हम औद्योगिक परियोजनाओं के लिए थोक में कुशल और अकुशल श्रमिक प्रदान करते हैं।' : 'আমরা যে কোনো ফ্যাক্টরি বা কন্সট্রাকশন প্রজেক্টের জন্য দক্ষ ও অদক্ষ শ্রমিক চুক্তি অনুযায়ী সরবরাহ করি।',
        createdAt: Date.now() - 3600000 * 12
      },
      {
        id: 'demo-b2',
        name: lang === 'en' ? 'Arvind Mishra' : lang === 'hi' ? 'अरविन्द मिश्रा' : 'অরবিন্দ মিশ্র',
        agency: lang === 'en' ? 'Mishra Labor Sourcing' : lang === 'hi' ? 'मिश्रा लेबर सोर्सिंग' : 'মিশ্র লেবার সোর্সিং',
        phone: '+91 98100 44556',
        location: 'দিল্লি (Delhi)',
        country: 'india',
        state: 'delhi',
        district: 'new_delhi',
        workerTypes: lang === 'en' ? 'Loading/Unloading, Logistics, Security guards' : lang === 'hi' ? 'लोडिंग/अनलोडिंग, लॉजिस्टिक्स, सुरक्षा गार्ड' : 'লোডিং-আনলোডিং, লজিস্টিকস, সিকিউরিটি গার্ড',
        experience: lang === 'en' ? '8 Years' : lang === 'hi' ? '8 वर्ष' : '৮ বছর',
        description: lang === 'en' ? 'Specialized in seaport logistic laborers, loaders, and security personnel.' : lang === 'hi' ? 'बंदरगाह रसद श्रमिकों, लोडरों और सुरक्षा कर्मियों में विशिष्ट।' : 'আমাদের এখানে অভিজ্ঞ লোডার, আনলোডার এবং ফ্যাক্টরি সোর্সিং সেবা দেয়া হয়।',
        createdAt: Date.now() - 3600000 * 14
      }
    ];

    return list;
  })();

  if (showPromoLanding) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
        {/* Dynamic Glowing Radial Ambient Orbs */}
        <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Premium Header */}
        <header className="bg-slate-950/80 border-b border-slate-900 sticky top-0 z-50 backdrop-blur-md px-4 py-3.5 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            {/* Logo Group */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 overflow-hidden border border-amber-400/30 shadow-lg flex items-center justify-center shrink-0">
                <img src={appLogo} alt="Bharat ka Kaam" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest bg-amber-400/10 px-1.5 py-0.5 rounded">SOHAGI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[8px] text-emerald-400 font-extrabold tracking-wider uppercase">{lang === 'bn' ? 'সার্ভার সচল' : 'LIVE SERVER'}</span>
                </div>
                <h1 className="text-sm md:text-base font-black text-white leading-tight">
                  {lang === 'bn' ? 'ভারত কা কাজ • ওয়েবসাইট' : lang === 'hi' ? 'भारत का काम • वेबसाइट' : 'Bharat ka Kaam • Official Website'}
                </h1>
              </div>
            </div>

            {/* Quick Actions & Language Switch */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {worldLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code as AppLanguage);
                      localStorage.setItem('app_google_lang', l.code);
                      handleSuccess(l.code === 'bn' ? '✓ ভাষা পরিবর্তন করা হয়েছে' : l.code === 'hi' ? '✓ भाषा बदली गई है' : '✓ Language switched');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      lang === l.code ? 'bg-[#0a2e50] text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="mr-1">{l.flag}</span>
                    {l.code.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Enter Web Version Button */}
              <button
                onClick={() => {
                  sessionStorage.setItem('dismissed_promo_landing', 'true');
                  setShowPromoLanding(false);
                  localStorage.setItem('app_onboarding_completed', 'true');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  handleSuccess(lang === 'bn' ? '🎉 সরাসরি ওয়েবসাইট ভার্সনে আপনাকে স্বাগতম!' : '🎉 Welcome to the Web App!');
                }}
                className="px-4 py-2 bg-[#0a2e50] border border-teal-500/30 hover:bg-[#072038] text-teal-300 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {lang === 'bn' ? 'ওয়েব ভার্সন চালান 🌐' : 'Use Web App 🌐'}
              </button>
            </div>
          </div>
        </header>

        {/* Success Toast */}
        {successToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-3 rounded-xl shadow-xl border border-emerald-400 animate-bounce flex items-center gap-2">
            <span>🎉</span>
            <span>{successToast}</span>
          </div>
        )}

        {/* Responsive Mobile-Only Language Switcher */}
        <div className="sm:hidden bg-slate-950/40 border-b border-slate-900/50 py-2.5 px-4 flex justify-center gap-2">
          {worldLanguages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code as AppLanguage);
                localStorage.setItem('app_google_lang', l.code);
                handleSuccess(l.code === 'bn' ? '✓ ভাষা পরিবর্তন করা হয়েছে' : l.code === 'hi' ? '✓ ভাষা बदली गई है' : '✓ Language switched');
              }}
              className={`px-3 py-1 text-[10px] font-black rounded-xl transition-all cursor-pointer ${
                lang === l.code ? 'bg-[#0a2e50] text-teal-400 border border-teal-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="mr-1">{l.flag}</span>
              {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Main Website Wrapper */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-12 z-10 relative">
          
          {/* Hero Promo Badge */}
          <div className="flex justify-center select-none">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-4 py-2 rounded-full text-amber-400 font-black text-[11px] tracking-widest uppercase animate-pulse shadow-md">
              <span>🔥</span>
              {lang === 'bn' ? '১০০% দালাল-মুক্ত ও ফ্রি অফিশিয়াল মোবাইল এ্যাপ পোর্টাল' : '100% Free & Official Mobile App Hub'}
            </div>
          </div>

          {/* Core Hero Branding Section */}
          <div className="space-y-4 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {lang === 'bn' ? (
                <>দালাল ছাড়াই সরাসরি কাজ ও কর্মী খোঁজার <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">১০০% ফ্রি মোবাইল অ্যাপ!</span></>
              ) : lang === 'hi' ? (
                <>बिना दलाल के सीधे काम और मजदूर खोजने का <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">100% फ्री मोबाइल ऐप!</span></>
              ) : (
                <>Find Local Jobs & Hire Workers directly <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">with ZERO commission!</span></>
              )}
            </h2>
            <p className="text-xs md:text-base text-slate-300 font-semibold leading-relaxed max-w-2xl mx-auto">
              {lang === 'bn' ? (
                'ভারত কা কাজ (Bharat ka Kaam) - আপনার এলাকায় দর্জি কারখানা, গার্মেন্টস, কাটিং মাস্টার, হেল্পার, ডেলিভারি চালক, বা দৈনিক মজুরির কাজ খুঁজুন সরাসরি কলের মাধ্যমে। কোনো দালালি চার্জ নেই, কোনো হিডেন ফী নেই!'
              ) : lang === 'hi' ? (
                'भारत का काम (Bharat ka Kaam) - अपने क्षेत्र में गारमेंट्स, टेलर, कटिंग मास्टर, सहायक, और दैनिक श्रम के काम सीधे मालिक को कॉल करके पाएं। कोई कमीशन नहीं!'
              ) : (
                'Bharat ka Kaam - Connects workers & employers directly. Find tailoring, garments, delivery, construction, factory, and other daily labor jobs near you in just 1-click via direct phone call.'
              )}
            </p>

            {/* Direct Instant Action Links */}
            <div className="flex flex-wrap justify-center gap-4 pt-3 select-none">
              <a
                href="#download-section"
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                📥 {lang === 'bn' ? 'এপিকে (APK) ডাউনলোড করুন' : 'Download Mobile APK'}
              </a>
              <button
                onClick={() => {
                  sessionStorage.setItem('dismissed_promo_landing', 'true');
                  setShowPromoLanding(false);
                  localStorage.setItem('app_onboarding_completed', 'true');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                🌐 {lang === 'bn' ? 'সরাসরি ওয়েবসাইটে ব্যবহার করুন' : 'Continue on Web Version'}
              </button>
            </div>
          </div>

          {/* Interactive Showcase Tabs Area (Aesthetic App Preview Mockup) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-36 h-36 bg-[#0a2e50]/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[10px] font-black uppercase text-teal-400 tracking-widest">Interactive App Preview</span>
              <h3 className="text-lg md:text-xl font-black text-white">
                {lang === 'bn' ? 'অ্যাপটিতে আপনি কি কি করতে পারবেন?' : 'What can you do with this app?'}
              </h3>
              <p className="text-xs text-slate-400 font-bold max-w-xl">
                {lang === 'bn' ? 'অ্যাপের ৩টি প্রধান সুবিধা নিচে ক্লিক করে দেখুন এবং যেকোনো একটি কাজে জয়েন করুন:' : 'Select any of the 3 main portals of the app to see how it works:'}
              </p>
            </div>

            {/* Tab Selectors */}
            <div className="flex flex-col sm:flex-row gap-2 border-b border-slate-800 pb-3 select-none">
              <button
                onClick={() => setPromoTab('workers')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  promoTab === 'workers' 
                    ? 'bg-[#0a2e50] text-teal-300 border border-teal-500/30' 
                    : 'bg-slate-950/40 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <span>🛠️</span>
                {lang === 'bn' ? 'কাজ খুঁজুন (Workers)' : 'Job Seekers'}
              </button>
              <button
                onClick={() => setPromoTab('employers')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  promoTab === 'employers' 
                    ? 'bg-[#0a2e50] text-teal-300 border border-teal-500/30' 
                    : 'bg-slate-950/40 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <span>🏢</span>
                {lang === 'bn' ? 'কর্মী খুঁজুন (Recruiters)' : 'Employers / Factory'}
              </button>
              <button
                onClick={() => setPromoTab('brokers')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  promoTab === 'brokers' 
                    ? 'bg-[#0a2e50] text-teal-300 border border-teal-500/30' 
                    : 'bg-slate-950/40 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <span>🤝</span>
                {lang === 'bn' ? 'দালাল পোর্টাল (Agents)' : 'Sourcing Broker Port'}
              </button>
            </div>

            {/* Tab Display Screens */}
            <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/60 animate-in fade-in duration-300">
              {promoTab === 'workers' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">
                        Active Job Portal
                      </span>
                      <h4 className="text-base font-black text-white">
                        {lang === 'bn' ? 'দর্জি ও গার্মেন্টস কাজের জন্য সরাসরি নিয়োগ' : 'Tailoring & Garments Direct Openings'}
                      </h4>
                    </div>
                    <span className="text-3xl">🪡</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {lang === 'bn' 
                      ? 'অপারেটর, আয়রন ম্যান, কাটিং মাস্টার, হেল্পার বা পিয়নরা আমাদের লাইভ ফিডে থাকা শত শত চাকরির বিজ্ঞাপন দেখে সরাসরি ফ্যাক্টরি বা কারখানার মালিকের নাম্বারে বা হোয়াটসঅ্যাপে কল করতে পারেন। মাঝখানে কোনো মধ্যভোগী বা দালালি কমিশন নেই।'
                      : 'Workers can browse daily job listings for garments, tailoring, delivery drivers, and construction helpers. View recruiter phone numbers instantly and call them in just 1-tap with absolutely zero commission.'
                    }
                  </p>

                  {/* Simulated App List */}
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-850 space-y-2 text-left">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
                      🔥 {lang === 'bn' ? 'চলমান কাজের বিজ্ঞাপন (উদাহরণ):' : 'Sample Active Jobs:'}
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-white">দরজি কারিগর প্রয়োজন (Tailoring Master)</p>
                        <p className="text-[10px] text-slate-400 font-bold">সেভিংস গার্মেন্টস • ঢাকা, উত্তরা • দৈনিক ৪৫০ টাকা</p>
                      </div>
                      <button className="px-2.5 py-1 bg-teal-500 text-slate-950 font-black text-[9px] rounded-md shrink-0">
                        📞 CALL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {promoTab === 'employers' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">
                        Recruiter Dashboard
                      </span>
                      <h4 className="text-base font-black text-white">
                        {lang === 'bn' ? 'ফ্যাক্টরি বা কারখানার জন্য কর্মী নিয়োগ দিন' : 'Recruit Qualified Local Staff Instantly'}
                      </h4>
                    </div>
                    <span className="text-3xl">🏢</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {lang === 'bn' 
                      ? 'আপনি কি একজন গার্মেন্টস বা ফ্যাক্টরি মালিক? এখন থেকে কর্মী খোঁজার জন্য পোস্টার লাগাতে হবে না! আমাদের অ্যাপে ১ ক্লিকে ফ্রিতে বিজ্ঞাপন দিন। আপনার এলাকায় আজ কতজন সক্রিয় ট্রেইলার্স কাজ খুঁজছে তাদের প্রোফাইল দেখে সরাসরি ফোন করুন।'
                      : 'Post unlimited free job vacancies for tailoring shops, factories, garments, construction, or shipping. Get direct responses from verified workers looking for jobs around your neighborhood.'
                    }
                  </p>

                  {/* Simulated Workers List */}
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-850 space-y-2 text-left">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
                      👥 {lang === 'bn' ? 'উপলব্ধ কর্মী তালিকা (আজকে সক্রিয়):' : 'Available Active Workers:'}
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-white">রাজেশ কুমার (অভিজ্ঞ দর্জি কারিগর)</p>
                        <p className="text-[10px] text-slate-400 font-bold">স্কিল: জ্যাকেট, শার্ট ফিটিং • ক্যাটাগরি: দর্জি কারিগর</p>
                      </div>
                      <button className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-md shrink-0">
                        {lang === 'bn' ? 'কল করুন' : 'CALL'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {promoTab === 'brokers' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">
                        Broker & Sourcing Network
                      </span>
                      <h4 className="text-base font-black text-white">
                        {lang === 'bn' ? 'নিবন্ধিত দালাল ও সোর্সিং এজেন্ট ডিরেক্টরি' : 'Registered Brokers & Sourcing Network'}
                      </h4>
                    </div>
                    <span className="text-3xl">🤝</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    {lang === 'bn' 
                      ? 'দালাল বা এজেন্টরা আমাদের অ্যাপের মাধ্যমে ফ্যাক্টরির কন্ট্রাক্ট নিয়ে বিশ্বস্ত কর্মী সরবরাহ করতে পারেন। নিজের সার্ভিস ও সোর্সিং রেট প্রমোট করুন সহজে।'
                      : 'Sourcing agents and brokers can manage their worker pools, check recruitment orders, contact direct companies, and manage placement deals efficiently.'
                    }
                  </p>

                  {/* Simulated Brokers List */}
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-850 space-y-2 text-left">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
                      💼 {lang === 'bn' ? 'সক্রিয় এজেন্ট (উদাহরণ):' : 'Sample Sourcing Agents:'}
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-white">করিম সোর্সিং এজেন্সি (Karim Sourcing)</p>
                        <p className="text-[10px] text-slate-400 font-bold">এলাকা: সাভার, ঢাকা • ক্যাটাগরি: গার্মেন্টস কর্মী সোর্স</p>
                      </div>
                      <button className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-md shrink-0">
                        {lang === 'bn' ? 'কল করুন' : 'CALL'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GIGANTIC APK DOWNLOAD CENTER */}
          <div id="download-section" className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left ring-1 ring-amber-500/25">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#0a2e50]/80 border border-teal-500/30 rounded-2xl flex items-center justify-center text-teal-400 text-2xl shadow-inner shrink-0 animate-bounce">
                🤖
              </div>
              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full inline-block">
                  {lang === 'bn' ? 'অফিশিয়াল এন্ড্রয়েড এপিকে (.APK)' : 'Official Android Installer'}
                </span>
                <h3 className="text-lg font-black text-white mt-1 leading-tight">
                  {lang === 'bn' ? 'মোবাইল অ্যাপ সরাসরি ডাউনলোড করুন' : 'Direct APK Installer Center'}
                </h3>
              </div>
            </div>

            {/* Pulsating Download Action Button */}
            <a
              href={remoteConfig.forceUpdateUrl || `${getLiveAppUrl()}/bharat_ka_kaam.apk`}
              download="Bharat_ka_Kaam.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs md:text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-98 text-center flex items-center justify-center gap-3 cursor-pointer ring-4 ring-emerald-500/20 hover:shadow-emerald-500/10"
              onClick={() => {
                handleSuccess(lang === 'bn' ? '📥 ডাউনলোড শুরু হচ্ছে...' : '📥 Starting download...');
              }}
            >
              <span className="text-xl animate-pulse">📥</span>
              <span>{lang === 'bn' ? 'মোবাইল এ্যাপ (.APK) ডাউনলোড করুন' : 'DOWNLOAD ANDROID APK NOW'}</span>
            </a>

            {/* Stats row */}
            <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-400 font-extrabold border-t border-slate-900 pt-4.5 gap-2 select-none">
              <span>📂 {lang === 'bn' ? 'ফাইলের সাইজ: ~৩.৬ এমবি (সুপার লাইট)' : 'Size: ~3.6 MB (Super Light)'}</span>
              <span>⚡ {lang === 'bn' ? 'অ্যাপ ভার্সন: ১.০.০ (লেটেস্ট রিলিজ)' : 'Version: 1.0.0 (Latest)'}</span>
              <span className="text-emerald-400">🛡️ {lang === 'bn' ? 'গুগল সিকিউর স্ক্যান সম্পন্ন' : '100% Safe & Secure'}</span>
            </div>
          </div>

          {/* Easy Step-by-Step Installation Guide */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 text-left space-y-4">
            <h4 className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-2 select-none">
              <span>📲</span>
              {lang === 'bn' ? 'সহজ ৩-ধাপে অ্যাপ ইন্সটল করার নিয়ম:' : 'Simple 3-Step App Installation Guide:'}
            </h4>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] flex items-center justify-center shrink-0 select-none">1</span>
                <div>
                  <p className="font-black text-white">{lang === 'bn' ? 'ডাউনলোড সম্পূর্ণ করুন' : 'Download the APK File'}</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5 leading-relaxed">
                    {lang === 'bn' ? 'উপরের সবুজ বাটনে ক্লিক করে ফাইলটি নামিয়ে নিন। ফাইলটি আপনার মেমোরির "Downloads" ফোল্ডারে সেভ হবে।' : 'Click the download button above. Locate the saved apk file in your system notification bar or your phone File Manager under Downloads.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] flex items-center justify-center shrink-0 select-none">2</span>
                <div>
                  <p className="font-black text-white">{lang === 'bn' ? '"Install Anyway" এ ট্যাপ করুন (Play Protect Warning)' : 'Select "Install Anyway" (If Blocked)'}</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5 leading-relaxed">
                    {lang === 'bn' ? 'গুগল প্লে স্টোরের বাইরে কাস্টম এপিকে ইন্সটল করার সময় অ্যান্ড্রয়েড সতর্ক করতে পারে। আপনি নিশ্চিন্তে "More Details" এ ক্লিক করে "Install Anyway" দিন।' : 'Since this is our custom secure build developed in AI Studio, Google Play Protect may prompt. Click "More details" and tap "Install Anyway" to continue.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] flex items-center justify-center shrink-0 select-none">3</span>
                <div>
                  <p className="font-black text-white">{lang === 'bn' ? 'ভাষা সিলেক্ট করে চালু করুন!' : 'Select Your Preferred Language!'}</p>
                  <p className="text-[11px] text-slate-400 font-bold mt-0.5 leading-relaxed">
                    {lang === 'bn' ? 'ইনস্টলেশন সফল হওয়ার পর অ্যাপটি ওপেন করে আপনার ভাষা (বাংলা/হিন্দি/ইংরেজি) নির্বাচন করে ১ ক্লিকে ব্যবহার করা শুরু করুন।' : 'Open the installed app, set your language preference, and start Sourcing workers or applying for tailored local vacancies immediately.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1 select-none">
              <span>❓</span>
              {lang === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQs):' : 'Frequently Asked Questions:'}
            </h4>

            <div className="space-y-2 select-none">
              {[
                {
                  q_bn: 'প্রশ্ন: ইন্সটল করার সময় Play Protect Blocked দেখালে কি করব?',
                  q_hi: 'सवाल: इंस्टॉल करते समय Play Protect चेतावनी आने पर क्या करें?',
                  q_en: 'FAQ: What if Play Protect blocks or warns during installation?',
                  a_bn: 'উত্তর: ভারত কা কাজ আমাদের এআই স্টুডিওতে ডেভেলপ করা একটি ১০০% নিরাপদ ফাইল। গুগল প্লে-স্টোরের বাইরে থেকে যেকোনো এপিকে ইন্সটল করার সময় এন্ড্রয়েড প্লে প্রোটেক্ট সতর্ক করতে পারে। আপনি নিশ্চিন্তে "More Details" এ ক্লিক করে "Install Anyway" তে ট্যাপ করে ইন্সটল করতে পারেন। এটি সম্পূর্ণ নিরাপদ।',
                  a_hi: 'उत्तर: यह ऐप पूरी तरह सुरक्षित है। चूंकि यह सीधे गूगल एआई स्टूडियो से बनाया गया है, एंड्रॉइड प्ले प्रोटेक्ट चेतावनी दे सकता है। आप बिना किसी चिंता के "More Details" पर क्लिक करके "Install Anyway" दबाएं।',
                  a_en: 'Answer: Our app is a custom build developed securely in Google AI Studio. Android displays a warning for any app installed outside of the official Play Store. This is 100% safe. Simply click "More Details" and select "Install Anyway" to proceed.'
                },
                {
                  q_bn: 'প্রশ্ন: এই অ্যাপের জন্য কি কোনো চার্জ বা দালেরি কমিশন দিতে হবে?',
                  q_hi: 'सवाल: क्या ऐप का इस्तेमाल करने के लिए पैसे देने होंगे?',
                  q_en: 'FAQ: Is there any registration fee or broker commission?',
                  a_bn: 'উত্তর: না! ভারত কা কাজ ১০০% ফ্রি এবং আজীবন ফ্রি থাকবে। কাজ খোঁজা, কাজের লোক নিয়োগ দেওয়া বা দালাল পোর্টাল ব্যবহারের জন্য ১ টাকাও চার্জ বা কমিশন দিতে হয় না। সব সরাসরি লেনদেন হবে।',
                  a_hi: 'उत्तर: बिल्कुल नहीं! यह ऐप आपके लिए जीवनभर 100% फ्री है। किसी भी नौकरी के लिए कॉल करने या मजदूर से संपर्क करने के लिए कोई दलाल शुल्क या कमीशन नहीं लिया जाता है।',
                  a_en: 'Answer: No! Bharat ka Kaam is 100% free and will remain free forever. We do not charge any fee or cut any commission on salaries.'
                },
                {
                  q_bn: 'প্রশ্ন: নতুন আপডেট দিলে সেটি আমার ফোনে থাকা অ্যাপে কিভাবে আসবে?',
                  q_hi: 'सवाल: ऐप में नया बदलाव आने पर मोबाइल ऐप में अपडेट कैसे मिलेगा?',
                  q_en: 'FAQ: How do updates from AI Studio reflect on my mobile app?',
                  a_bn: 'উত্তর: আমাদের এপিকে অ্যাপটি একটি উন্নত ক্লাউড কন্টেইনার সিঙ্ক প্রযুক্তি ব্যবহার করে। তাই আমরা এআই স্টুডিওতে কোনো নতুন পরিবর্তন বা সমস্যা সংশোধন করার সাথে সাথেই আপনার ফোনে থাকা অ্যাপটিতে সেটি অটোমেটিক আপডেট হয়ে যাবে! আপনাকে বারবার নতুন করে এপিকে ডাউনলোড বা ইন্সটল করতে হবে না।',
                  a_hi: 'उत्तर: हमारी ऐप क्लाउड सर्वर से जुड़ी है। जैसे ही हम कोई नई सुविधा या बदलाव एआई स्टुडियो में जोड़ेंगे, वह सीधे आपके फोन में ऑटो-अपडेट हो जाएगी।',
                  a_en: 'Answer: This app uses advanced real-time cloud-sync integration. Any edits, fixes, or feature updates deployed in AI Studio reflect instantly inside your installed app. You do not need to download the APK again for standard updates.'
                }
              ].map((item, index) => {
                const isSelected = activePromoFaq === index;
                const question = lang === 'bn' ? item.q_bn : lang === 'hi' ? item.q_hi : item.q_en;
                const answer = lang === 'bn' ? item.a_bn : lang === 'hi' ? item.a_hi : item.a_en;
                
                return (
                  <div key={index} className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-800">
                    <button
                      onClick={() => setActivePromoFaq(isSelected ? null : index)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors text-xs font-black text-slate-100 cursor-pointer"
                    >
                      <span className="pr-3 leading-snug">{question}</span>
                      <span className={`text-teal-400 text-xs shrink-0 transition-transform ${isSelected ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isSelected && (
                      <div className="px-5 pb-5 text-[11px] font-bold text-slate-400 leading-relaxed border-t border-slate-900/50 pt-3 bg-slate-950/40">
                        {answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Floating Download Button on Mobile */}
        <div className="sm:hidden fixed bottom-6 left-6 right-6 z-50">
          <a
            href={remoteConfig.forceUpdateUrl || `${getLiveAppUrl()}/bharat_ka_kaam.apk`}
            download="Bharat_ka_Kaam.apk"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl text-center flex items-center justify-center gap-2 cursor-pointer ring-4 ring-emerald-500/20"
          >
            <span>📥</span>
            <span>{lang === 'bn' ? 'অ্যাপ (.APK) নামিয়ে নিন' : 'GET THE APP'}</span>
          </a>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-[10px] text-slate-500 font-bold uppercase select-none mt-12">
          <p>© {new Date().getFullYear()} BHARAT KA KAAM CORP. ALL RIGHTS RESERVED.</p>
        </footer>
      </div>
    );
  }

  const combinedJobs = [...jobs, ...localJobs];
  const combinedWorkers = [...workers, ...localWorkers];
  const combinedBrokers = [...brokers, ...localBrokers];

  // filteredBrokers
  const filteredBrokers = combinedBrokers.filter(b => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (b.name || '').toLowerCase();
      const agency = (b.agencyName || b.agency || '').toLowerCase();
      const phone = (b.phone || '').toLowerCase();
      const loc = (b.location || '').toLowerCase();
      const workerTypes = (b.workerTypes || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      return name.includes(q) || agency.includes(q) || phone.includes(q) || loc.includes(q) || workerTypes.includes(q) || desc.includes(q);
    }
    return true;
  });

  // filteredJobs
  const filteredJobs = combinedJobs.filter(j => {
    if (isJobExpired(j)) return false;
    if (!matchesLocationFilter(j)) return false;
    if (selectedCategory !== 'all') {
      if (getCategoryForPost(j.title, j.description) !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (j.title || '').toLowerCase();
      const desc = (j.description || '').toLowerCase();
      const comp = (j.company || '').toLowerCase();
      const phone = (j.phone || '').toLowerCase();
      const type = (j.jobType || '').toLowerCase();
      const skills = (j.skillsRequired || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || comp.includes(q) || phone.includes(q) || type.includes(q) || skills.includes(q);
    }
    return true;
  });

  // filteredWorkers
  const filteredWorkers = combinedWorkers.filter(w => {
    if (!matchesLocationFilter(w)) return false;
    if (selectedCategory !== 'all') {
      if (getCategoryForPost(w.name + ' ' + w.skills, w.about) !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (w.name || '').toLowerCase();
      const skills = (w.skills || '').toLowerCase();
      const about = (w.about || '').toLowerCase();
      const phone = (w.phone || '').toLowerCase();
      return name.includes(q) || skills.includes(q) || about.includes(q) || phone.includes(q);
    }
    return true;
  });

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden text-white">
          {/* Decorative glowing background */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#0a2e50] rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-950 rounded-full blur-3xl opacity-30" />
          
          <div className="relative space-y-4 animate-in fade-in zoom-in duration-300">
            {/* Animated Wi-Fi Off Icon */}
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-md">
              <span className="text-4xl animate-pulse">📶❌</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                ইন্টারনেট সংযোগ নেই!
              </h2>
              <h3 className="text-sm font-bold text-slate-400">
                No Internet Connection
              </h3>
            </div>

            <div className="text-xs text-slate-400 font-semibold leading-relaxed space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 text-left">
              <p className="text-slate-200">
                এই অ্যাপ্লিকেশনটি শুধুমাত্র অনলাইন মোডে কাজ করে। অনুগ্রহ করে আপনার ওয়াই-ফাই (Wi-Fi) বা মোবাইল ডাটা (Mobile Data) চালু করুন।
              </p>
              <p className="text-slate-400 italic">
                This application only works online. Please enable your Wi-Fi or mobile data connection to continue.
              </p>
            </div>

            <button
              onClick={() => {
                if (typeof navigator !== 'undefined') {
                  setIsOnline(navigator.onLine);
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer hover:shadow-lg"
            >
              🔄 আবার চেষ্টা করুন / Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isUpdateRequired()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center select-none font-sans text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-5 shadow-2xl relative overflow-hidden">
          {/* Decorative glowing background or elements */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />

          {/* Icon / Brand badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0a2e50] to-[#0d3f6d] text-white flex items-center justify-center mx-auto shadow-md border border-white/10 overflow-hidden">
            <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider">
              {lang === 'bn' ? '⚠️ নতুন আপডেট উপলব্ধ!' : '⚠️ New Update Required!'}
            </h2>
            <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest">
              {lang === 'bn' ? 'ভার্সন আপডেট করুন • অ্যাপটি সচল রাখুন' : 'App Version Upgrade Required'}
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left">
            <p className="text-xs text-slate-200 font-bold leading-relaxed">
              {lang === 'bn' 
                ? (remoteConfig.forceUpdateMessageBn || 'আপনার ফোনের অ্যাপটি অনেক পুরনো হয়ে গেছে। নতুন সমস্ত ধামাকা ফিচার ও ডাটা সুরক্ষার জন্য এখনই নতুন এপিকে (APK) টি ইন্সটল করা বাধ্যতামূলক।')
                : (remoteConfig.forceUpdateMessageEn || 'Your app version is outdated. To protect your data and access all the premium real-time features, you must upgrade now.')
              }
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <a
              href={remoteConfig.forceUpdateUrl || `${getLiveAppUrl()}/bharat_ka_kaam.apk`}
              download="Bharat_ka_Kaam_Latest.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📥</span>
              <span>{lang === 'bn' ? 'নতুন এপিকে (APK) ইন্সটল করুন' : 'DOWNLOAD LATEST APK NOW'}</span>
            </a>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-slate-700/60 cursor-pointer"
            >
              🔄 {lang === 'bn' ? 'রিফ্রেশ করে ট্রাই করুন' : 'REFRESH & RETRY'}
            </button>
          </div>

          <div className="text-[9px] text-slate-500 font-bold">
            {lang === 'bn' 
              ? `বর্তমান ভার্সন: ${CURRENT_VERSION} ➔ নতুন ভার্সন: ${remoteConfig.minRequiredVersion}`
              : `Current version: ${CURRENT_VERSION} ➔ Required version: ${remoteConfig.minRequiredVersion}`
            }
          </div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen 
        onComplete={handleOnboardingComplete} 
        onTriggerLogin={() => {
          setShowOnboarding(false);
          setShowLoginModal(true);
        }} 
      />
    );
  }

  if (deviceLockStatus === 'pending' || deviceLockStatus === 'rejected') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 opacity-80" />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-3xl w-full max-w-md p-8 space-y-6 text-center shadow-2xl relative backdrop-blur-md"
        >
          {deviceLockStatus === 'pending' ? (
            <>
              {/* Pending visual */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-2 bg-amber-500/15 rounded-full animate-pulse" />
                <div className="w-16 h-16 bg-slate-950 border-2 border-amber-500 text-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative">
                  🔒
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
                  {lang === 'bn' ? 'লগইন অনুমোদনের অপেক্ষায়' : 'Waiting for Device Approval'}
                </h2>
                <p className="text-xs text-teal-400 font-extrabold uppercase tracking-widest font-mono">
                  {userProfile?.phone}
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 text-left space-y-2.5">
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  {lang === 'bn' 
                    ? '⚠️ এই ফোন নম্বরটি ইতিমধ্যে অন্য একটি ডিভাইসে রেজিস্টার করা আছে।' 
                    : '⚠️ This mobile number is already registered on another device.'}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {lang === 'bn' 
                    ? 'আপনার মূল ডিভাইসে একটি একসেপ্ট নোটিফিকেশন পাঠানো হয়েছে। লগইন সম্পন্ন করতে দয়া করে আগের মোবাইল বা কম্পিউটারে অনুমোদন করুন।' 
                    : 'An approval prompt was sent to your primary logged-in device. Please accept it there to authorize this login.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 py-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </>
          ) : (
            <>
              {/* Rejected visual */}
              <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-lg">
                ❌
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
                  {lang === 'bn' ? 'লগইন অনুরোধ প্রত্যাখ্যাত' : 'Login Request Denied'}
                </h2>
                <p className="text-xs text-rose-400 font-extrabold uppercase tracking-widest font-mono">
                  {userProfile?.phone}
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed p-4 bg-slate-950/60 rounded-2xl border border-slate-850">
                {lang === 'bn' 
                  ? '❌ দুঃখিত, আপনার মূল ডিভাইস এই লগইন অনুরোধটি প্রত্যাখ্যান করেছে। আপনি এই নম্বরে প্রবেশ করতে পারবেন না।' 
                  : '❌ Sorry, your primary device has declined this login authorization request.'}
              </p>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              // Cancel login, remove local storage fields, and trigger reset
              localStorage.removeItem('app_user_logged_in');
              localStorage.removeItem('app_user_name');
              localStorage.removeItem('app_user_phone');
              localStorage.removeItem('app_user_role');
              setUserProfile(null);
              setDeviceLockStatus('authorized');
              window.dispatchEvent(new Event('app_user_profile_updated'));
            }}
            className="w-full py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-800 cursor-pointer text-center"
          >
            {lang === 'bn' ? '← বাতিল করুন ও পিছনে যান' : '← Cancel & Go Back'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (isAdminWebsiteView) {
    return (
      <>
        <AdminDashboard
          jobs={jobs}
          workers={workers}
          brokers={brokers}
          paymentAttempts={paymentAttempts}
          rawSmsLogs={rawSmsLogs}
          lang={lang}
          setLang={setLang}
          onDeletePost={handleAdminDeletePost}
          onApprovePayment={handleApprovePayment}
          onBackToApp={() => {
            setIsAdminWebsiteView(false);
            // Clean URL parameters so it returns to standard view
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }}
          remoteConfig={remoteConfig}
          onSaveConfig={async (config) => {
            try {
              if (!isFirebaseAvailable) {
                throw new Error("Firebase is not initialized");
              }
              await setDoc(doc(db, 'app_config', 'system_control'), config, { merge: true });
              
              setRemoteConfig(prev => ({
                ...prev,
                ...config
              }));
              
              handleSuccess(
                lang === 'bn' 
                  ? '✓ সিস্টেম কনফিগারেশন সফলভাবে ক্লাউডে সেভ হয়েছে!' 
                  : '✓ System configuration successfully saved to Cloud!'
              );
            } catch (err: any) {
              console.error("Failed to save config from AdminDashboard", err);
              handleFirestoreError(err, OperationType.UPDATE, 'app_config');
            }
          }}
          loadingAttempts={loadingAttempts}
          loadingSms={loadingSmsLogs}
        />
        {adminPaymentAlert && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none animate-bounce">
            <div className="bg-slate-900/95 border-2 border-amber-500 text-amber-200 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 select-none pointer-events-auto">
              <span className="text-xl shrink-0">🔔</span>
              <div className="flex-1 text-left">
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  {lang === 'bn' ? 'নতুন পেমেন্ট অনুরোধ!' : 'New Payment Request!'}
                </p>
                <p className="text-[10px] font-semibold text-slate-300 mt-0.5">
                  {adminPaymentAlert}
                </p>
              </div>
              <button 
                onClick={() => setAdminPaymentAlert(null)}
                className="text-slate-400 hover:text-white text-[10px] uppercase font-bold px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer transition-colors"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (directProfile) {
    return (
      <PersonalProfileWebsite
        profileId={directProfile.id}
        profileType={directProfile.type}
        initialLang={lang}
        onBackToApp={() => {
          setDirectProfile(null);
          // clean URL query parameters so it goes back to default view
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Premium Header */}
      <header className="bg-gradient-to-r from-[#051c33] via-[#0a2e50] to-[#051c33] border-b border-[#0d345c]/40 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Brand/Logo & Profile Group */}
          <div className="flex flex-col items-start gap-1 select-none">
            {/* Logo and Name row */}
            <div 
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
              title={lang === 'bn' ? 'হোম ড্যাশবোর্ড' : 'Home Dashboard'}
            >
              {/* Main Official App Logo Badge inside Top Header */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setLogoClicks(prev => {
                    const next = prev + 1;
                    if (next >= 5) {
                      setShowAdminControl(true);
                      handleSuccess(lang === 'bn' ? '👑 সিস্টেম কন্ট্রোল প্যানেল ওপেন করা হয়েছে!' : '👑 System Control Center Opened!');
                      return 0;
                    }
                    return next;
                  });
                }}
                className="w-8.5 h-8.5 rounded-xl bg-slate-950 overflow-hidden border border-amber-400/50 shadow-md flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
              >
                <img src={appLogo} alt="Bharat ka Kaam Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>

              <div>
                <h1 className="text-xs sm:text-sm font-black text-white leading-tight">
                  {t.appTitle}
                </h1>
              </div>
            </div>

            {/* Profile Settings Option - Placed simply under App Title/Logo, borderless, no background box */}
            <div 
              onClick={() => {
                if (!userProfile) {
                  setShowLoginModal(true);
                } else {
                  setProfileActiveTab('settings');
                  setShowProfileSettings(true);
                }
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:text-amber-300 text-slate-300 transition-colors py-0.5"
              title={lang === 'bn' ? 'প্রোফাইল ফটো ও সেটিংস' : 'Profile Photo & Settings'}
            >
              {/* Profile Photo (DP) - Clean simple round circle */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#0a2e50] to-[#041a31] border border-white/20 flex items-center justify-center text-white shrink-0 relative">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[11px] font-black">👤</span>
                )}
                {userProfile && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#051c33] animate-pulse" />
                )}
              </div>
              
              {/* Profile Name & Status - Text next to simple DP */}
              <div className="text-left leading-none">
                <span className="text-[9.5px] font-bold text-white hover:text-amber-300 block truncate max-w-[120px]">
                  {userProfile 
                    ? getTransliteratedName(userProfile.name, lang) 
                    : (lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings')}
                </span>
                <span className="text-[7.5px] text-sky-300 hover:text-white block mt-0.5">
                  {userProfile 
                    ? ('@' + getTransliteratedName(userProfile.name, 'en').toLowerCase().replace(/\s+/g, '')) 
                    : (lang === 'bn' ? 'ডিপি সেট করুন' : 'Set DP')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 select-none">
            {/* AI Help Center Trigger Button */}
            <button 
              onClick={() => setShowHelpCenter(true)}
              className="relative p-1.5 hover:bg-white/10 rounded-lg text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              title={lang === 'bn' ? 'এআই হেল্প সেন্টার' : 'AI Help Center'}
            >
              <Headphones size={16} className="hover:scale-110 transition-transform duration-300" />
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 px-1.5 py-0.5 rounded-full border border-amber-400/30 hidden xs:inline-block">
                {lang === 'bn' ? 'হেল্প' : 'Help'}
              </span>
            </button>

            {/* Notification Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-1.5 hover:bg-white/10 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <Bell size={16} />
                {visibleNotifications.filter(n => !n.status || n.status === 'pending').some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                )}
                {visibleNotifications.filter(n => !n.status || n.status === 'pending').some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {showNotificationsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-2 space-y-1.5"
                  >
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                      </h4>
                      {visibleNotifications.filter(n => !n.status || n.status === 'pending').some(n => !n.read) && (
                        <button 
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                          className="text-[9px] font-black text-teal-600 hover:underline cursor-pointer"
                        >
                          {lang === 'bn' ? 'সব পঠিত' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-none p-1">
                      {visibleNotifications.filter(n => !n.status || n.status === 'pending').length === 0 ? (
                        <p className="text-[10px] text-center text-slate-400 py-4 font-bold">
                          {lang === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'No new notifications'}
                        </p>
                      ) : (
                        visibleNotifications.filter(n => !n.status || n.status === 'pending').map((n) => {
                          const isRecruitment = !!n.companyPhone;
                          return (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                if (n.jobPost) handleViewJobDetails(n.jobPost);
                                setNotifications(prev => prev.map(not => not.id === n.id ? { ...not, read: true } : not));
                                if (!isRecruitment) setShowNotificationsDropdown(false);
                              }}
                              className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors border border-slate-100 ${
                                n.read ? 'hover:bg-slate-50 bg-white' : 'bg-teal-50/40 hover:bg-teal-50/60 border-teal-100/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                                  <span>{isRecruitment ? '🛡️' : '💼'}</span>
                                  {n.title}
                                </h5>
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase shrink-0">{n.time}</span>
                              </div>
                              <p className="text-[9.5px] text-slate-600 leading-snug mt-1 font-semibold">{n.text}</p>
                              
                              {/* Direct SMS and Chat options for the Broker */}
                              {isRecruitment && (
                                <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                  {n.uploadedPhotos && n.uploadedPhotos.length > 0 && (
                                    <div className="flex gap-1 overflow-x-auto py-0.5">
                                      {n.uploadedPhotos.map((photo, pIdx) => (
                                        <img 
                                          key={pIdx} 
                                          src={photo} 
                                          alt="Workplace preview" 
                                          className="w-12 h-8 object-cover rounded border border-slate-200"
                                          referrerPolicy="no-referrer"
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <a
                                      href={`sms:${n.companyPhone}?body=${encodeURIComponent(
                                        lang === 'bn' 
                                          ? `আসসালামু আলাইকুম, আমি আপনার কোম্পানি সোর্সিং পোস্টটি দেখেছি। আমি কর্মী দিতে আগ্রহী। (দালালি: ${n.brokerCharge || 0} টাকা, মজুরি: ${n.workerWage || 0} টাকা)` 
                                          : `Hi, I saw your worker sourcing request. I am interested. (Broker fee: ${n.brokerCharge || 0} BDT, wage: ${n.workerWage || 0} BDT)`
                                      )}`}
                                      className="py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[9px] font-black text-center transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                    >
                                      ✉️ {lang === 'bn' ? 'সরাসরি SMS' : 'Direct SMS'}
                                    </a>
                                    <button
                                      onClick={() => {
                                        handleStartChatWithCompany(
                                          n.title.includes('ALERT') || n.title.includes('এলার্ট') 
                                            ? (lang === 'bn' ? 'কোম্পানি রিক্রুটার' : 'Company Recruiter') 
                                            : n.title, 
                                          n.companyPhone || ''
                                        );
                                        setShowNotificationsDropdown(false);
                                      }}
                                      className="py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[9px] font-black text-center transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                    >
                                      💬 {lang === 'bn' ? 'চ্যাট করুন' : 'Start Chat'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-white/5 p-0.5 border border-white/10 rounded-lg">
              {worldLanguages.slice(0, 3).map((l) => {
                const isActive = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => handleGlobalLanguageChange(l.code)}
                    className={`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black transition-all flex items-center gap-0.5 cursor-pointer select-none ${
                      isActive
                        ? 'bg-white/15 text-white border border-white/10 shadow-xs'
                        : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span className="hidden xs:inline">{l.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Global Announcement / Alert Bar */}
      {((lang === 'bn' && remoteConfig.globalAlertBn) || (lang !== 'bn' && (remoteConfig.globalAlertEn || remoteConfig.globalAlertBn))) && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-custom {
              display: inline-block;
              white-space: nowrap;
              animation: marquee 18s linear infinite;
            }
            .animate-marquee-custom:hover {
              animation-play-state: paused;
            }
          `}} />
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] uppercase tracking-wider py-2 px-4 shadow-sm border-b border-orange-600/30 flex items-center gap-3 overflow-hidden select-none relative z-30">
            <span className="shrink-0 bg-slate-950 text-amber-400 rounded-full px-2.5 py-0.5 text-[9px] font-black animate-pulse flex items-center gap-1 shadow-md">
              📢 {lang === 'bn' ? 'জরুরী নোটিশ' : 'NOTICE'}
            </span>
            <div className="flex-1 overflow-hidden relative w-full">
              <div className="animate-marquee-custom inline-block font-extrabold pr-4">
                <span className="mr-24">{lang === 'bn' ? remoteConfig.globalAlertBn : (remoteConfig.globalAlertEn || remoteConfig.globalAlertBn)}</span>
                <span>{lang === 'bn' ? remoteConfig.globalAlertBn : (remoteConfig.globalAlertEn || remoteConfig.globalAlertBn)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1">

        {/* Compact Search and Location Filters Area */}
        <div className="bg-gradient-to-r from-[#051c33] via-[#0a2e50] to-[#051c33] border-b border-[#0d345c]/40 shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row gap-2 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search size={14} className="absolute left-3 top-2.5 text-sky-200 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'কাজের নাম, কোম্পানি বা যোগ্যতা দিয়ে খুঁজুন...' : 'Search jobs, companies, skills...'}
                className="w-full pl-8.5 pr-4 py-1.5 bg-white/10 hover:bg-white/15 focus:bg-white text-xs text-white focus:text-slate-800 border border-white/15 focus:border-white rounded-xl outline-none transition-all font-semibold placeholder-sky-200/70 focus:placeholder-slate-400"
              />
            </div>

            {/* Compact Geographic Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
              {/* Country Selector */}
              <div className="relative min-w-[95px] flex-1 sm:flex-initial">
                <Globe size={11} className="absolute left-2 top-2 text-sky-300 pointer-events-none select-none z-10" />
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    const countryId = e.target.value;
                    setSelectedCountry(countryId);
                    const countryObj = regionsData.find(c => c.id === countryId);
                    if (countryObj && countryObj.states.length > 0) {
                      const firstState = countryObj.states[0];
                      setSelectedState(firstState.id);
                      if (firstState.districts.length > 0) {
                        setSelectedDistrict(firstState.districts[0].id);
                      } else {
                        setSelectedDistrict('');
                      }
                    } else {
                      setSelectedState('');
                      setSelectedDistrict('');
                    }
                  }}
                  className="w-full pl-5.5 pr-6 py-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-[9px] font-black text-sky-200 focus:outline-none cursor-pointer h-[24px]"
                >
                  {regionsData.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#051c33] text-slate-200">
                      {c.flag} {lang === 'bn' ? c.nameBn : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Selector */}
              <div className="relative min-w-[95px] flex-1 sm:flex-initial">
                <MapPin size={11} className={`absolute left-2 top-2 pointer-events-none select-none z-10 ${selectedCountry ? 'text-sky-300' : 'text-slate-500'}`} />
                <select
                  value={selectedState}
                  disabled={!selectedCountry}
                  onChange={(e) => {
                    const stateId = e.target.value;
                    setSelectedState(stateId);
                    const countryObj = regionsData.find(c => c.id === selectedCountry);
                    const stateObj = countryObj?.states.find(s => s.id === stateId);
                    if (stateObj && stateObj.districts.length > 0) {
                      setSelectedDistrict(stateObj.districts[0].id);
                    } else {
                      setSelectedDistrict('');
                    }
                  }}
                  className={`w-full pl-5.5 pr-6 py-1 border rounded-lg text-[9px] font-black focus:outline-none cursor-pointer h-[24px] ${
                    selectedCountry 
                      ? 'bg-white/10 hover:bg-white/15 border-white/15 text-sky-200' 
                      : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {selectedCountry && regionsData.find(c => c.id === selectedCountry)?.states.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#051c33] text-slate-200">
                      {lang === 'bn' ? s.nameBn : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Selector */}
              <div className="relative min-w-[95px] flex-1 sm:flex-initial">
                <MapPin size={11} className={`absolute left-2 top-2 pointer-events-none select-none z-10 ${selectedState ? 'text-sky-300' : 'text-slate-500'}`} />
                <select
                  value={selectedDistrict}
                  disabled={!selectedState}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className={`w-full pl-5.5 pr-6 py-1 border rounded-lg text-[9px] font-black focus:outline-none cursor-pointer h-[24px] ${
                    selectedState 
                      ? 'bg-white/10 hover:bg-white/15 border-white/15 text-sky-200' 
                      : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {selectedState && regionsData.find(c => c.id === selectedCountry)?.states.find(s => s.id === selectedState)?.districts.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#051c33] text-slate-200">
                      {lang === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(searchQuery || selectedCountry !== (localStorage.getItem('app_onboarding_country') || 'bangladesh') || selectedState !== (localStorage.getItem('app_onboarding_state') || 'dhaka') || selectedDistrict !== (localStorage.getItem('app_onboarding_district') || 'dhaka_dist')) && (
                <button
                  onClick={() => {
                    setSelectedCountry(localStorage.getItem('app_onboarding_country') || 'bangladesh');
                    setSelectedState(localStorage.getItem('app_onboarding_state') || 'dhaka');
                    setSelectedDistrict(localStorage.getItem('app_onboarding_district') || 'dhaka_dist');
                    setSearchQuery('');
                  }}
                  className="text-[9px] font-bold text-rose-300 hover:text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 px-2 py-1 rounded-lg cursor-pointer h-[24px] flex items-center shrink-0"
                >
                  ✕ {lang === 'bn' ? 'রিসেট' : 'Reset'}
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-6xl mx-auto px-4 py-6 space-y-6"
            >



              {/* Service Mode Selection Hub */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-teal-600 animate-pulse" />
                  {lang === 'bn' ? 'সার্ভিস মোড নির্বাচন করুন (Service Mode Selection Hub)' : lang === 'hi' ? 'सेवा मोड चुनें' : 'Select Service Mode'}
                </h3>

                <div className="flex overflow-x-auto gap-2.5 pb-2.5 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible select-none">
                  {/* Box 1: ড্যাশবোর্ড ও কাজ */}
                  <button
                    id="system-tab-jobs"
                    onClick={() => setActiveSystemTab('jobs')}
                    className={`p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border transition-all text-left flex flex-col gap-1 md:gap-2 w-[135px] md:w-auto shrink-0 cursor-pointer group ${
                      activeSystemTab === 'jobs'
                        ? 'bg-teal-50/40 border-teal-500 shadow-md shadow-teal-50/50'
                        : 'bg-white border-slate-200/60 shadow-xs hover:border-teal-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-full h-13 md:h-18 rounded-lg md:rounded-xl overflow-hidden relative border flex items-center justify-center transition-all ${
                      activeSystemTab === 'jobs' 
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-teal-500' 
                        : 'bg-teal-50/35 text-teal-600 border-slate-100'
                    }`}>
                      <Briefcase className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute top-1 left-1 bg-teal-500 text-white text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-xs">
                        ১. {lang === 'bn' ? 'ড্যাশবোর্ড' : lang === 'hi' ? 'ডैशबोर्ड' : 'Dashboard'}
                      </div>
                      <div className={`absolute bottom-1 right-1 text-[6px] md:text-[7px] font-black uppercase px-1 md:px-1.5 py-0.5 rounded-sm md:rounded-md ${
                        activeSystemTab === 'jobs' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {lang === 'bn' ? 'চলতি' : 'Active'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-teal-600 transition-colors">
                        {lang === 'bn' ? 'কাজ খুঁজুন ও ড্যাশবোর্ড' : lang === 'hi' ? 'काम खोजें और डैशबोर्ड' : 'Find Jobs & Dashboard'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
                        {lang === 'bn' ? 'মজুরি, কাপড় ও ডেলিভারি' : lang === 'hi' ? 'दैनिक काम और मजदूरी' : 'Wage & apparel jobs'}
                      </p>
                    </div>
                  </button>

                  {/* Box 2: কোম্পানি নিয়োগ (কাজের লোক লাগবে) */}
                  <button
                    id="system-tab-recruitment"
                    onClick={() => setShowCompanyForm(true)}
                    className="p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border transition-all text-left flex flex-col gap-1 md:gap-2 w-[135px] md:w-auto shrink-0 cursor-pointer group bg-white border-slate-200/60 shadow-xs hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-50/50"
                  >
                    <div className="w-full h-13 md:h-18 rounded-lg md:rounded-xl overflow-hidden relative border flex items-center justify-center transition-all bg-emerald-50/35 text-emerald-600 border-slate-100 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white group-hover:border-emerald-500">
                      <Building2 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-xs">
                        ২. {lang === 'bn' ? 'নিয়োগ দিন' : lang === 'hi' ? 'नौकरी दें' : 'Recruit'}
                      </div>
                      <div className="absolute bottom-1 right-1 text-[6px] md:text-[7px] font-black uppercase px-1 md:px-1.5 py-0.5 rounded-sm md:rounded-md bg-emerald-100 text-emerald-800 group-hover:bg-white/25 group-hover:text-white">
                        {lang === 'bn' ? 'মালিক' : 'Employer'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-emerald-600 transition-colors">
                        {lang === 'bn' ? 'কাজের লোক লাগবে (নিয়োগ পোস্ট)' : lang === 'hi' ? 'कर्मचारी चाहिए (पोस्ट करें)' : 'Need Workers (Post Vacancy)'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
                        {lang === 'bn' ? 'ডিটেইলস দিয়ে সাবমিট করুন' : lang === 'hi' ? 'विवरण के साथ सबमिट करें' : 'Post details & find workers'}
                      </p>
                    </div>
                  </button>

                  {/* Box 3: যোগ্যতা দিয়ে সাবমিট (কর্মী খুঁজুন ও যোগ করুন) */}
                  <button
                    id="system-tab-workers"
                    onClick={() => setActiveSystemTab('workers')}
                    className={`p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border transition-all text-left flex flex-col gap-1 md:gap-2 w-[135px] md:w-auto shrink-0 cursor-pointer group ${
                      activeSystemTab === 'workers'
                        ? 'bg-amber-50/40 border-amber-500 shadow-md shadow-amber-50/50'
                        : 'bg-white border-slate-200/60 shadow-xs hover:border-amber-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-full h-13 md:h-18 rounded-lg md:rounded-xl overflow-hidden relative border flex items-center justify-center transition-all ${
                      activeSystemTab === 'workers' 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-500' 
                        : 'bg-amber-50/35 text-amber-600 border-slate-100'
                    }`}>
                      <UserCheck className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-xs">
                        ৩. {lang === 'bn' ? 'কর্মী' : lang === 'hi' ? 'कर्मचारी' : 'Workers'}
                      </div>
                      <div className={`absolute bottom-1 right-1 text-[6px] md:text-[7px] font-black uppercase px-1 md:px-1.5 py-0.5 rounded-sm md:rounded-md ${
                        activeSystemTab === 'workers' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lang === 'bn' ? 'সরাসরি' : 'Direct'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-amber-600 transition-colors">
                        {lang === 'bn' ? 'যোগ্যতা সাবমিট ও কর্মী সন্ধান' : lang === 'hi' ? 'योग्यता जमा करें' : 'Profiles & Submit skills'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
                        {lang === 'bn' ? 'সরাসরি কাজের মালিকের কল' : lang === 'hi' ? 'काम पाएं सीधे मालिक से' : 'Submit skills and get called'}
                      </p>
                    </div>
                  </button>

                  {/* Box 4: দালালি অপশন (দালাল ডিরক্টরি ও একাউন্ট) */}
                  <button
                    id="system-tab-brokers"
                    onClick={() => {
                      if (isUserRegisteredBroker) {
                        setShowBrokerPortal(true);
                      } else {
                        setActiveSystemTab('brokers');
                      }
                    }}
                    className={`p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border transition-all text-left flex flex-col gap-1 md:gap-2 w-[135px] md:w-auto shrink-0 cursor-pointer group ${
                      activeSystemTab === 'brokers'
                        ? 'bg-rose-50/40 border-rose-500 shadow-md shadow-rose-50/50'
                        : 'bg-white border-slate-200/60 shadow-xs hover:border-rose-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-full h-13 md:h-18 rounded-lg md:rounded-xl overflow-hidden relative border flex items-center justify-center transition-all ${
                      activeSystemTab === 'brokers' 
                        ? 'bg-gradient-to-br from-rose-500 to-indigo-600 text-white border-rose-500' 
                        : 'bg-rose-50/35 text-rose-600 border-slate-100'
                    }`}>
                      <Users className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute top-1 left-1 bg-rose-500 text-white text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-xs">
                        ৪. {lang === 'bn' ? 'দালাল' : lang === 'hi' ? 'दलाल' : 'Brokers'}
                      </div>
                      <div className={`absolute bottom-1 right-1 text-[6px] md:text-[7px] font-black uppercase px-1 md:px-1.5 py-0.5 rounded-sm md:rounded-md ${
                        activeSystemTab === 'brokers' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {lang === 'bn' ? 'এজেন্ট' : 'Agents'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-rose-600 transition-colors">
                        {lang === 'bn' ? 'দালাল ও এজেন্ট ডিরেক্টরি' : lang === 'hi' ? 'दलाल और एजेंट' : 'Broker & Agent Network'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 truncate">
                        {lang === 'bn' ? 'দালালদের সাথে যোগাযোগ' : lang === 'hi' ? 'दलालों से संपर्क करें' : 'Contact registered brokers'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {activeSystemTab === 'jobs' && (
                <>
                  {/* Quick Action Horizontal Strip of Small Boxes with 3D Illustrations */}
                  <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-teal-600" />
                  {t.quickJobActions || 'Quick Job Actions'}
                </h3>
                
                <div className="flex overflow-x-auto gap-2.5 pb-2.5 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible select-none">
                  {/* Box 1: দৈনিক মজুরি */}
                  <button
                    id="action-add-daily-labourer"
                    onClick={() => setShowWorkerForm(true)}
                    className="bg-white p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:border-amber-300 transition-all text-left flex flex-col gap-1 md:gap-2 w-[115px] md:w-auto shrink-0 cursor-pointer group"
                  >
                    <div className="w-full h-14 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-amber-50 relative border border-slate-100">
                      <img 
                        src={dailyWageImg} 
                        alt="Daily Wage" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[7.5px] md:text-[9px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-sm">
                        🛠️ {t.labelLabor || 'Labor'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-amber-600 transition-colors">
                        {t.labelDailyWage || 'Daily Wage'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {t.labelPostWorker || 'Post Worker'}
                      </p>
                    </div>
                  </button>

                  {/* Box 2: কাপোড়ের কাজ পোস্ট */}
                  <button
                    id="action-post-cloth-job"
                    onClick={() => setShowCompanyForm(true)}
                    className="bg-white p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:border-violet-300 transition-all text-left flex flex-col gap-1 md:gap-2 w-[115px] md:w-auto shrink-0 cursor-pointer group"
                  >
                    <div className="w-full h-14 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-violet-50 relative border border-slate-100">
                      <img 
                        src={clothWorkImg} 
                        alt="Cloth Work" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-violet-600 text-white text-[7.5px] md:text-[9px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-sm">
                        🧵 {t.labelCloth || 'Cloth'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-violet-600 transition-colors">
                        {t.labelClothWorkPost || 'Cloth Work Post'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {t.labelRecruit || 'Recruit'}
                      </p>
                    </div>
                  </button>

                  {/* Box 3: ডেলিভারি পার্টনার */}
                  <button
                    id="action-add-delivery"
                    onClick={() => setShowWorkerForm(true)}
                    className="bg-white p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all text-left flex flex-col gap-1 md:gap-2 w-[115px] md:w-auto shrink-0 cursor-pointer group"
                  >
                    <div className="w-full h-14 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-emerald-50 relative border border-slate-100">
                      <img 
                        src={deliveryPartnerImg} 
                        alt="Delivery Partner" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[7.5px] md:text-[9px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-sm">
                        🛵 {t.labelDelivery || 'Delivery'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-emerald-600 transition-colors">
                        {t.labelDeliveryPartner || 'Delivery Partner'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {t.labelAddRider || 'Add Rider'}
                      </p>
                    </div>
                  </button>

                  {/* Box 4: ফ্রিল্যান্সাসযোগ */}
                  <button
                    id="action-add-freelance"
                    onClick={() => setShowCompanyForm(true)}
                    className="bg-white p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md hover:border-fuchsia-300 transition-all text-left flex flex-col gap-1 md:gap-2 w-[115px] md:w-auto shrink-0 cursor-pointer group"
                  >
                    <div className="w-full h-14 md:h-20 rounded-lg md:rounded-xl overflow-hidden bg-fuchsia-50 relative border border-slate-100">
                      <img 
                        src={freelanceImg} 
                        alt="Freelance" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1 left-1 bg-fuchsia-600 text-white text-[7.5px] md:text-[9px] font-black px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg shadow-sm">
                        💻 {t.labelFreelance || 'Freelance'}
                      </div>
                    </div>
                    <div className="min-w-0 px-0.5 pb-0.5">
                      <h4 className="text-[10px] md:text-[11.5px] font-black text-slate-800 tracking-tight leading-snug truncate group-hover:text-fuchsia-600 transition-colors">
                        {t.labelFreelanceJoin || 'Freelance Join'}
                      </h4>
                      <p className="text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                        {t.labelPostTechJob || 'Post Tech Job'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

            {/* Platform Quick Statistics Panel */}
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              <div className="bg-white/80 p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/50 flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg md:rounded-xl shrink-0">
                  <Briefcase size={15} className="md:w-[18px] md:h-[18px]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[8.5px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{t.statsJobs}</p>
                  <p className="text-sm md:text-lg font-black text-slate-900 leading-none mt-0.5 md:mt-1 truncate">{jobs.length + mockJobsDemo.length} Posts</p>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 md:p-4 rounded-xl md:rounded-2xl border border-slate-200/50 flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg md:rounded-xl shrink-0">
                  <UserCheck size={15} className="md:w-[18px] md:h-[18px]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[8.5px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{t.statsWorkers}</p>
                  <p className="text-sm md:text-lg font-black text-slate-900 leading-none mt-0.5 md:mt-1 truncate">{workers.length + mockWorkersDemo.length} Workers</p>
                </div>
              </div>
            </div>



            {/* Quick Horizontal Filter Categories Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {lang === 'bn' ? 'ক্যাটাগরি অনুযায়ী ফিল্টার' : 'Browse Categories'}
                </h3>
                {selectedCategory !== 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('all')} 
                    className="text-[10px] font-black text-teal-600 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none select-none scroll-smooth">
                {[
                  { 
                    id: 'all', 
                    nameBn: 'সব কাজ', 
                    nameEn: 'All Work', 
                    colorClass: 'from-sky-50 to-indigo-50/50 hover:from-sky-100 hover:to-indigo-100 border-sky-100 text-sky-800',
                    activeColorClass: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white border-sky-500 shadow-md shadow-sky-100',
                    icon: (active: boolean) => (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? 'scale-110 bg-white/20' : 'bg-sky-500/10'}`}>
                        <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-sky-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          <path d="M2 12h20" />
                        </svg>
                      </div>
                    )
                  },
                  { 
                    id: 'daily_wage', 
                    nameBn: 'দৈনিক মজুরি', 
                    nameEn: 'Daily Wage', 
                    colorClass: 'from-amber-50 to-orange-50/50 hover:from-amber-100 hover:to-orange-100 border-amber-100 text-amber-800',
                    activeColorClass: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-100',
                    icon: (active: boolean) => (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? 'scale-110 bg-white/20' : 'bg-amber-500/10'}`}>
                        <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-amber-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                      </div>
                    )
                  },
                  { 
                    id: 'corporate', 
                    nameBn: 'কাপোড়ের কাজ পোস্ট', 
                    nameEn: 'Cloth Work', 
                    colorClass: 'from-violet-50 to-purple-50/50 hover:from-violet-100 hover:to-purple-100 border-violet-100 text-violet-800',
                    activeColorClass: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white border-violet-500 shadow-md shadow-violet-100',
                    icon: (active: boolean) => (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? 'scale-110 bg-white/20' : 'bg-violet-500/10'}`}>
                        <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-violet-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v18" />
                          <path d="M12 12h6" />
                          <path d="M6 18H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2" />
                          <circle cx="15" cy="7" r="1.5" />
                        </svg>
                      </div>
                    )
                  },
                  { 
                    id: 'delivery', 
                    nameBn: 'ডেলিভারি পার্টনার', 
                    nameEn: 'Delivery Partner', 
                    colorClass: 'from-emerald-50 to-teal-50/50 hover:from-emerald-100 hover:to-teal-100 border-emerald-100 text-emerald-800',
                    activeColorClass: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-100',
                    icon: (active: boolean) => (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? 'scale-110 bg-white/20' : 'bg-emerald-500/10'}`}>
                        <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-emerald-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </div>
                    )
                  },
                  { 
                    id: 'editing', 
                    nameBn: 'ফ্রিল্যান্সাসযোগ', 
                    nameEn: 'Freelance & Editing', 
                    colorClass: 'from-fuchsia-50 to-pink-50/50 hover:from-fuchsia-100 hover:to-pink-100 border-fuchsia-100 text-fuchsia-800',
                    activeColorClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white border-fuchsia-500 shadow-md shadow-fuchsia-100',
                    icon: (active: boolean) => (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${active ? 'scale-110 bg-white/20' : 'bg-fuchsia-500/10'}`}>
                        <svg className={`w-6 h-6 ${active ? 'text-white' : 'text-fuchsia-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                    )
                  }
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 shrink-0 border cursor-pointer ${
                        isActive ? cat.activeColorClass : `bg-gradient-to-br ${cat.colorClass} border-slate-200`
                      }`}
                    >
                      {cat.icon(isActive)}
                      <div className="text-left min-w-0 pr-1.5">
                        <p className={`text-xs font-black tracking-tight leading-snug truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {lang === 'bn' ? cat.nameBn : cat.nameEn}
                        </p>
                        <p className={`text-[9px] font-bold tracking-wider uppercase mt-0.5 leading-none ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                          {lang === 'bn' ? cat.nameEn : cat.nameBn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic listings grouped by Category sections (from screenshot layout) */}
            <div className="space-y-8 pt-2">
              
              {/* Category section 1: Dail Wage Labour */}
              {(selectedCategory === 'all' || selectedCategory === 'daily_wage') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <span className="text-amber-500">💰</span>
                      {lang === 'bn' ? 'দৈনিক মজুরি কর্মী ও কাজ (Dail Wage Labour)' : 'Daily Wage Labour Listings'}
                    </h3>
                    <button onClick={() => { setActiveView('workers'); setSelectedCategory('daily_wage'); }} className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-0.5">
                      {lang === 'bn' ? 'সব দেখুন' : 'See all'} <ArrowRight size={12} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Filter local state + fall back to mock painters if none in database */}
                    {loadingWorkers ? (
                      <div className="py-8 text-center text-xs font-medium text-slate-400">{t.loading}</div>
                    ) : (
                      (() => {
                        const local = combinedWorkers.filter(w => matchesLocationFilter(w) && getCategoryForPost(w.name + ' ' + w.skills, w.about) === 'daily_wage');
                        const list = local.length > 0 ? local.slice(0, 4) : mockWorkersDemo.filter(w => getCategoryForPost(w.name + ' ' + w.skills, w.about) === 'daily_wage');
                        return list.map((post, idx) => (
                          <WorkerCard 
                            key={`${post.id || 'worker'}-${idx}`} 
                            post={post as any} 
                            lang={lang} 
                            onViewDetails={handleViewWorkerDetails} 
                            isSaved={savedPostIds.includes(post.id)}
                            onToggleSave={handleToggleSave}
                          />
                        ));
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* Category section 2: Corporate Jobs */}
              {(selectedCategory === 'all' || selectedCategory === 'corporate') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <span className="text-violet-500">🧵</span>
                      {lang === 'bn' ? 'কাপোড়ের কাজ ও অফিস চাকরি (Cloth/Garments & Office Work)' : 'Garments & Office Work'}
                    </h3>
                    <button onClick={() => { setActiveView('jobs'); setSelectedCategory('corporate'); }} className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-0.5">
                      {lang === 'bn' ? 'সব দেখুন' : 'See all'} <ArrowRight size={12} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loadingJobs ? (
                      <div className="py-8 text-center text-xs font-medium text-slate-400">{t.loading}</div>
                    ) : (
                      (() => {
                        const local = combinedJobs.filter(j => !isJobExpired(j) && matchesLocationFilter(j) && getCategoryForPost(j.title, j.description) === 'corporate');
                        const list = local.length > 0 ? local.slice(0, 4) : mockJobsDemo.filter(j => getCategoryForPost(j.title, j.description) === 'corporate');
                        return list.map((post, idx) => (
                          <JobCard 
                            key={`${post.id || 'job'}-${idx}`} 
                            post={post as any} 
                            lang={lang} 
                            onViewDetails={handleViewJobDetails} 
                            isSaved={savedPostIds.includes(post.id)}
                            onToggleSave={handleToggleSave}
                            onCallClick={handleJobCall}
                          />
                        ));
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* Category section 3: Delivery Services */}
              {(selectedCategory === 'all' || selectedCategory === 'delivery') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <span className="text-emerald-500">🛵</span>
                      {lang === 'bn' ? 'ডেলিভারি পার্টনার সার্ভিস (Delivery Partner Services)' : 'Delivery Partner Services'}
                    </h3>
                    <button onClick={() => { setActiveView('jobs'); setSelectedCategory('delivery'); }} className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-0.5">
                      {lang === 'bn' ? 'সব দেখুন' : 'See all'} <ArrowRight size={12} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loadingJobs ? (
                      <div className="py-8 text-center text-xs font-medium text-slate-400">{t.loading}</div>
                    ) : (
                      (() => {
                        const local = combinedJobs.filter(j => !isJobExpired(j) && matchesLocationFilter(j) && getCategoryForPost(j.title, j.description) === 'delivery');
                        const list = local.length > 0 ? local.slice(0, 4) : mockJobsDemo.filter(j => getCategoryForPost(j.title, j.description) === 'delivery');
                        return list.map((post, idx) => (
                          <JobCard 
                            key={`${post.id || 'job'}-${idx}`} 
                            post={post as any} 
                            lang={lang} 
                            onViewDetails={handleViewJobDetails} 
                            isSaved={savedPostIds.includes(post.id)}
                            onToggleSave={handleToggleSave}
                            onCallClick={handleJobCall}
                          />
                        ));
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* Category section 4: Editing & Freelance */}
              {(selectedCategory === 'all' || selectedCategory === 'editing') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <span className="text-fuchsia-500">💻</span>
                      {lang === 'bn' ? 'ফ্রিল্যান্সাসযোগ ও এডিটিং (Freelance & Editing)' : 'Freelance & Editing'}
                    </h3>
                    <button onClick={() => { setActiveView('workers'); setSelectedCategory('editing'); }} className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-0.5">
                      {lang === 'bn' ? 'সব দেখুন' : 'See all'} <ArrowRight size={12} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loadingWorkers ? (
                      <div className="py-8 text-center text-xs font-medium text-slate-400">{t.loading}</div>
                    ) : (
                      (() => {
                        const local = combinedWorkers.filter(w => matchesLocationFilter(w) && getCategoryForPost(w.name + ' ' + w.skills, w.about) === 'editing');
                        const list = local.length > 0 ? local.slice(0, 4) : mockWorkersDemo.filter(w => getCategoryForPost(w.name + ' ' + w.skills, w.about) === 'editing');
                        return list.map((post, idx) => (
                          <WorkerCard 
                            key={`${post.id || 'worker'}-${idx}`} 
                            post={post as any} 
                            lang={lang} 
                            onViewDetails={handleViewWorkerDetails} 
                            isSaved={savedPostIds.includes(post.id)}
                            onToggleSave={handleToggleSave}
                          />
                        ));
                      })()
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

          {activeSystemTab === 'workers' && (
            <div className="space-y-6 pt-2">
              {/* Banner & Registration CTA */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                    <span>👷</span>
                    {lang === 'bn' ? 'আপনি কি কাজ করতে ইচ্ছুক?' : lang === 'hi' ? 'क्या आप काम करना चाहते हैं?' : 'Are you looking for work?'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold max-w-xl leading-relaxed">
                    {lang === 'bn' 
                      ? 'আপনার যোগ্যতা ও অভিজ্ঞতার বিবরণ দিয়ে বিনামূল্যে প্রোফাইল সাবমিট করুন যাতে কাজের মালিকরা সরাসরি আপনার সাথে যোগাযোগ করতে পারে।' 
                      : lang === 'hi' ? 'अपनी योग्यता और अनुभव के साथ मुफ़्त में प्रोफ़ाइल सबमिट करें ताकि काम के मालिक सीधे आपसे संपर्क कर सकें।' : 'Submit your skills and bio for free so employers can call or message you directly.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowWorkerForm(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-md shadow-amber-200/50 cursor-pointer active:scale-95 transition-all select-none whitespace-nowrap"
                >
                  {lang === 'bn' ? '👷 আপনার প্রোফাইল সাবমিট করুন' : lang === 'hi' ? '👷 अपनी प्रोफ़ाइल सबमिट करें' : '👷 Submit Your Profile'}
                </button>
              </div>

              {/* Worker Directory Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className="text-amber-500">👷</span>
                  {lang === 'bn' ? 'উপলব্ধ সকল কর্মী ও তাদের যোগ্যতা ডিরেক্টরি' : lang === 'hi' ? 'सभी उपलब्ध कर्मचारी और उनकी योग्यता' : 'Available Worker Directory'}
                </h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {combinedWorkers.filter(matchesLocationFilter).length} {lang === 'bn' ? 'জন কর্মী' : 'Workers'}
                </span>
              </div>

              {/* Filtered Workers Grid */}
              {combinedWorkers.filter(matchesLocationFilter).length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                  <p className="text-base">🕵️‍♂️</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'bn' ? 'কোনো কর্মী প্রোফাইল পাওয়া যায়নি' : 'No worker profiles found'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold max-w-sm mx-auto">
                    {lang === 'bn' ? 'আপনার নির্বাচিত এলাকায় এখনও কোনো কর্মী প্রোফাইল যোগ করা হয়নি। প্রথম কর্মী হিসেবে আপনিই পোস্ট করুন!' : 'No workers found in this area. Be the first to register!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(() => {
                    const local = combinedWorkers.filter(matchesLocationFilter);
                    const list = local.length > 0 ? local : mockWorkersDemo;
                    return list.map((post, idx) => (
                      <WorkerCard 
                        key={`${post.id || 'worker'}-${idx}`} 
                        post={post as any} 
                        lang={lang} 
                        onViewDetails={handleViewWorkerDetails} 
                        isSaved={savedPostIds.includes(post.id)}
                        onToggleSave={handleToggleSave}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {activeSystemTab === 'brokers' && (
            <div className="space-y-6 pt-2">
              {/* Banner & Registration CTA */}
              {!isUserRegisteredBroker && (
                <div className="bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-rose-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                    <span>🛡️</span>
                    {lang === 'bn' ? 'আপনি কি একজন দালাল বা বিশ্বস্ত এজেন্ট?' : lang === 'hi' ? 'क्या आप एक दलाल या विश्वसनीय एजेंट हैं?' : 'Are you an Agent or Broker?'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold max-w-xl leading-relaxed">
                    {lang === 'bn' 
                      ? 'দালালদের রেজিস্ট্রেশন করুন। মালিকপক্ষ কাজের লোক চাইলে সরাসরি আপনার সাথে যোগাযোগ করে কন্টাক্ট করবে, তখন আপনি ২ নম্বর বক্সের কর্মী সরবরাহ করতে পারবেন।' 
                      : lang === 'hi' ? 'दलाल के रूप में पंजीकरण करें। मालिक आपसे संपर्क करेंगे, और आप उन्हें बॉक्स २ के श्रमिक प्रदान कर सकते हैं।' : 'Register as an agent. Clients needing workforces will contact you directly, then you can source workers from Option 2.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setShowBrokerForm(true)}
                    className="bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-md shadow-rose-200/50 cursor-pointer active:scale-95 transition-all select-none whitespace-nowrap"
                  >
                    {lang === 'bn' ? '🤝 দালাল হিসেবে একাউন্ট খুলুন' : lang === 'hi' ? '🤝 दलाल के रूप में खाता खोलें' : '🤝 Register Broker Profile'}
                  </button>
                </div>
              </div>
              )}

              {/* Broker Directory Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <span className="text-rose-500">🤝</span>
                  {lang === 'bn' ? 'দালাল ও কাজের এজেন্ট ডিরেক্টরি (Sourcing Network)' : lang === 'hi' ? 'दलाल और श्रम एजेंट नेटवर्क' : 'Registered Broker & Sourcing Network'}
                </h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {filteredBrokers.length} {lang === 'bn' ? 'টি এজেন্সি' : 'Agencies'}
                </span>
              </div>

              {/* Broker Grid */}
              {filteredBrokers.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                  <p className="text-base">🤝</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'bn' ? 'কোনো দালাল প্রোফাইল পাওয়া যায়নি' : 'No broker profiles found'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold max-w-sm mx-auto">
                    {lang === 'bn' ? 'আপনার নির্বাচিত এলাকায় এখনও কোনো দালালের একাউন্ট খোলা হয়নি। প্রথম দালাল হিসেবে আপনিই একাউন্ট খুলুন!' : 'No brokers found in this area. Be the first to register!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredBrokers.slice(0, visibleBrokersCount).map(post => (
                      <BrokerCard 
                        key={post.id} 
                        post={post} 
                        lang={lang} 
                        onContact={(p) => {
                          setContactedEmployerIds(prev => {
                            if (prev.includes(p.phone)) return prev;
                            return [...prev, p.phone];
                          });
                          setSuccessToast(lang === 'bn' ? `কল করা হচ্ছে: ${p.name} (${p.phone})` : `Calling: ${p.name} (${p.phone})`);
                          setTimeout(() => {
                            window.location.href = `tel:${p.phone}`;
                          }, 1000);
                        }} 
                        onRequestSourcing={(p) => {
                          setSourcingBroker(p);
                        }}
                      />
                    ))}
                  </div>

                  {filteredBrokers.length > visibleBrokersCount && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setVisibleBrokersCount(prev => prev + 12)}
                        className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 select-none"
                      >
                        ➕ {lang === 'bn' ? 'আরও দেখুন' : lang === 'hi' ? 'और अधिक देखें' : 'Load More Brokers'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          </motion.div>
        )}

        {/* VIEW 2: JOBS BOARD VIEW */}
        {activeView === 'jobs' && (
          <motion.div
            key="jobs-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 py-6 space-y-6"
          >
            {/* Search Controls inside View */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholderJobs}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all"
                />
              </div>

              <div className="w-full md:w-64 relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 select-none">
                <MapPin size={18} className="text-slate-400 mr-2.5 shrink-0" />
                <span className="text-slate-700 text-sm font-bold truncate">
                  {selectedDistrict 
                    ? getRegionName('district', selectedDistrict, lang) 
                    : selectedState 
                      ? getRegionName('state', selectedState, lang) 
                      : selectedCountry 
                        ? getRegionName('country', selectedCountry, lang) 
                        : (lang === 'bn' ? 'সব এলাকা' : 'All Regions')}
                </span>
              </div>

              <button
                id="create-job-post-btn-inside"
                onClick={() => setShowCompanyForm(true)}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus size={16} />
                {t.btnPostJob}
              </button>
            </div>

            {/* List Listings */}
            <div>
              {loadingJobs ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold">{t.loading}</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8">
                  <Briefcase size={40} className="mx-auto text-slate-300 stroke-1" />
                  <h3 className="text-sm font-bold text-slate-700 mt-4">
                    {lang === 'bn' ? 'কোনো কাজের বিজ্ঞাপন পাওয়া যায়নি' : 'No job vacancies found'}
                  </h3>
                  <button
                    onClick={() => setShowCompanyForm(true)}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {t.btnPostJob}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.slice(0, visibleJobsCount).map((job, idx) => (
                      <JobCard 
                        key={`${job.id || 'job'}-${idx}`} 
                        post={job} 
                        lang={lang} 
                        onViewDetails={handleViewJobDetails} 
                        isSaved={savedPostIds.includes(job.id)}
                        onToggleSave={handleToggleSave}
                        onCallClick={handleJobCall}
                      />
                    ))}
                  </div>

                  {filteredJobs.length > visibleJobsCount && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setVisibleJobsCount(prev => prev + 12)}
                        className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 select-none"
                      >
                        ➕ {lang === 'bn' ? 'আরও দেখুন' : lang === 'hi' ? 'और अधिक देखें' : 'Load More Jobs'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: WORKER DIRECTORY VIEW */}
        {activeView === 'workers' && (
          <motion.div
            key="workers-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 py-6 space-y-6"
          >
            {/* Search Controls inside View */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  id="search-input-workers"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholderWorkers}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div className="w-full md:w-64 relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 select-none">
                <MapPin size={18} className="text-slate-400 mr-2.5 shrink-0" />
                <span className="text-slate-700 text-sm font-bold truncate">
                  {selectedDistrict 
                    ? getRegionName('district', selectedDistrict, lang) 
                    : selectedState 
                      ? getRegionName('state', selectedState, lang) 
                      : selectedCountry 
                        ? getRegionName('country', selectedCountry, lang) 
                        : (lang === 'bn' ? 'সব এলাকা' : 'All Regions')}
                </span>
              </div>

              <button
                id="create-worker-post-btn-inside"
                onClick={() => setShowWorkerForm(true)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus size={16} />
                {t.btnPostWorker}
              </button>
            </div>

            {/* List Listings */}
            <div>
              {loadingWorkers ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold">{t.loading}</p>
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8">
                  <User size={40} className="mx-auto text-slate-300 stroke-1" />
                  <h3 className="text-sm font-bold text-slate-700 mt-4">
                    {lang === 'bn' ? 'কোনো কর্মীর বিজ্ঞাপন পাওয়া যায়নি' : 'No workers found'}
                  </h3>
                  <button
                    onClick={() => setShowWorkerForm(true)}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    {t.btnPostWorker}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkers.slice(0, visibleWorkersCount).map((worker, idx) => (
                      <WorkerCard 
                        key={`${worker.id || 'worker'}-${idx}`} 
                        post={worker} 
                        lang={lang} 
                        onViewDetails={handleViewWorkerDetails} 
                        isSaved={savedPostIds.includes(worker.id)}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>

                  {filteredWorkers.length > visibleWorkersCount && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setVisibleWorkersCount(prev => prev + 12)}
                        className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 select-none"
                      >
                        ➕ {lang === 'bn' ? 'আরও দেখুন' : lang === 'hi' ? 'और अधिक देखें' : 'Load More Workers'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 4: SAVED BOOKMARKS VIEW */}
        {activeView === 'saved' && (
          <motion.div
            key="saved-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto px-4 py-6 space-y-6"
          >
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Heart size={20} className="text-rose-500 fill-rose-500" />
                  {lang === 'bn' ? 'আমার সংরক্ষিত বিজ্ঞাপন' : 'My Saved Bookmarks'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {lang === 'bn' ? 'আপনার বুকমার্ক করা সকল কাজের তথ্য এখানে রয়েছে।' : 'All job listings and worker profiles you flagged as important.'}
                </p>
              </div>
              <span className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold px-3 py-1 rounded-xl">
                {savedJobs.length + savedWorkers.length} Saved Items
              </span>
            </div>

            {savedJobs.length === 0 && savedWorkers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 p-8">
                <Heart size={44} className="mx-auto text-slate-300 stroke-1" />
                <h3 className="text-sm font-bold text-slate-700 mt-4">
                  {lang === 'bn' ? 'কোনো সংরক্ষিত পোস্ট নেই' : 'No bookmarked postings yet'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {lang === 'bn' ? 'বিজ্ঞাপনের ডান কোণায় থাকা হার্ট আইকন ক্লিক করে সেভ করুন।' : 'Tap the heart icon on any post details or listing cards to bookmark.'}
                </p>
                <button
                  onClick={() => setActiveView('home')}
                  className="mt-6 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Go to Home'}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Bookmarked Jobs */}
                {savedJobs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      📂 {lang === 'bn' ? 'সংরক্ষিত কাজ সমূহ' : 'Saved Job Positions'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedJobs.map(job => (
                        <JobCard 
                          key={job.id} 
                          post={job} 
                          lang={lang} 
                          onViewDetails={handleViewJobDetails} 
                          isSaved={true}
                          onToggleSave={handleToggleSave}
                          onCallClick={handleJobCall}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookmarked Workers */}
                {savedWorkers.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      👷 {lang === 'bn' ? 'সংরক্ষিত কর্মী প্রোফাইল' : 'Saved Worker Profiles'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedWorkers.map(worker => (
                        <WorkerCard 
                          key={worker.id} 
                          post={worker} 
                          lang={lang} 
                          onViewDetails={handleViewWorkerDetails} 
                          isSaved={true}
                          onToggleSave={handleToggleSave}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 5: MESSAGES MOCK CHAT VIEW (From black phone photo) */}
        {activeView === 'messages' && (
          <motion.div
            key="messages-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto px-4 py-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[600px] flex">
              {/* Left sidebar - conversations list */}
              <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 bg-white">
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <MessageSquare size={18} className="text-teal-600" />
                    {lang === 'bn' ? 'বার্তা ও যোগাযোগ' : 'Bharat ka Kaam Chats'}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">
                    Direct Connections Live
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative ${
                        activeChatId === chat.id 
                          ? 'bg-white shadow-sm border border-slate-200 text-slate-900 font-bold' 
                          : 'hover:bg-white/60 text-slate-600'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-xs">
                        {chat.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black truncate">{chat.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{chat.time}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block leading-tight mt-0.5">{chat.role}</span>
                        <p className="text-[11px] text-slate-500 truncate leading-snug mt-1">{chat.lastMessage}</p>
                      </div>

                      {chat.unread && (
                        <span className="w-2.5 h-2.5 bg-teal-600 rounded-full absolute right-3 top-1/2 -translate-y-1/2"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right side - active chat thread */}
              <div className="hidden md:flex flex-1 flex-col bg-white">
                {/* Chat header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                      {activeChat.avatar}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 leading-tight">{activeChat.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wide">{activeChat.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${activeChat.phone}`}
                      className="px-4 py-2 bg-teal-50 border border-teal-100 text-teal-700 hover:bg-teal-100 text-[10px] font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <Phone size={12} />
                      {lang === 'bn' ? 'সরাসরি কল দিন' : 'Direct Call'}
                    </a>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                  {activeChat.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[70%] ${
                        msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-teal-600 text-white rounded-br-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                {/* Message input bar */}
                <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={lang === 'bn' ? 'বার্তা লিখুন এবং এন্টার চাপুন...' : 'Type a message and press Enter...'}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-teal-500 transition-all font-semibold"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Mobile View placeholder click instructions when narrow */}
              <div className="md:hidden flex-1 flex flex-col justify-center items-center text-center p-6 bg-slate-50">
                <MessageCircle size={36} className="text-slate-300 stroke-1 mb-2" />
                <h4 className="text-xs font-bold text-slate-600">Please choose a conversation</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Select any contact on the left rail to open the secure chat room details on desktop.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 6: GOOGLE SEARCH SIMULATOR */}
        {activeView === 'google-search' && (
          <motion.div
            key="google-search-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto px-4 py-6"
          >
            {/* Simulated Mobile Browser Container */}
            <div className="bg-[#f2f2f2] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden max-w-2xl mx-auto">
              
              {/* Browser Address Bar & controls */}
              <div className="bg-[#e0e0e0] px-4 py-2 flex items-center gap-3 border-b border-slate-300">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-teal-400" />
                </div>
                
                {/* Simulated URL Input */}
                <div className="flex-1 bg-white rounded-lg px-3 py-1 flex items-center justify-between text-[11px] text-slate-600 font-semibold shadow-inner">
                  <span className="flex items-center gap-1">
                    <span className="text-teal-600 text-[10px]">🔒</span> 
                    <span>google.com</span>
                  </span>
                  <button 
                    onClick={() => setActiveView('home')}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Browser Web Content */}
              <div className="bg-white p-5 space-y-5 min-h-[550px] text-left">
                
                {/* Google Logo & Search Input */}
                <div className="flex flex-col items-center gap-3 mt-2">
                  <div className="flex items-center font-bold text-2xl tracking-tight select-none">
                    <span className="text-blue-500">G</span>
                    <span className="text-red-500">o</span>
                    <span className="text-amber-500">o</span>
                    <span className="text-blue-500">g</span>
                    <span className="text-green-500">l</span>
                    <span className="text-red-500">e</span>
                  </div>
                  
                  {/* Search Input Box */}
                  <div className="w-full max-w-md relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      defaultValue="Bharat ka Kaam"
                      readOnly
                      className="w-full pl-9 pr-8 py-2 border border-slate-200 hover:border-slate-300 focus:outline-none rounded-full text-xs font-semibold shadow-xs bg-slate-50"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🎙️</span>
                  </div>
                </div>

                {/* Search Categories Tabs */}
                <div className="flex gap-4 border-b border-slate-100 pb-1 text-slate-500 font-bold text-[10.5px] select-none overflow-x-auto scrollbar-none">
                  <span className="text-blue-600 border-b-2 border-blue-600 pb-1 shrink-0">All</span>
                  <span className="shrink-0">News</span>
                  <span className="shrink-0">Images</span>
                  <span className="shrink-0">Videos</span>
                  <span className="shrink-0">Maps</span>
                  <span className="shrink-0">Shopping</span>
                </div>

                {/* About statistics */}
                <p className="text-[10px] text-slate-400 font-medium">
                  {lang === 'bn' 
                    ? 'প্রায় ১,৪২০,০০০টি ফলাফল (০.২৪ সেকেন্ড)' 
                    : 'About 1,420,000 results (0.24 seconds)'}
                </p>

                {/* RESULT 1: SPONSORED LISTING */}
                <div className="border border-slate-100 rounded-3xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                      {lang === 'bn' ? 'বিজ্ঞাপন' : 'Sponsored'}
                    </span>
                    <span className="text-slate-300 font-bold">•</span>
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                      <img src={appLogo} alt="Bharat ka Kaam Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-slate-700 font-extrabold tracking-wide">www.bharatkakaam.com</span>
                  </div>
                  
                  {/* Clickable Header with Description & Large Logo on Right */}
                  <div className="flex gap-4 items-start justify-between">
                    <button
                      onClick={() => {
                        setActiveView('app-website');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left group flex-1 cursor-pointer"
                    >
                      <h3 className="text-sm md:text-base font-bold text-blue-800 group-hover:underline leading-tight">
                        Bharat ka Kaam - Direct Connect Jobs & Workers
                      </h3>
                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-1">
                        {lang === 'bn' 
                          ? 'মালিক ও দৈনিক মজুরদের সরাসরি যোগাযোগের ১ নম্বর অ্যাপ। কোনো দালালি বা কমিশন চার্জ ছাড়াই গার্মেন্ট সোর্সিং, লোডার, কারিগর ও কাজের বিজ্ঞাপন দিন এবং সরাসরি কল দিন।' 
                          : 'India\'s premier open-access platform to find direct garment factories, workers, loaders, logistics and wage helpers. Free registration. 100% direct calling.'}
                      </p>
                    </button>

                    {/* Highly interactive logo badge right inside the sponsored block */}
                    <button
                      onClick={() => {
                        setActiveView('app-website');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden border border-amber-400/30 shadow-md shrink-0 hover:scale-105 active:scale-95 transition-all duration-200 relative group cursor-pointer"
                      title={lang === 'bn' ? 'ডাউনলোড করতে ক্লিক করুন' : 'Click to Download App'}
                    >
                      <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[8px] text-amber-400 font-black tracking-wider uppercase">{lang === 'bn' ? 'ডাউনলোড' : 'Install'}</span>
                      </div>
                    </button>
                  </div>

                  {/* HIGH-FIDELITY SITELINKS GRID */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Sitelink 1: Download Page */}
                    <button
                      onClick={() => {
                        setActiveView('app-website');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-2.5 transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-blue-800 group-hover:underline block">
                        📥 {lang === 'bn' ? 'অফিসিয়াল ডাউনলোড' : 'Download Web App'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5 leading-tight">
                        {lang === 'bn' ? '১ ক্লিকে মোবাইল ফোনে ইনস্টল' : 'Instant installation on your Android/iOS device.'}
                      </span>
                    </button>

                    {/* Sitelink 2: Jobs Feed */}
                    <button
                      onClick={() => {
                        setActiveView('jobs');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-2.5 transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-blue-800 group-hover:underline block">
                        💼 {lang === 'bn' ? 'কাজের বিজ্ঞপ্তি' : 'Browse Active Jobs'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5 leading-tight">
                        {lang === 'bn' ? 'গার্মেন্টস ও লেবার কাজ খুঁজুন' : 'Check latest high-wage loader & factory vacancies.'}
                      </span>
                    </button>

                    {/* Sitelink 3: Workers Feed */}
                    <button
                      onClick={() => {
                        setActiveView('workers');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-left bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-2.5 transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-blue-800 group-hover:underline block">
                        👷 {lang === 'bn' ? 'দক্ষ শ্রমিক ডিরেক্টরি' : 'Find Workers'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5 leading-tight">
                        {lang === 'bn' ? 'সরাসরি কারিগর ও শ্রমিক নিয়োগ' : 'Contact verified carpenters, tailors & helpers.'}
                      </span>
                    </button>

                    {/* Sitelink 4: Registration */}
                    <button
                      onClick={() => {
                        setShowOnboarding(true);
                      }}
                      className="text-left bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-2.5 transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-blue-800 group-hover:underline block">
                        👤 {lang === 'bn' ? 'ফ্রি আইডি তৈরি করুন' : 'Register Free Profile'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5 leading-tight">
                        {lang === 'bn' ? 'আজই কাজের সন্ধান শুরু করুন' : 'Activate your worker ID or Post job advertisements.'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ORGANIC SEARCH RESULTS */}
                <div className="space-y-4 pt-2">
                  {/* Organic Result 1 */}
                  <div className="space-y-1 text-left border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                        <img src={appLogo} alt="Favicon" className="w-full h-full object-cover" />
                      </div>
                      <span>https://play.google.com › store › apps › bharatkakaam</span>
                    </div>
                    
                    <div className="flex gap-4 items-start justify-between">
                      <button 
                        onClick={() => {
                          setActiveView('app-website');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-blue-800 hover:underline font-bold text-sm leading-snug block text-left flex-1 cursor-pointer"
                      >
                        Bharat ka Kaam - Direct Hire - Apps on Google Play
                      </button>

                      {/* Small inline preview of the official app icon */}
                      <button
                        onClick={() => {
                          setActiveView('app-website');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden border border-slate-200 shadow-xs shrink-0 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
                        title={lang === 'bn' ? 'অফিসিয়াল অ্যাপ ডাউনলোড' : 'Official App Download'}
                      >
                        <img src={appLogo} alt="App Logo Mini" className="w-full h-full object-cover" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      {lang === 'bn' 
                        ? 'প্লে স্টোরের কোনো ঝামেলা ছাড়াই সরাসরি আমাদের পিডব্লিউএ ডাউনলোড পেইজ থেকে ১ সেকেন্ডে অ্যাপ ডাউনলোড করুন।' 
                        : 'Learn how to download and pin Bharat ka Kaam on your home screen directly from the secure web app launcher.'}
                    </p>
                  </div>

                  {/* Organic Result 2 */}
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span className="text-blue-600 font-black">f</span>
                      <span>https://m.facebook.com › groups › bharatkakaam</span>
                    </div>
                    <span className="text-blue-800 font-semibold text-sm leading-snug block">
                      Bharat ka Kaam Jobs & Logistics (ভারতের কাজ গ্রুপ)
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {lang === 'bn' 
                        ? 'পশ্চিমবঙ্গ ও কলকাতার বিভিন্ন জুতোর কারখানা ও গার্মেন্টস কারখানার কাজের খবর পান।' 
                        : 'Connect with 45,000+ local businesses, garment tailors, and heavy load transporters across the network.'}
                    </p>
                  </div>
                </div>

                {/* Dynamic Instructions Box */}
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-2 mt-4 text-xs font-semibold text-sky-900 leading-relaxed text-left">
                  <h4 className="font-extrabold flex items-center gap-1">
                    ℹ️ {lang === 'bn' ? 'গুগল সার্চ ও ডোমেইন সুবিধা' : 'Google Search & Domain Information'}
                  </h4>
                  <p>
                    {lang === 'bn' ? (
                      <>
                        কেউ যখন গুগলে <strong className="text-indigo-900">Bharat ka Kaam</strong> লিখে সার্চ করবে বা এড্রেস বারে <strong className="text-indigo-900">bharatkakaam.com</strong> টাইপ করবে, তখন তারা সরাসরি আপনার এই অফিসিয়াল ডাউনলোড পেইজে চলে আসবে। এটি সম্পূর্ণ পিডব্লিউএ (Progressive Web App) সমর্থিত, যার ফলে কোনো প্লে-স্টোর চার্জ ছাড়াই ব্যবহারকারী সরাসরি এটি ফোনে অ্যাপ হিসেবে ডাউনলোড করে নিতে পারবেন!
                      </>
                    ) : (
                      <>
                        When a user searches for <strong className="text-indigo-900">Bharat ka Kaam</strong> on Google or types <strong className="text-indigo-900">bharatkakaam.com</strong> directly in their browser, they land on our lightning-fast PWA installation website. They can install it in 1-click with zero storage space used!
                      </>
                    )}
                  </p>
                  
                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => setActiveView('home')}
                      className="px-4 py-1.5 bg-[#0a2e50] hover:bg-[#051c33] text-white rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                      {lang === 'bn' ? 'মূল ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 7: APP WEBSITE WEB DOWNLOAD CENTER */}
        {activeView === 'app-website' && (
          <motion.div
            key="app-website-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto px-4 py-6"
          >
            {/* Simulated Mobile Browser Container for the Website */}
            <div className="bg-[#f2f2f2] rounded-3xl border border-slate-300 shadow-2xl overflow-hidden max-w-2xl mx-auto">
              
              {/* Browser Address Bar & controls */}
              <div className="bg-[#e0e0e0] px-4 py-2 flex items-center gap-3 border-b border-slate-300">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-teal-400" />
                </div>
                
                {/* Simulated URL Input showing the custom domain bharatkakaam.com */}
                <div className="flex-1 bg-white rounded-lg px-3 py-1 flex items-center justify-between text-[11px] text-slate-600 font-semibold shadow-inner">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <span className="text-teal-600 text-[10px]">🔒</span> 
                    <strong className="text-slate-800 font-bold">www.bharatkakaam.com</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setActiveView('google-search');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[9px] uppercase tracking-wide cursor-pointer"
                      title="Go back to Google"
                    >
                      🔍 Google Search
                    </button>
                    <button 
                      onClick={() => setActiveView('home')}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Website Content */}
              <div className="bg-slate-50 min-h-[600px] text-left pb-8">
                
                {/* Website Header */}
                <header className="bg-gradient-to-b from-[#0a2e50] to-[#051c33] text-white p-6 text-center space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl opacity-40"></div>
                  
                  {/* Logo Frame */}
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center border border-amber-400/30 shadow-lg relative overflow-hidden">
                    <img 
                      src={appLogo} 
                      alt="Bharat ka Kaam Logo" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <h1 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                      Bharat ka Kaam
                    </h1>
                    <p className="text-[10px] md:text-xs text-sky-200 font-bold tracking-widest uppercase">
                      www.bharatkakaam.com
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed text-center">
                    {lang === 'bn' 
                      ? 'দালালি বা কোনো কমিশন চার্জ ছাড়াই সরাসরি কাজের মালিকদের সাথে যোগাযোগ করার ১ নম্বর মোবাইল অ্যাপ।' 
                      : 'India\'s #1 direct-contact PWA application. Connect with loaders, tailors, and helpers instantly.'}
                  </p>


                </header>

                {/* High Fidelity Download & Instructions Body */}
                <div className="p-5 space-y-5">
                  
                  {/* Highlight Benefits Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-lg">⚡</span>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase mt-1">
                        {lang === 'bn' ? '০ এমবি স্টোরেজ' : 'Zero Memory'}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-bold leading-tight mt-0.5">
                        {lang === 'bn' ? 'মোবাইলের র‍্যাম বা মেমোরি নষ্ট হবে না' : 'Doesn\'t fill phone memory or slow it down.'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-lg">🔄</span>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase mt-1">
                        {lang === 'bn' ? 'সরাসরি আপডেট' : 'Direct Updates'}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-bold leading-tight mt-0.5">
                        {lang === 'bn' ? 'এখানে কোনো আপডেট দিলে সরাসরি ফোনে পেয়ে যাবেন' : 'Instant client updates automatically on launch.'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-lg">📴</span>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase mt-1">
                        {lang === 'bn' ? 'অফলাইন সুবিধা' : 'Offline Support'}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-bold leading-tight mt-0.5">
                        {lang === 'bn' ? 'ইন্টারনেট ছাড়াই সেভ করা কাজ দেখা যাবে' : 'Access your bookmarked workers & saved jobs offline.'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs">
                      <span className="text-lg">📞</span>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase mt-1">
                        {lang === 'bn' ? '১ ক্লিকে কল' : '1-Click Call'}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-bold leading-tight mt-0.5">
                        {lang === 'bn' ? 'দালাল ও মালিকদের সরাসরি কল করার সুবিধা' : 'Call listing owners directly with single tap.'}
                      </p>
                    </div>
                  </div>



                  {/* Back to App Dashboard button */}
                  <div className="pt-2 text-center select-none">
                    <button
                      onClick={() => {
                        setActiveView('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-2.5 bg-[#0a2e50] hover:bg-[#051c33] text-white font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>🔙</span>
                      {lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Details card modal */}
        {selectedPost && (
          <DetailModal 
            post={selectedPost} 
            type={detailType} 
            lang={lang} 
            onClose={() => setSelectedPost(null)} 
            onCallClick={handleJobCall}
          />
        )}

        {/* Admin / Owner App Control Panel Modal */}
        {showAdminControl && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-2xl p-6 space-y-4 text-white relative shadow-2xl max-h-[95vh] overflow-y-auto scrollbar-thin"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAdminControl(false)}
                className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Title & Banner */}
              <div className="text-center space-y-1 pt-2 select-none">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center mx-auto shadow-md border border-white/20">
                  <span className="text-xl">👑</span>
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider mt-2">
                  {lang === 'bn' ? 'সিস্টেম কন্ট্রোল ক্ষমতা' : 'System Control Center'}
                </h3>
                <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                  {lang === 'bn' ? 'অটো-আপডেট ও লাইভ পেমেন্ট ডায়াগনস্টিকস' : 'Auto-Update & Live Payment Diagnostics'}
                </p>
              </div>

              {/* Tabs for Admin Options */}
              <div className="flex border-b border-slate-800 pb-1">
                <button
                  type="button"
                  onClick={() => setAdminActiveTab('settings')}
                  className={`flex-1 text-center pb-2 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    adminActiveTab === 'settings'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ⚙️ {lang === 'bn' ? 'কনফিগ সেটিংস' : 'Config Settings'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminActiveTab('sms');
                    fetchRawSmsLogs();
                  }}
                  className={`flex-1 text-center pb-2 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    adminActiveTab === 'sms'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  📡 {lang === 'bn' ? 'এসএমএস ফরোয়ার্ডার' : 'SMS Webhook Logs'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminActiveTab('payments');
                    fetchPaymentAttempts();
                  }}
                  className={`flex-1 text-center pb-2 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    adminActiveTab === 'payments'
                      ? 'text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  💰 {lang === 'bn' ? 'পেমেন্ট ভেরিফিকেশন লগ' : 'Payment Logs'}
                </button>
              </div>

              {adminActiveTab === 'settings' && (
                <form onSubmit={handleSaveSystemConfig} className="space-y-4 text-left">
                  {/* Section: Version Control */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">
                      ⚙️ {lang === 'bn' ? 'ভার্সন কন্ট্রোল (অটো-আপডেট)' : 'Version Control (Auto-Update)'}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          {lang === 'bn' ? 'লেটেস্ট ভার্সন' : 'Latest Version'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={adminAppVersion}
                          onChange={(e) => setAdminAppVersion(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-500"
                          placeholder="e.g. 1.0.0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block text-rose-400">
                          {lang === 'bn' ? 'বাধ্যতামূলক ভার্সন' : 'Min Required Version'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={adminMinRequiredVersion}
                          onChange={(e) => setAdminMinRequiredVersion(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-rose-500"
                          placeholder="e.g. 1.0.0"
                        />
                      </div>
                    </div>
                    <p className="text-[8.5px] font-bold text-slate-500 leading-normal">
                      {lang === 'bn' 
                        ? '💡 লেটেস্ট ভার্সন থেকে "বাধ্যতামূলক ভার্সন" বেশি বা সমান হলে সকল ব্যবহারকারীর ফোনে অটো-আপডেট ওভারলে চলে আসবে।' 
                        : '💡 If Min Required Version is higher than users installed version, they will be forced to upgrade.'
                      }
                    </p>

                    <div className="space-y-1 pt-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === 'bn' ? 'নতুন এপিকে ডাউনলোড লিংক (APK Direct Link)' : 'Forced Update APK Link'}
                      </label>
                      <input 
                        type="url" 
                        value={adminForceUpdateUrl}
                        onChange={(e) => setAdminForceUpdateUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500"
                        placeholder={`e.g. ${getLiveAppUrl()}/bharat_ka_kaam.apk`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === 'bn' ? 'আপডেট মেসেজ (বাংলা)' : 'Update Message (Bengali)'}
                      </label>
                      <textarea 
                        value={adminForceUpdateMessageBn}
                        onChange={(e) => setAdminForceUpdateMessageBn(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500"
                        placeholder="আপডেট করুন মেসেজ..."
                      />
                    </div>
                  </div>

                  {/* Section: Global Announcement notice banner */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">
                      📢 {lang === 'bn' ? 'গ্লোবাল এলার্ট নোটিশ (Marquee Notice)' : 'Global Alert Banner'}
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === 'bn' ? 'এলার্ট নোটিশ (বাংলা)' : 'Alert Notice (Bengali)'}
                      </label>
                      <textarea 
                        value={adminGlobalAlertBn}
                        onChange={(e) => setAdminGlobalAlertBn(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-500"
                        placeholder="হেডারে দেখানোর জন্য নোটিশ..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        {lang === 'bn' ? 'এলার্ট নোটিশ (ইংরেজি)' : 'Alert Notice (English)'}
                      </label>
                      <textarea 
                        value={adminGlobalAlertEn}
                        onChange={(e) => setAdminGlobalAlertEn(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-500"
                        placeholder="Alert notice description..."
                      />
                    </div>
                  </div>

                  {/* Section: App System Status */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-extrabold text-white">
                        {lang === 'bn' ? 'সিস্টেম স্ট্যাটাস' : 'System Operational Status'}
                      </h5>
                      <p className="text-[8.5px] font-bold text-slate-500 mt-1">
                        {lang === 'bn' ? 'সরাসরি অনলাইন ও রক্ষণাবেক্ষণ মোড টগল করুন' : 'Toggle live or maintenance mode'}
                      </p>
                    </div>
                    <select
                      value={adminSystemStatus}
                      onChange={(e) => setAdminSystemStatus(e.target.value as 'active' | 'maintenance')}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-amber-400 outline-none focus:border-amber-500"
                    >
                      <option value="active">🟢 Active</option>
                      <option value="maintenance">🔴 Maintenance</option>
                    </select>
                  </div>

                  {/* Section: PWA & APK AssetLinks (Google Play Store verification) */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">
                      📱 {lang === 'bn' ? 'এপিকে ও গুগল প্লে ভেরিফিকেশন (AssetLinks)' : 'APK & Google Play Verification (AssetLinks)'}
                    </h4>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          {lang === 'bn' ? 'অ্যান্ড্রয়েড প্যাকেজ নাম (Package Name)' : 'Android Package Name'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={adminPackageName}
                          onChange={(e) => setAdminPackageName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500"
                          placeholder="e.g. com.bharatkakaam.app"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block text-sky-400">
                          {lang === 'bn' ? 'SHA-256 সার্টিফিকেট ফিঙ্গারপ্রিন্ট' : 'SHA-256 Certificate Fingerprint'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={adminSha256Fingerprint}
                          onChange={(e) => setAdminSha256Fingerprint(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-sky-500"
                          placeholder="e.g. 14:6D:E9:83:C5:EC:..."
                        />
                      </div>
                      <p className="text-[8px] font-bold text-slate-500 leading-normal">
                        {lang === 'bn' 
                          ? '💡 PWABuilder বা Google Play কনসোল থেকে প্রাপ্ত SHA-256 সার্টিফিকেট ফিঙ্গারপ্রিন্ট এখানে দিন।' 
                          : '💡 Enter the SHA-256 fingerprint from PWABuilder or Google Play Console to verify ownership.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminControl(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700/50"
                    >
                      {lang === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={adminSaving}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg disabled:opacity-50"
                    >
                      {adminSaving ? (lang === 'bn' ? 'সেভ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সেভ কনফিগারেশন' : 'Save Config')}
                    </button>
                  </div>
                </form>
              )}

              {adminActiveTab === 'sms' && (
                <div className="space-y-4 text-left animate-fadeIn">
                  {/* Webhook Configuration Guide */}
                  <div className="bg-[#051c33] border border-[#0d345c] rounded-2xl p-4 space-y-2">
                    <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest border-b border-[#0d345c] pb-1.5">
                      📡 {lang === 'bn' ? 'এসএমএস ফরোয়ার্ডার কনফিগারেশন গাইড' : 'SMS Forwarder Setup Guide'}
                    </h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {lang === 'bn' 
                        ? 'আপনার মোবাইলে আসা ব্যাংক মেসেজগুলি সরাসরি আমাদের সার্ভারে অটোমেটিক রিডাইরেক্ট করতে গুগল প্লে স্টোর থেকে "SMS Forwarder" নামক অ্যাপটি নামান এবং নিচের মতো রুল তৈরি করুন:'
                        : 'To forward bank credit SMS messages instantly to our server, download any "SMS Forwarder" app from Play Store and add a forward rule:'
                      }
                    </p>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-2 font-mono text-[9px]">
                      <div className="flex justify-between items-center text-slate-400 border-b border-slate-900 pb-1">
                        <span>🚀 WEBHOOK URL:</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${getLiveAppUrl()}/api/webhook/bank-sms?secret=bharat_ka_kaam_secret_2026`);
                            handleSuccess("✓ Copied to clipboard!");
                          }}
                          className="text-[8px] bg-slate-850 hover:bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded cursor-pointer uppercase font-bold"
                        >
                          Copy
                        </button>
                      </div>
                      <span className="text-amber-300 block truncate select-all">
                        {getLiveAppUrl()}/api/webhook/bank-sms?secret=bharat_ka_kaam_secret_2026
                      </span>
                    </div>
                    <ul className="list-disc list-inside text-[9.5px] text-slate-400 space-y-1">
                      <li><strong>Query Secret Token:</strong> <span className="text-amber-400 font-mono select-all">bharat_ka_kaam_secret_2026</span></li>
                      <li><strong>SMS Rule filter:</strong> {lang === 'bn' ? 'যেসব মেসেজে "49", "৪৯", "credited" বা "received" রয়েছে।' : 'Forward messages containing "49", "credited", or "received".'}</li>
                    </ul>
                  </div>

                  {/* Raw Received SMS List */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                      <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                        📥 {lang === 'bn' ? 'সার্ভারে আসা লাইভ এসএমএস হিস্ট্রি' : 'Live SMS Webhook Logs'}
                      </h4>
                      <button
                        type="button"
                        onClick={fetchRawSmsLogs}
                        disabled={loadingSmsLogs}
                        className="text-[9px] font-black text-amber-400 hover:text-amber-300 cursor-pointer uppercase tracking-wider bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        🔄 {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                      </button>
                    </div>

                    {loadingSmsLogs ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[9px] font-black uppercase text-slate-500">Loading SMS records...</p>
                      </div>
                    ) : rawSmsLogs.length === 0 ? (
                      <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-slate-800/60 text-slate-500">
                        <p className="text-[10px] font-black uppercase">No SMS records found on server</p>
                        <p className="text-[9px] text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                          {lang === 'bn' 
                            ? 'আপনার সেটআপ করা SMS Forwarder কোনো মেসেজ পাঠালে তা সাথে সাথে এখানে লাইভ স্ট্যাটাস সহ দেখা যাবে।'
                            : 'Setup your SMS forwarder app on your phone and send a test SMS to start syncing records.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                        {rawSmsLogs.map((log: any) => {
                          const statusColors: Record<string, string> = {
                            success: "bg-green-500/20 text-green-400 border-green-500/30",
                            ignored: "bg-slate-500/20 text-slate-400 border-slate-500/30",
                            unauthorized: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                            error: "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          };

                          return (
                            <div 
                              key={log.logId}
                              className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-850 space-y-1.5 text-left"
                            >
                              <div className="flex justify-between items-center">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${statusColors[log.status] || 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                  {log.status}
                                </span>
                                <span className="text-[8.5px] font-mono text-slate-500">
                                  {new Date(log.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                                </span>
                              </div>
                              <p className="text-[10.5px] font-medium text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-900 leading-normal font-mono select-all">
                                {log.rawBody}
                              </p>
                              <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400 pt-0.5">
                                <span>parsed UTR: <strong className="text-amber-400 font-mono select-all">{log.parsedUtr}</strong></span>
                                {log.reason && <span className="text-slate-500 italic max-w-[200px] truncate" title={log.reason}>{log.reason}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminActiveTab === 'payments' && (
                <div className="space-y-4 text-left animate-fadeIn">
                  {/* Broker Payments Log List */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                      <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                        💰 {lang === 'bn' ? 'ইউজার পেমেন্ট ও যাচাইকরণের ইতিহাস' : 'User Verification History'}
                      </h4>
                      <button
                        type="button"
                        onClick={fetchPaymentAttempts}
                        disabled={loadingAttempts}
                        className="text-[9px] font-black text-amber-400 hover:text-amber-300 cursor-pointer uppercase tracking-wider bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        🔄 {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                      </button>
                    </div>

                    {loadingAttempts ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[9px] font-black uppercase text-slate-500">Loading attempts...</p>
                      </div>
                    ) : paymentAttempts.length === 0 ? (
                      <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-slate-800/60 text-slate-500">
                        <p className="text-[10px] font-black uppercase">No payment attempts tracked yet</p>
                        <p className="text-[9px] text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                          {lang === 'bn' 
                            ? 'দালালরা যখনই প্রোফাইল ভেরিফাই বা প্রিমিয়াম পেমেন্ট করার চেষ্টা করবে, সমস্ত রিয়েল-টাইম রেকর্ড এখানে এসে জমা হবে।'
                            : 'When brokers input their 12-digit UTR numbers to renew accounts, verification attempts will be logged here.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                        {paymentAttempts.map((attempt: any) => {
                          const isSuccess = attempt.status === 'success';
                          const isPending = attempt.status === 'pending';
                          const isRejected = attempt.status === 'rejected';
                          
                          let borderClass = 'border-rose-950/40 hover:border-rose-900/40';
                          if (isSuccess) borderClass = 'border-green-950/50 hover:border-green-900/50';
                          if (isPending) borderClass = 'border-amber-950/50 hover:border-amber-900/50 bg-slate-900/80';

                          return (
                            <div 
                              key={attempt.orderId}
                              className={`p-2.5 bg-slate-900/50 rounded-xl border ${borderClass} space-y-1.5 transition-all text-left`}
                            >
                              <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500">
                                <span>Order: <strong className="text-slate-300 select-all">{attempt.orderId}</strong></span>
                                <span>{new Date(attempt.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
                              </div>

                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                  <p className="text-[11.5px] font-extrabold text-slate-200">
                                    👤 {attempt.brokerName} ({attempt.brokerPhone})
                                  </p>
                                  <p className="text-[9.5px] font-semibold text-slate-400 font-mono">
                                    🔑 UTR: <strong className="text-amber-400 select-all">{attempt.utr}</strong> ({attempt.amount} INR)
                                  </p>
                                </div>
                                <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                                  isSuccess 
                                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                    : isPending
                                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                }`}>
                                  {isSuccess 
                                    ? (lang === 'bn' ? 'সফল ✓' : 'Verified ✓') 
                                    : isPending
                                      ? (lang === 'bn' ? 'অপেক্ষমান ⌛' : 'Pending ⌛')
                                      : (lang === 'bn' ? 'বাতিল ✗' : 'Rejected ✗')}
                                </span>
                              </div>

                              {isPending && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                                  <div>
                                    <label className="text-[8.5px] font-bold uppercase text-slate-400 block mb-1">
                                      {lang === 'bn' ? 'বাতিল করার কারণ (রিজেক্ট করতে চাইলে ঐচ্ছিক কারণ লিখুন)' : 'Rejection Reason (Optional for Reject)'}
                                    </label>
                                    <input 
                                      type="text"
                                      id={`reason-${attempt.orderId}`}
                                      placeholder={lang === 'bn' ? 'যেমন: ভুল UTR নম্বর / টাকা পাওয়া যায়নি' : 'e.g., Incorrect UTR'}
                                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-white outline-none focus:border-rose-500"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const inputEl = document.getElementById(`reason-${attempt.orderId}`) as HTMLInputElement;
                                        const reason = inputEl?.value || "";
                                        handleApprovePayment(attempt.orderId, 'success', reason);
                                      }}
                                      className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-transform text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg cursor-pointer"
                                    >
                                      ✓ {lang === 'bn' ? 'একসেপ্ট করুন' : 'Approve'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const inputEl = document.getElementById(`reason-${attempt.orderId}`) as HTMLInputElement;
                                        const reason = inputEl?.value || "Incorrect UTR / Payment not received";
                                        handleApprovePayment(attempt.orderId, 'rejected', reason);
                                      }}
                                      className="flex-1 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 transition-transform text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg cursor-pointer"
                                    >
                                      ✗ {lang === 'bn' ? 'রিজেক্ট করুন' : 'Reject'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!isSuccess && !isPending && (attempt.errorMessage || attempt.errorMessageBn) && (
                                <div className="p-2 bg-rose-950/20 border border-rose-950/40 rounded-lg text-[9px] text-rose-300 leading-normal font-sans">
                                  ⚠️ <strong>Reason:</strong> {lang === 'bn' ? (attempt.errorMessageBn || attempt.errorMessage) : attempt.errorMessage}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* APK / PWA Download Center Modal */}
        {showApkModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-5 space-y-4 text-slate-800 relative shadow-2xl max-h-[95vh] overflow-y-auto scrollbar-thin"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowApkModal(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Title & Banner */}
              <div className="text-center space-y-1 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0a2e50] to-[#0d3f6d] text-white flex items-center justify-center mx-auto shadow-md border border-white/20 overflow-hidden">
                  <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mt-2">
                  {lang === 'bn' ? 'এপিকে ও মোবাইল অ্যাপ ইনস্টলেশন' : 'APK & Mobile App Installation'}
                </h3>
                <p className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wide">
                  {lang === 'bn' ? 'অফিসিয়াল অ্যাপ ইনস্টলেশন ও অটো-আপডেট গেটওয়ে' : 'Official App Setup & Live Update System'}
                </p>
              </div>

              {/* Critical Deployment Check warning */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 font-black">
                  <span className="text-lg animate-bounce">⚠️</span>
                  <h4 className="text-[11px] uppercase tracking-wider">
                    {lang === 'bn' ? 'এপিকে অত্যন্ত গুরুত্বপূর্ণ সমাধান (Error Page Not Found):' : 'CRITICAL APK RESOLUTION (Error Page Not Found):'}
                  </h4>
                </div>
                <div className="text-[10.5px] leading-relaxed font-semibold text-slate-700 space-y-1.5">
                  {lang === 'bn' ? (
                    <>
                      <p className="text-rose-950 font-extrabold text-[11px]">
                        আপনার ফোনে বা এপিকে (APK) অ্যাপ্লিকেশনে <span className="underline decoration-rose-500">"Error: Page not found"</span> দেখানোর প্রধান কারণ হলো আপনি এআই স্টুডিওতে অ্যাপটি এখনো <strong>"Share" (শেয়ার)</strong> বা পাবলিশ করেননি!
                      </p>
                      <p className="text-slate-600 font-bold">
                        👉 <strong>সহজ সমাধান:</strong> গুগল এআই স্টুডিও (Google AI Studio) স্ক্রিনের একদম উপরে ডানদিকের কোণায় একটি নীল রঙের <strong className="text-indigo-600">"Share" (শেয়ার)</strong> বাটন আছে। ওই বাটনে ক্লিক করে <strong>"Share App"</strong> করে দিন। এটি করলেই অ্যাপটি ক্লাউড সার্ভারে লাইভ হয়ে যাবে এবং মোবাইলের এপিকে বা লিংকটি সাথে সাথে কাজ করতে শুরু করবে!
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-rose-950 font-extrabold text-[11px]">
                        If your APK or live link shows <span className="underline decoration-rose-500">"Error: Page not found"</span>, it means your app container has not been built/published yet in AI Studio!
                      </p>
                      <p className="text-slate-600 font-bold">
                        👉 <strong>Simple Fix:</strong> Click the blue <strong className="text-indigo-600">"Share"</strong> button at the top-right corner of your Google AI Studio editor screen and finalize sharing. Once done, your cloud container will be active and your APK will load perfectly!
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Tab Switching Header */}
              <div className="flex border-b border-slate-200 select-none overflow-x-auto">
                <button
                  onClick={() => setApkTab('direct')}
                  className={`flex-1 min-w-[90px] pb-3 text-[10px] font-black uppercase tracking-wider transition-colors relative cursor-pointer ${
                    apkTab === 'direct' ? 'text-[#0a2e50]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {lang === 'bn' ? 'ডাউনলোড এপিকে' : 'Direct APK'}
                  {apkTab === 'direct' && (
                    <motion.div layoutId="apkActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a2e50]" />
                  )}
                </button>
                <button
                  onClick={() => setApkTab('pwa')}
                  className={`flex-1 min-w-[90px] pb-3 text-[10px] font-black uppercase tracking-wider transition-colors relative cursor-pointer ${
                    apkTab === 'pwa' ? 'text-[#0a2e50]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {lang === 'bn' ? '১-ক্লিক ইনস্টল' : '1-Click PWA'}
                  {apkTab === 'pwa' && (
                    <motion.div layoutId="apkActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a2e50]" />
                  )}
                </button>
                <button
                  onClick={() => setApkTab('builder')}
                  className={`flex-1 min-w-[130px] pb-3 text-[10px] font-black uppercase tracking-wider transition-colors relative cursor-pointer text-amber-600 ${
                    apkTab === 'builder' ? 'text-amber-500 font-extrabold' : 'text-amber-600/70 hover:text-amber-600'
                  }`}
                >
                  {lang === 'bn' ? '👑 ১০০% ফ্রি এপিকে মেকার' : '👑 Free APK Maker'}
                  {apkTab === 'builder' && (
                    <motion.div layoutId="apkActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
              </div>

              {/* Dynamic Tab Body */}
              <AnimatePresence mode="wait">
                {apkTab === 'direct' ? (
                  <motion.div
                    key="direct-tab-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left"
                  >
                    {/* Pulsating direct download card */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-3.5 shadow-sm">
                      <div className="flex items-center gap-2.5 text-emerald-800 font-black">
                        <span className="text-xl animate-bounce">🤖</span>
                        <div>
                          <h4 className="text-[12px] uppercase tracking-wider">
                            {lang === 'bn' ? 'সরাসরি এপিকে (.APK) ডাউনলোড লিংক:' : 'DIRECT APK DOWNLOAD:'}
                          </h4>
                          <p className="text-[9.5px] text-emerald-700 font-bold normal-case mt-0.5">
                            {lang === 'bn' ? 'মোবাইলে ইনস্টল করার একদম সহজ ও ডাইরেক্ট উপায়' : 'The easiest and fastest way to install on Android'}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`${getLiveAppUrl()}/bharat_ka_kaam.apk`}
                        download="Bharat ka Kaam.apk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 text-center flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <span className="text-sm">📥</span>
                        <span>{lang === 'bn' ? 'ডাইরেক্ট এপিকে (.APK) ডাউনলোড করুন' : 'DOWNLOAD DIRECT APK FILE'}</span>
                      </a>

                      <p className="text-[9.5px] text-slate-500 font-bold leading-relaxed text-center">
                        {lang === 'bn' ? 'ফাইল সাইজ: ~৩.৬ এমবি | ভার্সন: ১.০.০' : 'File Size: ~3.6 MB | Version: 1.0.0'}
                      </p>
                    </div>

                    {/* How to install instructions */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                      <p className="text-[11px] font-black uppercase tracking-wider text-[#0a2e50] flex items-center gap-1.5">
                        <span>📲</span>
                        {lang === 'bn' ? 'ফোনে ইনস্টল করার সহজ নিয়মাবলী:' : 'Easy Installation Steps:'}
                      </p>
                      
                      <div className="space-y-2 text-[10.5px] text-slate-600 font-bold">
                        <p>1️⃣ <strong className="text-slate-900">{lang === 'bn' ? 'ডাউনলোড সম্পন্ন করুন:' : 'Complete Download:'}</strong> {lang === 'bn' ? 'উপরের সবুজ বাটনে ক্লিক করে সরাসরি .APK ফাইলটি ডাউনলোড করুন।' : 'Click the green button above to download the .APK file.'}</p>
                        <p>2️⃣ <strong className="text-slate-900">{lang === 'bn' ? 'ফাইলটি ওপেন করুন:' : 'Open the File:'}</strong> {lang === 'bn' ? 'ডাউনলোড শেষে নোটিফিকেশন বার অথবা ফাইলের "Downloads" ফোল্ডার থেকে ফাইলটিতে ক্লিক করুন।' : 'Once downloaded, click on the file from your notification bar or "Downloads" folder.'}</p>
                        <p>3️⃣ <strong className="text-slate-900">{lang === 'bn' ? 'পারমিশন দিন (যদি চায়):' : 'Allow Installation:'}</strong> {lang === 'bn' ? 'যদি প্লে প্রোটেক্ট বা সিকিউরিটি সতর্কতা দেখায়, তবে "Install Anyway" অথবা "Settings" থেকে "Unknown Sources" অন করুন।' : 'If prompted with "Blocked by Play Protect", click "Install Anyway" or enable "Unknown Sources".'}</p>
                        <p>4️⃣ <strong className="text-slate-900">{lang === 'bn' ? 'ম্যাজিক সিঙ্ক সক্রিয়:' : 'Auto-Update Enabled:'}</strong> {lang === 'bn' ? 'এই এপিকে ফাইলটি সরাসরি আমাদের লাইভ সার্ভার লোড করে, তাই এআই স্টুডিওতে কোনো নতুন পরিবর্তন বা আপডেট দিলেই তা আপনার ফোনের অ্যাপেও সরাসরি অটো-আপডেট হয়ে যাবে!' : 'Once installed, any updates you make in AI Studio will reflect instantly inside your mobile app!'}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : apkTab === 'pwa' ? (
                  <motion.div
                    key="pwa-tab-content"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {/* Live Server Sync Loop Visual */}
                    <div className="bg-[#e8f5e9] border border-[#a5d6a7]/40 rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <div>
                          <p className="text-[11px] font-black text-emerald-950 uppercase">
                            {lang === 'bn' ? 'ম্যাজিক সিঙ্ক লুপ সক্রিয়' : 'Magic Sync Loop Active'}
                          </p>
                          <p className="text-[9.5px] text-emerald-800 font-bold leading-tight mt-0.5">
                            {lang === 'bn' ? 'এখানে কোনো নতুন ফিচার দিলে এআই স্টুডিও থেকে সরাসরি ফোনে আপডেট হবে!' : 'Any changes in AI Studio will load instantly inside the app!'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs shrink-0 select-none">🔄</span>
                    </div>

                    {/* Method 1: Instant App (PWA - Recommended) */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left space-y-3">
                      <div className="text-xs text-slate-600 font-medium leading-relaxed">
                        {lang === 'bn' ? (
                          <p>এটি অ্যান্ড্রয়েড ও আইওএস-এর আধুনিক ও অফিশিয়াল স্ট্যান্ডার্ড। কোনো প্লে-স্টোর ছাড়াই সরাসরি ব্রাউজার দিয়ে ১ ক্লিকে ফোনে অ্যাপটি ইনস্টল করে। এটি মোবাইলের মেমোরি খরচ করে না এবং অফলাইনেও কাজ করে!</p>
                        ) : (
                          <p>This is the modern and official standard. Installs directly to your home screen via browser. Zero storage footprint, offline ready, and extremely fast.</p>
                        )}
                      </div>

                      {/* Dynamic Trigger Button */}
                      <button
                        onClick={handleTriggerPWAInstall}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>📥</span>
                        {lang === 'bn' ? 'ফোনে সরাসরি ইনস্টল করুন (০ এমবি)' : 'Install on Mobile (0 MB Size)'}
                      </button>

                      <div className="border-t border-slate-200/50 pt-2.5 text-[10.5px] text-slate-400 font-bold space-y-1.5">
                        <p>🌐 <strong>{lang === 'bn' ? 'অ্যান্ড্রয়েড:' : 'Android (Chrome):'}</strong> {lang === 'bn' ? 'ইনস্টল বাটনে ট্যাপ করুন অথবা Chrome-এর ৩-ডট মেনু থেকে "Add to Home screen" বা "Install App" সিলেক্ট করুন।' : 'Tap Install or click Chrome Menu -> "Add to Home Screen".'}</p>
                        <p>🍎 <strong>{lang === 'bn' ? 'আইফোন (Safari):' : 'iPhone (Safari):'}</strong> {lang === 'bn' ? 'সাফারী ব্রাউজারের নিচে "Share" (📤) আইকনে ট্যাপ করে নিচের মেনু থেকে "Add to Home Screen" (➕) সিলেক্ট করুন।' : 'Tap Share (📤) in Safari -> "Add to Home Screen" (➕).'}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="apk-tab-content"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {/* Live Sync Explanation */}
                    <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3 text-left space-y-1.5">
                      <p className="text-[11px] font-black text-amber-950 uppercase flex items-center gap-1.5">
                        <span>💡</span>
                        {lang === 'bn' ? 'অটো-আপডেট এপিকে গ্যারান্টি:' : 'Auto-Update APK Guarantee:'}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                        {lang === 'bn' ? (
                          <span>নিচের সিস্টেমে তৈরি করা এপিকেটি সরাসরি আপনার লাইভ ক্লাউড রান সার্ভার লোড করবে। ফলে আপনি যখনই এআই স্টুডিওতে কোনো নতুন ফিচার বা কোড আপডেট দেবেন, মোবাইলের অ্যাপে সেটি <strong>পুনরায় এপিকে ডাউনলোড করা ছাড়াই সরাসরি আপডেট হয়ে যাবে!</strong></span>
                        ) : (
                          <span>APKs generated this way wrap your live Cloud Run server. Any new updates you perform in AI Studio will reflect instantly <strong>without downloading any new APK file!</strong></span>
                        )}
                      </p>
                    </div>

                    {/* Pre-filled Copy area */}
                    <div className="space-y-2.5 text-left bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        {lang === 'bn' ? 'এপিকে মেকারের প্রয়োজনীয় তথ্যসমূহ:' : 'Required Information for APK Builder:'}
                      </p>

                      {/* URL Copy */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">{lang === 'bn' ? 'আপনার লাইভ ওয়েবসাইট লিংক (Website URL):' : 'Website URL:'}</span>
                        <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 shadow-xs">
                          <span className="text-[10.5px] font-bold text-[#0a2e50] truncate block max-w-[260px]">
                            {getLiveAppUrl()}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getLiveAppUrl()).then(() => {
                                handleSuccess(lang === 'bn' ? '✓ লিংক কপি হয়েছে!' : '✓ Link copied!');
                              });
                            }}
                            className="px-2.5 py-1 bg-[#0a2e50] hover:bg-[#051c33] text-white font-black text-[9px] rounded-lg cursor-pointer shrink-0 transition-colors"
                          >
                            {lang === 'bn' ? '📋 কপি করুন' : '📋 Copy'}
                          </button>
                        </div>
                      </div>

                      {/* App Name Copy */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">{lang === 'bn' ? 'অ্যাপের নাম (App Name):' : 'App Name:'}</span>
                        <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 shadow-xs">
                          <span className="text-[10.5px] font-bold text-[#0a2e50] truncate block">
                            Bharat ka Kaam
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('Bharat ka Kaam').then(() => {
                                handleSuccess(lang === 'bn' ? '✓ নাম কপি হয়েছে!' : '✓ Name copied!');
                              });
                            }}
                            className="px-2.5 py-1 bg-[#0a2e50] hover:bg-[#051c33] text-white font-black text-[9px] rounded-lg cursor-pointer shrink-0 transition-colors"
                          >
                            {lang === 'bn' ? '📋 কপি করুন' : '📋 Copy'}
                          </button>
                        </div>
                      </div>

                      {/* App Icon Download */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-black uppercase block">{lang === 'bn' ? 'অ্যাপ লোগো / আইকন (App Icon):' : 'App Logo / Icon:'}</span>
                        <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 shadow-xs">
                          <span className="text-[10.5px] font-bold text-[#0a2e50] truncate block">
                            logo.png (512x512 High Resolution)
                          </span>
                          <a
                            href="/logo.png"
                            download="logo.png"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] rounded-lg cursor-pointer shrink-0 transition-colors flex items-center gap-1 text-center"
                          >
                            📥 {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-step Builder Instructions */}
                    <div className="space-y-1.5 text-[10px] text-slate-500 font-bold text-left pt-1">
                      <p className="font-extrabold text-amber-900 uppercase tracking-wider">{lang === 'bn' ? '১ মিনিটে ফ্রি এপিকে ফাইল বানানোর নিয়ম:' : 'How to make your APK in 1 minute:'}</p>
                      <p>1️⃣ {lang === 'bn' ? 'উপরের বাটনে ক্লিক করে লাইভ লিংকটি কপি করুন এবং অ্যাপ লোগোটি ডাউনলোড করুন।' : 'Copy the live website link and download the app logo above.'}</p>
                      <p>2️⃣ {lang === 'bn' ? 'ফ্রি এপিকে মেকার ওয়েবসাইট WebIntoApp এ যান (নিচের বাটনে ক্লিক করুন)।' : 'Go to free APK builder website: WebIntoApp (click the button below).'}</p>
                      <p>3️⃣ {lang === 'bn' ? 'সেখানে Website URL বক্সে আপনার কপি করা লিংকটি পেস্ট করুন।' : 'Paste your copied link into the Website URL box.'}</p>
                      <p>4️⃣ {lang === 'bn' ? 'App Name লিখুন "Bharat ka Kaam" এবং অ্যাপের লোগো হিসেবে ডাউনলোড করা লোগোটি আপলোড করুন।' : 'Set App Name: "Bharat ka Kaam" and upload the icon logo.'}</p>
                      <p>5️⃣ {lang === 'bn' ? '"Build App" এ ক্লিক করে আপনার এপিকে (.apk) ফাইল ডাউনলোড করে ফোনে ইনস্টল করুন!' : 'Click "Build App" to generate and download your instant .apk file!'}</p>
                    </div>

                    {/* External Builder Launcher */}
                    <a
                      href="https://www.webintoapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 text-center flex items-center justify-center gap-1.5"
                    >
                      <span>🚀</span>
                      {lang === 'bn' ? 'এপিকে মেকার (WebIntoApp) ওয়েবসাইটে যান' : 'Go to WebIntoApp.com Builder'}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Direct Website Sharing Platform section */}
              <div className="bg-gradient-to-br from-[#0a2e50] to-[#041a31] text-white border border-teal-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl text-left relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400 shrink-0">
                    <Share2 size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2">
                      {lang === 'bn' ? '🤝 বন্ধুদের সাথে ওয়েবসাইট শেয়ার করুন!' : lang === 'hi' ? '🤝 दोस्तों के साथ वेबसाइट शेयर करें!' : '🤝 Share Website with Friends!'}
                    </h3>
                    <p className="text-[10.5px] md:text-xs text-slate-300 font-bold leading-relaxed">
                      {lang === 'bn' 
                        ? 'নিচের বাটনে ক্লিক করে অফিশিয়াল ওয়েবসাইট লিংকটি কপি করুন ও বন্ধুদের পাঠান। এই লিংকে ক্লিক করে যে কেউ সরাসরি হোমপেজে এসে নিজের আইডি খুলে কাজ করতে বা লোক নিয়োগ করতে পারবেন!' 
                        : lang === 'hi'
                        ? 'नीचे दिए गए बटन पर क्लिक करके आधिकारिक वेबसाइट लिंक कॉपी करें और दोस्तों को भेजें। इस लिंक पर क्लिक करके कोई भी सीधे होमपेज पर आकर अपनी आईडी बनाकर काम पा सकता है!'
                        : 'Copy and share the official website link with friends. Clicking this link lets anyone land directly on the homepage, register their profile/ID, and start working immediately!'}
                    </p>
                  </div>
                </div>

                {/* Website Link Box */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] text-teal-400 font-black uppercase tracking-wider block mb-0.5">
                      {lang === 'bn' ? 'অফিশিয়াল ওয়েবসাইট লিংক (Official Website Link):' : 'Official Website Link:'}
                    </span>
                    <span className="text-[11px] font-mono font-black text-slate-100 block truncate select-all">
                      {getLiveAppUrl()}
                    </span>
                  </div>
                  
                  {/* Copy & Share Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const shareUrl = getLiveAppUrl();
                        navigator.clipboard.writeText(shareUrl);
                        handleSuccess(lang === 'bn' ? '✓ লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে!' : '✓ Link copied to clipboard!');
                        
                        // Try native web sharing if supported
                        if (navigator.share) {
                          navigator.share({
                            title: 'Bharat Ka Kaam',
                            text: lang === 'bn' ? 'দালাল ছাড়াই সরাসরি কাজ ও কর্মী খোঁজার ১০০% ফ্রি প্ল্যাটফর্ম!' : 'Find Jobs & Hire Workers directly with ZERO commission!',
                            url: shareUrl
                          }).catch(() => {});
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Copy size={13} />
                      {lang === 'bn' ? 'লিংক কপি করুন' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Direct Messenger Share Buttons Row */}
                <div className="flex flex-wrap items-center justify-start gap-2 pt-1.5 select-none">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                    {lang === 'bn' ? 'সরাসরি শেয়ার করুন:' : 'Direct Share:'}
                  </span>
                  
                  {/* WhatsApp Share */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      (lang === 'bn' 
                        ? 'দালাল ছাড়াই সরাসরি কাজ ও কর্মী খোঁজার ১০০% ফ্রি প্ল্যাটফর্ম! আজই ডাইরেক্ট হোমপেজে এসে আপনার আইডি খুলুন ও কাজ শুরু করুন: ' 
                        : 'Join Bharat Ka Kaam today! Connect directly with workers and employers. Register and create your ID now: ') + getLiveAppUrl()
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-green-600/15 border border-green-500/20 hover:bg-green-600/25 text-green-400 font-extrabold text-[9.5px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1"
                  >
                    💬 WhatsApp
                  </a>

                  {/* Facebook Share */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getLiveAppUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-blue-600/15 border border-blue-500/20 hover:bg-blue-600/25 text-blue-400 font-extrabold text-[9.5px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1"
                  >
                    👥 Facebook
                  </a>
                </div>
              </div>

              {/* Secure guarantee banner */}
              <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-center select-none">
                <p className="text-[9px] font-black text-slate-400 tracking-wider uppercase">
                  🛡️ BHARAT KA KAAM SECURE AUTO-UPDATE INFRASTRUCTURE
                </p>
              </div>

            </motion.div>
          </div>
        )}

        {/* Dynamic Floating Action Button for worker registration on Home screen */}
        {activeView === 'home' && (
          <motion.button
            id="floating-pencil-fab"
            onClick={() => setShowWorkerForm(true)}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-20 right-4 sm:right-8 z-40 flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg shadow-emerald-200/40 border border-emerald-400/20 font-black text-xs sm:text-sm tracking-wide cursor-pointer transition-all"
          >
            <Pencil size={18} className="animate-pulse shrink-0" />
            <span>
              {lang === 'bn' ? 'কাজ লাগবে? পোস্ট করুন 👷' : lang === 'hi' ? 'काम चाहिए? पोस्ट करें 👷' : 'Need Work? Post here! 👷'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </main>

      {/* Hidden Google Translate container */}
      <div id="google_translate_element" style={{ display: 'none' }} className="hidden" />

      {/* 🔐 Beautiful full-screen/modal for Login */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-6 text-slate-200 relative shadow-2xl"
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                🔑
              </div>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">
                {lang === 'bn' ? 'লগইন করুন' : 'Log In Account'}
              </h3>
              <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">
                {lang === 'bn' ? 'আপনার সেভ করা ক্রেডেনশিয়াল ব্যবহার করুন' : 'Access your existing profile'}
              </p>
            </div>

            <form onSubmit={handleCredentialsLogin} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                </label>
                <FastInput
                  type="text"
                  required
                  value={loginEmailOrPhone}
                  onChange={setLoginEmailOrPhone}
                  icon="📞"
                  placeholder={lang === 'bn' ? 'মোবাইল নম্বর লিখুন' : 'Enter mobile number'}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setShowForgotModal(true);
                      setForgotMessage('');
                    }}
                    className="text-[9px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-wider cursor-pointer"
                  >
                    {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                  </button>
                </div>
                <FastInput
                  type="password"
                  required
                  value={loginFormPassword}
                  onChange={setLoginFormPassword}
                  icon="🔒"
                  placeholder="•••••"
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 text-center uppercase tracking-wide">
                🛡️ {lang === 'bn' ? 'ডাটা সুরক্ষিত • কোনো তথ্য ফালতুভাবে লিক করা হবে না' : 'Data Secure • Zero Information Leak Guarantee'}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/5 cursor-pointer text-center"
              >
                {lang === 'bn' ? 'লগইন নিশ্চিত করুন' : 'Verify & Log In'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800/60 space-y-2">
              <p className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'কোনো অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowOnboarding(true);
                  }}
                  className="font-black text-teal-400 hover:text-teal-300 cursor-pointer focus:outline-none"
                >
                  {lang === 'bn' ? 'নতুন আইডি খুলুন (Sign Up)' : 'Register Profile (Sign Up)'}
                </button>
              </p>
              
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-[9px] text-amber-500 hover:text-amber-400 font-extrabold uppercase tracking-wide cursor-pointer focus:outline-none hover:underline"
              >
                🛡️ {lang === 'bn' ? 'প্রাইভেসি ও লাইফটাইম একাউন্ট পলিসি' : 'Privacy & Lifetime Account Policy'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 🔑 Beautiful full-screen/modal for Forgot Password/Phone */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-6 text-slate-200 relative shadow-2xl"
          >
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep('phone');
                setRecoveryOtpInput('');
                setForgotMessage('');
                setForgotInput('');
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                🛡️
              </div>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">
                {lang === 'bn' ? 'আইডি পুনরুদ্ধার' : 'Account Recovery'}
              </h3>
              <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">
                {forgotStep === 'phone' 
                  ? (lang === 'bn' ? 'আপনার নিবন্ধিত মোবাইল নম্বর লিখুন' : 'Enter your registered mobile number')
                  : (lang === 'bn' ? 'নিরাপত্তা ওটিপি যাচাই করুন' : 'Verify security OTP code')}
              </p>
            </div>

            {forgotStep === 'phone' ? (
              <form onSubmit={handleForgotCredentials} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    {lang === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile Number'}
                  </label>
                  <FastInput
                    type="tel"
                    required
                    value={forgotInput}
                    onChange={setForgotInput}
                    icon="📞"
                    placeholder={lang === 'bn' ? 'যেমনঃ 9876543210' : 'e.g. 9876543210'}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-rose-500 transition-all"
                  />
                </div>

                {forgotMessage && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-300 leading-normal text-center whitespace-pre-line animate-pulse">
                    {forgotMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={recoveryIsVerifying}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer text-center"
                >
                  {recoveryIsVerifying 
                    ? (lang === 'bn' ? 'অনুসন্ধান করা হচ্ছে...' : 'Searching account...') 
                    : (lang === 'bn' ? 'অ্যাকাউন্ট খুঁজুন' : 'Find Account & Send OTP')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4 text-left">
                {/* 🔒 OTP Code Display Badge */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                  <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">
                    {lang === 'bn' ? '🔑 আপনার সিকিউরিটি ওটিপি কোড' : '🔑 YOUR SECURITY OTP CODE'}
                  </span>
                  <div className="text-3xl font-black text-emerald-400 tracking-widest select-all bg-slate-950 py-2 px-4 rounded-xl border border-slate-800 inline-block font-mono">
                    {recoveryGeneratedOtp}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    {lang === 'bn' 
                      ? 'নিরাপত্তা নিশ্চিত করতে ওটিপি কোডটি নিচে লিখুন বা নিচের বাটনে ক্লিক করুন।' 
                      : 'To verify, type the code below or click the auto-fill button.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRecoveryOtpInput(recoveryGeneratedOtp)}
                    className="block text-[10px] mx-auto text-teal-400 hover:text-teal-300 font-black uppercase tracking-wider underline cursor-pointer active:scale-95 transition-transform"
                  >
                    ⚡ {lang === 'bn' ? 'কোডটি অটো-ফিল করুন (Auto-Fill Code)' : 'Auto-Fill OTP Code'}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    {lang === 'bn' ? '৪-ডিজিট ওটিপি কোড' : '4-Digit OTP Code'}
                  </label>
                  <FastInput
                    type="text"
                    maxLength={4}
                    required
                    value={recoveryOtpInput}
                    onChange={setRecoveryOtpInput}
                    icon="🔒"
                    placeholder="••••"
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs tracking-widest text-center text-slate-200 outline-none focus:border-rose-500 transition-all"
                  />
                </div>

                {forgotMessage && !forgotMessage.includes(recoveryGeneratedOtp) && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 leading-normal text-center whitespace-pre-line">
                    {forgotMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-center"
                >
                  {lang === 'bn' ? 'ওটিপি কোড যাচাই করুন' : 'Verify OTP & Login'}
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-slate-800/60">
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setShowLoginModal(true);
                  setForgotStep('phone');
                  setRecoveryOtpInput('');
                  setForgotMessage('');
                  setForgotInput('');
                }}
                className="font-black text-teal-400 hover:text-teal-300 text-[10px] uppercase tracking-wider cursor-pointer focus:outline-none"
              >
                ← {lang === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 👤 Premium Profile Settings & Photo Upload Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-200 relative shadow-2xl my-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowProfileSettings(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Tabs for Settings, Applied Jobs, History, and App Details */}
            <div className="flex border-b border-slate-800/80 pb-1 pt-2 gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setProfileActiveTab('settings')}
                className={`flex-1 min-w-[70px] text-center pb-2 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  profileActiveTab === 'settings'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                👤 {lang === 'bn' ? 'সেটিংস' : 'Settings'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileActiveTab('applied_jobs');
                  fetchUserHistory();
                }}
                className={`flex-1 min-w-[95px] text-center pb-2 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  profileActiveTab === 'applied_jobs'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                💼 {lang === 'bn' ? 'আবেদনকৃত কাজ' : 'Applied Jobs'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileActiveTab('history');
                  fetchUserHistory();
                }}
                className={`flex-1 min-w-[70px] text-center pb-2 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  profileActiveTab === 'history'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                📜 {lang === 'bn' ? 'ইতিহাস' : 'History'}
              </button>
              <button
                type="button"
                onClick={() => setProfileActiveTab('app_details')}
                className={`flex-1 min-w-[95px] text-center pb-2 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  profileActiveTab === 'app_details'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                📱 {lang === 'bn' ? 'এপ্স ডিটেলস' : 'App Details'}
              </button>
            </div>

            {profileActiveTab === 'history' ? (
              <div className="space-y-4 pt-1">
                <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <span>📜</span>
                    {lang === 'bn' ? 'আপনার কাজের ইতিহাস' : 'Your Activity History'}
                  </h3>
                  <button
                    type="button"
                    onClick={fetchUserHistory}
                    className="text-[9px] font-black text-teal-400 hover:text-teal-300 cursor-pointer uppercase tracking-wider bg-slate-950 px-2 py-1 rounded border border-slate-850"
                  >
                    🔄 {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black tracking-widest uppercase text-slate-500">Loading History...</p>
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-2 bg-slate-950/45 rounded-2xl border border-slate-800/60 p-4">
                    <span className="text-3xl block">📋</span>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {lang === 'bn' ? 'কোনো ইতিহাস পাওয়া যায়নি' : 'No history logged yet'}
                    </p>
                    <p className="text-[10px] leading-relaxed text-slate-500 max-w-xs mx-auto">
                      {lang === 'bn' 
                        ? 'আপনি যখনই অ্যাপ ব্যবহার করে সরাসরি কল করবেন, বুকমার্ক করবেন বা প্রোফাইল আপডেট করবেন, আপনার সমস্ত কাজের ইতিহাস এখানে ক্রমানুসারে সংরক্ষণ করা থাকবে।' 
                        : 'Your direct calls, bookmarked entries, posts, and profile updates will be securely saved and listed here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {historyLogs.map((log, index) => (
                      <div 
                        key={index}
                        className="p-2.5 bg-slate-950/45 rounded-xl border border-slate-850 hover:border-slate-800 transition-all flex gap-3 text-left"
                      >
                        <div className="text-sm select-none shrink-0 bg-slate-900 border border-slate-800 rounded-lg w-7 h-7 flex items-center justify-center">
                          {log.activityType === 'call' || log.activityType === 'call_broker' ? '📞' :
                           log.activityType === 'add_bookmark' ? '⭐' :
                           log.activityType === 'remove_bookmark' ? '🗑️' :
                           log.activityType === 'profile_update' ? '👤' :
                           log.activityType === 'post_job' || log.activityType === 'post_recruitment' ? '💼' :
                           log.activityType === 'post_worker' ? '🛠️' : '📝'}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-[11px] font-bold text-slate-300 tracking-tight leading-snug">
                            {lang === 'bn' ? log.descriptionBn : log.descriptionEn}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                            <span>
                              {new Date(log.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {log.details?.phone && (
                              <span className="text-[9px] font-extrabold text-teal-400">
                                📞 {log.details.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : profileActiveTab === 'applied_jobs' ? (
              <div className="space-y-4 pt-1 text-left max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>💼</span>
                    {lang === 'bn' ? 'আবেদনকৃত কাজের ইতিহাস' : 'Applied Jobs History'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    {lang === 'bn' 
                      ? 'আপনার মোবাইল থেকে করা কাজের আবেদন ও যোগাযোগের লাইফটাইম ইতিহাস।' 
                      : 'Lifetime history of jobs you applied to or contacted via call.'}
                  </p>
                </div>

                {/* Local search within applied jobs */}
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
                  <input
                    type="text"
                    value={appliedSearchQuery}
                    onChange={(e) => setAppliedSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                    placeholder={lang === 'bn' ? 'আবেদনকৃত কাজ খুঁজুন...' : 'Search applied jobs...'}
                  />
                  {appliedSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAppliedSearchQuery('')}
                      className="absolute right-3 top-2 text-[10px] text-slate-500 hover:text-slate-300 font-black cursor-pointer bg-slate-850 px-1.5 py-0.5 rounded"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {loadingHistory ? (
                  <div className="py-12 text-center text-xs font-medium text-slate-500 animate-pulse">
                    ⏳ {lang === 'bn' ? 'ইতিহাস লোড হচ্ছে...' : 'Loading history...'}
                  </div>
                ) : (() => {
                  // Filter out only apply_job or call events that have job/target details
                  const rawJobsList = historyLogs.filter(log => {
                    const isRelevant = log.activityType === 'apply_job' || log.activityType === 'call';
                    if (!isRelevant) return false;

                    const title = log.details?.title || (log.details?.targetId ? (combinedJobs.find(j => j.id === log.details.targetId)?.title || '') : '');
                    const company = log.details?.company || (log.details?.targetId ? (combinedJobs.find(j => j.id === log.details.targetId)?.company || '') : '');
                    
                    const q = appliedSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return title.toLowerCase().includes(q) || company.toLowerCase().includes(q);
                  });

                  if (rawJobsList.length === 0) {
                    return (
                      <div className="py-12 text-center border border-dashed border-slate-800/60 rounded-3xl space-y-2 bg-slate-950/20">
                        <span className="text-2xl block">📁</span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {lang === 'bn' ? 'কোনো কাজের আবেদন পাওয়া যায়নি' : 'No applied jobs found'}
                        </p>
                        <p className="text-[9px] text-slate-600 max-w-[200px] mx-auto leading-normal">
                          {lang === 'bn' 
                            ? 'যেকোনো কাজের কার্ডে থাকা "কল করুন" বা "দালালকে কল দিন" বাটনে চাপ দিলে এখানে অটোমেটিক রেকর্ড জমা হবে।' 
                            : 'Click "Call Employer" or "Call Broker" on any job post to automatically log your applications here.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {rawJobsList.map((log, idx) => {
                        // Extract metadata
                        const matchedJobFromState = log.details?.targetId ? combinedJobs.find(j => j.id === log.details.targetId) : null;
                        const jobId = log.details?.jobId || log.details?.targetId || '';
                        const title = log.details?.title || matchedJobFromState?.title || (lang === 'bn' ? 'কাজের তথ্য' : 'Job Vacancy');
                        const company = log.details?.company || matchedJobFromState?.company || (lang === 'bn' ? 'নিয়োগকর্তা' : 'Direct Employer');
                        const salary = log.details?.salary || matchedJobFromState?.salary || (lang === 'bn' ? 'আলোচনা সাপেক্ষে' : 'Negotiable');
                        const location = log.details?.location || matchedJobFromState?.location || '';
                        const phone = log.details?.phone || matchedJobFromState?.phone || '';

                        return (
                          <div 
                            key={`${log.id || 'apply'}-${idx}`}
                            className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3 hover:border-amber-500/30 transition-all"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1">
                                <h4 className="text-xs font-black text-white leading-tight">
                                  {title}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  🏢 {company}
                                </p>
                              </div>
                              <span className="shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                {formatAppliedDateTime(log.timestamp)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-900 text-[10px]">
                              {salary && (
                                <span className="bg-slate-900 text-teal-400 font-bold px-2 py-0.5 rounded-lg border border-slate-850">
                                  ৳ {salary}
                                </span>
                              )}
                              {location && (
                                <span className="text-slate-400 font-semibold">
                                  📍 {location}
                                </span>
                              )}
                              {phone && (
                                <span className="text-slate-400 font-semibold">
                                  📞 {phone}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-1.5 pt-1">
                              {phone && (
                                <a 
                                  href={`tel:${phone}`}
                                  onClick={() => handleJobCall(jobId, phone)}
                                  className="flex-1 text-center py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                  📞 {lang === 'bn' ? 'আবার কল করুন' : 'Call Again'}
                                </a>
                              )}
                              {jobId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matched = combinedJobs.find(j => j.id === jobId);
                                    if (matched) {
                                      handleViewJobDetails(matched);
                                    } else {
                                      alert(lang === 'bn' ? 'দুঃখিত, এই কাজটি এখন আর উপলব্ধ নেই।' : 'Sorry, this job post is no longer available.');
                                    }
                                  }}
                                  className="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-800"
                                >
                                  👁️ {lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : profileActiveTab === 'app_details' ? (
              <div className="space-y-4 pt-1 text-left max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>📱</span>
                    {lang === 'bn' ? 'এপ্স ডিটেলস ও নির্দেশিকা' : 'App Details & Guide'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    {lang === 'bn' 
                      ? 'অ্যাপের প্রতিটি ফিচারের কাজ ও ব্যবহার পদ্ধতি ধাপে ধাপে নিচে ব্যাখ্যা করা হলো।' 
                      : 'Step-by-step documentation on how to use every feature & option in the app.'}
                  </p>
                </div>

                {/* Local search within app details */}
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
                  <input
                    type="text"
                    value={guideSearchQuery}
                    onChange={(e) => setGuideSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all placeholder:text-slate-600"
                    placeholder={lang === 'bn' ? 'অপশন বা কি-ওয়ার্ড খুঁজুন...' : 'Search options or keywords...'}
                  />
                  {guideSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGuideSearchQuery('')}
                      className="absolute right-3 top-2 text-[10px] text-slate-500 hover:text-slate-300 font-black cursor-pointer bg-slate-850 px-1.5 py-0.5 rounded"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Filter and render detailed guides */}
                <div className="space-y-3">
                  {([
                    {
                      id: "scale",
                      titleBn: "⚡ ১০ লাখ মানুষের লোড হ্যান্ডেলিং (High Performance)",
                      titleEn: "⚡ 1 Million+ Real-time Load Handling",
                      descBn: "আমাদের অ্যাপের ক্লাউড ডেটাবেস এবং ফায়ারস্টোর ক্যোয়ারী অপ্টিমাইজেশনকে অত্যন্ত নিখুঁতভাবে সাজানো হয়েছে। এর ফলে একই সাথে ১০ লাখ লোক কাজ করলেও এটি কখনো স্লো হবে না এবং সার্ভার ক্র্যাশ করবে না। ধীরগতির ইন্টারনেটেও অ্যাপটি অতি দ্রুত কাজ করে কারণ এটি লোকাল ডিভাইস ক্যাশ সিঙ্ক আর্কিটেকচার ব্যবহার করে।",
                      descEn: "With native offline cache sync and Firestore high-concurrency capability, this application supports 1 Million+ active users concurrently. No server crashes, incredibly lightweight, and loads instantly even on weak 2G signals."
                    },
                    {
                      id: "security",
                      titleBn: "🔐 ফোন নম্বর ডিভাইস লক সিকিউরিটি (Device Lock)",
                      titleEn: "🔐 Phone Device Binding Security",
                      descBn: "১. আপনি যখন আপনার ফোন নম্বর দিয়ে প্রথমবার প্রোফাইল সাইন-আপ বা লগইন করবেন, তখন অ্যাপটি ডিভাইসটিকে আপনার প্রাইমারি বা প্রধান মোবাইল হিসেবে রেজিস্টার করে চিরদিনের জন্য লক করে দেবে।\n\n২. কেউ যদি অন্য কোনো মোবাইল বা ব্রাউজার থেকে একই ফোন নম্বর দিয়ে লগইন করার চেষ্টা করে, তবে তার স্ক্রিনে লক উইন্ডো আসবে এবং লেখা থাকবে 'অনুমোদনের অপেক্ষায়'।\n\n৩. এই সময়ে আপনার মূল বা আগের মোবাইলে একটি রিয়েল-টাইম পপ-আপ যাবে যাতে নতুন ডিভাইসের বিবরণ থাকবে। আপনি সেখানে 'অনুমোদন (APPROVE)' বাটনে চাপ দিলে কেবল তখনই নতুন মোবাইলে লগইন সাকসেসফুল হবে, অন্যথায় এক্সেস রিজেক্ট হয়ে যাবে।",
                      descEn: "1. When you first log in with a phone number, the app binds with your unique device identifier. This is your primary device.\n\n2. If someone tries to access your account with your phone number from another device, their screen will be locked and show 'Waiting for Approval'.\n\n3. You will immediately receive a security popup on your primary device with device info. Clicking 'APPROVE' binds the new device, while 'REJECT' locks out the intruder."
                    },
                    {
                      id: "job_seeker",
                      titleBn: "💼 কাজের সন্ধানকারীদের জন্য নির্দেশিকা (Job Seeker)",
                      titleEn: "💼 Job Seeker step-by-step Guide",
                      descBn: "১. অ্যাপের মূল স্ক্রিনে থাকা ফিল্টার বা ক্যাটাগরি অপশন ব্যবহার করে কাজ বেছে নিন।\n\n২. যেকোনো কাজের বিবরণ বা পেমেন্ট দেখতে কার্ডটির উপরে টাচ করুন।\n\n৩. সরাসরি মালিকের সাথে চুক্তি করতে কার্ডের ভেতরে থাকা 'কল করুন' বা 'হোয়াটসঅ্যাপ' বাটনে ক্লিক করে সরাসরি যোগাযোগ করুন। কোনো থার্ড-পার্টি বা চার্জ ছাড়াই সরাসরি বেতন নির্ধারণ করুন।\n\n৪. 'কর্মী প্রোফাইল দিন' অপশনে নিজের দক্ষতা পোস্ট করে রাখুন, যাতে মালিক নিজেই আপনাকে খুঁজে কল করতে পারেন।",
                      descEn: "1. Filter or search vacancies directly from the Home Screen.\n2. Tap on any job post card to view specific terms, wages, and description.\n3. Click 'Call Owner' or 'WhatsApp' to negotiate wages and start working immediately without middleman fees.\n4. Create a worker post to let employers contact you."
                    },
                    {
                      id: "employer",
                      titleBn: "🏢 কাজের মালিক / নিয়োগদাতার নির্দেশিকা (Employer)",
                      titleEn: "🏢 Employer / Recruiter Guide",
                      descBn: "১. 'কাজের সার্কুলার দিন' অপশনে ক্লিক করে কাজের নাম, ক্যাটাগরি, কাজের লোকেশন, দৈনিক বা মাসিক বেতন ইত্যাদি সুন্দরভাবে ক্যাপশন সহ পোস্ট করুন।\n\n২. কাজের পোস্ট করার পর সাথে সাথে কর্মী তালিকায় আপনার পোস্টটি লাখ লাখ কর্মীর কাছে লাইভ শো হবে।\n\n৩. আপনি চাইলে সরাসরি 'কর্মী খুঁজুন' তালিকা থেকে উপযুক্ত কর্মী সিলেক্ট করে তাকে সরাসরি মোবাইলে কল করতে পারেন।",
                      descEn: "1. Click on 'Post Job' to publish vacancies. Fill in the job details, category, location, and wages.\n2. Once posted, your job will instantly go live and become visible to millions of workers.\n3. You can also view the active 'Find Workers' directory and contact candidates directly."
                    },
                    {
                      id: "broker",
                      titleBn: "🤝 অনুমোদিত দালাল / ব্রোকার পোর্টাল (Broker Guide)",
                      titleEn: "🤝 Verified Broker Portal & Multi-Worker Control",
                      descBn: "১. ব্রোকাররা হলেন আমাদের প্ল্যাটফর্মের অংশীদার। তারা একটি পোর্টাল বা সিঙ্গেল আইডি ব্যবহার করে হাজার হাজার বা ১০ লাখ পর্যন্ত কর্মীকে কন্ট্রোল ও মনিটর করতে পারেন।\n\n২. ব্রোকার পোর্টালে কর্মী তালিকা সংরক্ষণ করা যায়, যাতে একসাথে একাধিক কর্মীকে কোনো কোম্পানির প্রোজেক্ট বা চুক্তিতে কাজের জন্য পাঠানো সম্ভব হয়।\n\n৩. শ্রমিকদের বিশ্বস্ততা, কাজের নিরাপত্তা এবং বুকিং চার্জের নিশ্চয়তা ব্রোকারদের অধীনে সুরক্ষিত থাকে।",
                      descEn: "1. Brokers act as contractors. Under their profile dashboard, they can register, assign, and track a roster of multiple workers.\n2. Perfect for handling large factory or agriculture projects by sending coordinated teams of laborers.\n3. Brokers manage the safety deposits, commissions, and workers' guarantees."
                    },
                    {
                      id: "daily_wage",
                      titleBn: "🪙 দৈনিক মজুরি ও কুইক অ্যাকশন কাজ (Daily Wage)",
                      titleEn: "🪙 Daily Wage & Quick Action Categories",
                      descBn: "হোমপেজের উপর থাকা ৪টি থ্রিডি বাটন দিয়ে অতি দ্রুত স্পেশাল ক্যাটাগরি কাজ পোস্ট ও অনুসন্ধান করা যায়:\n• দৈনিক মজুরি কাজ: সরাসরি দিনে দিনে নগদ টাকার চুক্তিভিত্তিক কাজ।\n• সুইং বা কাপড় তৈরির কাজ: গার্মেন্টস ও দর্জি কাজের অফার।\n• ডেলিভারি পার্টনার: রাইড শেয়ারিং বা মালামাল ডেলিভারির কাজ।\n• ফ্রিল্যান্স কাজ: মোবাইল বা কম্পিউটারে করার মতো পার্ট-টাইম কাজ।",
                      descEn: "Use the 3D buttons on the Home Screen for fast filtering:\n• Daily Wage: Work that pays cash on a daily basis.\n• Cloth Work: Sewing, tailoring, and garment industry requirements.\n• Delivery Partner: Courier or rider vacancies.\n• Freelance: Part-time computer/mobile work."
                    },
                    {
                      id: "payment",
                      titleBn: "🔑 ইউটিআর (UTR) এবং ইনস্ট্যান্ট পেমেন্ট যাচাইকরণ",
                      titleEn: "🔑 UTR & Automated Payment Verification",
                      descBn: "যেকোনো বিশেষ বা প্রিমিয়াম ফিচার অ্যাক্টিভ করতে লেনদেনের সঠিক ১২ সংখ্যার ইউটিআর (UTR) নম্বর ইনপুট দিন। অ্যাডমিন ব্যাকএন্ড রিয়েল-টাইমে এটি পরীক্ষা করে এবং অটোমেটিক্যালি সার্ভিস সচল করে। ভুল ইউটিআর সাবমিট করলে আইডি হোল্ড হতে পারে।",
                      descEn: "To access custom premium settings, input your bank transaction's 12-digit UTR number. The system verifies this against our backend ledger to instantly unlock services."
                    }
                  ])
                    .filter(item => {
                      const q = guideSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        item.titleBn.toLowerCase().includes(q) ||
                        item.titleEn.toLowerCase().includes(q) ||
                        item.descBn.toLowerCase().includes(q) ||
                        item.descEn.toLowerCase().includes(q)
                      );
                    })
                    .map((item) => (
                      <div 
                        key={item.id}
                        className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-2 hover:border-amber-500/30 transition-all group"
                      >
                        <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors leading-tight">
                          {lang === 'bn' ? item.titleBn : item.titleEn}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed whitespace-pre-line bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/80">
                          {lang === 'bn' ? item.descBn : item.descEn}
                        </p>
                      </div>
                    ))}
                </div>

                {/* Additional caption for any further help */}
                <div className="p-3 bg-gradient-to-r from-amber-500/5 to-teal-500/5 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-base">📞</span>
                  <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    {lang === 'bn' ? 'সরাসরি হেল্পলাইন সহায়তা' : 'Direct Helpline Assistance'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {lang === 'bn' 
                      ? 'অ্যাপের যেকোনো ফিচারের অতিরিক্ত তথ্যের জন্য প্রোফাইলের সাপোর্ট হেল্প চ্যাট ব্যবহার করুন।' 
                      : 'For more queries, contact us directly via the integrated Live Help chat.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div className="text-center space-y-2">
                  <div className="relative w-20 h-20 mx-auto group">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#0a2e50] to-[#041a31] border-2 border-amber-400 shadow-md flex items-center justify-center text-white relative">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-3xl font-black">👤</span>
                      )}
                    </div>
                    {/* Photo Upload Overlay Button */}
                    <label className="absolute bottom-0 right-0 bg-amber-500 hover:bg-amber-600 text-slate-950 p-1.5 rounded-full border border-slate-900 cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95 duration-200 flex items-center justify-center">
                      <span className="text-[10px] font-black">📷</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div>
                    <h3 className="text-md font-extrabold text-white uppercase tracking-wider">
                      {lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
                    </h3>
                    <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">
                      {userProfile?.phone}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveProfileSettings} className="space-y-4 text-left">
                  {/* Name Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      {lang === 'bn' ? 'আপনার নাম' : 'Your Name'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs">👤</span>
                      <input
                        type="text"
                        required
                        value={editProfileName}
                        onChange={(e) => setEditProfileName(e.target.value)}
                        placeholder={lang === 'bn' ? 'নাম লিখুন' : 'Enter name'}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs">📞</span>
                      <input
                        type="text"
                        required
                        value={editProfilePhone}
                        onChange={(e) => setEditProfilePhone(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমনঃ 017xxxxxxxx' : 'e.g. 017xxxxxxxx'}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Role Picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      {lang === 'bn' ? 'আপনার ভূমিকা' : 'Your Role'}
                    </label>
                    <select
                      value={editProfileRole}
                      onChange={(e) => setEditProfileRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="job_seeker">{lang === 'bn' ? 'কাজের সন্ধানকারী (Job Seeker)' : 'Job Seeker'}</option>
                      <option value="employer">{lang === 'bn' ? 'কাজের মালিক / নিয়োগদাতা (Employer)' : 'Employer'}</option>
                      <option value="daily_worker">{lang === 'bn' ? 'দৈনিক মজুরি কর্মী (Daily Wage Worker)' : 'Daily Worker'}</option>
                      <option value="broker">{lang === 'bn' ? 'অনুমোদিত দালাল / ব্রোকার (Verified Broker)' : 'Broker'}</option>
                    </select>
                  </div>

                  {/* Location Picker Group */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {lang === 'bn' ? 'দেশ' : 'Country'}
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => {
                          const c = e.target.value;
                          setSelectedCountry(c);
                          const countryObj = regionsData.find(item => item.id === c);
                          if (countryObj && countryObj.states.length > 0) {
                            setSelectedState(countryObj.states[0].id);
                            if (countryObj.states[0].districts.length > 0) {
                              setSelectedDistrict(countryObj.states[0].districts[0].id);
                            }
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        {regionsData.map((c) => (
                          <option key={c.id} value={c.id}>{c.flag} {lang === 'bn' ? c.nameBn : c.nameEn}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {lang === 'bn' ? 'বিভাগ / রাজ্য' : 'State / Div'}
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          const s = e.target.value;
                          setSelectedState(s);
                          const stateObj = regionsData.find(c => c.id === selectedCountry)?.states.find(item => item.id === s);
                          if (stateObj && stateObj.districts.length > 0) {
                            setSelectedDistrict(stateObj.districts[0].id);
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        {regionsData.find(c => c.id === selectedCountry)?.states.map((s) => (
                          <option key={s.id} value={s.id}>{lang === 'bn' ? s.nameBn : s.nameEn}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {lang === 'bn' ? 'জেলা / অঞ্চল' : 'District'}
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        {regionsData.find(c => c.id === selectedCountry)?.states.find(s => s.id === selectedState)?.districts.map((d) => (
                          <option key={d.id} value={d.id}>{lang === 'bn' ? d.nameBn : d.nameEn}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Language Selection inside Profile */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {lang === 'bn' ? 'ভাষা নির্বাচন' : 'Language'}
                      </label>
                      <select
                        value={lang}
                        onChange={(e) => {
                          const selectedVal = e.target.value as AppLanguage;
                          setLang(selectedVal);
                          setSelectedGlobalLang(selectedVal);
                        }}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="bn">🇧🇩 বাংলা (Bengali)</option>
                        <option value="en">🇺🇸 English (US)</option>
                        <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {lang === 'bn' ? 'মুদ্রা (Currency)' : 'Currency'}
                      </label>
                      <select
                        value={editProfileCurrencySymbol + '|' + editProfileCurrencyName}
                        onChange={(e) => {
                          const [sym, nm] = e.target.value.split('|');
                          setEditProfileCurrencySymbol(sym);
                          setEditProfileCurrencyName(nm);
                        }}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="৳|BDT">৳ BDT (Bangladesh Taka)</option>
                        <option value="₹|INR">₹ INR (Indian Rupee)</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#115e59] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    {lang === 'bn' ? 'সেভ করুন' : 'Save Changes'}
                  </button>
                </form>

                {/* Logout Button */}
                <div className="pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={handleProfileLogout}
                    className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    {lang === 'bn' ? '🚪 লগ-আউট (Sign Out)' : '🚪 ID Sign Out'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* 🧭 এআই হেল্প সেন্টার / AI Help Center Modal */}
      {showHelpCenter && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md h-[550px] flex flex-col text-slate-200 relative shadow-2xl overflow-hidden animate-fade-in"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Headphones size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    {lang === 'bn' ? 'ভারত কা কাম হেল্প সেন্টার' : 'Bharat Ka Kaam Help Center'}
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </h3>
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5">
                    {lang === 'bn' ? 'এআই দ্বারা চালিত সাপোর্ট' : 'AI-Powered Assistant'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelpCenter(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none bg-slate-900/40">
              {helpMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-bold leading-normal shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 rounded-tr-none'
                      : 'bg-slate-950 text-slate-100 border border-slate-800/80 rounded-tl-none'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1 text-[8px] uppercase tracking-widest text-amber-400 font-black">
                        <span>🤖 {lang === 'bn' ? 'হেল্প সহকারী' : 'Help Agent'}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isHelpGenerating && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 text-slate-100 border border-slate-800/80 rounded-2xl rounded-tl-none p-3 text-xs font-bold shadow-sm max-w-[85%]">
                    <div className="flex items-center gap-1 mb-1 text-[8px] uppercase tracking-widest text-amber-400 font-black">
                      <span>🤖 {lang === 'bn' ? 'টাইপ করছে...' : 'Typing...'}</span>
                    </div>
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={helpChatEndRef} />
            </div>

            {/* Quick Suggestions Chips Row */}
            <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/50">
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {lang === 'bn' ? 'পরামর্শ পেতে ক্লিক করুন:' : 'Click for quick solutions:'}
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
                {lang === 'bn' ? (
                  <>
                    <button
                      onClick={() => handleSendHelpMessage('পাসওয়ার্ড কিভাবে পুনরুদ্ধার করব?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      🔑 পাসওয়ার্ড উদ্ধার
                    </button>
                    <button
                      onClick={() => handleSendHelpMessage('কাজের জন্য লোক কিভাবে খুঁজবো?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      👤 কাজের লোক খোঁজা
                    </button>
                    <button
                      onClick={() => handleSendHelpMessage('আমি কিভাবে নতুন কাজ পোস্ট করব?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      📢 কাজ পোস্ট করা
                    </button>
                    <button
                      onClick={() => handleSendHelpMessage('দালাল বা ব্রোকার কি কাজ করে?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      💼 ব্রোকার একাউন্ট কি?
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendHelpMessage('How to recover my login password?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      🔑 Reset Password
                    </button>
                    <button
                      onClick={() => handleSendHelpMessage('How can I find workers?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      👤 Find Workers
                    </button>
                    <button
                      onClick={() => handleSendHelpMessage('How do I post a new job?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      📢 Post a Job
                    </button>
                    <button
                      onClick={() => handleSendHelpMessage('What is the role of a Broker or agency?')}
                      disabled={isHelpGenerating}
                      className="shrink-0 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full border border-slate-800/80 active:scale-95 transition-all cursor-pointer whitespace-nowrap snap-start"
                    >
                      💼 Broker Role
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 bg-slate-950 border-t border-slate-800/80">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendHelpMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={helpInput}
                  onChange={(e) => setHelpInput(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার সমস্যা বা প্রশ্নটি এখানে লিখুন...' : 'Type your problem or question here...'}
                  disabled={isHelpGenerating}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 outline-none focus:border-amber-500 transition-all placeholder:text-slate-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!helpInput.trim() || isHelpGenerating}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* 📱 Beautiful full-screen/modal for iOS PWA installation guide */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-6 text-slate-200 relative shadow-2xl"
          >
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg border border-amber-400/20 overflow-hidden">
                <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Bharat ka Kaam
              </h3>
              <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                {lang === 'bn' ? 'আইফোনে ডাউনলোড / ইনস্টল নির্দেশিকা' : 'Install on iPhone Guide'}
              </p>
            </div>

            <div className="space-y-4 text-left text-xs text-slate-300 leading-relaxed font-semibold">
              <p className="text-slate-400 text-[11px] text-center">
                {lang === 'bn' 
                  ? 'আপনার আইফোনে অ্যাপটি হোম স্ক্রিনে রাখতে নিচের নিয়ম অনুসরণ করুন:' 
                  : 'To add this app to your iPhone Home Screen, follow these simple steps:'}
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">১</div>
                  <p>
                    {lang === 'bn' 
                      ? 'নেভিগেশন বারের "শেয়ার" 📤 (Share) বাটনে ট্যাপ করুন।' 
                      : 'Tap the "Share" 📤 button in the Safari browser.'}
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">২</div>
                  <p>
                    {lang === 'bn' 
                      ? 'মেনু থেকে নিচের দিকে স্ক্রোল করে "Add to Home Screen" ➕ অপশনটি নির্বাচন করুন।' 
                      : 'Scroll down and select the "Add to Home Screen" ➕ option.'}
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">৩</div>
                  <p>
                    {lang === 'bn' 
                      ? 'ডানদিকের কোণে "Add" বাটনে ক্লিক করুন। অ্যাপের আইকনটি আপনার ফোনে সেভ হয়ে যাবে!' 
                      : 'Click the "Add" button in the top right corner. The app icon will be pinned to your Home Screen!'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/5 cursor-pointer text-center"
            >
              {lang === 'bn' ? 'বুঝেছি' : 'Got it!'}
            </button>
          </motion.div>
        </div>
      )}

      {/* 🛡️ Beautiful Full-Screen/Modal for Privacy Policy */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 text-slate-200 relative shadow-2xl max-h-[85vh] flex flex-col justify-between"
          >
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1 shrink-0">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto text-xl border border-emerald-500/25">
                🛡️
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mt-2">
                {lang === 'bn' ? 'প্রাইভেসি ও লাইফটাইম একাউন্ট পলিসি' : lang === 'hi' ? 'गोपनीयता और लाइफटाइम खाता नीति' : 'Privacy & Lifetime Account Policy'}
              </h3>
              <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">
                {lang === 'bn' ? 'আপনার মোবাইল নম্বর ভিত্তিক চিরস্থায়ী প্রোফাইল' : 'Your Permanent Phone-Based Personal Account'}
              </p>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1 text-slate-300 leading-relaxed max-h-[45vh] text-left">
              {lang === 'bn' ? (
                <>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🔑 ১. চিরস্থায়ী লাইফটাইম অ্যাকাউন্ট (Lifetime Account)</h4>
                    <p className="text-[11px] text-slate-400">
                      আপনি যে মোবাইল নম্বরটি ব্যবহার করে এই অ্যাকাউন্টটি খুলবেন, সেটি সম্পূর্ণভাবে আপনার জন্য সংরক্ষিত থাকবে। এই ফোন নম্বরটি আপনার লাইফটাইম বা চিরস্থায়ী ব্যক্তিগত আইডি হিসেবে সচল থাকবে।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">📱 ২. মোবাইল নম্বরভিত্তিক নিরাপদ লগইন</h4>
                    <p className="text-[11px] text-slate-400">
                      পরবর্তীতে যেকোনো সময় আপনি আপনার মোবাইল নম্বর ব্যবহার করে সরাসরি লগইন করতে পারবেন। আপনার প্রোফাইলের সাথে যুক্ত সমস্ত তথ্য, কাজ এবং যোগাযোগ স্থায়ীভাবে এই মোবাইল নম্বরের অধীনেই সংরক্ষিত থাকবে।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🛡️ ৩. ডাটা প্রাইভেসী এবং জিরো-স্প্যাম গ্যারান্টি</h4>
                    <p className="text-[11px] text-slate-400">
                      আমরা আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষা করতে প্রতিশ্রুতিবদ্ধ। আপনার মোবাইল নম্বর কোনো প্রকার থার্ড-পার্টি ডাটা ব্রোকার বা বিজ্ঞাপনী সংস্থার কাছে বিক্রি বা প্রকাশ করা হবে না।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">⚙️ ৪. তথ্য পরিবর্তন ও ডিলিট করার অধিকার</h4>
                    <p className="text-[11px] text-slate-400">
                      আপনি যখনই ইচ্ছা আপনার প্রোফাইলের নাম, ছবি, দক্ষতা বা কাজের বিবরণ পরিবর্তন করতে পারবেন। তবে মোবাইল নম্বরটি আপনার স্থায়ী অ্যাকাউন্টের পরিচয় বহন করবে।
                    </p>
                  </div>
                </>
              ) : lang === 'hi' ? (
                <>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🔑 1. लाइफटाइम व्यक्तिगत खाता (Lifetime Account)</h4>
                    <p className="text-[11px] text-slate-400">
                      आप जिस मोबाइल नंबर से खाता खोलेंगे, वह स्थायी रूप से आपके लिए आरक्षित रहेगा। यह आपका स्थायी लाइफटाइम व्यक्तिगत प्रोफ़ाइल होगा।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">📱 2. मोबाइल नंबर आधारित लॉगिन</h4>
                    <p className="text-[11px] text-slate-400">
                      भविष्य में कभी भी आप अपने मोबाइल नंबर के माध्यम से अपने खाते में सुरक्षित रूप से लॉगिन कर सकते हैं। आपकी सभी जानकारी इस नंबर से जुड़ी रहेगी।
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🛡️ 3. डेटा गोपनीयता गारंटी</h4>
                    <p className="text-[11px] text-slate-400">
                      हम आपकी गोपनीयता की सुरक्षा के लिए प्रतिबद्ध हैं। आपका मोबाइल नंबर किसी भी विज्ञापनदाता या तीसरे पक्ष को साझा नहीं किया जाएगा।
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🔑 1. Lifetime Personal Account</h4>
                    <p className="text-[11px] text-slate-400">
                      The personal account you register with your mobile phone number is strictly yours and remains active permanently for a lifetime.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">📱 2. Phone-Based Access Secure</h4>
                    <p className="text-[11px] text-slate-400">
                      You can securely log in and access your personal profile anytime using your mobile number. Your ratings, connections, and posts stay permanently linked to your number.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1.5">
                    <h4 className="font-extrabold text-amber-400">🛡️ 3. Data Privacy and Zero-Spam Promise</h4>
                    <p className="text-[11px] text-slate-400">
                      We strictly safeguard your identity. Your mobile number and details will never be leaked or sold to any third-party advertisers or databases.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center shrink-0"
            >
              {lang === 'bn' ? 'আমি বুঝতে পেরেছি • বন্ধ করুন' : lang === 'hi' ? 'मुझे समझ आ गया • बंद करें' : 'I Understand & Agree'}
            </button>
          </motion.div>
        </div>
      )}

      {/* 📝 Job Post Form Modal */}
      {showJobForm && (
        <JobPostForm
          lang={lang}
          onClose={() => setShowJobForm(false)}
          onSuccess={() => {
            handleSuccess(lang === 'bn' ? '🎉 কাজ সফলভাবে পোস্ট করা হয়েছে।' : '🎉 Job posted successfully.');
          }}
        />
      )}

      {/* 👤 Worker Registration Form Modal */}
      {showWorkerForm && (
        <WorkerPostForm
          lang={lang}
          onClose={() => setShowWorkerForm(false)}
          onSuccess={() => {
            handleSuccess(lang === 'bn' ? '🎉 কর্মী একাউন্ট সফলভাবে নিবন্ধিত হয়েছে।' : '🎉 Worker registered successfully.');
          }}
        />
      )}

      {/* 🤝 Broker Registration Form Modal */}
      {showBrokerForm && (
        <BrokerPostForm
          lang={lang}
          onClose={() => setShowBrokerForm(false)}
          onSuccess={() => {
            setShowBrokerForm(false);
            setShowBrokerPortal(true);
            handleSuccess(lang === 'bn' ? '🎉 দালাল হিসেবে একাউন্ট সফলভাবে খোলা হয়েছে এবং ড্যাশবোর্ড সচল করা হয়েছে।' : '🎉 Broker registered successfully and dashboard activated.');
          }}
        />
      )}

      {/* 🛡️ Broker Portal / Dashboard Modal */}
      {showBrokerPortal && (
        <BrokerPortal
          lang={lang}
          allBrokers={combinedBrokers}
          notifications={notifications}
          onClose={() => setShowBrokerPortal(false)}
          onSuccess={(msg) => {
            setShowBrokerPortal(false);
            handleSuccess(msg);
          }}
          onOpenHelpCenterWithText={(text) => {
            setShowHelpCenter(true);
            setTimeout(() => {
              handleSendHelpMessage(text);
            }, 100);
          }}
        />
      )}

      {/* 🏢 Company Recruitment Form Modal */}
      {showCompanyForm && (
        <CompanyRecruitmentForm
          lang={lang}
          availableJobs={jobs}
          onClose={() => setShowCompanyForm(false)}
          onSuccess={handleCompanyRecruitmentSuccess}
        />
      )}

      {/* 🏢 Company Sourcing Recruitment Form Modal (Direct from Broker Card) */}
      {sourcingBroker && (
        <CompanyRecruitmentForm
          lang={lang}
          availableJobs={jobs}
          preselectedBrokerId={sourcingBroker.id}
          onClose={() => setSourcingBroker(null)}
          onSuccess={(message, newPost) => {
            setSourcingBroker(null);
            handleCompanyRecruitmentSuccess(message, newPost);
          }}
        />
      )}

      {/* 📲 PWA App Installer Banner for Direct stand-alone Mobile launch */}
      <InstallPrompt lang={lang as any} />

      {/* 🔐 Real-time Device Binding Login Approval Request Popup */}
      {deviceLoginRequests.length > 0 && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-sm p-6 space-y-6 text-slate-200 relative shadow-2xl"
          >
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-500/20">
                🔔
              </div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                {lang === 'bn' ? 'ডিভাইস লগইন অনুমতি' : 'Device Login Authorization'}
              </h3>
              <p className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">
                {lang === 'bn' ? 'নতুন ডিভাইস এক্সেস অনুরোধ' : 'New Login Request Detected'}
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3 text-left">
              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">
                  {lang === 'bn' ? 'অনুরোধকারী মোবাইল নম্বর' : 'Requesting Phone Number'}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {deviceLoginRequests[0].phone}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">
                  {lang === 'bn' ? 'ডিভাইসের বিবরণ' : 'Device details'}
                </span>
                <span className="text-xs font-bold text-slate-300 block truncate leading-tight">
                  {deviceLoginRequests[0].requestingDeviceName || 'Unknown Browser'}
                </span>
              </div>

              <p className="text-[11px] font-semibold text-slate-400 leading-normal border-t border-slate-850 pt-2">
                {lang === 'bn' 
                  ? '⚠️ অন্য কোনো মোবাইল বা কম্পিউটার থেকে আপনার অ্যাকাউন্ট অ্যাক্সেস করার চেষ্টা করা হচ্ছে। আপনি কি লগইন অনুমোদন করতে চান?' 
                  : '⚠️ Someone is trying to log in with your phone number from another device. Do you want to approve this access?'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const req = deviceLoginRequests[0];
                  try {
                    await setDoc(doc(db, 'login_requests', req.phone), { status: 'denied' }, { merge: true });
                    handleSuccess(lang === 'bn' ? '✓ লগইন অনুরোধ প্রত্যাখ্যান করা হয়েছে!' : '✓ Login request denied!');
                  } catch (err) {
                    console.error("Failed to deny request:", err);
                  }
                }}
                className="py-3 bg-slate-800 hover:bg-slate-750 text-rose-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-750 cursor-pointer text-center"
              >
                {lang === 'bn' ? 'প্রত্যাখ্যান' : 'REJECT'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  const req = deviceLoginRequests[0];
                  try {
                    // Update user profile's authorized device first
                    await setDoc(doc(db, 'user_profiles', req.phone), { authorizedDeviceId: req.requestingDeviceId }, { merge: true });
                    // Then set request status to approved
                    await setDoc(doc(db, 'login_requests', req.phone), { status: 'approved' }, { merge: true });
                    handleSuccess(lang === 'bn' ? '✓ লগইন অনুরোধ সফলভাবে অনুমোদিত হয়েছে!' : '✓ Login request approved successfully!');
                  } catch (err) {
                    console.error("Failed to approve request:", err);
                  }
                }}
                className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                {lang === 'bn' ? 'অনুমোদন' : 'APPROVE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {adminPaymentAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none animate-bounce">
          <div className="bg-slate-900/95 border-2 border-amber-500 text-amber-200 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 select-none pointer-events-auto">
            <span className="text-xl shrink-0">🔔</span>
            <div className="flex-1 text-left">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                {lang === 'bn' ? 'নতুন পেমেন্ট অনুরোধ!' : 'New Payment Request!'}
              </p>
              <p className="text-[10px] font-semibold text-slate-300 mt-0.5">
                {adminPaymentAlert}
              </p>
            </div>
            <button 
              onClick={() => setAdminPaymentAlert(null)}
              className="text-slate-400 hover:text-white text-[10px] uppercase font-bold px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer transition-colors"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
