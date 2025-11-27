
// ... existing imports
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Account, Booking, Client, StudioConfig, Asset, Package } from '../types';
import { PACKAGES } from '../data';
import { X, Calendar, Clock, User as UserIcon, Search, ChevronDown, Plus, AlertTriangle, Check, ArrowRight, ArrowLeft, CreditCard, Sparkles, MapPin, Briefcase, Zap } from 'lucide-react';

const Motion = motion as any;

interface NewBookingModalProps {
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

// --- UTILS ---
const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

// --- COMPONENTS ---

const TimeAvailabilityBar = ({ date, studio, bookings, config, selectedTime, duration }: { date: string, studio: string, bookings: Booking[], config: StudioConfig, selectedTime: string, duration: number }) => {
    // ... existing implementation
    const opStart = config.operatingHoursStart || "09:00";
    const opEnd = config.operatingHoursEnd || "21:00";
    const [startH] = opStart.split(':').map(Number);
    const [endH] = opEnd.split(':').map(Number);
    const totalMinutes = (endH - startH) * 60;
    
    const dayBookings = bookings.filter(b => b.date === date && b.studio === studio && b.status !== 'CANCELLED');

    // Calculate Selection Position
    let selectionLeft = 0;
    let selectionWidth = 0;
    if (selectedTime) {
        const [selH, selM] = selectedTime.split(':').map(Number);
        const selStartMins = (selH - startH) * 60 + selM;
        selectionLeft = (selStartMins / totalMinutes) * 100;
        selectionWidth = (duration * 60 / totalMinutes) * 100;
    }

    return (
        <div className="mt-4">
            <div className="flex justify-between text-[10px] text-lumina-muted mb-1 uppercase font-bold tracking-wider">
                <span>{opStart}</span>
                <span>Availability ({studio})</span>
                <span>{opEnd}</span>
            </div>
            <div className="relative h-10 bg-lumina-base border border-lumina-highlight rounded-lg w-full overflow-hidden flex items-center">
                {/* Grid Lines */}
                {Array.from({ length: endH - startH }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-lumina-highlight/30 h-full" style={{ left: `${(i / (endH - startH)) * 100}%` }}></div>
                ))}
                
                {/* Existing Bookings */}
                {dayBookings.map(b => {
                    const [bH, bM] = b.timeStart.split(':').map(Number);
                    const startMins = (bH - startH) * 60 + bM;
                    const left = (startMins / totalMinutes) * 100;
                    const width = (b.duration * 60 / totalMinutes) * 100;
                    return (
                        <div 
                            key={b.id} 
                            className="absolute top-2 bottom-2 bg-lumina-highlight/80 border border-lumina-muted/50 rounded-sm z-10 flex items-center justify-center" 
                            style={{ left: `${left}%`, width: `${width}%` }} 
                            title={`Booked: ${b.timeStart}`}
                        >
                            <span className="text-[8px] text-lumina-muted hidden sm:block">Booked</span>
                        </div>
                    );
                })}

                {/* Current Selection Preview */}
                {selectedTime && (
                    <div 
                        className="absolute top-1 bottom-1 bg-emerald-500/30 border border-emerald-500 rounded-md z-20 animate-pulse transition-all duration-300"
                        style={{ left: `${selectionLeft}%`, width: `${selectionWidth}%` }}
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[9px] font-bold px-1.5 rounded">
                            New
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose, photographers, accounts, bookings = [], clients = [], assets = [], config, onAddBooking, onAddClient, initialData, packages = [] }) => {
  const [step, setStep] = useState(1);
  const [isQuickMode, setIsQuickMode] = useState(false); // NEW: Quick Mode Toggle
  
  // Client State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', phone: '', email: '', category: 'NEW' });

  // Booking State
  const [bookingForm, setBookingForm] = useState({
      date: new Date().toISOString().split('T')[0],
      timeStart: '10:00',
      duration: 2,
      studio: config.rooms[0]?.name || 'Main Studio',
      packageId: '',
      photographerId: photographers[0]?.id || '',
      price: 0,
      notes: ''
  });

  // Payment State
  const [paymentForm, setPaymentForm] = useState({ amount: 0, accountId: accounts[0]?.id || '' });

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isOpen && initialData) {
        setBookingForm(prev => ({
            ...prev,
            date: initialData.date,
            timeStart: initialData.time,
            studio: initialData.studio
        }));
        // Always start at client selection for integrity
        setStep(1);
        setIsQuickMode(false);
    }
  }, [initialData, isOpen]);

  // --- CLIENT LOGIC ---
  const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.phone.includes(clientSearch)
  );

  const handleCreateClient = () => {
      if (onAddClient && newClientForm.name) {
          const newClient: Client = {
              id: `c-${Date.now()}`,
              name: newClientForm.name,
              phone: newClientForm.phone,
              email: newClientForm.email,
              category: newClientForm.category,
              notes: '',
              joinedDate: new Date().toISOString(),
              avatar: `https://ui-avatars.com/api/?name=${newClientForm.name}&background=random`
          };
          onAddClient(newClient);
          setSelectedClient(newClient);
          setIsCreatingClient(false);
          if(!isQuickMode) setStep(2); // Auto advance only if normal mode
      }
  };

  // --- PACKAGE LOGIC ---
  const availablePackages = packages.length > 0 ? packages : PACKAGES;
  
  const handleSelectPackage = (pkg: Package) => {
      setBookingForm(prev => ({
          ...prev,
          packageId: pkg.id,
          price: pkg.price,
          duration: pkg.duration
      }));
  };

  // --- CONFLICT LOGIC ---
  const hasConflict = useMemo(() => {
      const [h, m] = bookingForm.timeStart.split(':').map(Number);
      const startMins = h * 60 + m;
      const endMins = startMins + (bookingForm.duration * 60);

      return bookings.some(b => {
          if (b.date !== bookingForm.date || b.studio !== bookingForm.studio || b.status === 'CANCELLED') return false;
          const [bH, bM] = b.timeStart.split(':').map(Number);
          const bStart = bH * 60 + bM;
          const bEnd = bStart + (b.duration * 60);
          // Check overlap
          return (startMins < bEnd) && (endMins > bStart);
      });
  }, [bookingForm, bookings]);

  // --- FINANCIAL LOGIC ---
  const calculateTotal = () => {
      const tax = config.taxRate || 0;
      return bookingForm.price * (1 + tax/100);
  };

  const handleSubmit = () => {
      // In Quick Mode, we might need to create a dummy client if none selected
      let finalClient = selectedClient;
      if (isQuickMode && !finalClient && clientSearch) {
          // Auto-create dummy client
          finalClient = {
              id: `c-quick-${Date.now()}`,
              name: clientSearch,
              phone: '',
              email: '',
              category: 'NEW',
              avatar: `https://ui-avatars.com/api/?name=${clientSearch}&background=random`
          };
          if(onAddClient) onAddClient(finalClient);
      }

      if (onAddBooking && finalClient) {
          const selectedPkg = availablePackages.find(p => p.id === bookingForm.packageId) || { name: 'Quick Book', features: [] };
          const finalPrice = isQuickMode ? 0 : bookingForm.price; // Quick bookings might skip price initially or handle later

          const newBooking: Booking = {
              id: `b-${Date.now()}`,
              clientName: finalClient.name,
              clientPhone: finalClient.phone,
              clientId: finalClient.id,
              date: bookingForm.date,
              timeStart: bookingForm.timeStart,
              duration: bookingForm.duration,
              package: selectedPkg.name,
              packageId: bookingForm.packageId,
              price: finalPrice,
              paidAmount: 0,
              status: 'BOOKED',
              photographerId: bookingForm.photographerId,
              studio: bookingForm.studio,
              contractStatus: 'PENDING',
              items: [
                  { 
                      id: `i-${Date.now()}`, 
                      description: selectedPkg.name, 
                      quantity: 1, 
                      unitPrice: finalPrice, 
                      total: finalPrice 
                  }
              ],
              taxSnapshot: config.taxRate
          };

          onAddBooking(newBooking, paymentForm.amount > 0 ? paymentForm : undefined);
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <Motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-lumina-surface border border-lumina-highlight w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Stepper */}
        <div className="bg-lumina-base border-b border-lumina-highlight p-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-xl font-display font-bold text-white">{isQuickMode ? 'Express Booking' : 'New Booking'}</h2>
                    <p className="text-xs text-lumina-muted">{isQuickMode ? 'Fast-track for mobile' : 'Wizard Mode'}</p>
                </div>
                {/* QUICK MODE TOGGLE */}
                <button 
                    onClick={() => setIsQuickMode(!isQuickMode)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isQuickMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-lumina-highlight text-lumina-muted hover:text-white'}`}
                >
                    <Zap size={14} className={isQuickMode ? 'fill-amber-400' : ''}/> {isQuickMode ? 'Quick Mode ON' : 'Quick Mode OFF'}
                </button>
            </div>
            
            {!isQuickMode && (
                <div className="flex items-center gap-2">
                    {[
                        { n: 1, l: 'Client' },
                        { n: 2, l: 'Details' },
                        { n: 3, l: 'Confirm' }
                    ].map((s, i) => (
                        <div key={s.n} className="flex items-center">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors
                                ${step === s.n ? 'bg-lumina-accent text-lumina-base' : step > s.n ? 'bg-emerald-500/20 text-emerald-400' : 'bg-lumina-highlight text-lumina-muted'}
                            `}>
                                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-black/20">{s.n}</span>
                                <span>{s.l}</span>
                            </div>
                            {i < 2 && <div className="w-8 h-px bg-lumina-highlight mx-2"></div>}
                        </div>
                    ))}
                </div>
            )}
            
            <button onClick={onClose} className="p-2 hover:bg-lumina-highlight rounded-lg text-lumina-muted hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            <AnimatePresence mode="wait">
                
                {/* === QUICK MODE FORM === */}
                {isQuickMode ? (
                    <Motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="bg-lumina-highlight/10 p-4 rounded-xl border border-lumina-highlight">
                            <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Client Name / Info</label>
                            <input 
                                autoFocus
                                className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white text-lg focus:border-amber-500 outline-none"
                                placeholder="Enter Name or Search..."
                                value={clientSearch}
                                onChange={e => setClientSearch(e.target.value)}
                            />
                            {clientSearch && filteredClients.length > 0 && (
                                <div className="mt-2 bg-lumina-base border border-lumina-highlight rounded-lg max-h-32 overflow-y-auto">
                                    {filteredClients.map(c => (
                                        <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); }} className="p-2 hover:bg-lumina-highlight cursor-pointer text-sm text-white">
                                            {c.name} ({c.phone})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Date</label>
                                <input type="date" className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Start Time</label>
                                <input type="time" className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white" value={bookingForm.timeStart} onChange={e => setBookingForm({...bookingForm, timeStart: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Duration</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setBookingForm(prev => ({...prev, duration: Math.max(1, prev.duration - 1)}))} className="p-3 bg-lumina-base border border-lumina-highlight rounded-xl text-white">-</button>
                                    <span className="flex-1 text-center font-bold text-white text-xl">{bookingForm.duration}h</span>
                                    <button onClick={() => setBookingForm(prev => ({...prev, duration: prev.duration + 1}))} className="p-3 bg-lumina-base border border-lumina-highlight rounded-xl text-white">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Room</label>
                                <select className="w-full bg-lumina-base border border-lumina-highlight rounded-xl p-3 text-white" value={bookingForm.studio} onChange={e => setBookingForm({...bookingForm, studio: e.target.value})}>
                                    {config.rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {hasConflict && (
                            <div className="p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-sm text-center animate-pulse">
                                Slot Conflict Detected!
                            </div>
                        )}

                        <button 
                            onClick={handleSubmit}
                            disabled={!clientSearch && !selectedClient} 
                            className="w-full py-4 bg-amber-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 mt-4"
                        >
                            Quick Block
                        </button>
                    </Motion.div>
                ) : (
                    // === WIZARD MODE ===
                    <>
                        {/* STEP 1: CLIENT SELECTION */}
                        {step === 1 && (
                            <Motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-2xl mx-auto">
                                {!isCreatingClient ? (
                                    <div className="space-y-6">
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-bold text-white">Who is this booking for?</h3>
                                            <p className="text-lumina-muted">Search existing clients or add a new one.</p>
                                        </div>

                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lumina-muted w-5 h-5 group-focus-within:text-lumina-accent transition-colors" />
                                            <input 
                                                autoFocus
                                                className="w-full bg-lumina-base border border-lumina-highlight rounded-2xl pl-12 pr-4 py-4 text-white text-lg focus:border-lumina-accent outline-none shadow-lg"
                                                placeholder="Search name, phone or email..."
                                                value={clientSearch}
                                                onChange={e => setClientSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {filteredClients.map(client => (
                                                <button 
                                                    key={client.id} 
                                                    onClick={() => { setSelectedClient(client); setStep(2); }}
                                                    className="flex items-center justify-between p-4 rounded-xl border border-lumina-highlight bg-lumina-surface hover:border-lumina-accent hover:bg-lumina-highlight/20 transition-all group text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <img src={client.avatar} className="w-10 h-10 rounded-full border border-lumina-highlight" />
                                                        <div>
                                                            <p className="font-bold text-white">{client.name}</p>
                                                            <p className="text-xs text-lumina-muted">{client.phone} • {client.email}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="text-lumina-muted -rotate-90 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-lumina-highlight">
                                            <button 
                                                onClick={() => setIsCreatingClient(true)}
                                                className="w-full py-4 border border-dashed border-lumina-highlight rounded-xl text-lumina-muted hover:text-white hover:border-lumina-accent hover:bg-lumina-highlight/10 transition-all flex items-center justify-center gap-2 font-bold"
                                            >
                                                <Plus size={18} /> Create New Client Profile
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-lumina-base border border-lumina-highlight rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                                        {/* ... Client Create Form ... */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-white">New Client Profile</h3>
                                            <button onClick={() => setIsCreatingClient(false)} className="text-xs font-bold text-lumina-muted hover:text-white">Cancel</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-lumina-muted uppercase mb-2 block">Full Name</label>
                                                <input autoFocus className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" placeholder="e.g. Jane Doe" value={newClientForm.name} onChange={e => setNewClientForm({...newClientForm, name: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-lumina-muted uppercase mb-2 block">Phone (WhatsApp)</label>
                                                <input className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" placeholder="0812..." value={newClientForm.phone} onChange={e => setNewClientForm({...newClientForm, phone: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-lumina-muted uppercase mb-2 block">Email</label>
                                                <input className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" placeholder="jane@mail.com" value={newClientForm.email} onChange={e => setNewClientForm({...newClientForm, email: e.target.value})} />
                                            </div>
                                        </div>
                                        <button onClick={handleCreateClient} disabled={!newClientForm.name} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                                            Save & Continue
                                        </button>
                                    </div>
                                )}
                            </Motion.div>
                        )}

                        {/* STEP 2: SESSION DETAILS */}
                        {step === 2 && (
                            <Motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                                    
                                    {/* Left Col: Logistics */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <div className="bg-lumina-base border border-lumina-highlight rounded-2xl p-6">
                                            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Calendar size={18} className="text-lumina-accent"/> Logistics</h3>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Date</label>
                                                    <input type="date" className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Start Time</label>
                                                    <input type="time" className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" value={bookingForm.timeStart} onChange={e => setBookingForm({...bookingForm, timeStart: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Duration (Hrs)</label>
                                                    <input type="number" min="1" className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" value={bookingForm.duration} onChange={e => setBookingForm({...bookingForm, duration: Number(e.target.value)})} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Room</label>
                                                    <select className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-lumina-accent outline-none" value={bookingForm.studio} onChange={e => setBookingForm({...bookingForm, studio: e.target.value})}>
                                                        {config.rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Visual Availability */}
                                            <TimeAvailabilityBar 
                                                date={bookingForm.date}
                                                studio={bookingForm.studio}
                                                bookings={bookings}
                                                config={config}
                                                selectedTime={bookingForm.timeStart}
                                                duration={bookingForm.duration}
                                            />

                                            {hasConflict && (
                                                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-pulse">
                                                    <AlertTriangle size={18} />
                                                    <span>Conflict Detected! The selected time overlaps with an existing booking.</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Client Summary Small */}
                                        <div className="p-4 bg-lumina-highlight/10 rounded-xl border border-lumina-highlight flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={selectedClient?.avatar} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{selectedClient?.name}</p>
                                                    <p className="text-xs text-lumina-muted">Client</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setStep(1)} className="text-xs font-bold text-lumina-accent hover:underline">Change</button>
                                        </div>
                                    </div>

                                    {/* Right Col: Service */}
                                    <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
                                        <div className="bg-lumina-base border border-lumina-highlight rounded-2xl p-6 flex-1 flex flex-col">
                                            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-400"/> Package</h3>
                                            
                                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar max-h-[300px] mb-4">
                                                {availablePackages.filter(p => p.active).map(pkg => (
                                                    <div 
                                                        key={pkg.id}
                                                        onClick={() => handleSelectPackage(pkg)}
                                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center
                                                            ${bookingForm.packageId === pkg.id 
                                                                ? 'bg-lumina-highlight border-lumina-accent shadow-md' 
                                                                : 'bg-lumina-surface border-lumina-highlight hover:border-lumina-muted'}
                                                        `}
                                                    >
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{pkg.name}</p>
                                                            <p className="text-xs text-lumina-muted">{pkg.duration}h • {pkg.features.length} features</p>
                                                        </div>
                                                        <p className="text-sm font-mono font-bold text-lumina-accent">{(pkg.price/1000).toFixed(0)}k</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-4 border-t border-lumina-highlight">
                                                <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Photographer</label>
                                                <div className="relative">
                                                    <UserIcon size={16} className="absolute left-3 top-3 text-lumina-muted"/>
                                                    <select 
                                                        className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl pl-10 p-3 text-white focus:border-lumina-accent outline-none appearance-none"
                                                        value={bookingForm.photographerId}
                                                        onChange={e => setBookingForm({...bookingForm, photographerId: e.target.value})}
                                                    >
                                                        {photographers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-lumina-base border border-lumina-highlight rounded-xl font-bold text-lumina-muted hover:text-white">Back</button>
                                            <button onClick={() => setStep(3)} disabled={hasConflict || !bookingForm.packageId} className="flex-[2] py-3 bg-lumina-accent text-lumina-base rounded-xl font-bold shadow-lg shadow-lumina-accent/10 hover:bg-lumina-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                                Review & Pay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Motion.div>
                        )}

                        {/* STEP 3: PAYMENT & CONFIRM */}
                        {step === 3 && (
                            <Motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="max-w-3xl mx-auto">
                                <div className="bg-lumina-base border border-lumina-highlight rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-6 bg-lumina-highlight/20 border-b border-lumina-highlight flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">Booking Summary</h3>
                                            <p className="text-xs text-lumina-muted">{bookingForm.date} @ {bookingForm.timeStart}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-mono font-bold text-lumina-accent">{formatCurrency(calculateTotal())}</p>
                                            <p className="text-[10px] text-lumina-muted uppercase tracking-widest">Total Estimate</p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Summary Table */}
                                        <div className="bg-lumina-surface rounded-xl border border-lumina-highlight p-4 space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-lumina-muted">Service Package</span>
                                                <span className="text-white font-bold">{availablePackages.find(p => p.id === bookingForm.packageId)?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-lumina-muted">Studio Room</span>
                                                <span className="text-white">{bookingForm.studio}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-lumina-muted">Photographer</span>
                                                <span className="text-white">{photographers.find(p => p.id === bookingForm.photographerId)?.name}</span>
                                            </div>
                                            <div className="border-t border-lumina-highlight my-2 pt-2 flex justify-between">
                                                <span className="text-lumina-muted">Base Price</span>
                                                <span className="font-mono text-white">{formatCurrency(bookingForm.price)}</span>
                                            </div>
                                            {config.taxRate > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-lumina-muted">Tax ({config.taxRate}%)</span>
                                                    <span className="font-mono text-white">{formatCurrency(bookingForm.price * config.taxRate / 100)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Deposit Input */}
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CreditCard size={16} className="text-emerald-400"/> Initial Payment (Optional)</h4>
                                            <div className="flex gap-4">
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lumina-muted font-bold text-sm">Rp</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl pl-10 pr-4 py-3 text-white font-mono focus:border-emerald-500 outline-none"
                                                        value={paymentForm.amount}
                                                        onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setPaymentForm({...paymentForm, amount: calculateTotal() * 0.5})} className="px-4 py-2 bg-lumina-surface border border-lumina-highlight rounded-xl text-xs font-bold hover:text-white hover:border-emerald-500 transition-colors">50%</button>
                                                    <button onClick={() => setPaymentForm({...paymentForm, amount: calculateTotal()})} className="px-4 py-2 bg-lumina-surface border border-lumina-highlight rounded-xl text-xs font-bold hover:text-white hover:border-emerald-500 transition-colors">Full</button>
                                                </div>
                                            </div>
                                            
                                            {paymentForm.amount > 0 && (
                                                <div className="mt-4 animate-in slide-in-from-top-2">
                                                    <label className="text-xs font-bold text-lumina-muted uppercase mb-1 block">Deposit To Account</label>
                                                    <select 
                                                        className="w-full bg-lumina-surface border border-lumina-highlight rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                                        value={paymentForm.accountId}
                                                        onChange={e => setPaymentForm({...paymentForm, accountId: e.target.value})}
                                                    >
                                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 border-t border-lumina-highlight bg-lumina-base flex gap-4">
                                        <button onClick={() => setStep(2)} className="px-6 py-3 text-lumina-muted font-bold hover:text-white">Back</button>
                                        <button 
                                            onClick={handleSubmit} 
                                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={18} className="fill-white/20"/> Confirm Booking
                                        </button>
                                    </div>
                                </div>
                            </Motion.div>
                        )}
                    </>
                )}

            </AnimatePresence>
        </div>
      </Motion.div>
    </div>
  );
};

export default NewBookingModal;
