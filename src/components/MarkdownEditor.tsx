import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Edit2, Eye } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "# Rubrik\n\nSkriv ditt innehåll här...",
  minHeight = "200px"
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>('edit');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="edit" className="gap-1.5">
          <Edit2 className="h-3.5 w-3.5" />
          Redigera
        </TabsTrigger>
        <TabsTrigger value="preview" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          Förhandsvisning
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="edit" className="mt-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
          style={{ minHeight }}
        />
      </TabsContent>
      
      <TabsContent value="preview" className="mt-0">
        <div 
          className="border rounded-md p-4 bg-background overflow-auto"
          style={{ minHeight }}
        >
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground italic">Inget innehåll att förhandsvisa</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
