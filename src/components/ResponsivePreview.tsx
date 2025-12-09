import { Smartphone, Tablet, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsivePreviewProps {
  url: string;
}

const devices = [
  { 
    name: "Mobil", 
    icon: Smartphone, 
    width: 375, 
    height: 667,
    scale: 0.4 
  },
  { 
    name: "Platta", 
    icon: Tablet, 
    width: 768, 
    height: 1024,
    scale: 0.35 
  },
  { 
    name: "Desktop", 
    icon: Monitor, 
    width: 1280, 
    height: 800,
    scale: 0.4 
  },
];

export function ResponsivePreview({ url }: ResponsivePreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {devices.map((device) => (
        <div key={device.name} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <device.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{device.name}</span>
            <span className="text-xs">({device.width}×{device.height})</span>
          </div>
          
          <div 
            className={cn(
              "bg-card rounded-xl border-2 border-border shadow-lg overflow-hidden",
              "relative"
            )}
            style={{
              width: device.width * device.scale,
              height: device.height * device.scale,
            }}
          >
            <iframe
              src={url}
              title={`${device.name} förhandsvisning`}
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: device.width,
                height: device.height,
                transform: `scale(${device.scale})`,
                border: "none",
              }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
