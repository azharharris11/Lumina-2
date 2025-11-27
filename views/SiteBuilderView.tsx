
// ... existing imports
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteBuilderViewProps, SiteGalleryItem, SitePage, SiteSection, SectionType, SiteTheme, SiteFont } from '../types';
import { Globe, Smartphone, Monitor, Save, Layout, Type, Image as ImageIcon, Palette, Check, Megaphone, Trash2, Plus, ArrowLeft, Sliders, File, Home, Layers, ArrowUp, ArrowDown, GripVertical, PanelLeftClose, PanelLeftOpen, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import SitePreviewFrame from '../components/site-builder/SitePreviewFrame';

// Themes (Import remains same)
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

const Motion = motion as any;

interface ExtendedSiteBuilderViewProps extends SiteBuilderViewProps {
    onExit?: () => void;
}

const THEMES: {id: SiteTheme, label: string, color: string, textColor: string}[] = [
    { id: 'NOIR', label: 'Noir', color: '#000000', textColor: '#ffffff' },
    { id: 'ETHEREAL', label: 'Ethereal', color: '#fcfaf7', textColor: '#4a4a4a' },
    { id: 'VOGUE', label: 'Vogue', color: '#ff3333', textColor: '#000000' },
    { id: 'MINIMAL', label: 'Minimal', color: '#ffffff', textColor: '#000000' },
    { id: 'CINEMA', label: 'Cinema', color: '#1a1a1a', textColor: '#ffffff' },
    { id: 'RETRO', label: 'Retro', color: '#008080', textColor: '#ffffff' },
    { id: 'ATELIER', label: 'Atelier', color: '#f5f0eb', textColor: '#2c2c2c' },
    { id: 'HORIZON', label: 'Horizon', color: '#0f172a', textColor: '#ffffff' },
    { id: 'BOLD', label: 'Bold', color: '#bef264', textColor: '#000000' },
    { id: 'IMPACT', label: 'Impact', color: '#ffff00', textColor: '#000000' },
    { id: 'CLEANSLATE', label: 'Clean Slate', color: '#f8fafc', textColor: '#334155' },
    { id: 'AUTHORITY', label: 'Authority', color: '#1a1a1a', textColor: '#d97706' },
];

const FONTS: {id: SiteFont, label: string, desc: string}[] = [
    { id: 'SANS', label: 'Modern Sans', desc: 'Clean, geometric (Outfit)' },
    { id: 'SERIF', label: 'Classic Serif', desc: 'Elegant, timeless (Playfair)' },
    { id: 'DISPLAY', label: 'Bold Display', desc: 'Artistic, unique (Syne)' },
    { id: 'MONO', label: 'Technical Mono', desc: 'Raw, brutalist (Monospace)' }
];

const SiteBuilderView: React.FC<ExtendedSiteBuilderViewProps> = ({ config, packages, users, bookings, onUpdateConfig, onExit, onPublicBooking }) => {
  const [localSite, setLocalSite] = useState(config.site);
  const [previewMode, setPreviewMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'SECTIONS' | 'GALLERY' | 'COMPONENTS' | 'SEO' | 'MARKETING' | 'PAGES'>('SECTIONS');
  const [hasChanges, setHasChanges] = useState(false);
  const [activePageId, setActivePageId] = useState<string>('home');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [newPageName, setNewPageName] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  
  // Sidebar & Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ... (Responsive listener & Auto Migration & publicUrl & activePageData calculation remain same) ...
  // Responsive Listener
  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (mobile) setIsSidebarOpen(false); // Close by default on mobile
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- AUTO MIGRATION: Convert Legacy Home to Sections ---
  useEffect(() => {
      const homePage = localSite.pages?.find(p => p.id === 'home' || p.slug === 'home');
      
      if (!homePage) {
          console.log("Migrating Home Page to Blocks...");
          const newSections: SiteSection[] = [];

          // 1. Hero
          newSections.push({
              id: 'home-hero',
              type: 'HERO',
              content: {
                  headline: localSite.headline,
                  description: localSite.description,
                  image: localSite.heroImage,
                  subheadline: 'Welcome'
              }
          });

          // 2. Gallery (if populated)
          if (localSite.showPortfolio && localSite.gallery.length > 0) {
              newSections.push({
                  id: 'home-gallery',
                  type: 'GALLERY',
                  content: {}
              });
          }

          // 3. Pricing (if enabled)
          if (localSite.showPricing) {
              newSections.push({
                  id: 'home-pricing',
                  type: 'PRICING',
                  content: { headline: 'Our Collections' }
              });
          }

          // 4. Booking Widget
          if (localSite.showBookingWidget) {
              newSections.push({
                  id: 'home-cta',
                  type: 'CTA_BANNER',
                  content: {
                      headline: 'Ready to Book?',
                      buttonText: 'Reserve Now'
                  }
              });
          }

          const newHomePage: SitePage = {
              id: 'home',
              title: 'Home',
              slug: 'home',
              headline: localSite.headline,
              description: localSite.description,
              heroImage: localSite.heroImage,
              showPortfolio: localSite.showPortfolio,
              showPricing: localSite.showPricing,
              showBookingWidget: localSite.showBookingWidget,
              gallery: localSite.gallery,
              sections: newSections
          };

          setLocalSite(prev => ({
              ...prev,
              pages: [newHomePage, ...(prev.pages || [])]
          }));
          setActivePageId('home');
      }
  }, []); // Run once on mount

  const publicUrl = `${window.location.origin}?site=${config.ownerId || 'me'}`;

  const activePageData = useMemo(() => {
      if (activePageId === 'HOME') {
          return localSite.pages?.find(p => p.id === 'home') || localSite;
      }
      return localSite.pages?.find(p => p.id === activePageId) || localSite;
  }, [activePageId, localSite]);

  const handleContentChange = (key: string, value: any) => {
      setHasChanges(true);
      // Update the page in the pages array
      setLocalSite(prev => ({
          ...prev,
          pages: prev.pages?.map(p => (p.id === activePageId || (activePageId==='HOME' && p.id==='home')) ? { ...p, [key]: value } : p) || []
      }));
  };

  const getActiveSections = () => {
      return (activePageData as SitePage).sections || [];
  };

  const updateSections = (newSections: SiteSection[]) => {
      handleContentChange('sections', newSections);
  };

  // ... (Section handlers remain same) ...
  const handleAddSection = (type: SectionType) => {
      const newSection: SiteSection = {
          id: `sec-${Date.now()}`,
          type,
          content: {
              headline: 'New Section',
              description: 'Add your content here.',
              image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80',
              layout: 'LEFT',
              items: type === 'FEATURES' ? [{title: 'Feature 1', text: 'Detail'}] : undefined
          }
      };
      updateSections([...getActiveSections(), newSection]);
      setSelectedSectionId(newSection.id);
      if (activeTab !== 'SECTIONS') setActiveTab('SECTIONS');
  };

  const handleUpdateSection = (id: string, content: any) => {
      const sections = getActiveSections().map(s => s.id === id ? { ...s, content: { ...s.content, ...content } } : s);
      updateSections(sections);
  };

  const handleDeleteSection = (id: string) => {
      if(window.confirm('Delete this section?')) {
          updateSections(getActiveSections().filter(s => s.id !== id));
          if (selectedSectionId === id) setSelectedSectionId(null);
      }
  };

  const handleMoveSection = (index: number, direction: 'UP' | 'DOWN') => {
      const sections = [...getActiveSections()];
      if (direction === 'UP' && index > 0) {
          [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
      } else if (direction === 'DOWN' && index < sections.length - 1) {
          [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      }
      updateSections(sections);
  };

  const handleGlobalChange = (key: string, value: any) => {
      setLocalSite(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
  };

  const handleAddPage = () => {
      if (newPageName.trim()) {
          const slug = newPageName.toLowerCase().replace(/\s+/g, '-');
          const newPage: SitePage = {
              id: `p-${Date.now()}`,
              title: newPageName,
              slug: slug,
              headline: newPageName,
              description: 'Add your page description here.',
              heroImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
              showPortfolio: true,
              showPricing: false,
              showBookingWidget: true,
              gallery: [],
              sections: [
                  {
                      id: `hero-${Date.now()}`,
                      type: 'HERO',
                      content: { headline: newPageName, description: 'Welcome to this page', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80' }
                  }
              ] 
          };
          setLocalSite(prev => ({ ...prev, pages: [...(prev.pages || []), newPage] }));
          setNewPageName('');
          setHasChanges(true);
          setActivePageId(newPage.id);
      }
  };

  const handleDeletePage = (id: string) => {
      if (id === 'home') {
          alert("Cannot delete Home page.");
          return;
      }
      if (window.confirm('Are you sure? This page will be deleted.')) {
          setLocalSite(prev => ({ ...prev, pages: prev.pages?.filter(p => p.id !== id) || [] }));
          if (activePageId === id) setActivePageId('home');
          setHasChanges(true);
      }
  };

  const handleSave = () => {
      onUpdateConfig({ ...config, site: localSite });
      setHasChanges(false);
  };

  // Render Theme Logic
  const renderTheme = () => {
      const commonProps = { 
          site: localSite, 
          activePage: activePageData, 
          packages, 
          users, 
          bookings, 
          config, 
          onBooking: onPublicBooking,
          onNavigate: (pageId: string) => {
              if (pageId === 'HOME') setActivePageId('home');
              else setActivePageId(pageId);
          }
      };

      // Wrap theme component in a div that applies the selected font
      // The SitePreviewFrame injects tailwind config, we'll use inline styles or specific classes
      let fontClass = 'font-sans';
      if (localSite.font === 'SERIF') fontClass = 'font-serif';
      if (localSite.font === 'DISPLAY') fontClass = 'font-display';
      if (localSite.font === 'MONO') fontClass = 'font-mono';

      const themeComponent = (() => {
          switch(localSite.theme) {
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
      })();

      return <div className={fontClass}>{themeComponent}</div>;
  };

  // ... (renderSectionEditor remain same) ...
  const renderSectionEditor = (section: SiteSection) => {
      // (Implementation same as before)
      return (
          <div className="space-y-3 p-4 bg-lumina-base border border-lumina-highlight rounded-xl mt-4 animate-in slide-in-from-top-2 duration-200">
              {/* ... editor UI code ... */}
              <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-white bg-lumina-accent/20 text-lumina-accent px-2 py-0.5 rounded border border-lumina-accent/20">{section.type.replace('_', ' ')}</span>
                  <button onClick={() => handleDeleteSection(section.id)} className="text-lumina-muted hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
              </div>
              {section.type !== 'GALLERY' && section.type !== 'PRICING' && section.type !== 'TESTIMONIALS' && section.type !== 'FAQ' && (
                  <div>
                      <label className="text-[10px] text-lumina-muted uppercase block mb-1 font-bold">Headline</label>
                      <input 
                          value={section.content.headline || ''}
                          onChange={(e) => handleUpdateSection(section.id, { headline: e.target.value })}
                          className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none"
                      />
                  </div>
              )}
              {(section.type === 'HERO' || section.type === 'TEXT_IMAGE' || section.type === 'CTA_BANNER') && (
                  <div>
                      <label className="text-[10px] text-lumina-muted uppercase block mb-1 font-bold">Description</label>
                      <textarea 
                          value={section.content.description || ''}
                          onChange={(e) => handleUpdateSection(section.id, { description: e.target.value })}
                          className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none min-h-[80px]"
                      />
                  </div>
              )}
              {(section.type === 'HERO' || section.type === 'TEXT_IMAGE') && (
                  <div>
                      <label className="text-[10px] text-lumina-muted uppercase block mb-1 font-bold">Image URL</label>
                      <div className="flex gap-2">
                          <input 
                              value={section.content.image || ''}
                              onChange={(e) => handleUpdateSection(section.id, { image: e.target.value })}
                              className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none"
                          />
                          {section.content.image && <img src={section.content.image} className="w-8 h-8 rounded object-cover border border-lumina-highlight" />}
                      </div>
                  </div>
              )}
              {section.type === 'TEXT_IMAGE' && (
                  <div>
                      <label className="text-[10px] text-lumina-muted uppercase block mb-1 font-bold">Layout</label>
                      <div className="flex bg-lumina-surface rounded-lg p-1 border border-lumina-highlight">
                          {['LEFT', 'RIGHT', 'CENTER'].map((layout) => (
                              <button 
                                  key={layout}
                                  onClick={() => handleUpdateSection(section.id, { layout })}
                                  className={`flex-1 text-[10px] font-bold py-1.5 rounded ${section.content.layout === layout ? 'bg-lumina-highlight text-white' : 'text-lumina-muted'}`}
                              >
                                  {layout}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
              {section.type === 'FEATURES' && (
                  <div>
                      <label className="text-[10px] text-lumina-muted uppercase block mb-1 font-bold">Features List</label>
                      {section.content.items?.map((item, idx) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-lumina-highlight/50 last:border-0">
                              <input 
                                  value={item.title} 
                                  onChange={(e) => {
                                      const newItems = [...(section.content.items || [])];
                                      newItems[idx].title = e.target.value;
                                      handleUpdateSection(section.id, { items: newItems });
                                  }}
                                  className="w-full bg-transparent border-none p-1 text-xs text-white font-bold placeholder-gray-600 focus:ring-0"
                                  placeholder="Title"
                              />
                              <input 
                                  value={item.text} 
                                  onChange={(e) => {
                                      const newItems = [...(section.content.items || [])];
                                      newItems[idx].text = e.target.value;
                                      handleUpdateSection(section.id, { items: newItems });
                                  }}
                                  className="w-full bg-transparent border-none p-1 text-xs text-lumina-muted placeholder-gray-700 focus:ring-0"
                                  placeholder="Description"
                              />
                          </div>
                      ))}
                      <button 
                          onClick={() => handleUpdateSection(section.id, { items: [...(section.content.items || []), { title: 'New Feature', text: 'Description here.' }] })}
                          className="w-full py-1.5 border border-dashed border-lumina-highlight rounded text-[10px] text-lumina-muted hover:text-white hover:border-lumina-accent"
                      >
                          + Add Feature
                      </button>
                  </div>
              )}
              {section.type === 'CTA_BANNER' && (
                  <div>
                      <label className="text-[10px] text-lumina-muted uppercase block mb-1 font-bold">Button Text</label>
                      <input 
                          value={section.content.buttonText || ''}
                          onChange={(e) => handleUpdateSection(section.id, { buttonText: e.target.value })}
                          className="w-full bg-lumina-surface border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none"
                      />
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-lumina-base overflow-hidden relative">
      
      {/* ... (Sidebar toggle & Overlay wrapper remain same) ... */}
      <AnimatePresence>
        {!isSidebarOpen && (
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-50 p-3 bg-lumina-surface border border-lumina-highlight rounded-xl text-white shadow-2xl hover:bg-lumina-highlight transition-colors flex items-center gap-2"
            >
                <PanelLeftOpen size={20} />
                <span className="text-xs font-bold hidden md:inline">Editor</span>
            </motion.button>
        )}
      </AnimatePresence>

      <motion.div 
        className="bg-lumina-surface/95 backdrop-blur-xl border-r border-lumina-highlight flex flex-col shadow-2xl z-40 overflow-hidden absolute md:relative inset-y-0 left-0"
        initial={false}
        animate={{ 
            x: isSidebarOpen ? 0 : "-100%",
            width: isMobile ? "100%" : 400,
            opacity: 1
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full w-full overflow-hidden"> 
            {/* Header */}
            <div className="p-4 border-b border-lumina-highlight flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onExit} className="p-2 rounded-lg hover:bg-lumina-highlight text-lumina-muted hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-white text-sm">Site Editor</h2>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                            <span className="text-[10px] text-lumina-muted hidden md:inline">{hasChanges ? 'Unsaved' : 'Published'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={!hasChanges} className="p-2 bg-lumina-accent text-lumina-base rounded-lg disabled:opacity-50 disabled:grayscale hover:brightness-110 transition-all">
                        <Save size={18} />
                    </button>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-lumina-highlight text-lumina-muted hover:text-white rounded-lg">
                        <PanelLeftClose size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Page Selector */}
                <div className="p-2 bg-lumina-base border-b border-lumina-highlight overflow-x-auto shrink-0">
                    <div className="flex gap-1">
                        <button 
                            onClick={() => { setActivePageId('home'); setActiveTab('SECTIONS'); }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2
                                ${activePageId === 'home' || activePageId === 'HOME' ? 'bg-lumina-highlight text-white border border-lumina-highlight' : 'text-lumina-muted hover:text-white'}
                            `}
                        >
                            <Home size={12} /> Home
                        </button>
                        {localSite.pages?.filter(p => p.id !== 'home').map(page => (
                            <button 
                                key={page.id}
                                onClick={() => { setActivePageId(page.id); setActiveTab('SECTIONS'); }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors
                                    ${activePageId === page.id ? 'bg-lumina-highlight text-white border border-lumina-highlight' : 'text-lumina-muted hover:text-white'}
                                `}
                            >
                                {page.title}
                            </button>
                        ))}
                        <button 
                            onClick={() => setActiveTab('PAGES')}
                            className={`px-2 py-1.5 rounded-lg text-lumina-muted hover:text-white hover:bg-lumina-highlight transition-colors`}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-lumina-highlight overflow-x-auto no-scrollbar shrink-0">
                    {[
                        { id: 'SECTIONS', icon: Layers, label: 'Blocks' },
                        { id: 'CONTENT', icon: Layout, label: 'Settings' },
                        { id: 'GALLERY', icon: ImageIcon, label: 'Gallery' },
                        { id: 'PAGES', icon: File, label: 'Pages' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors
                                ${activeTab === tab.id 
                                    ? 'border-lumina-accent text-lumina-accent bg-lumina-accent/5' 
                                    : 'border-transparent text-lumina-muted hover:text-white hover:bg-lumina-highlight/30'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-lumina-surface/50 pb-20 md:pb-4">
                    {activeTab === 'CONTENT' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Theme Selection</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {THEMES.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleGlobalChange('theme', theme.id)}
                                            className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${localSite.theme === theme.id ? 'border-lumina-accent ring-2 ring-lumina-accent/30 scale-105 z-10' : 'border-lumina-highlight hover:border-white/50'}`}
                                        >
                                            <div className="absolute inset-0" style={{ backgroundColor: theme.color }}></div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                {localSite.theme === theme.id && <Check size={20} className="text-white drop-shadow-md" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* UPDATED: Typography Selection */}
                            <div className="space-y-3 border-t border-lumina-highlight pt-6">
                                <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-widest flex items-center gap-2"><Type size={14}/> Typography</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {FONTS.map(font => (
                                        <button
                                            key={font.id}
                                            onClick={() => handleGlobalChange('font', font.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${localSite.font === font.id ? 'bg-lumina-highlight border-lumina-accent text-white' : 'bg-lumina-surface border-lumina-highlight text-lumina-muted hover:border-white'}`}
                                        >
                                            <div className="text-left">
                                                <span className={`block text-sm ${font.id === 'SERIF' ? 'font-serif' : font.id === 'DISPLAY' ? 'font-display' : font.id === 'MONO' ? 'font-mono' : 'font-sans'}`}>
                                                    {font.label}
                                                </span>
                                                <span className="text-[10px] opacity-60">{font.desc}</span>
                                            </div>
                                            {localSite.font === font.id && <Check size={16} className="text-lumina-accent"/>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-lumina-highlight pt-6">
                                <h3 className="text-xs font-bold text-lumina-muted uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Global Meta</h3>
                                <div><label className="text-[10px] font-bold text-lumina-muted uppercase mb-1 block">Site Title</label><input value={localSite.title} onChange={(e) => handleGlobalChange('title', e.target.value)} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-sm text-white focus:border-lumina-accent outline-none"/></div>
                                <div><label className="text-[10px] font-bold text-lumina-muted uppercase mb-1 block">Hero Headline (Default)</label><textarea value={localSite.headline} onChange={(e) => handleGlobalChange('headline', e.target.value)} className="w-full bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-sm text-white focus:border-lumina-accent outline-none min-h-[80px]"/></div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'SECTIONS' && (
                        // ... sections content same ...
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-2">
                                {['TEXT_IMAGE', 'FEATURES', 'GALLERY', 'PRICING', 'CTA_BANNER', 'FAQ'].map((type) => (
                                    <button key={type} onClick={() => handleAddSection(type as SectionType)} className="flex flex-col items-center justify-center p-3 bg-lumina-base border border-lumina-highlight rounded-xl hover:border-lumina-accent hover:bg-lumina-accent/10 transition-all group">
                                        <Plus size={16} className="text-lumina-muted group-hover:text-lumina-accent mb-1" />
                                        <span className="text-[9px] font-bold text-white group-hover:text-lumina-accent uppercase">{type.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {getActiveSections().length === 0 && (
                                    <p className="text-center text-lumina-muted text-xs py-4 italic">No blocks on this page. Add one above.</p>
                                )}
                                {getActiveSections().map((section, index) => (
                                    <div key={section.id} className={`border rounded-xl transition-all ${selectedSectionId === section.id ? 'border-lumina-accent bg-lumina-accent/5' : 'border-lumina-highlight bg-lumina-surface'}`}>
                                        <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setSelectedSectionId(selectedSectionId === section.id ? null : section.id)}>
                                            <GripVertical size={14} className="text-lumina-muted"/>
                                            <span className="text-xs font-bold text-white flex-1 uppercase tracking-wider">{section.type.replace('_', ' ')}</span>
                                            <div className="flex gap-1"><button onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'UP'); }} className="p-1 hover:bg-lumina-highlight rounded text-lumina-muted"><ArrowUp size={12}/></button><button onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'DOWN'); }} className="p-1 hover:bg-lumina-highlight rounded text-lumina-muted"><ArrowDown size={12}/></button></div>
                                        </div>
                                        {selectedSectionId === section.id && renderSectionEditor(section)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'GALLERY' && (
                        // ... gallery content same ...
                        <div className="space-y-4">
                            <p className="text-xs text-lumina-muted">Global Gallery Images (Used in Gallery Blocks)</p>
                            <div className="flex gap-2">
                                <input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none" placeholder="Image URL..." />
                                <button onClick={() => { if(newGalleryUrl) { handleGlobalChange('gallery', [...localSite.gallery, {id: `g-${Date.now()}`, url: newGalleryUrl, caption: ''}]); setNewGalleryUrl(''); } }} className="px-3 bg-lumina-accent text-lumina-base rounded-lg font-bold text-xs">Add</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {localSite.gallery.map(img => (
                                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                                        <img src={img.url} className="w-full h-full object-cover" />
                                        <button onClick={() => handleGlobalChange('gallery', localSite.gallery.filter(g => g.id !== img.id))} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded hover:bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'PAGES' && (
                        // ... pages content same ...
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <input value={newPageName} onChange={(e) => setNewPageName(e.target.value)} placeholder="New Page Name" className="flex-1 bg-lumina-base border border-lumina-highlight rounded-lg p-2 text-xs text-white focus:border-lumina-accent outline-none" />
                                <button onClick={handleAddPage} disabled={!newPageName} className="px-3 bg-lumina-accent text-lumina-base rounded-lg font-bold text-xs">Add</button>
                            </div>
                            <div className="space-y-2">
                                {localSite.pages?.map(page => (
                                    <div key={page.id} className="flex items-center justify-between p-3 bg-lumina-base border border-lumina-highlight rounded-xl group">
                                        <div>
                                            <p className="text-xs font-bold text-white">{page.title}</p>
                                            <p className="text-[10px] text-lumina-muted font-mono">{page.id === 'home' ? '/' : `/${page.slug}`}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {page.id !== 'home' && (
                                                <button onClick={() => handleDeletePage(page.id)} className="p-1.5 hover:text-rose-500 text-lumina-muted"><Trash2 size={14}/></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
      </motion.div>

      {/* --- PREVIEW AREA --- */}
      <div className="flex-1 flex flex-col h-full bg-[#111] relative overflow-hidden">
          <div className="h-14 border-b border-lumina-highlight flex justify-center items-center gap-4 bg-lumina-base z-10 shrink-0">
              <button onClick={() => setPreviewMode('DESKTOP')} className={`p-2 rounded-lg transition-colors ${previewMode === 'DESKTOP' ? 'text-white bg-lumina-highlight' : 'text-lumina-muted hover:text-white'}`}><Monitor size={18} /></button>
              <button onClick={() => setPreviewMode('MOBILE')} className={`p-2 rounded-lg transition-colors ${previewMode === 'MOBILE' ? 'text-white bg-lumina-highlight' : 'text-lumina-muted hover:text-white'}`}><Smartphone size={18} /></button>
              <div className="w-px h-6 bg-lumina-highlight mx-2"></div>
              <a href={publicUrl} target="_blank" className="flex items-center gap-2 text-xs font-bold text-lumina-accent hover:underline bg-lumina-accent/10 px-3 py-1 rounded-full border border-lumina-accent/20"><Globe size={12} /> Live</a>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-900 p-4 md:p-8 relative custom-scrollbar">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
              <motion.div layout className={`bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-in-out relative ${previewMode === 'MOBILE' ? 'w-[375px] h-[812px] rounded-[3rem] border-[8px] border-gray-900 ring-4 ring-gray-800' : 'w-full h-full rounded-lg border border-lumina-highlight'}`}>
                  {previewMode === 'MOBILE' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-50"></div>}
                  
                  {/* USING IFRAME COMPONENT FOR ISOLATION */}
                  <SitePreviewFrame className="w-full h-full bg-white">
                      {renderTheme()}
                  </SitePreviewFrame>
              </motion.div>
          </div>
      </div>
    </div>
  );
};

export default SiteBuilderView;
