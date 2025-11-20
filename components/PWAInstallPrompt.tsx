import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember user dismissed the prompt (optional - could use localStorage)
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  // Check if user previously dismissed
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">ტელეფონში დააინსტალირე Bite</h3>
            <p className="text-sm text-gray-600">
              მარტივად იქონიე წვდომა აპლიკაციაზე ტელეფონის მთავარი ეკრანიდან
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-2"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-4 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            არა, გმადლობთ
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{backgroundColor: '#f27141'}}
          >
            <PlusIcon className="w-4 h-4" />
            დაინსტალირება
          </button>
        </div>
      </div>
    </div>
  );
};