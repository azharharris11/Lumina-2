
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, StudioConfig, SettingsViewProps, StudioRoom, Booking, User, WorkflowAutomation, ProjectStatus, Asset, PackageCostItem } from '../types';
import { Settings as SettingsIcon, Tag, Plus, Edit2, Building, Save, Trash2, HardDrive, RefreshCcw, Archive, User as UserIcon, Zap, Loader2, List, X } from 'lucide-react';

const Motion = motion as any;

interface ExtendedSettingsViewProps extends SettingsViewProps {
    bookings?: Booking[];
    googleToken?: string | null;
    setGoogleToken?: (token: string | null) => void;
    assets?: Asset[];
    users?: User[]; 
}

declare var google: any;

const SettingsView: React.FC<ExtendedSettingsViewProps> = ({ packages, config, onAddPackage, onUpdatePackage, onDeletePackage, onUpdateConfig, bookings = [], currentUser, onUpdateUserProfile, onDeleteAccount, googleToken, setGoogleToken, assets = [], users = [] }) => {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [localConfig, setLocalConfig] = useState<StudioConfig>(config);
  
  // Loading States
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState<Partial<User>>({ name: '', phone: '', avatar: '', specialization: '' });
  const [newAutomation, setNewAutomation] = useState<Partial<WorkflowAutomation>>({ triggerStatus: 'SHOOTING', tasks: [], triggerPackageId: '' });
  const [taskInput, setTaskInput] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<Package>>({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [], turnaroundDays: 7, defaultTasks: [], defaultAssetIds: [] });
  const [newRoom, setNewRoom] = useState<Partial<StudioRoom>>({ name: '', type: 'INDOOR', color: 'gray' });

  // Dynamic List State
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newAssetCat, setNewAssetCat] = useState('');
  const [newClientCat, setNewClientCat] = useState('');

  useEffect(() => { setLocalConfig(config); }, [config]);
  useEffect(() => { if (currentUser) { setProfileForm({ id: currentUser.id, name: currentUser.name, phone: currentUser.phone, avatar: currentUser.avatar, specialization: currentUser.specialization || '' }); } }, [currentUser]);

  // ... Handlers ...
  const handleSavePackage = async () => {
      if (!newPackage.name || newPackage.price === undefined) return;
      setIsSavingPackage(true);
      try {
          const pkgData = { ...newPackage, features: newPackage.features || [], costBreakdown: newPackage.costBreakdown || [], defaultTasks: newPackage.defaultTasks || [], defaultAssetIds: newPackage.defaultAssetIds || [] };
          if (isEditingPackage && onUpdatePackage && newPackage.id) {
              await onUpdatePackage({ ...pkgData, id: newPackage.id } as Package);
          } else if(onAddPackage) {
              await onAddPackage({ ...pkgData, id: `p-${Date.now()}` } as Package);
          }
          setShowAddPackage(false);
          setIsEditingPackage(false);
          setNewPackage({ name: '', price: 0, duration: 1, features: [], active: true, costBreakdown: [], turnaroundDays: 7 });
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingPackage(false);
      }
  };

  const handleArchivePackage = (e: React.MouseEvent, pkg: Package) => {
      e.stopPropagation();
      const futureBookings = bookings.filter(b => b.packageId === pkg.id && b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
      let confirmMsg = `Archive package '${pkg.name}'?`;
      if (futureBookings.length > 0) confirmMsg += `\n\nWARNING: There are ${futureBookings.length} upcoming bookings using this package.`;
      if (window.confirm(confirmMsg)) {
          if (onUpdatePackage) onUpdatePackage({ ...pkg, archived: true });
      }
  };

  const handleSaveConfig = async () => {
      if (onUpdateConfig) {
          setIsSavingConfig(true);
          try {
              await onUpdateConfig(localConfig);
          } finally {
              setIsSavingConfig(false);
          }
      }
  };

  const handleDeleteRoom = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      e.preventDefault();
      const activeBookings = bookings.filter(b => b.studio === name && b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
      if (activeBookings.length > 0) {
          alert(`CANNOT DELETE ROOM '${name}'.\n\nReason: There are ${activeBookings.length} active bookings scheduled in this room.`);
          return;
      }
      if (!window.confirm(`Delete studio room '${name}'?`)) return;
      const updatedRooms = (localConfig.rooms || []).filter(r => r.id !== id);
      const updatedConfig = { ...localConfig, rooms: updatedRooms };
      setLocalConfig(updatedConfig);
      if (onUpdateConfig) onUpdateConfig(updatedConfig);
  };

  // --- DYNAMIC LIST HANDLERS ---
  const addItemToList = (listName: 'expenseCategories' | 'assetCategories' | 'clientCategories', item: string, setter: (val: string) => void) => {
      if (!item.trim()) return;
      const currentList = localConfig[listName] || [];
      if (currentList.includes(item.trim())) return;
      const updatedConfig = { ...localConfig, [listName]: [...currentList, item.trim()] };
      setLocalConfig(updatedConfig);
      if (onUpdateConfig) onUpdateConfig(updatedConfig);
      setter('');
  };

  const removeItemFromList = (listName: 'expenseCategories' | 'assetCategories' | 'clientCategories', item: string) => {
      if (!window.confirm(`Remove '${item}' from list?`)) return;
      const currentList = localConfig[listName] || [];
      const updatedConfig = { ...localConfig, [listName]: currentList.filter(i => i !== item) };
      setLocalConfig(updatedConfig);
      if (onUpdateConfig) onUpdateConfig(updatedConfig);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setLocalConfig(prev => ({ ...prev, [name]: value })); };
  const handleAddRoom = () => { if (newRoom.name) { const room: StudioRoom = { id: `r-${Date.now()}`, name: newRoom.name, type: newRoom.type as any, color: newRoom.color || 'gray' }; const updatedRooms = [...(localConfig.rooms || []), room]; const updatedConfig = { ...localConfig, rooms: updatedRooms }; setLocalConfig(updatedConfig); if (onUpdateConfig) onUpdateConfig(updatedConfig); setNewRoom({ name: '', type: 'INDOOR', color: 'gray' }); } };
  const handleExportData = () => { /* ... */ };
  const handleDeleteAutomation = (id: string) => { const updatedConfig = { ...localConfig, workflowAutomations: (localConfig.workflowAutomations || []).filter(a => a.id !== id) }; setLocalConfig(updatedConfig); if (onUpdateConfig) onUpdateConfig(updatedConfig); };
  const handleAddTaskToAutomation = () => { if(taskInput.trim()) { setNewAutomation(prev => ({ ...prev, tasks: [...(prev.tasks || []), taskInput.trim()] })); setTaskInput(''); } };
  const handleAddAutomation = () => { 
      if(newAutomation.triggerStatus) { 
          const automation: WorkflowAutomation = { 
              id: `wf-${Date.now()}`, 
              triggerStatus: newAutomation.triggerStatus, 
              triggerPackageId: newAutomation.triggerPackageId || undefined, 
              tasks: newAutomation.tasks || [],
              assignToUserId: newAutomation.assignToUserId
          }; 
          const updatedConfig = { ...localConfig, workflowAutomations: [...(localConfig.workflowAutomations || []), automation] }; 
          setLocalConfig(updatedConfig); 
          if (onUpdateConfig) onUpdateConfig(updatedConfig); 
          setNewAutomation({ triggerStatus: 'SHOOTING', tasks: [], triggerPackageId: '' }); 
      } 
  };
  const togglePackage = (pkg: Package) => { if (onUpdatePackage) { onUpdatePackage({ ...pkg, active: !pkg.active }); } };
  const handleEditPackage = (pkg: Package) => { setNewPackage(pkg); setIsEditingPackage(true); setShowAddPackage(true); };

  const menuItems = [
    { id: 'GENERAL', label: 'General', icon: Building },
    { id: 'PACKAGES', label: 'Packages', icon: Tag },
    { id: 'LISTS', label: 'Lists', icon: List },
    { id: 'AUTOMATION', label: 'Automation', icon: Zap },
    { id: 'DATA', label: 'Data Management', icon: HardDrive },
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

      <div className="flex-1 bg-lumina-surface border border-lumina-highlight rounded-2xl p-6 lg:p-8 relative overflow-y-auto custom-scrollbar">
        
        {/* GENERAL TAB */}
        {activeTab === 'GENERAL' && (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">General Settings</h2>
                    <div className="flex items-center gap-3 bg-lumina-base p-2 rounded-lg border border-lumina-highlight">
                        <span className={`text-xs font-bold ${localConfig.isLiteMode ? 'text-emerald-400' : 'text-lumina-muted'}`}>Solo Mode</span>
                        <button onClick={() => setLocalConfig(prev => ({...prev, isLiteMode: !prev.isLiteMode}))} className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.isLiteMode ? 'bg-emerald-500' : 'bg-lumina-highlight'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${localConfig.isLiteMode ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Studio Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Studio Name</label><input name="name" value={localConfig.name} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Address</label><input name="address" value={localConfig.address} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Phone</label><input name="phone" value={localConfig.phone} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                        <div><label className="block text-xs text-lumina-muted mb-1 font-bold">Website</label><input name="website" value={localConfig.website} onChange={handleConfigChange} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-3 text-white"/></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Studio Rooms</h3>
                    <div className="space-y-2">
                        {localConfig.rooms.map(room => (
                            <div key={room.id} className="flex justify-between items-center bg-lumina-base border border-lumina-highlight rounded-lg p-3">
                                <span className="text-sm text-white font-bold">{room.name}</span>
                                <button onClick={(e) => handleDeleteRoom(e, room.id, room.name)} className="text-lumina-muted hover:text-rose-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input placeholder="New Room Name" className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} />
                        <button onClick={handleAddRoom} className="bg-lumina-highlight px-4 rounded-lg text-white font-bold">Add</button>
                    </div>
                </div>

                <div className="flex justify-end pt-6 sticky bottom-0 bg-lumina-surface py-4 border-t border-lumina-highlight">
                    <button onClick={handleSaveConfig} disabled={isSavingConfig} className="bg-lumina-accent text-lumina-base px-6 py-3 rounded-xl font-bold hover:bg-lumina-accent/90 shadow-lg w-full md:w-auto flex items-center justify-center gap-2">
                        {isSavingConfig && <Loader2 className="animate-spin" size={16} />} Save Changes
                    </button>
                </div>
            </div>
        )}

        {/* PACKAGES TAB */}
        {activeTab === 'PACKAGES' && (
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
                            <button onClick={handleSavePackage} disabled={isSavingPackage} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                {isSavingPackage && <Loader2 className="animate-spin" size={16} />} Save Package
                            </button>
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
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* LISTS TAB */}
        {activeTab === 'LISTS' && (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white mb-6">Manage Categories</h2>
                
                {/* Expense Categories */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Expense Categories</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {localConfig.expenseCategories?.map(cat => (
                            <span key={cat} className="bg-lumina-base border border-lumina-highlight px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2">
                                {cat}
                                <button onClick={() => removeItemFromList('expenseCategories', cat)} className="text-lumina-muted hover:text-rose-500"><X size={14}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                        <input value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} placeholder="New Expense Category" className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white text-sm" />
                        <button onClick={() => addItemToList('expenseCategories', newExpenseCat, setNewExpenseCat)} className="bg-lumina-highlight px-3 rounded-lg text-white"><Plus size={18}/></button>
                    </div>
                </div>

                {/* Asset Categories */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Asset Categories</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {localConfig.assetCategories?.map(cat => (
                            <span key={cat} className="bg-lumina-base border border-lumina-highlight px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2">
                                {cat}
                                <button onClick={() => removeItemFromList('assetCategories', cat)} className="text-lumina-muted hover:text-rose-500"><X size={14}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                        <input value={newAssetCat} onChange={e => setNewAssetCat(e.target.value)} placeholder="New Asset Category" className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white text-sm" />
                        <button onClick={() => addItemToList('assetCategories', newAssetCat, setNewAssetCat)} className="bg-lumina-highlight px-3 rounded-lg text-white"><Plus size={18}/></button>
                    </div>
                </div>

                {/* Client Categories */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-lumina-highlight pb-2">Client Tags</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {localConfig.clientCategories?.map(cat => (
                            <span key={cat} className="bg-lumina-base border border-lumina-highlight px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2">
                                {cat}
                                <button onClick={() => removeItemFromList('clientCategories', cat)} className="text-lumina-muted hover:text-rose-500"><X size={14}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                        <input value={newClientCat} onChange={e => setNewClientCat(e.target.value)} placeholder="New Client Tag" className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-white text-sm" />
                        <button onClick={() => addItemToList('clientCategories', newClientCat, setNewClientCat)} className="bg-lumina-highlight px-3 rounded-lg text-white"><Plus size={18}/></button>
                    </div>
                </div>
            </div>
        )}

        {/* AUTOMATION TAB */}
        {activeTab === 'AUTOMATION' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Workflow Automation</h2>
                <div className="bg-lumina-base border border-lumina-highlight rounded-xl p-6 mb-6">
                    <div className="flex flex-col gap-4">
                        <button onClick={handleAddAutomation} disabled={(!newAutomation.tasks || newAutomation.tasks.length === 0) && !newAutomation.assignToUserId} className="w-full py-3 bg-lumina-accent text-lumina-base font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                            Save Automation Rule
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    {localConfig.workflowAutomations?.map((automation) => (
                        <div key={automation.id} className="bg-lumina-base border border-lumina-highlight rounded-xl p-4 flex justify-between items-center">
                            <button onClick={() => handleDeleteAutomation(automation.id)} className="text-lumina-muted hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'DATA' && (
            <div className="space-y-6">
                <div className="p-6 bg-lumina-base border border-lumina-highlight rounded-xl text-center">
                    <HardDrive className="mx-auto text-lumina-muted mb-4" size={32} />
                    <h3 className="text-lg font-bold text-white mb-2">Export Data</h3>
                    <button onClick={handleExportData} className="px-6 py-3 bg-lumina-surface border border-lumina-highlight text-white rounded-xl hover:bg-lumina-highlight transition-colors font-bold text-sm">
                        Download Backup
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
