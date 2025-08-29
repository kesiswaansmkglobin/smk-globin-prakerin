import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction } from 'lucide-react';

interface PlaceholderContentProps {
  title: string;
}

const PlaceholderContent = ({ title }: PlaceholderContentProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">{title}</h1>
        <p className="text-muted-foreground">
          Halaman ini sedang dalam tahap pengembangan
        </p>
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="mr-2 h-5 w-5 text-primary" />
            Dalam Pengembangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10 glow-effect">
                <Construction className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Fitur Segera Hadir</h3>
            <p className="text-muted-foreground mb-4">
              Halaman {title.toLowerCase()} sedang dalam tahap pengembangan dan akan tersedia segera.
            </p>
            <Badge variant="outline" className="text-primary border-primary/50">
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderContent;