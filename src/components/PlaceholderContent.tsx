import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface PlaceholderContentProps {
  title: string;
  user?: any;
}

const PlaceholderContent = ({ title, user }: PlaceholderContentProps) => {
  return (
    <div className="space-y-6">
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Anda tidak memiliki akses untuk menggunakan fitur ini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderContent;