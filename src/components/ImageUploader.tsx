import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadAppImage } from '@/hooks/useSubmitApp';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadAppImage();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Fel filtyp',
        description: 'Vänligen välj en bildfil (PNG, JPG, GIF)',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Filen är för stor',
        description: 'Bilden får max vara 5MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      const url = await uploadMutation.mutateAsync(file);
      onChange(url);
      toast({
        title: 'Bild uppladdad!',
        description: 'Din bild har laddats upp'
      });
    } catch (error) {
      toast({
        title: 'Uppladdning misslyckades',
        description: 'Kunde inte ladda upp bilden, försök igen',
        variant: 'destructive'
      });
    }
  }, [uploadMutation, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  if (value) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-card">
        <img 
          src={value} 
          alt="App preview" 
          className="w-full h-48 object-cover"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
        ${isDragging 
          ? 'border-primary bg-primary/10 scale-[1.02]' 
          : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploadMutation.isPending}
      />
      
      <div className="flex flex-col items-center gap-3">
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Laddar upp...</p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-primary/10">
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isDragging ? 'Släpp bilden här!' : 'Dra och släpp eller klicka'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG eller GIF (max 5MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
