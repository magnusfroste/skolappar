import { useState } from 'react';
import { Share2, Copy, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { QRCodeModal } from './QRCodeModal';

interface ShareButtonProps {
  appId: string;
  appTitle: string;
}

export function ShareButton({ appId, appTitle }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  
  const shareUrl = `${window.location.origin}/app/${appId}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Länk kopierad! Dela med andra föräldrar 🎉');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kunde inte kopiera länk');
    }
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: appTitle,
          text: `Kolla in "${appTitle}" på Skolappar!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed silently
      }
    } else {
      handleCopyLink();
    }
  };

  // Use native share on mobile if available
  if (navigator.share) {
    return (
      <>
        <Button variant="secondary" size="sm" className="gap-2" onClick={handleNativeShare}>
          <Share2 className="w-4 h-4" />
          Dela
        </Button>
        <QRCodeModal 
          open={qrOpen} 
          onOpenChange={setQrOpen} 
          url={shareUrl} 
          title={appTitle} 
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Dela
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopierad!' : 'Kopiera länk'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setQrOpen(true)} className="gap-2 cursor-pointer">
            <QrCode className="w-4 h-4" />
            Visa QR-kod
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <QRCodeModal 
        open={qrOpen} 
        onOpenChange={setQrOpen} 
        url={shareUrl} 
        title={appTitle} 
      />
    </>
  );
}
