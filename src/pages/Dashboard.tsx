import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';
import JurusanContent from '@/components/JurusanContent';
import PenggunaContent from '@/components/PenggunaContent';
import PrakerinContent from '@/components/PrakerinContent';
import LaporanContent from '@/components/LaporanContent';
import PlaceholderContent from '@/components/PlaceholderContent';

export type MenuType = 'dashboard' | 'jurusan' | 'pengguna' | 'prakerin' | 'laporan' | 'sekolah' | 'kelas' | 'siswa';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [user, setUser] = useState<any>(null);
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
      case 'jurusan':
        return user?.role === 'admin' ? <JurusanContent /> : <PlaceholderContent title="Akses Ditolak" />;
      case 'pengguna':
        return user?.role === 'admin' ? <PenggunaContent /> : <PlaceholderContent title="Akses Ditolak" />;
      case 'prakerin':
        return <PrakerinContent user={user} />;
      case 'laporan':
        return <LaporanContent user={user} />;
      case 'sekolah':
      case 'kelas':
      case 'siswa':
        return <PlaceholderContent title={`Data ${activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}`} />;
      default:
        return <DashboardContent user={user} />;
    }
  };

  if (!user) {
    return null;
  }

  // Simple layout for Kaprog (no sidebar)
  if (user.role === 'kaprog') {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <DashboardContent user={user} />
        </div>
      </div>
    );
  }

  // Full admin layout with sidebar
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
        user={user}
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