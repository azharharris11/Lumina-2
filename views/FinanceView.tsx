
// ... existing imports ...
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowRightLeft, Wallet, FileText, AlertCircle, CheckCircle, ArrowUpRight, MessageCircle, FileInput, MinusCircle, CheckSquare, Search, Filter, Download, RotateCcw, Trash2, History, Upload, Repeat, Paperclip, ArrowDownLeft, Calendar, Edit2, Plus, X, Save, Percent, Target } from 'lucide-react';
import { FinanceViewProps, Account } from '../types';
import { STUDIO_CONFIG } from '../data';
import InvoiceModal from '../components/InvoiceModal';
import WhatsAppModal from '../components/WhatsAppModal';

const Motion = motion as any;

const FinanceView: React.FC<FinanceViewProps> = ({ accounts, metrics, bookings, users, transactions = [], onTransfer, onRecordExpense, onSettleBooking, onDeleteTransaction, config, onAddAccount, onUpdateAccount, showToast }) => {
  // ... state ...
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES' | 'EXPENSES' | 'LEDGER' | 'TAX'>('OVERVIEW');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountForm, setAccountForm] = useState<Partial<Account>>({ name: '', type: 'BANK', balance: 0, accountNumber: '' });
  const [invoiceFilter, setInvoiceFilter] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [transferForm, setTransferForm] = useState({ fromId: accounts[1]?.id || '', toId: accounts[0]?.id || '', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: config.expenseCategories[0] || 'Other', accountId: accounts[0]?.id || '', isRecurring: false, receiptUrl: '' });
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<any | null>(null);
  const [selectedBookingForWA, setSelectedBookingForWA] = useState<any | null>(null);
  const [settleForm, setSettleForm] = useState<{ bookingId: string | null, amount: number, maxAmount: number, currentPaidAmount: number, accountId: string, mode: 'PAYMENT' | 'REFUND' }>({ bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: accounts[0]?.id || '', mode: 'PAYMENT' });
  const [taxMode, setTaxMode] = useState<'UMKM' | 'NORMAL'>('UMKM'); 

  // --- GOAL LOGIC ---
  const monthlyGoal = 100000000;
  const currentMonthRevenue = useMemo(() => {
      const now = new Date();
      return transactions.filter(t => 
          t.type === 'INCOME' && 
          new Date(t.date).getMonth() === now.getMonth() &&
          new Date(t.date).getFullYear() === now.getFullYear()
      ).reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);
  const goalProgress = Math.min((currentMonthRevenue / monthlyGoal) * 100, 100);

  // --- SAFE MATH HELPER ---
  const getBookingFinancials = (b: any) => {
      const applicableTaxRate = b.taxSnapshot !== undefined ? b.taxSnapshot : (config.taxRate || 0);
      let subtotal = b.price;
      if (b.items && b.items.length > 0) {
          subtotal = b.items.reduce((acc: number, item: any) => acc + item.total, 0);
      }
      
      let discountAmount = 0;
      if (b.discount) {
          discountAmount = b.discount.type === 'PERCENT' ? subtotal * (b.discount.value / 100) : b.discount.value;
      }
      
      // Use Math.round to handle float issues with cents/decimals in JS
      const afterDiscount = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(afterDiscount * (applicableTaxRate / 100));
      const grandTotal = afterDiscount + taxAmount;
      const dueAmount = grandTotal - b.paidAmount;
      
      return { grandTotal, dueAmount };
  };

  const unpaidBookings = bookings.filter(b => {
      const { dueAmount } = getBookingFinancials(b);
      return dueAmount > 100 && b.status !== 'CANCELLED' && b.status !== 'REFUNDED'; 
  });

  const paidBookings = bookings.filter(b => {
      const { dueAmount } = getBookingFinancials(b);
      return dueAmount <= 100 && b.status !== 'CANCELLED' && b.status !== 'REFUNDED';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayBookings = invoiceFilter === 'UNPAID' ? unpaidBookings : paidBookings;

  const cashFlowData = useMemo(() => {
      const dataMap = new Map<string, { date: string, income: number, expense: number }>();
      transactions.forEach(t => {
          const dateKey = new Date(t.date).toLocaleDateString('en-CA'); 
          const entry = dataMap.get(dateKey) || { date: dateKey, income: 0, expense: 0 };
          if (t.type === 'INCOME') entry.income += t.amount;
          if (t.type === 'EXPENSE') entry.expense += t.amount;
          dataMap.set(dateKey, entry);
      });
      const result = Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      return result.slice(-14);
  }, [transactions]);

  // ... (Other standard handlers like handleTransferSubmit remain same) ...
  const handleTransferSubmit = () => { if (onTransfer && transferForm.amount) { onTransfer(transferForm.fromId, transferForm.toId, Number(transferForm.amount)); setShowTransferModal(false); setTransferForm(prev => ({...prev, amount: ''})); } };
  const handleExpenseSubmit = () => { if (onRecordExpense && expenseForm.amount && expenseForm.description) { onRecordExpense({ description: expenseForm.description, amount: Number(expenseForm.amount), category: expenseForm.category, accountId: expenseForm.accountId, isRecurring: expenseForm.isRecurring, receiptUrl: expenseForm.receiptUrl }); setShowExpenseModal(false); setExpenseForm({ description: '', amount: '', category: config.expenseCategories[0] || 'Other', accountId: accounts[0]?.id || '', isRecurring: false, receiptUrl: '' }); } };
  const handleSettleSubmit = () => { if (onSettleBooking && settleForm.bookingId) { if (settleForm.mode === 'PAYMENT') { if (settleForm.amount <= 0) { alert("Please enter a valid positive amount."); return; } if (settleForm.amount > settleForm.maxAmount) { alert("Amount exceeds remaining balance!"); return; } onSettleBooking(settleForm.bookingId, settleForm.amount, settleForm.accountId); } else { if (settleForm.amount <= 0) { alert("Please enter a valid positive amount to refund."); return; } if (settleForm.amount > settleForm.currentPaidAmount) { alert("Refund exceeds total paid amount."); return; } const sourceAccount = accounts.find(a => a.id === settleForm.accountId); if (sourceAccount && sourceAccount.balance < settleForm.amount) { alert(`Insufficient funds in ${sourceAccount.name}.`); return; } onSettleBooking(settleForm.bookingId, -settleForm.amount, settleForm.accountId); } setSettleForm({ bookingId: null, amount: 0, maxAmount: 0, currentPaidAmount: 0, accountId: accounts[0]?.id || '', mode: 'PAYMENT' }); } };
  const isOverdue = (dateStr: string) => { const due = new Date(dateStr); due.setDate(due.getDate() + (config.paymentDueDays || 0)); return new Date() > due; };
  const handleEditAccount = (acc: Account) => { setEditingAccount(acc); setAccountForm({ ...acc }); setShowAccountModal(true); };
  const handleOpenAddAccount = () => { setEditingAccount(null); setAccountForm({ name: '', type: 'BANK', balance: 0, accountNumber: '' }); setShowAccountModal(true); };
  const handleAccountSubmit = () => { if (editingAccount && onUpdateAccount) { onUpdateAccount({ ...editingAccount, ...accountForm } as Account); } else if (onAddAccount && accountForm.name) { onAddAccount({ id: `acc-${Date.now()}`, name: accountForm.name!, type: accountForm.type as any, balance: Number(accountForm.balance), accountNumber: accountForm.accountNumber } as Account); } setShowAccountModal(false); };

  // ... (Tax Logic omitted for brevity, same as previous) ...

  return (
    <div className="space-y-4 lg:space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end shrink-0 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-1 lg:mb-2">Financial Hub</h1>
          <p className="text-lumina-muted text-sm">Master your studio's cash flow.</p>
        </div>
        <div className="grid grid-cols-2 lg:flex w-full lg:w-auto gap-3">
          <button onClick={() => setShowExpenseModal(true)} className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center text-sm"><MinusCircle className="w-4 h-4 mr-2" /> Expense</button>
          <button onClick={() => setShowTransferModal(!showTransferModal)} className="bg-lumina-surface border border-lumina-highlight text-white hover:bg-lumina-highlight px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center text-sm"><ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-lumina-base pt-2 pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-lumina-highlight shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-1 min-w-max pr-4">
            {[{ id: 'OVERVIEW', label: 'Overview', icon: Wallet }, { id: 'INVOICES', label: 'Invoices', icon: FileText, count: unpaidBookings.length }, { id: 'EXPENSES', label: 'Analysis', icon: PieChart }, { id: 'LEDGER', label: 'Ledger', icon: ArrowRightLeft }, { id: 'TAX', label: 'Tax / SPT', icon: Percent }].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 lg:px-6 py-3 lg:py-2 font-bold text-sm transition-colors relative flex items-center whitespace-nowrap rounded-lg ${activeTab === tab.id ? 'bg-lumina-surface text-white' : 'text-lumina-muted hover:text-white hover:bg-lumina-highlight/30'}`}>
                    <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-lumina-accent' : ''}`} />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && <span className="ml-2 px-1.5 py-0.5 bg-lumina-danger text-white text-[10px] rounded-full">{tab.count}</span>}
                </button>
            ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'OVERVIEW' && (
            <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Goal Bar */}
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-4 lg:p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="shrink-0 p-3 bg-lumina-accent/10 rounded-full"><Target className="w-8 h-8 text-lumina-accent" /></div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <div><h3 className="text-white font-bold text-sm uppercase tracking-wider">Monthly Goal</h3><p className="text-xs text-lumina-muted">Target: Rp {monthlyGoal.toLocaleString()}</p></div>
                            <span className="text-2xl font-display font-bold text-white">{goalProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-3 bg-lumina-base rounded-full overflow-hidden border border-lumina-highlight"><motion.div initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"/></div>
                        <div className="flex justify-between mt-1 text-[10px] text-lumina-muted font-mono"><span>Rp {currentMonthRevenue.toLocaleString()}</span><span>Remaining: Rp {(Math.max(0, monthlyGoal - currentMonthRevenue)).toLocaleString()}</span></div>
                    </div>
                </div>
                {/* Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((acc) => (
                        <Motion.div key={acc.id} whileHover={{ y: -2 }} className="p-5 rounded-2xl border bg-lumina-surface border-lumina-highlight relative overflow-hidden group transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded border uppercase ${acc.type === 'CASH' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>{(acc.type || 'BANK').replace('_', ' ')}</span>
                                <div className="flex gap-2"><button onClick={() => handleEditAccount(acc)} className="p-1 hover:bg-lumina-highlight rounded text-lumina-muted hover:text-white transition-colors" title="Edit Account"><Edit2 size={14} /></button></div>
                            </div>
                            <h3 className="text-lumina-muted text-sm">{acc.name}</h3>
                            <p className="text-2xl font-display font-bold text-white mt-1">Rp {acc.balance.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-lumina-muted mt-1 font-mono font-sans">{acc.accountNumber}</p>
                        </Motion.div>
                    ))}
                    <button onClick={handleOpenAddAccount} className="p-5 rounded-2xl border border-dashed border-lumina-highlight hover:border-lumina-accent hover:bg-lumina-highlight/10 flex flex-col items-center justify-center transition-all group min-h-[160px]">
                        <div className="w-12 h-12 rounded-full bg-lumina-highlight/50 flex items-center justify-center mb-3 group-hover:bg-lumina-accent group-hover:text-lumina-base transition-colors"><Plus size={24} className="text-lumina-muted group-hover:text-lumina-base" /></div>
                        <span className="text-sm font-bold text-lumina-muted group-hover:text-white">Add New Account</span>
                    </button>
                </div>
                {/* Chart */}
                <div className="bg-lumina-surface border border-lumina-highlight rounded-2xl p-4 lg:p-6"><h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><History size={18} className="text-lumina-accent"/> Cash Flow (14 Days)</h3><div className="h-48 lg:h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={cashFlowData}><defs><linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} /><XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(str) => new Date(str).getDate().toString()} /><YAxis stroke="#666" fontSize={12} tickFormatter={(val) => `${val/1000000}m`} /><Tooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #333', color: '#fff' }} /><Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} /><Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
            </Motion.div>
        )}

        {/* ... INVOICES Tab ... */}
        {activeTab === 'INVOICES' && (
            <Motion.div key="invoices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-lumina-surface border border-lumina-highlight p-4 rounded-xl gap-4">
                    <div className="flex bg-lumina-base p-1 rounded-lg border border-lumina-highlight w-full md:w-auto">
                        <button onClick={() => setInvoiceFilter('UNPAID')} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${invoiceFilter === 'UNPAID' ? 'bg-lumina-highlight text-white' : 'text-lumina-muted hover:text-white'}`}><AlertCircle size={14} /> Outstanding</button>
                        <button onClick={() => setInvoiceFilter('PAID')} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${invoiceFilter === 'PAID' ? 'bg-lumina-highlight text-emerald-400' : 'text-lumina-muted hover:text-white'}`}><History size={14} /> Paid History</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayBookings.map((booking) => {
                        const { grandTotal, dueAmount } = getBookingFinancials(booking);
                        const percentagePaid = grandTotal > 0 ? (booking.paidAmount / grandTotal) * 100 : 100;
                        const isFullyPaid = dueAmount <= 100;
                        return (
                            <div key={booking.id} className={`bg-lumina-surface border rounded-2xl p-6 relative overflow-hidden group transition-all ${isFullyPaid ? 'border-emerald-500/20' : isOverdue(booking.date) ? 'border-rose-500/30 shadow-rose-500/5' : 'border-lumina-highlight hover:border-lumina-accent/50'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div><h3 className="font-bold text-white text-lg">{booking.clientName}</h3><p className="text-xs text-lumina-muted">{booking.package} • {new Date(booking.date).toLocaleDateString()}</p></div>
                                    {!isFullyPaid && <button onClick={() => setSettleForm({ bookingId: booking.id, amount: dueAmount, maxAmount: dueAmount, currentPaidAmount: booking.paidAmount, accountId: accounts[0]?.id || '', mode: 'PAYMENT' })} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20 transition-colors" title="Quick Settle"><CheckSquare size={16} /></button>}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-lumina-muted mb-1"><span className={isFullyPaid ? "text-emerald-500 font-bold" : ""}>{isFullyPaid ? 'Paid in Full' : `Paid: ${percentagePaid.toFixed(0)}%`}</span><span>Total: Rp {grandTotal.toLocaleString('id-ID')}</span></div>
                                        <div className="w-full h-2 bg-lumina-base border border-lumina-highlight rounded-full overflow-hidden"><div className={`h-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percentagePaid}%` }}></div></div>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-t border-lumina-highlight/30"><span className="text-sm text-lumina-muted">Balance Due</span><span className={`text-xl font-mono font-bold font-sans ${isFullyPaid ? 'text-emerald-500' : 'text-rose-400'}`}>Rp {dueAmount.toLocaleString('id-ID')}</span></div>
                                    <div className="flex gap-2">
                                        <div className="flex gap-2 flex-1"><button onClick={() => setSelectedBookingForInvoice(booking)} className="flex-1 py-2 bg-lumina-base hover:bg-lumina-highlight text-white text-xs font-bold rounded-lg border border-lumina-highlight flex items-center justify-center gap-1"><FileInput size={14}/> Invoice</button><button onClick={() => setSelectedBookingForWA(booking)} className="py-2 px-3 bg-lumina-highlight hover:bg-emerald-500/20 hover:text-emerald-400 text-white text-xs font-bold rounded-lg border border-lumina-highlight transition-colors"><MessageCircle size={14} /></button></div>
                                        {isFullyPaid && <button onClick={() => setSettleForm({ bookingId: booking.id, amount: 0, maxAmount: 0, currentPaidAmount: booking.paidAmount, accountId: accounts[0]?.id || '', mode: 'REFUND' })} className="py-2 px-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 text-xs font-bold">Refund</button>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Motion.div>
        )}

        {/* LEDGER - Enforce Card View on Mobile */}
        {activeTab === 'LEDGER' && (
            <Motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-lumina-surface border border-lumina-highlight rounded-2xl overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-lumina-base text-lumina-muted uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4 font-sans">Date</th>
                                <th className="p-4 font-sans">Description</th>
                                <th className="p-4 font-sans">Category</th>
                                <th className="p-4 font-sans">Account</th>
                                <th className="p-4 text-right font-sans">Amount</th>
                                <th className="p-4 text-center font-sans">Receipt</th>
                                <th className="p-4 font-sans"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-lumina-highlight/50">
                            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                <tr key={t.id} className="hover:bg-lumina-highlight/10 transition-colors group">
                                    <td className="p-4 font-mono text-xs text-lumina-muted font-sans">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-white font-sans">{t.description}</td>
                                    <td className="p-4 font-sans"><span className="px-2 py-1 rounded bg-lumina-highlight text-xs text-lumina-muted">{t.category}</span></td>
                                    <td className="p-4 text-xs text-lumina-muted font-sans">{accounts.find(a => a.id === t.accountId)?.name}</td>
                                    <td className={`p-4 text-right font-mono font-bold font-sans ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type === 'INCOME' ? '+' : '-'} Rp {t.amount.toLocaleString()}</td>
                                    <td className="p-4 text-center">{t.receiptUrl ? <a href={t.receiptUrl} target="_blank" className="text-blue-400 hover:underline text-xs flex items-center justify-center gap-1"><Paperclip size={12}/> View</a> : <span className="text-lumina-muted/30">-</span>}</td>
                                    <td className="p-4 text-right"><button onClick={() => onDeleteTransaction && onDeleteTransaction(t.id)} className="text-lumina-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View (Strictly visible on sm/hidden on md) */}
                <div className="md:hidden p-4 space-y-4">
                    {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                        <div key={t.id} className="p-4 bg-lumina-base rounded-xl border border-lumina-highlight flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white font-bold text-sm font-sans">{t.description}</p>
                                    <p className="text-xs text-lumina-muted font-mono font-sans">{new Date(t.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`font-mono font-bold font-sans ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'} {(t.amount/1000).toFixed(0)}k
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="bg-lumina-highlight px-2 py-1 rounded text-lumina-muted">{t.category}</span>
                                {onDeleteTransaction && (
                                    <button onClick={() => onDeleteTransaction(t.id)} className="text-lumina-muted hover:text-rose-500"><Trash2 size={14}/></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Motion.div>
        )}
      </AnimatePresence>
      
      {/* ... (Modals remain same) ... */}
      <InvoiceModal isOpen={!!selectedBookingForInvoice} onClose={() => setSelectedBookingForInvoice(null)} booking={selectedBookingForInvoice} config={config} />
      <WhatsAppModal isOpen={!!selectedBookingForWA} onClose={() => setSelectedBookingForWA(null)} booking={selectedBookingForWA} config={config} />
    </div>
  );
};

export default FinanceView;
