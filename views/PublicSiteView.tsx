
import React, { useState } from 'react';
import { SiteConfig, Package, User, StudioConfig, PublicBookingSubmission, Booking } from '../types';
import NoirTheme from '../components/site-builder/themes/NoirTheme';
import EtherealTheme from '../components/site-builder/themes/EtherealTheme';
import VogueTheme from '../components/site-builder/themes/VogueTheme';
import MinimalTheme from '../components/site-builder/themes/MinimalTheme';
import CinemaTheme from '../components/site-builder/themes/CinemaTheme';
import RetroTheme from '../components/site-builder/themes/RetroTheme';
import AtelierTheme from '../components/site-builder/themes/AtelierTheme';
import HorizonTheme from '../components/site-builder/themes/HorizonTheme';
import BoldTheme from '../components/site-builder/themes/BoldTheme';
import ImpactTheme from '../components/site-builder/themes/ImpactTheme';
import CleanSlateTheme from '../components/site-builder/themes/CleanSlateTheme';
import AuthorityTheme from '../components/site-builder/themes/AuthorityTheme';
import { Loader2, AlertCircle, ArrowRight, CheckCircle2, Clock, Lock, Download, MessageCircle, HardDrive, Calendar } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

interface PublicSiteViewProps {
    config: StudioConfig | null;
    packages: Package[];
    users: User[];
    bookings: Booking[];
    portalBooking?: Booking | null; // Optional: If present, render Client Portal
    isLoading: boolean;
    error: string | null;
    onBooking: (data: PublicBookingSubmission) => void;
}

const PublicSiteView: React.FC<PublicSiteViewProps> = ({ config, packages, users, bookings, portalBooking, isLoading, error, onBooking }) => {
    const [portalMode, setPortalMode] = useState<'LOGIN' | 'DASHBOARD'>('LOGIN');
    const [phoneInput, setPhoneInput] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showInvoice, setShowInvoice] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-lumina-accent mb-4" />
                <p className="text-sm font-mono text-lumina-muted">Loading...</p>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="p-4 bg-rose-500/10 rounded-full mb-4 border border-rose-500/20">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Access Error</h1>
                <p className="text-lumina-muted max-w-md">{error || "The requested page could not be loaded."}</p>
            </div>
        );
    }

    // --- CLIENT PORTAL RENDERER ---
    if (portalBooking) {
        const handleLogin = (e: React.FormEvent) => {
            e.preventDefault();
            // Simple verification: Check last 4 digits of phone
            const clientPhone = portalBooking.clientPhone.replace(/\D/g, '');
            const inputClean = phoneInput.replace(/\D/g, '');
            
            if (clientPhone.endsWith(inputClean) && inputClean.length >= 4) {
                setPortalMode('DASHBOARD');
            } else {
                setLoginError("Verification failed. Please enter the last 4 digits of your phone number.");
            }
        };

        if (portalMode === 'LOGIN') {
            return (
                <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 font-sans">
                    <div className="w-full max-w-md bg-neutral-800 border border-neutral-700 rounded-2xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">{config.name}</h2>
                            <p className="text-neutral-400 text-sm">Client Portal Access</p>
                        </div>
                        <div className="bg-neutral-900 p-4 rounded-xl mb-6 border border-neutral-700 text-center">
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest mb-1">Project</p>
                            <p className="text-white font-bold text-lg">{portalBooking.package}</p>
                            <p className="text-neutral-400 text-sm">{new Date(portalBooking.date).toLocaleDateString()}</p>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Verify Identity</label>
                                <input 
                                    type="text" 
                                    placeholder="Last 4 digits of your phone number"
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white text-center tracking-widest focus:border-white outline-none transition-colors"
                                    maxLength={4}
                                    value={phoneInput}
                                    onChange={e => setPhoneInput(e.target.value)}
                                />
                            </div>
                            {loginError && <p className="text-rose-500 text-xs text-center">{loginError}</p>}
                            <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors">
                                Access Dashboard
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        // PORTAL DASHBOARD
        const steps = ['BOOKED', 'SHOOTING', 'EDITING', 'REVIEW', 'COMPLETED'];
        const currentStepIndex = steps.indexOf(portalBooking.status) !== -1 ? steps.indexOf(portalBooking.status) : 0;
        const balance = (portalBooking.price * (1 + config.taxRate/100)) - portalBooking.paidAmount;
        const isPaid = balance <= 100;

        return (
            <div className="min-h-screen bg-neutral-950 text-white font-sans pb-20">
                <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                        <span className="font-bold text-lg">{config.name}</span>
                        <div className="text-xs font-bold bg-neutral-800 px-3 py-1 rounded-full text-neutral-400">
                            Order #{portalBooking.id.substring(portalBooking.id.length-4).toUpperCase()}
                        </div>
                    </div>
                </nav>

                <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
                    {/* Welcome */}
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Hello, {portalBooking.clientName.split(' ')[0]}</h1>
                        <p className="text-neutral-400">Here is the latest status of your project.</p>
                    </div>

                    {/* Timeline */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 overflow-x-auto">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8">Project Timeline</h3>
                        <div className="flex items-center min-w-[600px]">
                            {steps.map((step, i) => (
                                <div key={step} className="flex-1 relative last:flex-none">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 z-10 relative
                                            ${i <= currentStepIndex ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}
                                        `}>
                                            {i < currentStepIndex ? <CheckCircle2 size={16}/> : i + 1}
                                        </div>
                                        <div className={`text-sm font-bold ${i <= currentStepIndex ? 'text-white' : 'text-neutral-600'}`}>{step}</div>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`absolute top-5 left-10 right-[-20px] h-0.5 ${i < currentStepIndex ? 'bg-white' : 'bg-neutral-800'}`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Financials */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6">Financial Overview</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-400">Total Amount</span>
                                        <span className="font-bold">Rp {(portalBooking.price * (1 + config.taxRate/100)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-400">Paid to Date</span>
                                        <span className="font-bold text-emerald-500">Rp {portalBooking.paidAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                                        <span className="font-bold">Balance Due</span>
                                        <span className={`text-xl font-mono font-bold ${isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            Rp {balance > 0 ? balance.toLocaleString() : '0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-neutral-800">
                                <button 
                                    onClick={() => setShowInvoice(true)}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Download Invoice
                                </button>
                            </div>
                        </div>

                        {/* Deliverables */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                            {!isPaid && (
                                <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                                    <Lock size={32} className="text-neutral-500 mb-4"/>
                                    <h3 className="font-bold text-white mb-1">Deliverables Locked</h3>
                                    <p className="text-sm text-neutral-400">Please settle the remaining balance to access your files.</p>
                                </div>
                            )}
                            <div>
                                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6">Deliverables</h3>
                                <div className="aspect-video bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                                    <HardDrive size={48} className="text-neutral-600"/>
                                </div>
                                <p className="text-sm text-neutral-400 mb-2">
                                    Your photos are stored securely on our cloud server.
                                </p>
                            </div>
                            <div className="mt-4">
                                {portalBooking.deliveryUrl ? (
                                    <a 
                                        href={portalBooking.deliveryUrl} 
                                        target="_blank"
                                        className="block w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-center"
                                    >
                                        Access Gallery
                                    </a>
                                ) : (
                                    <button disabled className="w-full py-3 bg-neutral-800 text-neutral-500 font-bold rounded-lg cursor-not-allowed">
                                        Not Ready Yet
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Need Help?</h3>
                            <p className="text-sm text-neutral-400">Contact the studio directly.</p>
                        </div>
                        <a 
                            href={`https://wa.me/${config.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full transition-colors"
                        >
                            <MessageCircle size={24} />
                        </a>
                    </div>
                </main>

                <InvoiceModal 
                    isOpen={showInvoice}
                    onClose={() => setShowInvoice(false)}
                    booking={portalBooking}
                    config={config}
                />
            </div>
        );
    }

    // --- PUBLIC SITE RENDERER (Original Logic) ---
    const site = config.site;
    const commonProps = {
        site,
        packages,
        users,
        config,
        bookings,
        onBooking,
        onNavigate: (pageId: string) => {
            const el = document.getElementById(pageId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Helper to decide which theme to render
    const renderTheme = () => {
        switch(site.theme) {
            case 'ETHEREAL': return <EtherealTheme {...commonProps} />;
            case 'VOGUE': return <VogueTheme {...commonProps} />;
            case 'MINIMAL': return <MinimalTheme {...commonProps} />;
            case 'CINEMA': return <CinemaTheme {...commonProps} />;
            case 'RETRO': return <RetroTheme {...commonProps} />;
            case 'ATELIER': return <AtelierTheme {...commonProps} />;
            case 'HORIZON': return <HorizonTheme {...commonProps} />;
            case 'BOLD': return <BoldTheme {...commonProps} />;
            case 'IMPACT': return <ImpactTheme {...commonProps} />;
            case 'CLEANSLATE': return <CleanSlateTheme {...commonProps} />;
            case 'AUTHORITY': return <AuthorityTheme {...commonProps} />;
            default: return <NoirTheme {...commonProps} />;
        }
    };

    return (
        <div className="w-full min-h-screen">
            {renderTheme()}
            {/* Lumina Badge */}
            <div className="fixed bottom-4 right-4 z-[100]">
                <a href="/" target="_blank" className="flex items-center gap-2 bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-black hover:border-lumina-accent transition-colors">
                    <div className="w-2 h-2 bg-lumina-accent rounded-full"></div>
                    Powered by Lumina
                </a>
            </div>
        </div>
    );
};

export default PublicSiteView;
