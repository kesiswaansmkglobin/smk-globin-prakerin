import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Briefcase, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardContentProps {
  user: any;
}

const DashboardContent = ({ user }: DashboardContentProps) => {
  const [stats, setStats] = useState({
    totalJurusan: 0,
    totalPengguna: 0,
    totalPrakerin: 0,
    aktivePrakerin: 0
  });
  const [recentPrakerin, setRecentPrakerin] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load statistics
      const [jurusanRes, penggunaRes, prakerinRes] = await Promise.all([
        supabase.from('jurusan').select('*', { count: 'exact' }),
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('prakerin').select('*', { count: 'exact' })
      ]);

      setStats({
        totalJurusan: jurusanRes.count || 0,
        totalPengguna: user?.role === 'admin' ? (penggunaRes.count || 0) : 0,
        totalPrakerin: prakerinRes.count || 0,
        aktivePrakerin: 0 // Will calculate based on current date
      });

      // Load recent prakerin data
      const { data: prakerin } = await supabase
        .from('prakerin')
        .select('*, siswa(*, jurusan(nama))')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentPrakerin(prakerin || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, color = "primary" }) => (
    <Card className="card-gradient border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {user?.name || 'Admin'}! 
          {user?.role === 'kaprog' && ` - Kepala Program ${user.jurusan}`}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'admin' && (
          <StatCard
            title="Total Jurusan"
            value={stats.totalJurusan}
            icon={BookOpen}
            description="Jurusan terdaftar"
            color="primary"
          />
        )}
        
        {user?.role === 'admin' && (
          <StatCard
            title="Total Pengguna"
            value={stats.totalPengguna}
            icon={Users}
            description="Kepala Program"
            color="secondary"
          />
        )}
        
        <StatCard
          title="Total Prakerin"
          value={stats.totalPrakerin}
          icon={Briefcase}
          description={user?.role === 'kaprog' ? `Jurusan ${user.jurusan}` : "Semua jurusan"}
          color="accent"
        />
        
        <StatCard
          title="Aktif Prakerin"
          value={stats.aktivePrakerin}
          icon={TrendingUp}
          description="Sedang berlangsung"
          color="primary"
        />
      </div>

      {/* Recent Prakerin Data */}
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle>Data Prakerin Terbaru</CardTitle>
          <CardDescription>
            {user?.role === 'kaprog' 
              ? `Data prakerin untuk jurusan ${user.jurusan}` 
              : 'Data prakerin dari semua jurusan'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : recentPrakerin.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data prakerin
            </div>
          ) : (
            <div className="space-y-4">
              {recentPrakerin.slice(0, 5).map((prakerin: any, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div>
                    <p className="font-medium">{prakerin.siswa?.nama || 'Nama tidak tersedia'}</p>
                    <p className="text-sm text-muted-foreground">
                      {prakerin.siswa?.jurusan?.nama || 'Jurusan tidak tersedia'} • NIS: {prakerin.siswa?.nis || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {prakerin.tempat_prakerin || 'Tempat tidak tersedia'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {prakerin.tanggal_mulai && prakerin.tanggal_selesai 
                        ? `${new Date(prakerin.tanggal_mulai).toLocaleDateString('id-ID')} s/d ${new Date(prakerin.tanggal_selesai).toLocaleDateString('id-ID')}`
                        : 'Periode tidak tersedia'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardContent;