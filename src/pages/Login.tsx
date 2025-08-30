import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.username,
        password: formData.password,
      });

      if (error) {
        // If Supabase auth fails, check for Kaprog accounts in users table
        const { data: users, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('username', formData.username)
          .eq('password', formData.password)
          .single();

        if (dbError || !users) {
          setError('Username atau password salah');
          return;
        }

        // Store Kaprog user data in localStorage
        localStorage.setItem('user', JSON.stringify(users));
        navigate('/dashboard');
        return;
      }

      // Handle successful Supabase auth (admin user)
      if (data.user) {
        const userProfile = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'Administrator',
          role: data.user.user_metadata?.role || 'admin',
          username: data.user.email,
        };
        
        localStorage.setItem('user', JSON.stringify(userProfile));
        navigate('/dashboard');
      }

    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      
      <Card className="w-full max-w-md p-8 card-gradient border border-border/50 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 glow-effect">
              <School className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">
            SIM Prakerin
          </h1>
          <p className="text-muted-foreground">SMK GLOBIN</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem Informasi Manajemen Prakerin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username (Email)</Label>
            <Input
              id="username"
              name="username"
              type="email"
              value={formData.username}
              onChange={handleChange}
              placeholder="Masukkan username"
              required
              className="bg-input/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              required
              className="bg-input/50 border-border/50"
            />
          </div>

          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full glow-effect"
            disabled={loading}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>
        </form>

      </Card>
    </div>
  );
};

export default Login;