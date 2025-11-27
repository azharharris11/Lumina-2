
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, SiteTheme, PublicBookingSubmission, SitePixels, Booking } from '../../types';
import { Check, ChevronRight, Calendar, Clock, User, ArrowLeft, CheckCircle2, Loader2, Activity, AlertCircle, ShoppingBag } from 'lucide-react';

const Motion = motion as any;

interface BookingWidgetProps {
    packages: Package[];
    theme: SiteTheme;
    onSubmit?: (data: PublicBookingSubmission) => void;
    pixels?: SitePixels;
    bookings?: Booking[];
}

type Step = 'PACKAGE' | 'DATE' | 'DETAILS' | 'CONFIRM';

const BookingWidget: React.FC<BookingWidgetProps> = ({ packages, theme, onSubmit, pixels, bookings = [] }) => {
    const [step, setStep] = useState<Step>('PACKAGE');
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [pixelToast, setPixelToast] = useState<string | null>(null);

    const firePixel = (event: string, details: string) => {
        const w = window as any;
        if (pixels?.facebookPixelId && w.fbq) w.fbq('track', event, { content_name: details });
        if (pixels?.tiktokPixelId && w.ttq) w.ttq.track(event, { content_name: details });
        if (pixels?.googleTagId && w.gtag) w.gtag('event', event, { event_label: details });
    };

    const handleSelectPackage = (pkg: Package) => {
        setSelectedPackage(pkg);
        firePixel('ViewContent', `Package: ${pkg.name} - Rp ${pkg.price}`);
        setStep('DATE');
    };

    // --- DYNAMIC SLOT LOGIC ---
    const availableTimeSlots = useMemo(() => {
        if (!selectedDate || !selectedPackage) return [];

        // Operating Hours (Default 09:00 - 18:00 if not config passed, assumed standard)
        const opStart = 9;
        const opEnd = 18;
        const slots = [];

        // Generate slots every 30 mins
        for (let h = opStart; h < opEnd; h++) {
            slots.push(`${h < 10 ? '0'+h : h}:00`);
            slots.push(`${h < 10 ? '0'+h : h}:30`);
        }

        return slots.map(time => {
            const [startH, startM] = time.split(':').map(Number);
            const proposedStart = startH * 60 + startM;
            const proposedEnd = proposedStart + (selectedPackage.duration * 60);

            // Hard Stop at closing time
            if (proposedEnd > (opEnd * 60)) {
                return { time, available: false };
            }

            // Check overlap against existing bookings
            const hasConflict = bookings.some(b => {
                if (b.date !== selectedDate || b.status === 'CANCELLED') return false;
                if (!b.timeStart) return false;
                const [bStartH, bStartM] = b.timeStart.split(':').map(Number);
                const bStart = bStartH * 60 + bStartM;
                const bEnd = bStart + (b.duration * 60);
                
                // Conflict if: Proposed start is before Existing end AND Proposed End is after Existing Start
                return (proposedStart < bEnd) && (proposedEnd > bStart);
            });

            return { time, available: !hasConflict };
        });
    }, [selectedDate, selectedPackage, bookings]);

    // --- THEME ADAPTER (Simplified for brevity, keeps existing structure) ---
    const getThemeClasses = () => {
        switch(theme) {
            case 'RETRO': return { container: 'bg-[#c0c0c0] border-2 border-white border-r-black border-b-black p-4 text-black font-mono', button: 'bg-blue-800 text-white border-2 border-white/50 px-4 py-2 font-bold hover:bg-blue-700 shadow-sm', input: 'bg-white border-2 border-gray-600 border-r-white border-b-white p-2', card: 'bg-white border-2 border-gray-600 p-3 hover:bg-blue-100 cursor-pointer mb-2', accent: 'text-blue-800' };
            case 'VOGUE': return { container: 'bg-white border-[4px] border-[#ff3333] p-6 text-black font-sans', button: 'bg-black text-white border-2 border-black hover:bg-[#ffff00] hover:text-black font-black uppercase px-6 py-3', input: 'bg-[#f0f0f0] border-2 border-black p-3 font-bold focus:bg-[#ffff00] outline-none', card: 'border-4 border-black p-4 hover:bg-[#ffff00] cursor-pointer transition-all mb-3', accent: 'text-[#ff3333]' };
            case 'CINEMA': return { container: 'bg-[#050505] border border-white/10 p-6 text-white font-sans rounded-xl backdrop-blur-md', button: 'bg-blue-600 text-white rounded px-6 py-2 font-bold hover:bg-blue-500 transition-colors', input: 'bg-white/10 border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none', card: 'bg-white/5 border border-white/10 p-4 rounded hover:border-blue-500 cursor-pointer transition-all mb-3', accent: 'text-blue-500' };
            case 'BOLD': return { container: 'bg-white border-[6px] border-black p-6 text-black font-sans', button: 'bg-black text-[#bef264] border-4 border-black font-black uppercase px-6 py-3 hover:bg-white hover:text-black', input: 'bg-[#f0f0f0] border-4 border-black p-3 font-bold focus:bg-white outline-none', card: 'border-4 border-black p-4 hover:bg-[#bef264] cursor-pointer transition-all mb-3 shadow-[4px_4px_0_0_black]', accent: 'text-black' };
            case 'IMPACT': return { container: 'bg-white border-4 border-black p-6 text-black font-sans shadow-[8px_8px_0_0_black]', button: 'bg-[#22c55e] text-white border-2 border-black font-black uppercase px-6 py-3 hover:translate-y-1 transition-transform shadow-[4px_4px_0_0_black]', input: 'bg-gray-100 border-2 border-black p-3 font-bold focus:bg-yellow-100 outline-none', card: 'border-2 border-black p-4 hover:bg-yellow-100 cursor-pointer transition-all shadow-[4px_4px_0_0_gray] mb-3', accent: 'text-black' };
            default: return { container: 'bg-white border border-gray-200 p-6 text-gray-800 font-sans rounded-2xl shadow-xl', button: 'bg-black text-white rounded-lg px-6 py-3 font-medium hover:opacity-80 transition-opacity', input: 'bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-black/5 focus:border-black outline-none', card: 'bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md cursor-pointer transition-all mb-3 hover:border-black', accent: 'text-black' };
        }
    };

    const s = getThemeClasses();

    const handleNext = async () => {
        if (step === 'DATE' && selectedDate && selectedTime) {
            firePixel('AddToCart', `Date: ${selectedDate} ${selectedTime}`);
            setStep('DETAILS');
        }
        else if (step === 'DETAILS' && clientInfo.name) {
            firePixel('InitiateCheckout', `Client: ${clientInfo.name}`);
            setStep('CONFIRM');
        }
        else if (step === 'CONFIRM') {
            if (onSubmit && selectedPackage) {
                setIsSubmitting(true);
                firePixel('Purchase', `Package: ${selectedPackage.name}`);
                try {
                    await (onSubmit as any)({
                        clientName: clientInfo.name,
                        clientEmail: clientInfo.email,
                        clientPhone: clientInfo.phone,
                        date: selectedDate,
                        time: selectedTime,
                        packageId: selectedPackage.id
                    });
                    setStep('PACKAGE');
                    setSelectedPackage(null);
                    setClientInfo({ name: '', email: '', phone: '' });
                    setSelectedDate('');
                    setSelectedTime('');
                } catch (error) {
                    alert("Submission failed.");
                } finally {
                    setIsSubmitting(false);
                }
            }
        }
    };

    const handleBack = () => {
        if (step === 'DATE') setStep('PACKAGE');
        else if (step === 'DETAILS') setStep('DATE');
        else if (step === 'CONFIRM') setStep('DETAILS');
    };

    return (
        <div className={`w-full max-w-md mx-auto my-8 ${s.container} relative`}>
            {/* Steps Visual */}
            <div className="flex justify-between items-center mb-6 px-2">
                {['Service', 'Date', 'Info', 'Done'].map((label, i) => {
                    const steps = ['PACKAGE', 'DATE', 'DETAILS', 'CONFIRM'];
                    const idx = steps.indexOf(step);
                    const active = idx >= i;
                    return (
                        <div key={label} className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mb-1 transition-colors ${active ? 'bg-current scale-125' : 'bg-gray-300'}`}></div>
                            <span className={`text-[10px] uppercase font-bold ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {step === 'PACKAGE' && (
                    <Motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-lg font-bold mb-4 uppercase tracking-wider ${s.accent}`}>Choose Experience</h3>
                        <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
                            {packages.filter(p => p.active).map(pkg => (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => handleSelectPackage(pkg)}
                                    className={`${s.card}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-lg">{pkg.name}</span>
                                            <p className="text-xs opacity-60 mt-1">{pkg.duration} Hours • {pkg.features[0]}</p>
                                        </div>
                                        <span className="font-bold text-lg">{(pkg.price/1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Motion.div>
                )}

                {step === 'DATE' && (
                    <Motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-lg font-bold mb-4 uppercase tracking-wider ${s.accent}`}>Select Date</h3>
                        <div className="space-y-4">
                            <input 
                                type="date" 
                                className={`w-full ${s.input}`}
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            
                            {selectedDate && (
                                <div className="grid grid-cols-2 gap-2 mt-4 animate-in slide-in-from-top-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {availableTimeSlots.map(slot => (
                                        <button 
                                            key={slot.time}
                                            onClick={() => slot.available && setSelectedTime(slot.time)}
                                            disabled={!slot.available}
                                            className={`py-3 text-sm font-bold border rounded transition-all ${
                                                selectedTime === slot.time 
                                                ? 'bg-black text-white border-black' 
                                                : slot.available 
                                                    ? 'border-gray-300 hover:border-black text-gray-700' 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent line-through'
                                            }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={handleNext} disabled={!selectedDate || !selectedTime} className={`${s.button} w-full disabled:opacity-50`}>Next Step</button>
                        </div>
                    </Motion.div>
                )}

                {/* DETAILS and CONFIRM steps remain essentially the same */}
                {step === 'DETAILS' && (
                    <Motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-lg font-bold mb-4 uppercase tracking-wider ${s.accent}`}>Contact Info</h3>
                        <div className="space-y-3">
                            <input placeholder="Your Name" className={`w-full ${s.input}`} value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                            <input placeholder="Phone / WhatsApp" className={`w-full ${s.input}`} value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} />
                            <input placeholder="Email" className={`w-full ${s.input}`} value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} />
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={handleNext} disabled={!clientInfo.name} className={`${s.button} w-full disabled:opacity-50`}>Review Booking</button>
                        </div>
                    </Motion.div>
                )}

                {step === 'CONFIRM' && (
                    <Motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <h3 className={`text-lg font-bold mb-4 uppercase tracking-wider ${s.accent}`}>Summary</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Service</span>
                                <span className="font-bold">{selectedPackage?.name}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Date & Time</span>
                                <span className="font-bold">{selectedDate} @ {selectedTime}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-500">Client</span>
                                <span className="font-bold">{clientInfo.name}</span>
                            </div>
                            <div className="flex justify-between text-lg pt-1">
                                <span className="font-bold">Total</span>
                                <span className="font-bold">Rp {selectedPackage?.price.toLocaleString()}</span>
                            </div>
                        </div>
                        <button onClick={handleNext} disabled={isSubmitting} className={`${s.button} w-full flex justify-center items-center gap-2`}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
                        </button>
                    </Motion.div>
                )}
            </AnimatePresence>

            {step !== 'PACKAGE' && (
                <button onClick={handleBack} className="absolute top-4 right-4 text-xs font-bold opacity-50 hover:opacity-100 flex items-center gap-1">
                    <ArrowLeft size={12}/> Back
                </button>
            )}
        </div>
    );
};

export default BookingWidget;
