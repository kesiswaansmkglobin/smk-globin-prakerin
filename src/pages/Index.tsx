import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { School, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      
      <Card className="w-full max-w-2xl p-8 card-gradient border border-border/50 relative z-10 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10 glow-effect">
            <School className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold gradient-text mb-4">
          SIM Prakerin SMK GLOBIN
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Sistem Informasi Manajemen Prakerin
        </p>
        <p className="text-muted-foreground mb-8">
          Platform terpadu untuk mengelola data praktik kerja industri siswa SMK GLOBIN dengan fitur lengkap dan mudah digunakan.
        </p>
        
        <div className="space-y-4">
          <Button 
            className="w-full glow-effect" 
            size="lg"
            onClick={() => navigate('/')}
          >
            Masuk ke Sistem
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>Demo Account:</p>
            <p>admin@smkglobin.sch.id / Smkglobin1@</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;
