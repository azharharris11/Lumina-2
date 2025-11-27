
// ... existing imports ...
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, ProjectStatus, User, StudioConfig, Package, BookingTask } from '../types';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, GripVertical, CheckSquare, List, Columns, ArrowRightLeft, Plus } from 'lucide-react';
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
  const [viewFormat, setViewFormat] = useState<'BOARD' | 'LIST'>(window.innerWidth < 768 ? 'LIST' : 'BOARD');
  
  // Mobile Move State
  const [movingBooking, setMovingBooking] = useState<Booking | null>(null);

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
        const userMatch = (b.photographerId === currentUser?.id) || (b.editorId === currentUser?.id);
        return statusMatch && userMatch;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // --- AUTOMATION LOGIC ---
  const applyWorkflowAutomation = (booking: Booking, newStatus: ProjectStatus): Booking => {
      let updatedBooking = { ...booking, status: newStatus };
      
      // Find automation rule for this status
      const automation = config.workflowAutomations?.find(a => 
          a.triggerStatus === newStatus && 
          (!a.triggerPackageId || a.triggerPackageId === booking.packageId)
      );

      if (automation && automation.tasks.length > 0) {
          const newTasks: BookingTask[] = automation.tasks.map(t => ({
              id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: t,
              completed: false
          }));
          
          // Append new tasks to existing ones
          updatedBooking.tasks = [...(updatedBooking.tasks || []), ...newTasks];
          
          // Optional: Assign User
          if (automation.assignToUserId) {
              // If moving to editing/culling, assign editor. If shooting, assign photographer.
              if (['CULLING', 'EDITING'].includes(newStatus)) {
                  updatedBooking.editorId = automation.assignToUserId;
              }
          }
      }
      return updatedBooking;
  };

  const handleDragStart = (e: React.DragEvent, bookingId: string) => { setDraggedBookingId(bookingId); e.dataTransfer.setData('bookingId', bookingId); };
  const handleDragOver = (e: React.DragEvent, status: ProjectStatus) => { e.preventDefault(); setActiveDropColumn(status); };
  
  const handleDrop = (e: React.DragEvent, status: ProjectStatus) => {
      e.preventDefault();
      const bookingId = e.dataTransfer.getData('bookingId');
      const booking = bookings.find(b => b.id === bookingId);
      
      if (booking && booking.status !== status && onUpdateBooking) { 
          const updatedBooking = applyWorkflowAutomation(booking, status);
          onUpdateBooking(updatedBooking); 
      }
      setActiveDropColumn(null); setDraggedBookingId(null);
  };

  const handleMobileMove = (newStatus: ProjectStatus) => {
      if (movingBooking && onUpdateBooking) {
          const updatedBooking = applyWorkflowAutomation(movingBooking, newStatus);
          onUpdateBooking(updatedBooking);
          setMovingBooking(null);
      }
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
    <div className="h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Production Board</h1>
          <p className="text-lumina-muted">Track post-production workflow.</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-lumina-surface border border-lumina-highlight rounded-lg p-1 flex">
                <button onClick={() => setViewFormat('BOARD')} className={`p-2 rounded ${viewFormat === 'BOARD' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted'}`}><Columns size={18}/></button>
                <button onClick={() => setViewFormat('LIST')} className={`p-2 rounded ${viewFormat === 'LIST' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted'}`}><List size={18}/></button>
            </div>

            <div className="bg-lumina-surface border border-lumina-highlight rounded-lg p-1 flex">
                <button 
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 md:px-4 py-2 text-xs font-bold rounded transition-colors ${filterMode === 'ALL' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
                >
                    All Jobs
                </button>
                <button 
                    onClick={() => setFilterMode('MINE')}
                    className={`px-3 md:px-4 py-2 text-xs font-bold rounded transition-colors ${filterMode === 'MINE' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}
                >
                    My Tasks
                </button>
            </div>
        </div>
      </div>

      {viewFormat === 'BOARD' ? (
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
                        <div className={`p-4 border-b border-lumina-highlight flex justify-between items-center sticky top-0 bg-lumina-surface/95 backdrop-blur-md z-10 rounded-t-2xl`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-${col.color}-500`}></div>
                                <h3 className="font-bold text-white text-sm">{col.label}</h3>
                            </div>
                            <span className="text-xs font-mono font-sans text-lumina-muted bg-lumina-base px-2 py-0.5 rounded">{columnBookings.length}</span>
                        </div>
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
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold text-lumina-muted uppercase tracking-wider truncate max-w-[100px]">{booking.package}</span>
                                        {booking.photographerId === currentUser?.id && <div className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-bold">YOU</div>}
                                    </div>
                                    <h4 className="font-bold text-white text-base mb-1 truncate">{booking.clientName}</h4>
                                    
                                    {/* Task Progress Preview */}
                                    {(booking.tasks || []).length > 0 && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex-1 h-1 bg-lumina-surface rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-lumina-accent" 
                                                    style={{width: `${(booking.tasks!.filter(t=>t.completed).length / booking.tasks!.length) * 100}%`}}
                                                ></div>
                                            </div>
                                            <span className="text-[9px] text-lumina-muted">{booking.tasks!.filter(t=>t.completed).length}/{booking.tasks!.length}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-lumina-muted mb-3 font-sans">
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
      ) : (
          /* List View (Mobile Friendly) */
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {columns.map(col => {
                  const items = getColumnBookings(col.id);
                  if (items.length === 0) return null;
                  return (
                      <div key={col.id} className="space-y-2">
                          <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-wider px-2 flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${col.color}-500`}></div>
                              {col.label} ({items.length})
                          </h3>
                          {items.map(booking => (
                              <div 
                                key={booking.id} 
                                className="bg-lumina-surface border border-lumina-highlight p-4 rounded-xl flex items-center justify-between active:bg-lumina-highlight/30 transition-colors"
                              >
                                  <div onClick={() => onSelectBooking(booking.id)} className="flex-1">
                                      <h4 className="font-bold text-white text-sm">{booking.clientName}</h4>
                                      <p className="text-xs text-lumina-muted">{booking.package} • {new Date(booking.date).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      {/* Mobile Move Button */}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setMovingBooking(booking); }}
                                        className="p-2 bg-lumina-base border border-lumina-highlight rounded-lg text-lumina-muted hover:text-white"
                                      >
                                          <ArrowRightLeft size={16} />
                                      </button>
                                      <ChevronRight size={16} className="text-lumina-muted"/>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )
              })}
          </div>
      )}

      {/* Mobile Move Modal */}
      <AnimatePresence>
          {movingBooking && (
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMovingBooking(null)}></div>
                  <Motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    className="bg-lumina-surface border border-lumina-highlight w-full max-w-sm rounded-2xl p-6 relative z-10"
                  >
                      <h3 className="font-bold text-white mb-4">Move {movingBooking.clientName} to...</h3>
                      <div className="space-y-2">
                          {columns.map(col => (
                              <button
                                key={col.id}
                                onClick={() => handleMobileMove(col.id)}
                                className={`w-full p-3 rounded-xl text-left font-bold text-sm flex items-center justify-between border ${movingBooking.status === col.id ? 'bg-lumina-accent/10 border-lumina-accent text-lumina-accent' : 'bg-lumina-base border-lumina-highlight text-lumina-muted'}`}
                              >
                                  <span>{col.label}</span>
                                  {movingBooking.status === col.id && <CheckCircle2 size={16} />}
                              </button>
                          ))}
                      </div>
                      <button onClick={() => setMovingBooking(null)} className="w-full mt-4 py-3 text-lumina-muted font-bold">Cancel</button>
                  </Motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default ProductionView;
