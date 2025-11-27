
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
  const [newAutomation, setNewAutomation] = useState<Partial<WorkflowAutomation>>({ triggerStatus: 'SHOOTING', tasks: [], triggerPackageId: '' });
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
              triggerPackageId: newAutomation.triggerPackageId || undefined, // undefined means 'ANY'
              tasks: newAutomation.tasks || [],
              assignToUserId: newAutomation.assignToUserId
          }; 
          const updatedConfig = { ...localConfig, workflowAutomations: [...(localConfig.workflowAutomations || []), automation] }; 
          setLocalConfig(updatedConfig); 
          if (onUpdateConfig) onUpdateConfig(updatedConfig); 
          setNewAutomation({ triggerStatus: 'SHOOTING', tasks: [], triggerPackageId: '' }); 
      } 
  };
  const handleDeleteAutomation = (id: string) => { const updatedConfig = { ...localConfig, workflowAutomations: (localConfig.workflowAutomations || []).filter(a => a.id !== id) }; setLocalConfig(updatedConfig); if (onUpdateConfig) onUpdateConfig(updatedConfig); };
  
  const menuItems = [
    { id: 'GENERAL', label: 'General', icon: Building },
    { id: 'PACKAGES', label: 'Packages', icon: Tag },
    { id: 'AUTOMATION', label: 'Automation', icon: Zap },
    { id: 'DATA', label: 'Data Management', icon: HardDrive },
  ];

  const togglePackage = (pkg: Package) => {
      if (onUpdatePackage) {
          onUpdatePackage({ ...pkg, active: !pkg.active });
      }
  };

  const handleEditPackage = (pkg: Package) => {
      setNewPackage(pkg);
      setIsEditingPackage(true);
      setShowAddPackage(true);
  };

  const handleArchivePackage = (e: React.MouseEvent, pkg: Package) => {
      e.stopPropagation();
      if (window.confirm(`Archive package ${pkg.name}?`)) {
          if (onUpdatePackage) {
              onUpdatePackage({ ...pkg, archived: true });
          }
      }
  };

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
        
        {/* GENERAL TAB (Including Lite Mode) */}
        {activeTab === 'GENERAL' && (
            <div className="space-y-8">
                {/* ... existing General content ... */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">General Settings</h2>
                    {/* LITE MODE TOGGLE */}
                    <div className="flex items-center gap-3 bg-lumina-base p-2 rounded-lg border border-lumina-highlight">
                        <span className={`text-xs font-bold ${localConfig.isLiteMode ? 'text-emerald-400' : 'text-lumina-muted'}`}>
                            Solo Mode (Lite)
                        </span>
                        <button 
                            onClick={() => setLocalConfig(prev => ({...prev, isLiteMode: !prev.isLiteMode}))}
                            className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.isLiteMode ? 'bg-emerald-500' : 'bg-lumina-highlight'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${localConfig.isLiteMode ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
                {/* ... rest of General Tab from previous ... */}
                {/* Basic Info, Financial, Banking, Legal, Categories, Ops, Rooms, Save Button */}
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
                {/* ... other sections repeated from previous ... */}
                <div className="flex justify-end pt-6 sticky bottom-0 bg-lumina-surface py-4 border-t border-lumina-highlight">
                    <button onClick={handleSaveConfig} className="bg-lumina-accent text-lumina-base px-6 py-3 rounded-xl font-bold hover:bg-lumina-accent/90 shadow-lg w-full md:w-auto">Save Changes</button>
                </div>
            </div>
        )}

        {/* PACKAGES, TEMPLATES, TEAM, DATA tabs remain same */}
        {activeTab === 'PACKAGES' && (
            // ... Package Tab Content ...
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
                        {/* ... other inputs ... */}
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
                            <div className="flex flex-wrap gap-1 mt-3">
                                {pkg.features.slice(0, 3).map((f, i) => <span key={i} className="text-[10px] bg-lumina-surface px-2 py-0.5 rounded text-lumina-muted border border-lumina-highlight">{f}</span>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* AUTOMATION TAB - UPDATED with Package Trigger */}
        {activeTab === 'AUTOMATION' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Workflow Automation</h2>
                <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-white mb-4">Create New Rule</h3>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-lumina-muted block mb-2">When Status Becomes:</label>
                                <select 
                                    className="w-full bg-lumina-surface border border-lumina-highlight text-white rounded-lg p-2 text-sm font-bold"
                                    value={newAutomation.triggerStatus}
                                    onChange={e => setNewAutomation({...newAutomation, triggerStatus: e.target.value as ProjectStatus})}
                                >
                                    {['BOOKED', 'SHOOTING', 'CULLING', 'EDITING', 'REVIEW', 'COMPLETED'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-lumina-muted block mb-2">For Package (Optional):</label>
                                <select 
                                    className="w-full bg-lumina-surface border border-lumina-highlight text-white rounded-lg p-2 text-sm focus:border-lumina-accent outline-none"
                                    value={newAutomation.triggerPackageId || ''}
                                    onChange={e => setNewAutomation({...newAutomation, triggerPackageId: e.target.value})}
                                >
                                    <option value="">Any Package</option>
                                    {packages.filter(p => p.active).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
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
                                    <span className="text-xs text-white">
                                        {automation.triggerPackageId 
                                            ? `for ${packages.find(p => p.id === automation.triggerPackageId)?.name}` 
                                            : 'for ALL packages'}
                                    </span>
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

        {/* ... (DATA tab remains same) ... */}
      </div>
    </div>
  );
};

export default SettingsView;
