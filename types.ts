
export type Role = 'OWNER' | 'ADMIN' | 'PHOTOGRAPHER' | 'EDITOR' | 'FINANCE';
export type ProjectStatus = 'INQUIRY' | 'BOOKED' | 'SHOOTING' | 'CULLING' | 'EDITING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN';
export type AssetCategory = 'CAMERA' | 'LENS' | 'LIGHTING' | 'PROP' | 'BACKGROUND' | 'AUDIO' | 'CABLES';
export type SiteTheme = 'NOIR' | 'ETHEREAL' | 'VOGUE' | 'MINIMAL' | 'CINEMA' | 'RETRO' | 'ATELIER' | 'HORIZON' | 'BOLD' | 'IMPACT' | 'CLEANSLATE' | 'AUTHORITY';
export type SiteFont = 'SANS' | 'SERIF' | 'DISPLAY' | 'MONO';
export type SectionType = 'HERO' | 'TEXT_IMAGE' | 'FEATURES' | 'GALLERY' | 'PRICING' | 'CTA_BANNER' | 'TESTIMONIALS' | 'FAQ';
export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  joinedDate: string;
  commissionRate?: number;
  unavailableDates?: string[];
  specialization?: string;
  studioFocus?: string;
  hasCompletedOnboarding?: boolean;
  studioName?: string;
  createdAt?: string;
  uid?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'E-WALLET';
  balance: number;
  accountNumber?: string;
}

export interface PackageCostItem {
  id: string;
  description: string;
  amount: number;
  category: 'LABOR' | 'MATERIAL' | 'OTHER';
}

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
  turnaroundDays: number;
  costBreakdown?: PackageCostItem[];
  defaultTasks?: string[];
  defaultAssetIds?: string[];
  archived?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  serialNumber?: string;
  assignedToUserId?: string;
  returnDate?: string;
  notes?: string;
  ownerId?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  category: string;
  notes?: string;
  joinedDate: string;
  ownerId?: string;
}

export interface BookingItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cost?: number;
}

export interface BookingTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
  userId: string;
  userName: string;
}

export interface BookingComment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface TimeLog {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

export interface Discount {
  type: 'FIXED' | 'PERCENT';
  value: number;
}

export interface BookingFile {
    id: string;
    url: string;
    name: string;
    type: string;
}

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientId: string;
  date: string;
  timeStart: string;
  duration: number;
  package: string;
  packageId?: string;
  price: number;
  paidAmount: number;
  status: ProjectStatus;
  photographerId: string;
  editorId?: string;
  studio: string;
  contractStatus: 'PENDING' | 'SIGNED';
  contractSignedDate?: string;
  contractSignature?: string;
  items?: BookingItem[];
  comments?: BookingComment[];
  discount?: Discount;
  timeLogs?: TimeLog[];
  selectedImageIds?: string[];
  ownerId?: string;
  logs?: ActivityLog[];
  tasks?: BookingTask[];
  deliveryUrl?: string;
  taxSnapshot?: number;
  costSnapshot?: PackageCostItem[];
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  accountId: string;
  category: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  bookingId?: string;
  ownerId?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  submittedBy?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface StudioRoom {
  id: string;
  name: string;
  type: 'INDOOR' | 'OUTDOOR';
  color: string;
}

export interface WorkflowAutomation {
    id: string;
    triggerStatus: ProjectStatus;
    triggerPackageId?: string;
    tasks: string[];
    assignToUserId?: string;
}

export interface SiteGalleryItem {
    id: string;
    url: string;
    caption?: string;
}

export interface SiteTestimonial {
    id: string;
    clientName: string;
    text: string;
    rating: number;
}

export interface SiteFAQ {
    id: string;
    question: string;
    answer: string;
}

export interface SiteSectionContent {
    headline?: string;
    subheadline?: string;
    description?: string;
    image?: string;
    layout?: 'LEFT' | 'RIGHT' | 'CENTER';
    buttonText?: string;
    items?: { title: string; text: string }[];
}

export interface SiteSection {
    id: string;
    type: SectionType;
    content: SiteSectionContent;
}

export interface SitePage {
    id: string;
    title: string;
    slug: string;
    headline: string;
    description: string;
    heroImage: string;
    showPortfolio: boolean;
    showPricing: boolean;
    showBookingWidget: boolean;
    gallery: SiteGalleryItem[];
    sections: SiteSection[];
}

export interface SitePixels {
    facebookPixelId?: string;
    googleTagId?: string;
    tiktokPixelId?: string;
    googleTagManagerId?: string;
}

export interface SiteConfig {
    subdomain: string;
    title: string;
    headline: string;
    description: string;
    theme: SiteTheme;
    font?: SiteFont;
    customCss?: string;
    heroImage: string;
    showPricing: boolean;
    showTeam: boolean;
    showPortfolio: boolean;
    showBookingWidget: boolean;
    isPublished: boolean;
    instagramUrl?: string;
    gallery: SiteGalleryItem[];
    seo?: {
        title: string;
        description: string;
        keywords: string[];
    };
    pixels?: SitePixels;
    announcement?: {
        enabled: boolean;
        text: string;
        link: string;
        color: string;
        textColor: string;
    };
    testimonials?: SiteTestimonial[];
    faq?: SiteFAQ[];
    beforeAfter?: {
        enabled: boolean;
        beforeImage: string;
        afterImage: string;
        label: string;
    };
    branding?: {
        faviconUrl: string;
        socialShareImage: string;
    };
    pages?: SitePage[];
}

export interface StudioConfig {
  name: string;
  address: string;
  phone: string;
  website: string;
  taxRate: number;
  requiredDownPaymentPercentage: number;
  paymentDueDays: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  expenseCategories: string[];
  assetCategories: string[];
  clientCategories: string[];
  operatingHoursStart: string;
  operatingHoursEnd: string;
  bufferMinutes: number;
  defaultTurnaroundDays: number;
  isLiteMode: boolean;
  logoUrl?: string;
  npwp?: string;
  invoiceFooter?: string;
  invoicePrefix?: string;
  rooms: StudioRoom[];
  templates: {
      booking: string;
      reminder: string;
      thanks: string;
  };
  site: SiteConfig;
  ownerId?: string;
  workflowAutomations?: WorkflowAutomation[];
}

export interface MonthlyMetric {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    bookingsCount: number;
}

export interface PublicBookingSubmission {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    date: string;
    time: string;
    packageId: string;
}

export interface OnboardingData {
    studioName: string;
    subdomain: string;
    address: string;
    phone: string;
    focus: string;
    operatingHours: { start: string; end: string };
    rooms: string[];
    bankDetails: { name: string; number: string; holder: string };
    taxRate: number;
    initialPackage: { name: string; price: number; duration: number };
}

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export interface WhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    config: StudioConfig;
    onLogActivity?: (bookingId: string, action: string, details: string) => void;
}

// View Props
export interface SidebarProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  currentView: string;
  onLogout: () => void;
  onSwitchApp?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  bookings?: Booking[];
  config?: StudioConfig; 
}

export interface DashboardProps {
  user: User;
  bookings: Booking[];
  transactions: Transaction[];
  assets?: Asset[]; 
  onSelectBooking: (id: string) => void;
  selectedDate: string;
  onNavigate: (view: string) => void;
  config?: StudioConfig;
  onOpenWhatsApp?: (booking: Booking) => void;
  showToast?: (msg: string, type: ToastType) => void;
}

export interface CalendarViewProps {
  bookings: Booking[];
  currentDate: string;
  users: User[];
  rooms: StudioRoom[];
  onDateChange: (date: string) => void;
  onNewBooking: (prefill: { date: string, time: string, studio: string }) => void;
  onSelectBooking: (id: string) => void;
  onUpdateBooking: (booking: Booking) => void;
  googleToken?: string | null;
  showToast?: (msg: string, type: ToastType) => void;
}

export interface TeamViewProps {
  users: User[];
  bookings: Booking[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onRecordExpense?: (expense: any) => void;
  showToast?: (msg: string, type: ToastType) => void;
}

export interface InventoryViewProps {
  assets: Asset[];
  users: User[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  config: StudioConfig;
  showToast?: (msg: string, type: ToastType) => void;
}

export interface ClientsViewProps {
  clients: Client[];
  bookings: Booking[];
  onUpdateClient: (client: Client) => void;
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectBooking: (id: string) => void;
  config: StudioConfig;
  showToast?: (msg: string, type: ToastType) => void;
}

export interface FinanceViewProps {
  accounts: Account[];
  metrics: MonthlyMetric[];
  bookings: Booking[];
  users: User[];
  transactions: Transaction[];
  onTransfer: (fromId: string, toId: string, amount: number) => void;
  onRecordExpense: (data: { description: string; amount: number; category: string; accountId: string; isRecurring?: boolean; receiptUrl?: string; submittedBy?: string }) => void;
  onSettleBooking: (bookingId: string, amount: number, accountId: string) => void;
  onDeleteTransaction?: (id: string) => void;
  config: StudioConfig;
  onAddAccount?: (account: Account) => void;
  onUpdateAccount?: (account: Account) => void;
  showToast?: (msg: string, type: ToastType) => void;
}

export interface SettingsViewProps {
  packages: Package[];
  config: StudioConfig;
  onAddPackage: (pkg: Package) => void;
  onUpdatePackage: (pkg: Package) => void;
  onDeletePackage: (id: string) => void;
  onUpdateConfig: (config: StudioConfig) => void;
  currentUser?: User;
  onUpdateUserProfile?: (user: User) => void;
  onDeleteAccount?: () => void;
  users?: User[]; 
  googleToken?: string | null;
  setGoogleToken?: (token: string | null) => void;
  assets?: Asset[];
  showToast?: (msg: string, type: ToastType) => void;
}

export interface SiteBuilderViewProps {
    config: StudioConfig;
    packages: Package[];
    users: User[];
    bookings: Booking[];
    onUpdateConfig: (config: StudioConfig) => void;
    onPublicBooking?: (data: PublicBookingSubmission) => void;
    showToast?: (msg: string, type: ToastType) => void;
}
