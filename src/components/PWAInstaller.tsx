import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default install prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install button
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Optionally, send analytics about the installation
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    // Hide the install button
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">Install App</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add this app to your home screen for faster access and offline use.
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex space-x-3">
          <Button
            onClick={handleInstallClick}
            className="w-full justify-center"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstaller;
