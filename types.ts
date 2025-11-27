
export type Role = 'OWNER' | 'ADMIN' | 'PHOTOGRAPHER' | 'EDITOR' | 'FINANCE';
export type ProjectStatus = 'INQUIRY' | 'BOOKED' | 'SHOOTING' | 'CULLING' | 'EDITING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD';
export type AccountType = 'BANK' | 'CASH' | 'E_WALLET';
export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN';
export type AssetCategory = 'CAMERA' | 'LENS' | 'LIGHTING' | 'PROP' | 'BACKGROUND' | 'AUDIO' | 'CABLES' | string;
export type SiteTheme = 'NOIR' | 'ETHEREAL' | 'VOGUE' | 'MINIMAL' | 'CINEMA' | 'RETRO' | 'ATELIER' | 'HORIZON' | 'BOLD' | 'IMPACT' | 'CLEANSLATE' | 'AUTHORITY';
export type SectionType = 'HERO' | 'TEXT_IMAGE' | 'GALLERY' | 'FEATURES' | 'PRICING' | 'TESTIMONIALS' | 'FAQ' | 'CTA_BANNER';
export type SiteFont = 'SANS' | 'SERIF' | 'DISPLAY' | 'MONO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  joinedDate: string;
  commissionRate?: number;
  specialization?: string;
  unavailableDates?: string[];
  hasCompletedOnboarding?: boolean;
  studioFocus?: string;
  studioName?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  ownerId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  category: string;
  status: 'PENDING' | 'COMPLETED';
  bookingId?: string;
  receiptUrl?: string;
  ownerId?: string;
  submittedBy?: string;
  isRecurring?: boolean;
}

export interface BookingItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cost?: number;
}

export interface PackageCostItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
  costBreakdown?: PackageCostItem[];
  turnaroundDays?: number;
  archived?: boolean;
  defaultTasks?: string[];
  defaultAssetIds?: string[];
  ownerId?: string;
}

export interface Discount {
  type: 'PERCENT' | 'FIXED';
  value: number;
  code?: string;
}

export interface TimeLog {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  description?: string;
}

export interface BookingTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
  userId: string;
  userName: string;
}

export interface BookingFile {
  id: string;
  url: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  uploadedAt: string;
}

export interface BookingComment {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
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
  notes?: string;
  discount?: Discount;
  deliveryUrl?: string; 
  tasks?: BookingTask[];
  logs?: ActivityLog[];
  files?: BookingFile[];
  comments?: BookingComment[];
  timeLogs?: TimeLog[];
  taxSnapshot?: number;
  costSnapshot?: PackageCostItem[];
  ownerId?: string;
  selectedImageIds?: string[]; 
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  serialNumber?: string;
  purchaseDate?: string;
  value?: number;
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
  category: string;
  notes?: string;
  joinedDate: string;
  avatar?: string;
  ownerId?: string;
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

export interface WhatsAppTemplates {
    booking: string;
    reminder: string;
    thanks: string;
}

export interface MonthlyMetric {
    month: string;
    revenue: number;
    expenses: number;
    bookings: number;
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

export interface SiteSection {
    id: string;
    type: SectionType;
    content: {
        headline?: string;
        subheadline?: string;
        description?: string;
        image?: string;
        layout?: 'LEFT' | 'RIGHT' | 'CENTER';
        buttonText?: string;
        items?: { title: string; text: string }[];
    };
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
    sections?: SiteSection[];
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
    seo: {
        title: string;
        description: string;
        keywords: string[];
    };
    pixels?: SitePixels;
    announcement?: {
        enabled: boolean;
        text: string;
        link?: string;
        color?: string;
        textColor?: string;
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
        faviconUrl?: string;
        socialShareImage?: string;
    };
    pages?: SitePage[];
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

export interface StudioConfig {
  name: string;
  address: string;
  phone: string;
  website: string;
  
  // Financial
  taxRate: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  invoicePrefix?: string;
  requiredDownPaymentPercentage?: number;
  paymentDueDays?: number;
  expenseCategories?: string[];

  // Ops
  operatingHoursStart: string;
  operatingHoursEnd: string;
  bufferMinutes: number;
  
  defaultTurnaroundDays?: number;
  workflowAutomations?: WorkflowAutomation[];
  isLiteMode?: boolean; 

  logoUrl?: string;
  npwp?: string;
  invoiceFooter?: string;
  rooms: StudioRoom[];
  templates: WhatsAppTemplates;
  
  // CRM & Inventory
  assetCategories?: string[];
  clientCategories?: string[];

  site: SiteConfig;
  ownerId?: string;
}

// ... (Component Props)
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
}

export interface TeamViewProps {
  users: User[];
  bookings: Booking[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onRecordExpense?: (expense: any) => void;
}

export interface InventoryViewProps {
  assets: Asset[];
  users: User[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  config: StudioConfig;
}

export interface ClientsViewProps {
  clients: Client[];
  bookings: Booking[];
  onUpdateClient: (client: Client) => void;
  onAddClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectBooking: (id: string) => void;
  config: StudioConfig;
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
}

export interface SiteBuilderViewProps {
    config: StudioConfig;
    packages: Package[];
    users: User[];
    bookings: Booking[];
    onUpdateConfig: (config: StudioConfig) => void;
    onPublicBooking?: (data: PublicBookingSubmission) => void;
}

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  config: StudioConfig;
  onLogActivity?: (bookingId: string, action: string, details: string) => void;
}

export interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographers: User[];
  accounts: Account[];
  bookings?: Booking[]; 
  clients?: Client[]; 
  assets?: Asset[]; 
  config: StudioConfig; 
  onAddBooking?: (booking: Booking, paymentDetails?: { amount: number, accountId: string }) => void;
  onAddClient?: (client: Client) => void; 
  initialData?: { date: string, time: string, studio: string };
  googleToken?: string | null;
  packages?: Package[];
}
