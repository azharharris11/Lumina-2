
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

const Motion = motion as any;

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20 }}
                        layout
                        className="pointer-events-auto bg-lumina-surface border border-lumina-highlight shadow-2xl rounded-xl p-4 flex items-center gap-3 min-w-[300px] max-w-sm backdrop-blur-md"
                    >
                        <div className={`p-2 rounded-full shrink-0 
                            ${toast.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 
                              toast.type === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}
                        >
                            {toast.type === 'SUCCESS' && <CheckCircle size={18} />}
                            {toast.type === 'ERROR' && <AlertCircle size={18} />}
                            {toast.type === 'INFO' && <Info size={18} />}
                        </div>
                        <p className="text-sm font-bold text-white flex-1">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="text-lumina-muted hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </Motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
