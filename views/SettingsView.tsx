
// ... imports
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, StudioConfig, SettingsViewProps, StudioRoom, Booking, User, WorkflowAutomation, ProjectStatus, Asset, PackageCostItem, SiteFont } from '../types';
import { Settings as SettingsIcon, Tag, Plus, Edit2, ToggleLeft, ToggleRight, Building, Save, X, Layout, MessageSquare, Trash2, Clock, DollarSign, AlertCircle, Sliders, Briefcase, Bell, Link, User as UserIcon, CheckCircle2, Calendar, Archive, CreditCard, Smartphone, Download, RefreshCcw, HardDrive, Check, Zap, ListChecks, Box, Image as ImageIcon, CreditCard as BankIcon, FileText, Users, Type } from 'lucide-react';

const Motion = motion as any;

interface ExtendedSettingsViewProps extends SettingsViewProps {
    bookings?: Booking[];
    googleToken?: string | null;
    setGoogleToken?: (token: string | null) => void;
    assets?: Asset[];
    users?: User[]; // Needed for assignment
}

declare var google: any;

const SettingsView: React.FC<ExtendedSettingsViewProps> = ({ packages, config, onAddPackage, onUpdatePackage, onDeletePackage, onUpdateConfig, bookings = [], currentUser, onUpdateUserProfile, onDeleteAccount, googleToken, setGoogleToken, assets = [], users = [] }) => {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [localConfig, setLocalConfig] = useState<StudioConfig>(config);
  
  const [profileForm, setProfileForm] = useState<Partial<User>>({ name: '', phone: '', avatar: '', specialization: '' });
  const [newAutomation, setNewAutomation] = useState<Partial<WorkflowAutomation>>({ triggerStatus: 'SHOOTING', tasks: [] });
  const [taskInput, setTaskInput] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<Package>>({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [], turnaroundDays: 7, defaultTasks: [], defaultAssetIds: [] });
  const [featureInput, setFeatureInput] = useState('');
  const [packageTaskInput, setPackageTaskInput] = useState('');
  const [newRoom, setNewRoom] = useState<Partial<StudioRoom>>({ name: '', type: 'INDOOR', color: 'gray' });
  
  // Dynamic Lists State
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newAssetCat, setNewAssetCat] = useState('');
  const [newClientCat, setNewClientCat] = useState('');

  // COGS State for Package Modal
  const [newCostItem, setNewCostItem] = useState<Partial<PackageCostItem>>({ description: '', amount: 0, category: 'OTHER' });

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { if (currentUser) { setProfileForm({ id: currentUser.id, name: currentUser.name, phone: currentUser.phone, avatar: currentUser.avatar, specialization: currentUser.specialization || '' }); } }, [currentUser]);

  // ... (Google Script & Connect functions remain same) ...
  const loadGoogleScript = () => { return new Promise((resolve) => { if (typeof google !== 'undefined' && google.accounts) { resolve(true); return; } const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = () => resolve(true); document.body.appendChild(script); }); };
  const handleConnectGoogle = async () => { if (googleToken) { if (window.confirm("Disconnect Google Account?")) { if(setGoogleToken) setGoogleToken(null); } return; } await loadGoogleScript(); const CLIENT_ID = '276331844787-lolqnoah70th2mm7jt2ftim37sjilu00.apps.googleusercontent.com'; const client = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive', callback: (tokenResponse: any) => { if (tokenResponse && tokenResponse.access_token) { if(setGoogleToken) setGoogleToken(tokenResponse.access_token); alert("Successfully connected!"); } }, }); client.requestAccessToken(); };

  // ... (Package Handlers remain same) ...
  const handleSavePackage = () => { const pkgData = { name: newPackage.name, price: Number(newPackage.price), duration: Number(newPackage.duration), features: newPackage.features || [], active: true, costBreakdown: newPackage.costBreakdown || [], turnaroundDays: Number(newPackage.turnaroundDays) || 7, defaultTasks: newPackage.defaultTasks || [], defaultAssetIds: newPackage.defaultAssetIds || [] }; if (isEditingPackage && onUpdatePackage && newPackage.id) { onUpdatePackage({ ...pkgData, id: newPackage.id } as Package); } else if(onAddPackage && newPackage.name) { onAddPackage({ ...pkgData, id: `p-${Date.now()}` } as Package); } setShowAddPackage(false); setIsEditingPackage(false); setNewPackage({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [], turnaroundDays: 7, defaultTasks: [], defaultAssetIds: [] }); setFeatureInput(''); setPackageTaskInput(''); };
  
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setLocalConfig(prev => ({ ...prev, [name]: value })); };
  const handleTemplateChange = (key: 'booking' | 'reminder' | 'thanks', value: string) => {
      setLocalConfig(prev => ({
          ...prev,
          templates: { ...prev.templates, [key]: value }
      }));
  };

  const handleSaveConfig = () => { if (onUpdateConfig) { onUpdateConfig(localConfig); } };
  const handleAddRoom = () => { if (newRoom.name) { const room: StudioRoom = { id: `r-${Date.now()}`, name: newRoom.name, type: newRoom.type as any, color: newRoom.color || 'gray' }; const updatedRooms = [...(localConfig.rooms || []), room]; const updatedConfig = { ...localConfig, rooms: updatedRooms }; setLocalConfig(updatedConfig); if (onUpdateConfig) onUpdateConfig(updatedConfig); setNewRoom({ name: '', type: 'INDOOR', color: 'gray' }); } };
  const handleDeleteRoom = (e: React.MouseEvent, id: string, name: string) => { e.stopPropagation(); e.preventDefault(); if (!window.confirm(`Delete studio room '${name}'?`)) return; try { const validBookings = bookings || []; const hasActiveBookings = validBookings.some(b => { if (!b || !b.studio) return false; return b.studio.toLowerCase() === name.toLowerCase() && b.status !== 'COMPLETED' && b.status !== 'CANCELLED'; }); if (hasActiveBookings) { alert(`Cannot delete '${name}' because there are active bookings scheduled in this room.`); return; } const updatedRooms = (localConfig.rooms || []).filter(r => r.id !== id); const updatedConfig = { ...localConfig, rooms: updatedRooms }; setLocalConfig(updatedConfig); if (onUpdateConfig) { onUpdateConfig(updatedConfig); } } catch (err: any) { console.error("Delete Room Error:", err); alert("Error checking bookings. See console."); } };
  const handleSaveProfile = () => { if (onUpdateUserProfile && profileForm.name && currentUser) { onUpdateUserProfile({ ...currentUser, ...profileForm } as User); alert("Profile updated"); } };
  
  // ... (Export Logic) ...
  const handleExportData = () => { 
      try { 
          // Robust serializer to prevent Circular Reference errors
          const serialize = (obj: any, depth = 0, seen = new WeakSet()): any => {
              if (depth > 10) return '[MAX_DEPTH]';
              if (obj === null || typeof obj !== 'object') return obj;
              
              if (seen.has(obj)) return '[CIRCULAR]';
              seen.add(obj);

              if (obj instanceof Date) return obj.toISOString();
              
              if (Array.isArray(obj)) {
                  return obj.map(item => serialize(item, depth + 1, seen));
              }

              const newObj: any = {};
              for (const key in obj) {
                  if (Object.prototype.hasOwnProperty.call(obj, key)) {
                      // Filter out Firebase/Internal keys that often cause issues
                      if (['firestore', 'app', 'auth', 'storage', '_key', '_delegate', 'src', 'container', 'ownerDocument'].includes(key)) continue;
                      if (key.startsWith('_')) continue;
                      
                      // Filter out DOM nodes
                      const val = obj[key];
                      if (val instanceof Node || (val && val.nodeType)) continue;
                      if (val && val.constructor && val.constructor.name && (val.constructor.name === 'Window' || val.constructor.name === 'HTMLDocument')) continue;

                      newObj[key] = serialize(val, depth + 1, seen);
                  }
              }
              return newObj;
          };

          const cleanData = serialize({ config: localConfig, packages, timestamp: new Date().toISOString() });
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanData, null, 2));
          const downloadAnchorNode = document.createElement('a'); 
          downloadAnchorNode.setAttribute("href", dataStr); 
          downloadAnchorNode.setAttribute("download", "lumina_backup.json"); 
          document.body.appendChild(downloadAnchorNode); 
          downloadAnchorNode.click(); 
          downloadAnchorNode.remove(); 
      } catch (e) { 
          console.error("Export Failed:", e); 
          alert("Failed to export data. Please try again."); 
      } 
  };
  
  // Automation Handlers
  const handleAddTaskToAutomation = () => { if(taskInput.trim()) { setNewAutomation(prev => ({ ...prev, tasks: [...(prev.tasks || []), taskInput.trim()] })); setTaskInput(''); } };
  const handleAddAutomation = () => { 
      if(newAutomation.triggerStatus) { 
          const automation: WorkflowAutomation = { 
              id: `wf-${Date.now()}`, 
              triggerStatus: newAutomation.triggerStatus, 
              tasks: newAutomation.tasks || [],
              assignToUserId: newAutomation.assignToUserId
          }; 
          const updatedConfig = { ...localConfig, workflowAutomations: [...(localConfig.workflowAutomations || []), automation] }; 
          setLocalConfig(updatedConfig); 
          if (onUpdateConfig) onUpdateConfig(updatedConfig); 
          setNewAutomation({ triggerStatus: 'SHOOTING', tasks: [] }); 
      } 
  };
  const handleDeleteAutomation = (id: string) => { const updatedConfig = { ...localConfig, workflowAutomations: (localConfig.workflowAutomations || []).filter(a => a.id !== id) }; setLocalConfig(updatedConfig); if (onUpdateConfig) onUpdateConfig(updatedConfig); };
  
  const addFeature = () => { if (featureInput.trim()) { setNewPackage(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] })); setFeatureInput(''); } };
  const removeFeature = (index: number) => { setNewPackage(prev => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== index) })); };
  const addPackageTask = () => { if (packageTaskInput.trim()) { setNewPackage(prev => ({ ...prev, defaultTasks: [...(prev.defaultTasks || []), packageTaskInput.trim()] })); setPackageTaskInput(''); } };
  const removePackageTask = (index: number) => { setNewPackage(prev => ({ ...prev, defaultTasks: (prev.defaultTasks || []).filter((_, i) => i !== index) })); };
  
  const togglePackageAsset = (assetId: string) => {
      const current = newPackage.defaultAssetIds || [];
      if (current.includes(assetId)) {
          setNewPackage(prev => ({ ...prev, defaultAssetIds: current.filter(id => id !== assetId) }));
      } else {
          setNewPackage(prev => ({ ...prev, defaultAssetIds: [...current, assetId] }));
      }
  };

  // COGS Handlers
  const addCostItem = () => {
      if (newCostItem.description && newCostItem.amount) {
          const item: PackageCostItem = {
              id: `cost-${Date.now()}`,
              description: newCostItem.description,
              amount: Number(newCostItem.amount),
              category: newCostItem.category as any || 'OTHER'
          };
          setNewPackage(prev => ({
              ...prev,
              costBreakdown: [...(prev.costBreakdown || []), item]
          }));
          setNewCostItem({ description: '', amount: 0, category: 'OTHER' });
      }
  };

  const removeCostItem = (id: string) => {
      setNewPackage(prev => ({
          ...prev,
          costBreakdown: (prev.costBreakdown || []).filter(c => c.id !== id)
      }));
  };

  const handleEditPackage = (pkg: Package) => { setNewPackage({ ...pkg, turnaroundDays: pkg.turnaroundDays || 7, defaultTasks: pkg.defaultTasks || [], defaultAssetIds: pkg.defaultAssetIds || [], costBreakdown: pkg.costBreakdown || [] }); setIsEditingPackage(true); setShowAddPackage(true); };
  const togglePackage = (pkg: Package) => { if(onUpdatePackage) { onUpdatePackage({ ...pkg, active: !pkg.active }); } };
  const handleArchivePackage = (e: React.MouseEvent, pkg: Package) => { e.stopPropagation(); e.preventDefault(); if (!window.confirm(`Archive package '${pkg.name}'?`)) return; if (onUpdatePackage) { onUpdatePackage({ ...pkg, active: false, archived: true }); } };

  // LIST MANAGEMENT HELPERS
  const addCategory = (listName: 'expenseCategories' | 'assetCategories' | 'clientCategories', value: string, setter: (v: string) => void) => {
      if (value.trim()) {
          const current = localConfig[listName] || [];
          if (!current.includes(value.trim())) {
              const updated = [...current, value.trim()];
              setLocalConfig(prev => ({...prev, [listName]: updated}));
          }
          setter('');
      }
  };

  const removeCategory = (listName: 'expenseCategories' | 'assetCategories' | 'clientCategories', value: string) => {
      const updated = (localConfig[listName] || []).filter(c => c !== value);
      setLocalConfig(prev => ({...prev, [listName]: updated}));
  };

  const menuItems = [
    { id: 'GENERAL', label: 'General', icon: Sliders },
    { id: 'PACKAGES', label: 'Packages', icon: Tag },
    { id: 'TEMPLATES', label: 'Templates', icon: MessageSquare },
    { id: 'TEAM', label: 'Profile & Account', icon: UserIcon },
    { id: 'AUTOMATION', label: 'Workflow', icon: Zap },
    { id: 'DATA', label: 'Data', icon: HardDrive },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 pb-20 lg:pb-0">
      {/* Sidebar */}
      <div className="w-full lg:w-64 bg-lumina-surface border border-lumina-highlight rounded-2xl p-4 flex flex-row lg:flex-col gap-2 shrink-0 overflow-x-auto no-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${activeTab === item.id ? 'bg-lumina-accent text-lumina-base shadow-lg shadow-lumina-accent/20' : 'text-lumina-muted hover:text-white hover:bg-lumina-highlight'}`}
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 lg:p-8 relative overflow-y-auto custom-scrollbar">
        
        {/* ... (GENERAL, PACKAGES, TEMPLATES, TEAM tabs remain mostly the same) ... */}
        {activeTab === 'GENERAL' && (
            <div className="space-y-8">
                {/* ... existing General content ... */}
                <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
                
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Studio Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Studio Name</label><input name="name" value={localConfig.name} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Address</label><input name="address" value={localConfig.address} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Phone</label><input name="phone" value={localConfig.phone} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Website</label><input name="website" value={localConfig.website} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Logo URL</label><input name="logoUrl" value={localConfig.logoUrl || ''} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="https://..."/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Invoice Prefix</label><input name="invoicePrefix" value={localConfig.invoicePrefix || ''} onChange={handleConfigChange} placeholder="e.g. LUM" className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                    </div>
                </div>

                {/* Financial Policy */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2 flex items-center gap-2"><DollarSign size={16}/> Financial Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Tax Rate (%)</label><input type="number" name="taxRate" value={localConfig.taxRate} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Down Payment (%)</label><input type="number" name="requiredDownPaymentPercentage" value={localConfig.requiredDownPaymentPercentage} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Payment Due (Days)</label><input type="number" name="paymentDueDays" value={localConfig.paymentDueDays} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                    </div>
                </div>

                {/* Banking Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2 flex items-center gap-2"><BankIcon size={16}/> Banking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Bank Name</label><input name="bankName" value={localConfig.bankName} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="e.g. BCA"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Account Number</label><input name="bankAccount" value={localConfig.bankAccount} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="1234567890"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Account Holder</label><input name="bankHolder" value={localConfig.bankHolder} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="PT Name"/></div>
                    </div>
                </div>

                {/* Legal */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2 flex items-center gap-2"><FileText size={16}/> Legal & Footer</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">NPWP (Tax ID)</label><input name="npwp" value={localConfig.npwp || ''} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white" placeholder="XX.XXX.XXX.X-XXX.XXX"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Invoice Footer Note</label><textarea name="invoiceFooter" value={localConfig.invoiceFooter || ''} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white min-h-[80px]" placeholder="Terms & Conditions, Thank you note..."/></div>
                    </div>
                </div>

                {/* Categories Management */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2 flex items-center gap-2"><Tag size={16}/> Custom Categories</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Expense Categories */}
                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                            <h4 className="text-xs font-bold text-lumina-muted uppercase mb-3">Expense Types</h4>
                            <div className="flex gap-2 mb-3">
                                <input placeholder="Add..." value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} className="flex-1 bg-lumina-surface border border-lumina-highlight rounded p-1.5 text-white text-xs" onKeyDown={e => e.key === 'Enter' && addCategory('expenseCategories', newExpenseCat, setNewExpenseCat)} />
                                <button onClick={() => addCategory('expenseCategories', newExpenseCat, setNewExpenseCat)} className="bg-lumina-highlight px-2 rounded text-white text-xs">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(localConfig.expenseCategories || []).map((cat) => (
                                    <span key={cat} className="bg-lumina-surface px-2 py-1 rounded text-[10px] text-white border border-lumina-highlight flex items-center gap-1">
                                        {cat} <X size={10} className="cursor-pointer text-lumina-muted hover:text-rose-500" onClick={() => removeCategory('expenseCategories', cat)}/>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Asset Categories */}
                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                            <h4 className="text-xs font-bold text-lumina-muted uppercase mb-3">Asset Types</h4>
                            <div className="flex gap-2 mb-3">
                                <input placeholder="Add..." value={newAssetCat} onChange={e => setNewAssetCat(e.target.value)} className="flex-1 bg-lumina-surface border border-lumina-highlight rounded p-1.5 text-white text-xs" onKeyDown={e => e.key === 'Enter' && addCategory('assetCategories', newAssetCat, setNewAssetCat)} />
                                <button onClick={() => addCategory('assetCategories', newAssetCat, setNewAssetCat)} className="bg-lumina-highlight px-2 rounded text-white text-xs">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(localConfig.assetCategories || []).map((cat) => (
                                    <span key={cat} className="bg-lumina-surface px-2 py-1 rounded text-[10px] text-white border border-lumina-highlight flex items-center gap-1">
                                        {cat} <X size={10} className="cursor-pointer text-lumina-muted hover:text-rose-500" onClick={() => removeCategory('assetCategories', cat)}/>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Client Categories */}
                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                            <h4 className="text-xs font-bold text-lumina-muted uppercase mb-3">Client Tags</h4>
                            <div className="flex gap-2 mb-3">
                                <input placeholder="Add..." value={newClientCat} onChange={e => setNewClientCat(e.target.value)} className="flex-1 bg-lumina-surface border border-lumina-highlight rounded p-1.5 text-white text-xs" onKeyDown={e => e.key === 'Enter' && addCategory('clientCategories', newClientCat, setNewClientCat)} />
                                <button onClick={() => addCategory('clientCategories', newClientCat, setNewClientCat)} className="bg-lumina-highlight px-2 rounded text-white text-xs">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(localConfig.clientCategories || []).map((cat) => (
                                    <span key={cat} className="bg-lumina-surface px-2 py-1 rounded text-[10px] text-white border border-lumina-highlight flex items-center gap-1">
                                        {cat} <X size={10} className="cursor-pointer text-lumina-muted hover:text-rose-500" onClick={() => removeCategory('clientCategories', cat)}/>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Operating Hours */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2 flex items-center gap-2"><Clock size={16}/> Operating Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Open Time</label><input type="time" name="operatingHoursStart" value={localConfig.operatingHoursStart} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Close Time</label><input type="time" name="operatingHoursEnd" value={localConfig.operatingHoursEnd} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Buffer (Minutes)</label><input type="number" name="bufferMinutes" value={localConfig.bufferMinutes} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                    </div>
                </div>

                {/* Rooms */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Studio Rooms</h3>
                    <div className="space-y-3 mb-4">
                        {localConfig.rooms.map(room => (
                            <div key={room.id} className="flex justify-between items-center bg-lumina-base p-3 rounded-lg border border-lumina-highlight">
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full bg-${room.color}-500`}></div>
                                    <span className="text-white font-bold">{room.name}</span>
                                    <span className="text-xs text-lumina-muted uppercase bg-lumina-surface px-2 py-0.5 rounded">{room.type}</span>
                                </div>
                                <button onClick={(e) => handleDeleteRoom(e, room.id, room.name)} className="text-lumina-muted hover:text-rose-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input placeholder="New Room Name" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white text-sm"/>
                        <button onClick={handleAddRoom} className="bg-lumina-accent text-lumina-base px-4 rounded-lg font-bold text-sm">Add</button>
                    </div>
                </div>

                <div className="flex justify-end pt-6 sticky bottom-0 bg-lumina-surface py-4 border-t border-lumina-highlight">
                    <button onClick={handleSaveConfig} className="bg-lumina-accent text-lumina-base px-6 py-3 rounded-xl font-bold hover:bg-lumina-accent/90 shadow-lg w-full md:w-auto">Save Changes</button>
                </div>
            </div>
        )}

        {/* ... (Other tabs content from previous file) ... */}
        {activeTab === 'PACKAGES' && (
            // ... copy existing packages tab ...
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Packages</h2>
                    <button onClick={() => { setShowAddPackage(true); setIsEditingPackage(false); }} className="bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> New Package</button>
                </div>
                
                {showAddPackage && (
                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6 space-y-4 mb-6 animate-in slide-in-from-top-4">
                        <h3 className="font-bold text-white">{isEditingPackage ? 'Edit Package' : 'Create Package'}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Package Name" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white"/>
                            <input type="number" placeholder="Price" value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="Duration (hours)" value={newPackage.duration} onChange={e => setNewPackage({...newPackage, duration: Number(e.target.value)})} className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white"/>
                            <input type="number" placeholder="Turnaround (days)" value={newPackage.turnaroundDays} onChange={e => setNewPackage({...newPackage, turnaroundDays: Number(e.target.value)})} className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white"/>
                        </div>
                        
                        {/* Task Automation */}
                        <div className="border-t border-lumina-highlight/50 pt-4">
                            <label className="block text-xs text-lumina-muted font-bold mb-2">Automated Tasks</label>
                            <div className="flex gap-2 mb-2">
                                <input placeholder="Add default task (e.g. Edit Photos)" value={packageTaskInput} onChange={e => setPackageTaskInput(e.target.value)} className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white text-sm"/>
                                <button onClick={addPackageTask} className="bg-lumina-highlight px-3 rounded-lg text-white font-bold text-sm">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {newPackage.defaultTasks?.map((t, i) => (
                                    <span key={i} className="bg-lumina-surface px-2 py-1 rounded text-xs text-white border border-lumina-highlight flex items-center gap-1">{t} <X size={10} className="cursor-pointer" onClick={() => removePackageTask(i)}/></span>
                                ))}
                            </div>
                        </div>

                        {/* COGS Breakdown (NEW) */}
                        <div className="border-t border-lumina-highlight/50 pt-4">
                            <label className="block text-xs text-lumina-muted font-bold mb-2">Cost Breakdown (COGS)</label>
                            <div className="flex gap-2 mb-2">
                                <input placeholder="Item (e.g. Prints)" value={newCostItem.description} onChange={e => setNewCostItem({...newCostItem, description: e.target.value})} className="flex-[2] bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white text-sm"/>
                                <input type="number" placeholder="Cost" value={newCostItem.amount || ''} onChange={e => setNewCostItem({...newCostItem, amount: Number(e.target.value)})} className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white text-sm"/>
                                <select value={newCostItem.category} onChange={e => setNewCostItem({...newCostItem, category: e.target.value as any})} className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white text-sm">
                                    <option value="LABOR">Labor</option>
                                    <option value="MATERIAL">Material</option>
                                    <option value="OTHER">Other</option>
                                </select>
                                <button onClick={addCostItem} className="bg-lumina-highlight px-3 rounded-lg text-white font-bold text-sm">+</button>
                            </div>
                            <div className="space-y-1 mb-2">
                                {newPackage.costBreakdown?.map((cost, i) => (
                                    <div key={i} className="flex justify-between items-center bg-lumina-surface px-3 py-1.5 rounded border border-lumina-highlight text-xs">
                                        <span className="text-white">{cost.description} <span className="text-lumina-muted">({cost.category})</span></span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-rose-400 font-mono">Rp {cost.amount.toLocaleString()}</span>
                                            <button onClick={() => removeCostItem(cost.id)}><X size={10} className="text-lumina-muted hover:text-white"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-right text-xs text-lumina-muted">
                                Total COGS: <span className="text-rose-400 font-bold">Rp {(newPackage.costBreakdown || []).reduce((acc, c) => acc + c.amount, 0).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Asset Bundling */}
                        <div className="border-t border-lumina-highlight/50 pt-4">
                            <label className="block text-xs text-lumina-muted font-bold mb-2">Included Assets (Auto-Select)</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar bg-lumina-surface p-2 rounded-lg border border-lumina-highlight">
                                {assets.map((asset) => (
                                    <button 
                                        key={asset.id}
                                        onClick={() => togglePackageAsset(asset.id)}
                                        className={`px-2 py-1 text-xs border rounded transition-colors ${newPackage.defaultAssetIds?.includes(asset.id) ? 'bg-lumina-accent text-lumina-base border-lumina-accent font-bold' : 'text-lumina-muted border-lumina-highlight hover:border-white'}`}
                                    >
                                        {asset.name}
                                    </button>
                                ))}
                                {assets.length === 0 && <p className="text-xs text-lumina-muted italic">No assets available in inventory.</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowAddPackage(false)} className="px-4 py-2 text-lumina-muted font-bold">Cancel</button>
                            <button onClick={handleSavePackage} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold">Save Package</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.filter(p => !p.archived).map(pkg => (
                        <div key={pkg.id} className={`p-4 rounded-xl border ${pkg.active ? 'bg-lumina-base border-lumina-highlight' : 'bg-lumina-base/50 border-lumina-highlight/50 opacity-60'} relative group`}>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => togglePackage(pkg)} className="p-1.5 bg-lumina-surface rounded text-lumina-muted hover:text-white"><RefreshCcw size={14}/></button>
                                <button onClick={() => handleEditPackage(pkg)} className="p-1.5 bg-lumina-surface rounded text-lumina-muted hover:text-white"><Edit2 size={14}/></button>
                                <button onClick={(e) => handleArchivePackage(e, pkg)} className="p-1.5 bg-lumina-surface rounded text-lumina-muted hover:text-rose-500"><Archive size={14}/></button>
                            </div>
                            <h3 className="font-bold text-white text-lg">{pkg.name}</h3>
                            <p className="text-lumina-accent font-mono font-bold">Rp {pkg.price.toLocaleString()}</p>
                            <p className="text-xs text-lumina-muted mt-2">{pkg.duration} Hours • {pkg.turnaroundDays} Days Turnaround</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                                {pkg.features.slice(0, 3).map((f, i) => <span key={i} className="text-[10px] bg-lumina-surface px-2 py-0.5 rounded text-lumina-muted border border-lumina-highlight">{f}</span>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ... (TEMPLATES tab from previous file) ... */}
        {activeTab === 'TEMPLATES' && (
            // ... existing templates content ...
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">WhatsApp Templates</h2>
                        <p className="text-sm text-lumina-muted">Customize the automated messages sent to clients.</p>
                    </div>
                    <button onClick={handleSaveConfig} className="bg-lumina-accent text-lumina-base px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Save size={18} /> Save Templates
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Booking Confirmation</h3>
                        <p className="text-xs text-lumina-muted mb-2">Sent when a booking is created.</p>
                        <textarea 
                            className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white text-sm font-mono h-32 focus:border-lumina-accent outline-none"
                            value={localConfig.templates.booking}
                            onChange={e => handleTemplateChange('booking', e.target.value)}
                        />
                    </div>

                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Bell size={16} className="text-amber-400"/> Payment Reminder</h3>
                        <p className="text-xs text-lumina-muted mb-2">Sent to remind clients of outstanding balance.</p>
                        <textarea 
                            className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white text-sm font-mono h-32 focus:border-lumina-accent outline-none"
                            value={localConfig.templates.reminder}
                            onChange={e => handleTemplateChange('reminder', e.target.value)}
                        />
                    </div>

                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-4">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><MessageSquare size={16} className="text-blue-400"/> Thank You Note</h3>
                        <p className="text-xs text-lumina-muted mb-2">Sent after session completion.</p>
                        <textarea 
                            className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-3 text-white text-sm font-mono h-32 focus:border-lumina-accent outline-none"
                            value={localConfig.templates.thanks}
                            onChange={e => handleTemplateChange('thanks', e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 bg-lumina-highlight/10 border border-lumina-highlight rounded-xl">
                    <h4 className="text-xs font-bold text-lumina-muted uppercase mb-2">Available Variables</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-white font-mono">
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{clientName}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{package}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{date}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{time}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{studio}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{balance}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{bankName}`}</span>
                        <span className="bg-lumina-base px-2 py-1 rounded border border-lumina-highlight">{`{bankAccount}`}</span>
                    </div>
                </div>
            </div>
        )}

        {/* ... (TEAM tab from previous file) ... */}
        {activeTab === 'TEAM' && (
            // ... existing team content ...
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">My Profile</h2>
                    <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <img src={profileForm.avatar || `https://ui-avatars.com/api/?name=${profileForm.name}`} className="w-20 h-20 rounded-full border-2 border-lumina-highlight" />
                            <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-lumina-muted block mb-1">Display Name</label><input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white"/></div>
                                    <div><label className="text-xs font-bold text-lumina-muted block mb-1">Phone</label><input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white"/></div>
                                </div>
                                <button onClick={handleSaveProfile} className="bg-lumina-highlight text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-lumina-accent hover:text-lumina-base transition-colors">Update Profile</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Integrations</h2>
                    <div className="space-y-3">
                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-8 h-8"/></div>
                                <div>
                                    <h3 className="font-bold text-white">Google Calendar</h3>
                                    <p className="text-xs text-lumina-muted">{googleToken ? 'Connected' : 'Not connected'}</p>
                                </div>
                            </div>
                            <button onClick={handleConnectGoogle} className={`px-4 py-2 rounded-lg font-bold text-sm ${googleToken ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-blue-600 text-white'}`}>
                                {googleToken ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>

                        <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-8 h-8"/></div>
                                <div>
                                    <h3 className="font-bold text-white">Google Drive</h3>
                                    <p className="text-xs text-lumina-muted">{googleToken ? 'Connected' : 'Not connected'}</p>
                                </div>
                            </div>
                            <button onClick={handleConnectGoogle} className={`px-4 py-2 rounded-lg font-bold text-sm ${googleToken ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-blue-600 text-white'}`}>
                                {googleToken ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-rose-500 mb-4">Danger Zone</h2>
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white">Delete Account</h3>
                            <p className="text-xs text-lumina-muted">Permanently delete your studio and all data.</p>
                        </div>
                        <button onClick={onDeleteAccount} className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm hover:bg-rose-600">Delete Account</button>
                    </div>
                </div>
            </div>
        )}

        {/* AUTOMATION TAB */}
        {activeTab === 'AUTOMATION' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Workflow Automation</h2>
                <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-white mb-4">Create New Rule</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-lumina-muted">When booking status becomes</span>
                            <select 
                                className="bg-lumina-surface border border-lumina-highlight text-white rounded-lg p-2 text-sm font-bold"
                                value={newAutomation.triggerStatus}
                                onChange={e => setNewAutomation({...newAutomation, triggerStatus: e.target.value as ProjectStatus})}
                            >
                                {['BOOKED', 'SHOOTING', 'CULLING', 'EDITING', 'REVIEW', 'COMPLETED'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        {/* UPDATE: Auto-Assign User */}
                        <div>
                            <label className="text-xs font-bold text-lumina-muted block mb-2">Automatically Assign Staff (Optional):</label>
                            <select 
                                className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white text-sm focus:border-lumina-accent outline-none"
                                value={newAutomation.assignToUserId || ''}
                                onChange={e => setNewAutomation({...newAutomation, assignToUserId: e.target.value || undefined})}
                            >
                                <option value="">Do not assign anyone</option>
                                {users.filter(u => u.status === 'ACTIVE').map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-lumina-muted block mb-2">Add Tasks to Checklist:</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    placeholder="e.g. Send Gallery Link" 
                                    value={taskInput} 
                                    onChange={e => setTaskInput(e.target.value)} 
                                    className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-white text-sm"
                                    onKeyDown={e => e.key === 'Enter' && handleAddTaskToAutomation()}
                                />
                                <button onClick={handleAddTaskToAutomation} className="bg-lumina-highlight px-3 rounded-lg text-white font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {newAutomation.tasks?.map((t, i) => (
                                    <span key={i} className="bg-lumina-highlight px-2 py-1 rounded text-xs text-white flex items-center gap-2">
                                        {t} <button onClick={() => setNewAutomation(prev => ({...prev, tasks: prev.tasks?.filter((_, idx) => idx !== i)}))}><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={handleAddAutomation} 
                            disabled={(!newAutomation.tasks || newAutomation.tasks.length === 0) && !newAutomation.assignToUserId}
                            className="w-full py-3 bg-lumina-accent text-lumina-base font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Automation Rule
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {localConfig.workflowAutomations?.map((automation) => (
                        <div key={automation.id} className="bg-lumina-base border border-lumina-highlight rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-lumina-muted uppercase font-bold">Trigger:</span>
                                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">{automation.triggerStatus}</span>
                                </div>
                                <div className="text-sm text-white space-y-1">
                                    {automation.assignToUserId && (
                                        <p className="flex items-center gap-2 text-xs"><UserIcon size={12}/> Auto-assign: <span className="font-bold">{users.find(u => u.id === automation.assignToUserId)?.name || 'Unknown'}</span></p>
                                    )}
                                    <p>{automation.tasks.length} tasks will be added.</p>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteAutomation(automation.id)} className="text-lumina-muted hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    {(!localConfig.workflowAutomations || localConfig.workflowAutomations.length === 0) && (
                        <p className="text-center text-lumina-muted py-8">No active automations.</p>
                    )}
                </div>
            </div>
        )}

        {/* DATA TAB */}
        {activeTab === 'DATA' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Data Management</h2>
                <div className="p-6 bg-lumina-base border border-lumina-highlight rounded-xl flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white">Export Data</h3>
                        <p className="text-sm text-lumina-muted">Download a JSON backup of your studio configuration and packages.</p>
                    </div>
                    <button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-lumina-highlight hover:bg-white hover:text-black text-white rounded-lg font-bold transition-colors">
                        <Download size={18} /> Export JSON
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
