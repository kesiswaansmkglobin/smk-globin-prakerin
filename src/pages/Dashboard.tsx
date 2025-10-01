import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';
import JurusanContent from '@/components/JurusanContent';
import PenggunaContent from '@/components/PenggunaContent';
import PrakerinContent from '@/components/PrakerinContent';
import LaporanContent from '@/components/LaporanContent';
import SekolahContent from '@/components/SekolahContent';
import KelasContent from '@/components/KelasContent';
import SiswaContent from '@/components/SiswaContent';
import PengaturanContent from '@/components/PengaturanContent';
import PlaceholderContent from '@/components/PlaceholderContent';

export type MenuType = 'dashboard' | 'sekolah' | 'jurusan' | 'kelas' | 'siswa' | 'prakerin' | 'laporan' | 'pengguna' | 'pengaturan';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardContent user={user} />;
      case 'sekolah':
        return <SekolahContent user={user} />;
      case 'jurusan':
        return <JurusanContent user={user} />;
      case 'kelas':
        return <KelasContent user={user} />;
      case 'siswa':
        return <SiswaContent user={user} />;
      case 'prakerin':
        return <PrakerinContent user={user} />;
      case 'laporan':
        return <LaporanContent user={user} />;
      case 'pengguna':
        return user?.role === 'admin' ? <PenggunaContent user={user} /> : <PlaceholderContent title="Akses Ditolak" />;
      case 'pengaturan':
        return user?.role === 'admin' ? <PengaturanContent user={user} /> : <PlaceholderContent title="Akses Ditolak" />;
      default:
        return <DashboardContent user={user} />;
    }
  };

  if (!user) {
    return null;
  }

  // Standard layout for all users (admin, kaprog, kepala_sekolah)
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
        user={user}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;