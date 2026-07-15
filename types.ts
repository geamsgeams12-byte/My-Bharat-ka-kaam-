export interface JobPost {
  id?: string;
  title: string;       // কাজের নাম/ধরন (e.g., Delivery Boy, Factory Worker)
  company: string;     // কোম্পানি বা মালিকের নাম
  date: string;        // কাজ শুরুর তারিখ (Date)
  time: string;        // কাজের সময় (Time/Shift)
  location: string;    // কাজের জায়গা/ঠিকানা (Location)
  country?: string;    // দেশের আইডি বা নাম
  state?: string;      // রাজ্য/বিভাগের আইডি বা নাম
  district?: string;   // জেলার আইডি বা নাম
  customCountry?: string; // কাস্টম দেশের নাম যদি অন্যান্য সিলেক্ট করা হয়
  customState?: string;   // কাস্টম রাজ্যের নাম যদি অন্যান্য সিলেক্ট করা হয়
  customDistrict?: string;// কাস্টম জেলার নাম যদি অন্যান্য সিলেক্ট করা হয়
  phone: string;       // যোগাযোগের মোবাইল নম্বর (Phone Number)
  salary: string;      // কাজের বেতন/মজুরি (Salary/Wage)
  description: string; // কাজের বিবরণ ও যোগ্যতা (Details)
  brokerId?: string;   // দালাল আইডি
  brokerName?: string; // দালালের নাম
  brokerPhone?: string; // দালালের ফোন নম্বর
  isBrokerManaged?: boolean; // দালাল দ্বারা পরিচালিত কাজের পোস্ট কিনা
  recruitmentId?: string; // কোন রিক্রুটমেন্ট এলার্ট থেকে পোস্ট করা হয়েছে
  brokerFee?: number;   // দালালি চার্জ বা ফি
  requiredGender?: string;
  requiredDate?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  totalWorkHours?: number;
  uploadedPhotos?: string[];
  workplaceMapLink?: string;
  createdAt: number;   // পোস্ট করার সময়
  isDemo?: boolean;     // ডেমো কাজের পোস্ট কিনা
}

export interface WorkerPost {
  id?: string;
  name: string;        // কর্মীর নাম
  gender: string;      // লিঙ্গ (Male / Female / Other)
  skills: string;      // কি কাজ করতে পারেন/দক্ষতা (e.g., Driver, Electrician, Cook)
  date: string;        // কখন থেকে কাজ করতে পারবেন (Availability Date)
  time: string;        // কাজের সময় (Available hours)
  location: string;    // পছন্দের কাজের এলাকা (Preferred Location)
  country?: string;    // দেশের আইডি বা নাম
  state?: string;      // রাজ্য/বিভাগের আইডি বা নাম
  district?: string;   // জেলার আইডি বা নাম
  customCountry?: string; // কাস্টম দেশের নাম যদি অন্যান্য সিলেক্ট করা হয়
  customState?: string;   // কাস্টম রাজ্যের নাম যদি অন্যান্য সিলেক্ট করা হয়
  customDistrict?: string;// কাস্টম জেলার নাম যদি অন্যান্য সিলেক্ট করা হয়
  phone: string;       // যোগাযোগের মোবাইল নম্বর (Phone Number)
  expectedWage: string;// আশা করা মজুরি (Expected Wage)
  about: string;       // নিজের সম্পর্কে / কাজের অভিজ্ঞতা (About me)
  age?: string;        // বয়স (Age)
  qualification?: string; // কাজের যোগ্যতা (Qualification)
  photoUrl?: string;   // ফোটো (Photo base64 or URL)
  createdAt: number;   // পোস্ট করার সময়
  isDemo?: boolean;     // ডেমো কর্মীর পোস্ট কিনা
}

export interface BrokerPost {
  id?: string;
  name: string;        // দালালের/এজেন্টের নাম
  agency?: string;     // এজেন্সির নাম (ঐচ্ছিক)
  phone: string;       // যোগাযোগের নম্বর
  location: string;    // প্রধান কাজের এলাকা
  country?: string;    // দেশের আইডি বা নাম
  state?: string;      // রাজ্য/বিভাগের আইডি বা নাম
  district?: string;   // জেলার আইডি বা নাম
  customCountry?: string; // কাস্টম দেশের নাম যদি অন্যান্য সিলেক্ট করা হয়
  customState?: string;   // কাস্টম রাজ্যের নাম যদি অন্যান্য সিলেক্ট করা হয়
  customDistrict?: string;// কাস্টম জেলার জেলার নাম যদি অন্যান্য সিলেক্ট করা হয়
  workerTypes: string; // যে ধরণের কর্মী সরবরাহ করেন
  experience: string;  // কত বছরের অভিজ্ঞতা
  description: string; // বিস্তারিত বিবরণ
  utrVerified?: string; // ভেরিফায়েড পেমেন্ট ট্রানজেকশন UTR আইডি
  maxJobsToBroker?: number; // সর্বোচ্চ কয়টি কাজের উপরে দালালি করতে পারবে
  selectedJobs?: string[]; // দালালের নির্বাচন করা সর্বোচ্চ ৩টি কাজের নাম
  subscribedUntil?: number; // সাবস্ক্রিপশন মেয়াদ (Timestamp)
  lastPaymentDate?: number; // শেষ পেমেন্ট করার সময় (Timestamp)
  createdAt: number;
  isDemo?: boolean;     // ডেমো দালালের পোস্ট কিনা
}

export interface BrokerPayment {
  id?: string;
  orderId: string;
  brokerId: string;
  brokerPhone: string;
  brokerName: string;
  utr: string;
  amount: number;
  status: 'success' | 'rejected' | 'pending';
  errorMessage?: string;
  errorMessageBn?: string;
  timestamp: number;
  paymentMethod: string;
}

export type AppLanguage = string;

export function isJobExpired(job: any): boolean {
  if (!job || !job.requiredDate) return false;
  try {
    const datePart = job.requiredDate; // YYYY-MM-DD
    const timePart = job.shiftEndTime || '23:59'; // HH:MM
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, min] = timePart.split(':').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const expiryDate = new Date(year, month - 1, day, hour, min);
      return Date.now() > expiryDate.getTime();
    }
  } catch (e) {
    console.error("Error checking job expiry", e);
  }
  return false;
}

