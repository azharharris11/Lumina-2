
// ... existing imports ...
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ... imports
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DashboardView from './views/DashboardView';
import CalendarView from './views/CalendarView';
import ProductionView from './views/ProductionView';
import InventoryView from './views/InventoryView';
import ClientsView from './views/ClientsView';
import TeamView from './views/TeamView';
import FinanceView from './views/FinanceView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import LandingPageView from './views/LandingPageView';
import RegisterView from './views/RegisterView';
import AnalyticsView from './views/AnalyticsView';
import SiteBuilderView from './views/SiteBuilderView';
import PublicSiteView from './views/PublicSiteView';
import OnboardingView from './views/OnboardingView';
import AppLauncher from './components/AppLauncher';
import NewBookingModal from './components/NewBookingModal';
import ProjectDrawer from './components/ProjectDrawer';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/ToastContainer';
import { User, Booking, Asset, Notification, Account, Transaction, Client, Package, StudioConfig, ToastMessage, ToastType } from './types';
import { STUDIO_CONFIG } from './data';
import { auth, db } from './firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, getDoc, orderBy, limit } from 'firebase/firestore';

const INITIAL_CONFIG = STUDIO_CONFIG;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'OS' | 'SITE' | 'LAUNCHER' | 'PUBLIC'>('LAUNCHER'); 
  
  // Data State
  const [config, setConfig] = useState<StudioConfig>(INITIAL_CONFIG);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);

  // UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{date: string, time: string, studio: string} | undefined>(undefined);
  
  // TOKEN PERSISTENCE LOGIC
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
      return localStorage.getItem('lumina_google_token');
  });

  const handleSetGoogleToken = (token: string | null) => {
      setGoogleToken(token);
      if (token) {
          localStorage.setItem('lumina_google_token', token);
      } else {
          localStorage.removeItem('lumina_google_token');
      }
  };

  const [portalBooking, setPortalBooking] = useState<Booking | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'INFO') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- NAVIGATION HANDLER ---
  const handleNavigate = (view: string) => {
      if (view === 'website') {
          setViewMode('SITE');
      } else {
          setCurrentView(view);
      }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publicSiteId = params.get('site');
    const portalBookingId = params.get('booking');

    if (publicSiteId) {
        setViewMode('PUBLIC');
        setLoading(true);
        const fetchData = async () => {
            try {
                const configRef = doc(db, "studios", publicSiteId);
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) {
                    setConfig(configSnap.data() as StudioConfig);
                }
                if (portalBookingId) {
                    const bookingRef = doc(db, "bookings", portalBookingId);
                    const bookingSnap = await getDoc(bookingRef);
                    if (bookingSnap.exists()) {
                        setPortalBooking(bookingSnap.data() as Booking);
                    }
                }
                setLoading(false);
            } catch (e) {
                console.error("Public Fetch Error:", e);
                setLoading(false);
            }
        };
        fetchData();
        return; 
    }

    const unsubscribeAuth = (auth as any).onAuthStateChanged(async (user: any) => {
      if (user) {
        // Try to fetch from Firestore, fallback to mock if fails/doesn't exist
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                setCurrentUser({ ...userData, id: user.uid });
                const ownerId = userData.role === 'OWNER' ? user.uid : user.uid; 
                
                // Listeners
                const configRef = doc(db, "studios", ownerId);
                onSnapshot(configRef, (doc) => { if (doc.exists()) setConfig(doc.data() as StudioConfig); });

                // OPTIMIZED QUERIES: Order by Date and Limit to last 300 to prevent overload
                // In a real app, you would use pagination (infinite scroll), but this prevents the crash
                const qBookings = query(
                    collection(db, "bookings"), 
                    where("ownerId", "==", ownerId),
                    // orderBy("date", "desc"), // Requires Index in Firestore
                    limit(300) 
                );
                onSnapshot(qBookings, (snap) => setBookings(snap.docs.map(d => d.data() as Booking)));

                const qClients = query(collection(db, "clients"), where("ownerId", "==", ownerId));
                onSnapshot(qClients, (snap) => setClients(snap.docs.map(d => d.data() as Client)));

                const qAssets = query(collection(db, "assets"), where("ownerId", "==", ownerId));
                onSnapshot(qAssets, (snap) => setAssets(snap.docs.map(d => d.data() as Asset)));

                const qAccounts = query(collection(db, "accounts"), where("ownerId", "==", ownerId));
                onSnapshot(qAccounts, (snap) => {
                    const accData = snap.docs.map(d => d.data() as Account);
                    if (accData.length > 0) setAccounts(accData);
                });

                const qPackages = query(collection(db, "packages"), where("ownerId", "==", ownerId));
                onSnapshot(qPackages, (snap) => setPackages(snap.docs.map(d => d.data() as Package)));

                // Optimized Transactions Query
                const qTransactions = query(
                    collection(db, "transactions"), 
                    where("ownerId", "==", ownerId),
                    // orderBy("date", "desc"), // Requires Index
                    limit(500)
                );
                onSnapshot(qTransactions, (snap) => setTransactions(snap.docs.map(d => d.data() as Transaction)));
                
                const qUsers = query(collection(db, "users")); 
                onSnapshot(qUsers, (snap) => setUsers(snap.docs.map(d => ({...d.data(), id: d.id} as User))));

            } else {
                 // Fallback/First Time
                 setCurrentUser({
                    id: user.uid,
                    name: user.displayName || 'User',
                    email: user.email || '',
                    role: 'OWNER',
                    avatar: user.photoURL || '',
                    phone: '',
                    status: 'ACTIVE',
                    joinedDate: new Date().toISOString(),
                    hasCompletedOnboarding: false
                });
            }
        } catch (e) {
             // Fallback if firestore fails
             setCurrentUser({
                id: user.uid,
                name: user.displayName || 'User',
                email: user.email || '',
                role: 'OWNER',
                avatar: user.photoURL || '',
                phone: '',
                status: 'ACTIVE',
                joinedDate: new Date().toISOString(),
                hasCompletedOnboarding: false
            });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = (user: User) => {};
  const handleLogout = async () => { await (auth as any).signOut(); setCurrentUser(null); setViewMode('LAUNCHER'); handleSetGoogleToken(null); };
  const handleCompleteOnboarding = async (data: any) => { /*...*/ };

  // ... (handleAddBooking, handleUpdateBooking, handleAddClient logic - Keeping as is) ...
  const handleAddBooking = async (newBooking: Booking, paymentDetails?: any) => { /* ... */ };
  const handleUpdateBooking = async (updatedBooking: Booking) => { /* ... */ };
  const handleAddClient = async (client: Client) => { /* ... */ };

  if (loading) return (
      <div className="min-h-screen bg-lumina-base flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-lumina-accent border-t-transparent rounded-full"
          />
      </div>
  );

  if (viewMode === 'PUBLIC') {
      return (
          <PublicSiteView 
              config={config} 
              packages={packages} 
              users={users} 
              bookings={bookings}
              portalBooking={portalBooking}
              isLoading={loading}
              error={null}
              onBooking={(data) => {
                  console.log("Public Booking:", data);
                  alert("Booking submitted! Check your email for confirmation.");
              }}
          />
      );
  }

  if (!currentUser) return <AnimatePresence mode="wait">{viewMode === 'LAUNCHER' ? <LandingPageView onLogin={() => setViewMode('OS')} onRegister={() => setViewMode('SITE')} /> : viewMode === 'SITE' ? <RegisterView onLoginLink={() => setViewMode('OS')} onRegisterSuccess={(user) => { setCurrentUser(user); }} onHome={() => setViewMode('LAUNCHER')} /> : <LoginView users={users} onLogin={handleLogin} onRegisterLink={() => setViewMode('SITE')} onHome={() => setViewMode('LAUNCHER')} />}</AnimatePresence>;
  if (!currentUser.hasCompletedOnboarding) return <OnboardingView user={currentUser} onComplete={handleCompleteOnboarding} />;
  if (viewMode === 'LAUNCHER') return <AppLauncher user={currentUser} onSelectApp={(app) => setViewMode(app)} onLogout={handleLogout} />;

  // SITE BUILDER
  if (viewMode === 'SITE') {
      return (
          <>
            <SiteBuilderView 
                config={config} 
                packages={packages} 
                users={users} 
                bookings={bookings}
                onUpdateConfig={async (newConfig) => {
                    setConfig(newConfig);
                    try {
                        await setDoc(doc(db, "studios", currentUser.id), newConfig);
                        showToast("Site saved successfully", 'SUCCESS');
                    } catch (e) {
                        showToast("Failed to save to cloud", 'ERROR');
                    }
                }}
                onExit={() => setViewMode('OS')} // Return to OS, not Launcher, for smoother flow
                showToast={showToast}
            />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </>
      );
  }

  // MAIN OS
  return (
    <div className={`flex h-screen bg-lumina-base text-lumina-text font-sans overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {!isMobile && (
          <Sidebar 
            currentUser={currentUser} 
            onNavigate={handleNavigate} // Use the wrapper to handle 'website'
            currentView={currentView} 
            onLogout={handleLogout}
            onSwitchApp={() => setViewMode('LAUNCHER')}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            bookings={bookings}
            config={config}
          />
      )}
      
      <main className="flex-1 flex flex-col relative h-full overflow-hidden lg:pl-64 transition-all duration-300">
        {/* Mobile Header */}
        {isMobile && (
            <div className="h-16 border-b border-lumina-highlight flex items-center justify-between px-4 shrink-0">
                <span className="font-display font-bold text-lg text-white">LUMINA</span>
                <button onClick={() => setIsCommandPaletteOpen(true)} className="p-2 text-lumina-muted"><SearchIcon/></button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pb-24 lg:pb-8 scroll-smooth">
            <AnimatePresence mode="wait">
                {currentView === 'dashboard' && (
                    <DashboardView 
                        key="dashboard" 
                        user={currentUser} 
                        bookings={bookings} 
                        transactions={transactions}
                        assets={assets} 
                        onSelectBooking={(id) => { setSelectedBookingId(id); setIsProjectDrawerOpen(true); }}
                        selectedDate={new Date().toISOString().split('T')[0]}
                        onNavigate={setCurrentView}
                        config={config}
                        showToast={showToast}
                    />
                )}
                {/* ... other views ... */}
                {currentView === 'calendar' && (
                    <CalendarView 
                        key="calendar"
                        bookings={bookings}
                        currentDate={new Date().toISOString().split('T')[0]}
                        users={users}
                        rooms={config.rooms}
                        onDateChange={() => {}}
                        onNewBooking={(prefill) => { setBookingPrefill(prefill); setIsNewBookingModalOpen(true); }}
                        onSelectBooking={(id) => { setSelectedBookingId(id); setIsProjectDrawerOpen(true); }}
                        onUpdateBooking={handleUpdateBooking}
                        googleToken={googleToken}
                        showToast={showToast}
                    />
                )}
                {currentView === 'production' && (
                    <ProductionView 
                        key="production"
                        bookings={bookings}
                        onSelectBooking={(id) => { setSelectedBookingId(id); setIsProjectDrawerOpen(true); }}
                        currentUser={currentUser}
                        onUpdateBooking={handleUpdateBooking}
                        config={config}
                    />
                )}
                {currentView === 'inventory' && (
                    <InventoryView 
                        key="inventory"
                        assets={assets} 
                        users={users}
                        onAddAsset={async (a) => {
                            try {
                                await setDoc(doc(db, "assets", a.id), { ...a, ownerId: currentUser.id });
                                showToast("Item added", 'SUCCESS');
                            } catch (e) { showToast("Failed to save", 'ERROR'); }
                        }}
                        onUpdateAsset={async (a) => {
                            try {
                                await setDoc(doc(db, "assets", a.id), a);
                                showToast("Item updated", 'SUCCESS');
                            } catch (e) { showToast("Failed to save", 'ERROR'); }
                        }}
                        onDeleteAsset={async (id) => {
                            try {
                                await deleteDoc(doc(db, "assets", id));
                                showToast("Item deleted", 'INFO');
                            } catch (e) { showToast("Failed to delete", 'ERROR'); }
                        }}
                        config={config}
                        showToast={showToast}
                    />
                )}
                {currentView === 'clients' && (
                    <ClientsView 
                        key="clients"
                        clients={clients}
                        bookings={bookings}
                        onAddClient={handleAddClient}
                        onUpdateClient={async (c) => {
                            try {
                                await setDoc(doc(db, "clients", c.id), c);
                                showToast("Client updated", 'SUCCESS');
                            } catch (e) { showToast("Failed to save", 'ERROR'); }
                        }}
                        onDeleteClient={async (id) => {
                            try {
                                await deleteDoc(doc(db, "clients", id));
                                showToast("Client deleted", 'INFO');
                            } catch (e) { showToast("Failed to delete", 'ERROR'); }
                        }}
                        onSelectBooking={(id) => { setSelectedBookingId(id); setIsProjectDrawerOpen(true); }}
                        config={config}
                        showToast={showToast}
                    />
                )}
                {currentView === 'team' && (
                    <TeamView 
                        key="team"
                        users={users}
                        bookings={bookings}
                        accounts={accounts}
                        onAddUser={async (u) => { try { await setDoc(doc(db, "users", u.id), u); showToast("User added", 'SUCCESS'); } catch (e) { showToast("Error", 'ERROR'); } }}
                        onUpdateUser={async (u) => { try { await setDoc(doc(db, "users", u.id), u); showToast("User updated", 'SUCCESS'); } catch (e) { showToast("Error", 'ERROR'); } }}
                        onDeleteUser={async (id) => { try { await deleteDoc(doc(db, "users", id)); showToast("User deleted", 'INFO'); } catch (e) { showToast("Error", 'ERROR'); } }}
                        onRecordExpense={(data) => { /*...*/ }}
                        showToast={showToast}
                    />
                )}
                {currentView === 'finance' && (
                    <FinanceView 
                        key="finance"
                        accounts={accounts}
                        metrics={metrics}
                        bookings={bookings}
                        users={users}
                        transactions={transactions}
                        config={config}
                        onTransfer={async (fromId, toId, amount) => { /*...*/ }}
                        onRecordExpense={async (data) => { /*...*/ }}
                        onSettleBooking={async (bookingId, amount, accountId) => { /*...*/ }}
                        onDeleteTransaction={async (id) => { try { await deleteDoc(doc(db, "transactions", id)); } catch (e) {} }}
                        onAddAccount={async (acc) => { try { await setDoc(doc(db, "accounts", acc.id), { ...acc, ownerId: currentUser.id }); } catch (e) {} }}
                        onUpdateAccount={async (acc) => { try { await setDoc(doc(db, "accounts", acc.id), acc); } catch (e) {} }}
                        showToast={showToast}
                    />
                )}
                {currentView === 'analytics' && <AnalyticsView key="analytics" bookings={bookings} packages={packages} transactions={transactions} />}
                {currentView === 'settings' && (
                    <SettingsView 
                        key="settings"
                        packages={packages}
                        config={config}
                        bookings={bookings}
                        assets={assets}
                        currentUser={currentUser}
                        users={users}
                        googleToken={googleToken}
                        setGoogleToken={handleSetGoogleToken}
                        onAddPackage={async (pkg) => { try { await setDoc(doc(db, "packages", pkg.id), { ...pkg, ownerId: currentUser.id }); showToast("Package added", 'SUCCESS'); } catch(e) { showToast("Error", 'ERROR'); } }}
                        onUpdatePackage={async (pkg) => { try { await setDoc(doc(db, "packages", pkg.id), pkg); showToast("Package updated", 'SUCCESS'); } catch(e) { showToast("Error", 'ERROR'); } }}
                        onDeletePackage={async (id) => { try { await deleteDoc(doc(db, "packages", id)); showToast("Package deleted", 'INFO'); } catch(e) { showToast("Error", 'ERROR'); } }}
                        onUpdateConfig={async (newConfig) => { setConfig(newConfig); try { await setDoc(doc(db, "studios", currentUser.id), newConfig); showToast("Settings saved", 'SUCCESS'); } catch(e) { showToast("Error", 'ERROR'); } }}
                        onUpdateUserProfile={async (user) => { try { await setDoc(doc(db, "users", user.id), user); setCurrentUser(user); showToast("Profile saved", 'SUCCESS'); } catch(e) { showToast("Error", 'ERROR'); } }}
                        onDeleteAccount={async () => { /*...*/ }}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>
        </div>

        {isMobile && <MobileNav currentUser={currentUser} onNavigate={handleNavigate} currentView={currentView} onLogout={handleLogout} bookings={bookings} />}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Modals - ProjectDrawer, NewBookingModal, CommandPalette */}
      <NewBookingModal 
        isOpen={isNewBookingModalOpen} 
        onClose={() => setIsNewBookingModalOpen(false)}
        photographers={users}
        accounts={accounts}
        bookings={bookings}
        clients={clients}
        assets={assets}
        config={config}
        packages={packages}
        onAddBooking={handleAddBooking}
        onAddClient={handleAddClient}
        initialData={bookingPrefill}
      />

      <ProjectDrawer
        isOpen={isProjectDrawerOpen}
        onClose={() => setIsProjectDrawerOpen(false)}
        booking={bookings.find(b => b.id === selectedBookingId) || null}
        photographer={users.find(u => u.id === (bookings.find(b => b.id === selectedBookingId)?.photographerId))}
        onUpdateBooking={handleUpdateBooking}
        onDeleteBooking={async (id) => { try { await deleteDoc(doc(db, "bookings", id)); setIsProjectDrawerOpen(false); showToast("Project deleted", 'INFO'); } catch (e) { showToast("Error", 'ERROR'); } }}
        config={config}
        packages={packages}
        currentUser={currentUser}
        assets={assets}
        googleToken={googleToken}
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        clients={clients}
        bookings={bookings}
        assets={assets}
        onSelectBooking={(id) => { setSelectedBookingId(id); setIsProjectDrawerOpen(true); }}
        currentUser={currentUser}
      />

      <div className="hidden" onKeyDown={(e) => { if (e.metaKey && e.key === 'k') setIsCommandPaletteOpen(true); }} />
    </div>
  );
};

const SearchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

export default App;
