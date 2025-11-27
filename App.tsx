
// ... existing imports
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import ToastContainer from './components/ToastContainer'; // NEW
import { User, Booking, Asset, Notification, Account, Transaction, Client, Package, StudioConfig, BookingTask, ActivityLog, PublicBookingSubmission, StudioRoom, ProjectStatus, OnboardingData, ToastMessage, ToastType } from './types';
import { STUDIO_CONFIG, USERS, ACCOUNTS, PACKAGES, ASSETS, CLIENTS, BOOKINGS, TRANSACTIONS, NOTIFICATIONS } from './data';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, addDoc, deleteDoc, query, where, writeBatch, getDoc } from 'firebase/firestore';

const INITIAL_CONFIG = STUDIO_CONFIG;

const App: React.FC = () => {
  // ... existing state ...
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
  const [googleToken, setGoogleToken] = useState<string | null>(null); 

  // Client Portal State
  const [portalBooking, setPortalBooking] = useState<Booking | null>(null);

  // --- TOAST NOTIFICATIONS ---
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

  // ... (Responsive Handler & Auth Effect remain the same) ...
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ... (Auth Effect remains same) ...
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            setCurrentUser({ ...userData, id: user.uid });
            const ownerId = userData.role === 'OWNER' ? user.uid : user.uid; 
            
            const configRef = doc(db, "studios", ownerId);
            onSnapshot(configRef, (doc) => { if (doc.exists()) setConfig(doc.data() as StudioConfig); });

            const qBookings = query(collection(db, "bookings"), where("ownerId", "==", ownerId));
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

            const qTransactions = query(collection(db, "transactions"), where("ownerId", "==", ownerId));
            onSnapshot(qTransactions, (snap) => setTransactions(snap.docs.map(d => d.data() as Transaction)));
            
            const qUsers = query(collection(db, "users")); 
            onSnapshot(qUsers, (snap) => setUsers(snap.docs.map(d => ({...d.data(), id: d.id} as User))));

        } else {
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

  // ... (handleLogin, handleLogout, handleCompleteOnboarding remain same) ...
  const handleLogin = (user: User) => {};
  const handleLogout = async () => { await signOut(auth); setCurrentUser(null); setViewMode('LAUNCHER'); };
  const handleCompleteOnboarding = async (data: OnboardingData) => { /* ... existing code ... */ };

  const handleAddBooking = async (newBooking: Booking, paymentDetails?: { amount: number, accountId: string }) => {
      try {
          const user = auth.currentUser;
          if (!user) { showToast("You must be logged in.", 'ERROR'); return; }
          const ownerId = user.uid;
          
          const bookingWithAuth = { ...newBooking, ownerId };
          
          await setDoc(doc(db, "bookings", newBooking.id), bookingWithAuth);

          if (paymentDetails && paymentDetails.amount > 0) {
              const transactionId = `t-${Date.now()}`;
              const newTransaction: Transaction = {
                  id: transactionId,
                  date: new Date().toISOString(),
                  description: `Deposit - ${newBooking.clientName}`,
                  amount: paymentDetails.amount,
                  type: 'INCOME',
                  accountId: paymentDetails.accountId,
                  category: 'Sales / Booking',
                  status: 'COMPLETED',
                  bookingId: newBooking.id,
                  ownerId
              };
              await setDoc(doc(db, "transactions", transactionId), newTransaction);
              
              const accountRef = doc(db, "accounts", paymentDetails.accountId);
              const account = accounts.find(a => a.id === paymentDetails.accountId);
              if (account) {
                  await updateDoc(accountRef, { balance: account.balance + paymentDetails.amount });
              }
              await updateDoc(doc(db, "bookings", newBooking.id), { paidAmount: paymentDetails.amount });
          }
          showToast("Booking created successfully!", 'SUCCESS');
      } catch (e) {
          console.error("Add Booking Error:", e);
          showToast("Failed to create booking.", 'ERROR');
      }
  };

  // --- AUTOMATION ENGINE ---
  const handleUpdateBooking = async (updatedBooking: Booking) => {
      // 1. Determine if status changed
      const oldBooking = bookings.find(b => b.id === updatedBooking.id);
      const statusChanged = oldBooking && oldBooking.status !== updatedBooking.status;
      
      let finalBooking = { ...updatedBooking };

      if (statusChanged && config.workflowAutomations) {
          const matchingRules = config.workflowAutomations.filter(rule => 
              rule.triggerStatus === updatedBooking.status &&
              (!rule.triggerPackageId || rule.triggerPackageId === updatedBooking.packageId)
          );

          if (matchingRules.length > 0) {
              const newTasks: BookingTask[] = [];
              let assignedUser = finalBooking.editorId; 

              matchingRules.forEach(rule => {
                  rule.tasks.forEach(taskTitle => {
                      if (!finalBooking.tasks?.some(t => t.title === taskTitle)) {
                          newTasks.push({
                              id: `t-auto-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
                              title: taskTitle,
                              completed: false
                          });
                      }
                  });
                  if (rule.assignToUserId && ['CULLING', 'EDITING'].includes(updatedBooking.status)) {
                      assignedUser = rule.assignToUserId;
                  }
              });

              finalBooking = {
                  ...finalBooking,
                  tasks: [...(finalBooking.tasks || []), ...newTasks],
                  editorId: assignedUser
              };
              showToast(`Automation Triggered: Added ${newTasks.length} tasks`, 'INFO');
          }
      }

      setBookings(prev => prev.map(x => x.id === finalBooking.id ? finalBooking : x));
      await setDoc(doc(db, "bookings", finalBooking.id), finalBooking);
  };

  const handleAddClient = async (client: Client) => {
      try {
          await setDoc(doc(db, "clients", client.id), { ...client, ownerId: currentUser?.id });
          showToast("Client profile created", 'SUCCESS');
      } catch (e) { showToast("Error creating client", 'ERROR'); }
  };

  if (loading) return (
      <div className="min-h-screen bg-lumina-base flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-lumina-accent border-t-transparent rounded-full"
          />
      </div>
  );

  // PUBLIC VIEW
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

  // AUTH FLOW & ONBOARDING ... (remains similar)
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
                    await setDoc(doc(db, "studios", currentUser.id), newConfig);
                    showToast("Site saved successfully", 'SUCCESS');
                }}
                onExit={() => setViewMode('LAUNCHER')}
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
            onNavigate={setCurrentView} 
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
                            await setDoc(doc(db, "assets", a.id), { ...a, ownerId: currentUser.id });
                            showToast("Item added to inventory", 'SUCCESS');
                        }}
                        onUpdateAsset={async (a) => {
                            await setDoc(doc(db, "assets", a.id), a);
                            showToast("Item updated", 'SUCCESS');
                        }}
                        onDeleteAsset={async (id) => {
                            await deleteDoc(doc(db, "assets", id));
                            showToast("Item deleted", 'INFO');
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
                            await setDoc(doc(db, "clients", c.id), c);
                            showToast("Client updated", 'SUCCESS');
                        }}
                        onDeleteClient={async (id) => {
                            await deleteDoc(doc(db, "clients", id));
                            showToast("Client deleted", 'INFO');
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
                        onAddUser={async (u) => {
                            await setDoc(doc(db, "users", u.id), u);
                            showToast("Staff member added", 'SUCCESS');
                        }}
                        onUpdateUser={async (u) => {
                            await setDoc(doc(db, "users", u.id), u);
                            showToast("Profile updated", 'SUCCESS');
                        }}
                        onDeleteUser={async (id) => {
                            await deleteDoc(doc(db, "users", id));
                            showToast("Staff removed", 'INFO');
                        }}
                        onRecordExpense={(data) => {
                            const tid = `t-${Date.now()}`;
                            const txn = {
                                id: tid,
                                date: new Date().toISOString(),
                                type: 'EXPENSE',
                                status: 'COMPLETED',
                                ownerId: currentUser.id,
                                ...data
                            };
                            setDoc(doc(db, "transactions", tid), txn);
                            showToast("Expense recorded", 'SUCCESS');
                        }}
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
                        onTransfer={async (fromId, toId, amount) => {
                            const batch = writeBatch(db);
                            const fromAcc = accounts.find(a => a.id === fromId);
                            const toAcc = accounts.find(a => a.id === toId);
                            
                            if (fromAcc && toAcc && fromAcc.balance >= amount) {
                                batch.update(doc(db, "accounts", fromId), { balance: fromAcc.balance - amount });
                                batch.update(doc(db, "accounts", toId), { balance: toAcc.balance + amount });
                                const tid = `t-${Date.now()}`;
                                batch.set(doc(db, "transactions", tid), {
                                    id: tid,
                                    date: new Date().toISOString(),
                                    description: `Transfer to ${toAcc.name}`,
                                    amount: amount,
                                    type: 'TRANSFER',
                                    accountId: fromId,
                                    category: 'Internal Transfer',
                                    status: 'COMPLETED',
                                    ownerId: currentUser.id
                                });
                                await batch.commit();
                                showToast("Transfer successful", 'SUCCESS');
                            }
                        }}
                        onRecordExpense={async (data) => {
                            const batch = writeBatch(db);
                            const acc = accounts.find(a => a.id === data.accountId);
                            const tid = `t-${Date.now()}`;
                            batch.set(doc(db, "transactions", tid), {
                                id: tid,
                                date: new Date().toISOString(),
                                type: 'EXPENSE',
                                status: 'COMPLETED',
                                ownerId: currentUser.id,
                                ...data
                            });
                            if (acc) {
                                batch.update(doc(db, "accounts", acc.id), { balance: acc.balance - data.amount });
                            }
                            await batch.commit();
                            showToast("Expense saved", 'SUCCESS');
                        }}
                        onSettleBooking={async (bookingId, amount, accountId) => {
                            const batch = writeBatch(db);
                            const booking = bookings.find(b => b.id === bookingId);
                            const acc = accounts.find(a => a.id === accountId);
                            
                            if (booking && acc) {
                                batch.update(doc(db, "bookings", bookingId), { paidAmount: booking.paidAmount + amount });
                                batch.update(doc(db, "accounts", accountId), { balance: acc.balance + amount });
                                const tid = `t-${Date.now()}`;
                                batch.set(doc(db, "transactions", tid), {
                                    id: tid,
                                    date: new Date().toISOString(),
                                    description: amount > 0 ? `Payment - ${booking.clientName}` : `Refund - ${booking.clientName}`,
                                    amount: Math.abs(amount),
                                    type: amount > 0 ? 'INCOME' : 'EXPENSE',
                                    accountId: accountId,
                                    category: 'Sales / Booking',
                                    status: 'COMPLETED',
                                    bookingId: bookingId,
                                    ownerId: currentUser.id
                                });
                                await batch.commit();
                                showToast("Transaction recorded", 'SUCCESS');
                            }
                        }}
                        onDeleteTransaction={async (id) => {
                            await deleteDoc(doc(db, "transactions", id));
                            showToast("Transaction deleted", 'INFO');
                        }}
                        onAddAccount={async (acc) => {
                            await setDoc(doc(db, "accounts", acc.id), { ...acc, ownerId: currentUser.id });
                            showToast("Account created", 'SUCCESS');
                        }}
                        onUpdateAccount={async (acc) => {
                            await setDoc(doc(db, "accounts", acc.id), acc);
                            showToast("Account updated", 'SUCCESS');
                        }}
                        showToast={showToast}
                    />
                )}
                {currentView === 'analytics' && (
                    <AnalyticsView 
                        key="analytics"
                        bookings={bookings}
                        packages={packages}
                        transactions={transactions}
                    />
                )}
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
                        setGoogleToken={setGoogleToken}
                        onAddPackage={async (pkg) => {
                            await setDoc(doc(db, "packages", pkg.id), { ...pkg, ownerId: currentUser.id });
                            showToast("Package created", 'SUCCESS');
                        }}
                        onUpdatePackage={async (pkg) => {
                            await setDoc(doc(db, "packages", pkg.id), pkg);
                            showToast("Package saved", 'SUCCESS');
                        }}
                        onDeletePackage={async (id) => {
                            await deleteDoc(doc(db, "packages", id));
                            showToast("Package deleted", 'INFO');
                        }}
                        onUpdateConfig={async (newConfig) => {
                            setConfig(newConfig);
                            await setDoc(doc(db, "studios", currentUser.id), newConfig);
                            showToast("Settings updated", 'SUCCESS');
                        }}
                        onUpdateUserProfile={async (user) => {
                            await setDoc(doc(db, "users", user.id), user);
                            setCurrentUser(user);
                            showToast("Profile saved", 'SUCCESS');
                        }}
                        onDeleteAccount={async () => {
                            if (window.confirm("CRITICAL: Are you sure? This will wipe all your data.")) {
                                alert("Account deletion simulation.");
                            }
                        }}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>
        </div>

        {isMobile && <MobileNav currentUser={currentUser} onNavigate={setCurrentView} currentView={currentView} onLogout={handleLogout} bookings={bookings} />}
      </main>

      {/* Toast Container Global */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Modals */}
      <NewBookingModal 
        isOpen={isNewBookingModalOpen} 
        onClose={() => setIsNewBookingModalOpen(false)}
        photographers={users.filter(u => u.role === 'PHOTOGRAPHER' || u.role === 'OWNER')}
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
        onDeleteBooking={async (id) => {
            await deleteDoc(doc(db, "bookings", id));
            setIsProjectDrawerOpen(false);
            showToast("Project deleted", 'INFO');
        }}
        config={config}
        packages={packages}
        currentUser={currentUser}
        assets={assets}
        googleToken={googleToken}
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
        clients={clients}
        bookings={bookings}
        assets={assets}
        onSelectBooking={(id) => { setSelectedBookingId(id); setIsProjectDrawerOpen(true); }}
        currentUser={currentUser}
      />

      {/* Shortcut Listener */}
      <div className="hidden" onKeyDown={(e) => {
          if (e.metaKey && e.key === 'k') setIsCommandPaletteOpen(true);
      }} />
    </div>
  );
};

const SearchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

export default App;
