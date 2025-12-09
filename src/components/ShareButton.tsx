import { useState } from 'react';
import { Share2, Copy, Check, QrCode, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const shareText = `Kolla in "${appTitle}" på Skolappar!`;
  
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
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      handleCopyLink();
    }
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleFacebookShare} className="gap-2 cursor-pointer">
            <Facebook className="w-4 h-4" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTwitterShare} className="gap-2 cursor-pointer">
            <Twitter className="w-4 h-4" />
            X (Twitter)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLinkedInShare} className="gap-2 cursor-pointer">
            <Linkedin className="w-4 h-4" />
            LinkedIn
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
