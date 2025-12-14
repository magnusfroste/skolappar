import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

interface CompactAppCardProps {
  id: string;
  title: string;
  imageUrl?: string;
}

export function CompactAppCard({ id, title, imageUrl }: CompactAppCardProps) {
  return (
    <Link to={`/app/${id}`} className="block group">
      <Card className="overflow-hidden border-0 bg-card/90 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 aspect-square">
        {/* Thumbnail - full card */}
        <div className="relative w-full h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors duration-300">
              <span className="group-hover:scale-110 transition-transform duration-300">📱</span>
            </div>
          )}
          
          {/* Title overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 pt-8">
            <h3 className="font-heading font-bold text-sm text-white line-clamp-2 drop-shadow-md">
              {title}
            </h3>
          </div>
        </div>
      </Card>
    </Link>
  );
}
