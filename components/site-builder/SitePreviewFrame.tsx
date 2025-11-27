
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface SitePreviewFrameProps {
  children: React.ReactNode;
  className?: string;
  customCss?: string; 
}

const SitePreviewFrame: React.FC<SitePreviewFrameProps> = ({ children, className, customCss }) => {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const mountNode = contentRef?.contentWindow?.document?.body;

  useEffect(() => {
    if (!contentRef?.contentWindow) return;

    const doc = contentRef.contentWindow.document;
    
    // Inject Tailwind CSS (Check first)
    if (!doc.getElementById('tailwind-script')) {
        const script = doc.createElement('script');
        script.id = 'tailwind-script';
        script.src = "https://cdn.tailwindcss.com";
        doc.head.appendChild(script);
    }

    // Inject Fonts (Check first)
    if (!doc.getElementById('font-link')) {
        const fontLink = doc.createElement('link');
        fontLink.id = 'font-link';
        fontLink.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Syne:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap";
        fontLink.rel = "stylesheet";
        doc.head.appendChild(fontLink);
    }

    // Basic Styles reset
    if (!doc.getElementById('base-styles')) {
        const style = doc.createElement('style');
        style.id = "base-styles";
        style.innerHTML = `
          body { margin: 0; overflow-x: hidden; }
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #1c1917; }
          ::-webkit-scrollbar-thumb { background: #292524; border-radius: 3px; }
        `;
        doc.head.appendChild(style);
    }

  }, [contentRef]);

  // Inject Custom CSS dynamically
  useEffect(() => {
      if (!contentRef?.contentWindow) return;
      const doc = contentRef.contentWindow.document;
      
      let cssStyle = doc.getElementById('custom-css');
      if (!cssStyle) {
          cssStyle = doc.createElement('style');
          cssStyle.id = 'custom-css';
          doc.head.appendChild(cssStyle);
      }
      if (customCss) {
          cssStyle.innerHTML = customCss;
      } else {
          cssStyle.innerHTML = '';
      }
  }, [contentRef, customCss]);

  return (
    <iframe
      ref={setContentRef}
      className={className}
      title="Site Preview"
      style={{ border: 'none', width: '100%', height: '100%' }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
};

export default SitePreviewFrame;
