
// ... existing imports ...
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, StudioConfig, Package } from '../types';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, GripVertical, CheckSquare } from 'lucide-react';
import { PACKAGES } from '../data';

const Motion = motion as any;

interface ProductionViewProps {
  bookings: Booking[];
  onSelectBooking: (bookingId: string) => void; 
  currentUser?: User; 
  onUpdateBooking?: (booking: Booking) => void;
  config: StudioConfig; 
}

const ProductionView: React.FC<ProductionViewProps> = ({ bookings, onSelectBooking, currentUser, onUpdateBooking, config }) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE'>('ALL');
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<ProjectStatus | null>(null);

  const columns: { id: ProjectStatus; label: string; color: string }[] = [
    { id: 'SHOOTING', label: 'To Shoot', color: 'indigo' },
    { id: 'CULLING', label: 'Culling', color: 'purple' },
    { id: 'EDITING', label: 'Editing', color: 'pink' },
    { id: 'REVIEW', label: 'Review', color: 'amber' },
    { id: 'COMPLETED', label: 'Done', color: 'emerald' },
  ];

  const getColumnBookings = (status: ProjectStatus) => {
    return bookings.filter(b => {
        const statusMatch = b.status === status;
        if (filterMode === 'ALL') return statusMatch;
        // For 'MINE', check if user is photographer or editor
        const userMatch = (b.photographerId === currentUser?.id) || (b.editorId === currentUser?.id);
        return statusMatch && userMatch;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleDragStart = (e: React.DragEvent, bookingId: string) => {
      setDraggedBookingId(bookingId);
      e.dataTransfer.setData('bookingId', bookingId);
  };

  const handleDragOver = (e: React.DragEvent, status: ProjectStatus) => {
      e.preventDefault();
      setActiveDropColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: ProjectStatus) => {
      e.preventDefault();
      const bookingId = e.dataTransfer.getData('bookingId');
      const booking = bookings.find(b => b.id === bookingId);
      
      if (booking && booking.status !== status && onUpdateBooking) {
          onUpdateBooking({ ...booking, status });
      }
      setActiveDropColumn(null);
      setDraggedBookingId(null);
  };

  const getDeadlineColor = (date: string) => {
      const today = new Date();
      const deadline = new Date(date);
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'text-rose-500 bg-rose-500/10';
      if (diffDays <= 2) return 'text-amber-500 bg-amber-500/10';
      return 'text-emerald-500 bg-emerald-500/10';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Production Board</h1>
          <p className="text-lumina-muted">Track post-production workflow.</p>
        </div>
        <div className="bg-lumina-surface border border-lumina-highlight rounded-lg p-1 flex">
            <button 
                onClick={() => setFilterMode('ALL')}
                className={`px-4 py-2 text-xs font-bold rounded transition-colors ${filterMode === 'ALL' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
            >
                All Jobs
            </button>
            <button 
                onClick={() => setFilterMode('MINE')}
                className={`px-4 py-2 text-xs font-bold rounded transition-colors ${filterMode === 'MINE' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
            >
                My Tasks
            </button>
        </div>
      </div>

      {/* Kanban Board Container - Snap Scrolling for Mobile */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4 snap-x snap-mandatory">
        {columns.map((col) => {
            const columnBookings = getColumnBookings(col.id);
            
            return (
                <div 
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`min-w-[85vw] md:min-w-[320px] flex-1 flex flex-col bg-lumina-surface/50 border border-lumina-highlight rounded-2xl transition-colors snap-center
                        ${activeDropColumn === col.id ? 'bg-lumina-highlight/30 border-lumina-accent/50' : ''}
                    `}
                >
                    {/* Column Header */}
                    <div className={`p-4 border-b border-lumina-highlight flex justify-between items-center sticky top-0 bg-lumina-surface/95 backdrop-blur-md z-10 rounded-t-2xl`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${col.color}-500`}></div>
                            <h3 className="font-bold text-white text-sm">{col.label}</h3>
                        </div>
                        <span className="text-xs font-mono text-lumina-muted bg-lumina-base px-2 py-0.5 rounded">{columnBookings.length}</span>
                    </div>

                    {/* Scrollable Cards Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                        {columnBookings.map((booking) => (
                            <Motion.div
                                layout
                                key={booking.id}
                                draggable
                                onDragStart={(e: any) => handleDragStart(e, booking.id)}
                                onClick={() => onSelectBooking(booking.id)}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-lumina-base border border-lumina-highlight p-4 rounded-xl shadow-sm hover:border-lumina-accent/50 cursor-grab active:cursor-grabbing group relative overflow-hidden"
                            >
                                {/* Card Content */}
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-lumina-muted uppercase tracking-wider truncate max-w-[100px]">{booking.package}</span>
                                    {booking.photographerId === currentUser?.id && (
                                        <div className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-bold">YOU</div>
                                    )}
                                </div>
                                
                                <h4 className="font-bold text-white text-base mb-1 truncate">{booking.clientName}</h4>
                                
                                <div className="flex items-center gap-2 text-xs text-lumina-muted mb-3">
                                    <Clock size={12} />
                                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-lumina-highlight/50">
                                    <div className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${getDeadlineColor(booking.date)}`}>
                                        <AlertCircle size={10} /> Due Soon
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-lumina-surface border border-lumina-highlight flex items-center justify-center text-[10px] text-white font-bold">
                                        {booking.clientName.charAt(0)}
                                    </div>
                                </div>
                            </Motion.div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ProductionView;
