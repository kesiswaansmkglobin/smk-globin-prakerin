import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load heavy content components for better performance
const DashboardContent = lazy(() => import('@/components/DashboardContent'));
const JurusanContent = lazy(() => import('@/components/JurusanContent'));
const PenggunaContent = lazy(() => import('@/components/PenggunaContent'));
const PrakerinContent = lazy(() => import('@/components/PrakerinContent'));
const LaporanContent = lazy(() => import('@/components/LaporanContent'));
const SekolahContent = lazy(() => import('@/components/SekolahContent'));
const KelasContent = lazy(() => import('@/components/KelasContent'));
const SiswaContent = lazy(() => import('@/components/SiswaContent'));
const PengaturanContent = lazy(() => import('@/components/PengaturanContent'));
const PlaceholderContent = lazy(() => import('@/components/PlaceholderContent'));

// New menu components
const GuruPembimbingContent = lazy(() => import('@/components/GuruPembimbingContent'));
const BimbinganContent = lazy(() => import('@/components/BimbinganContent'));
const NilaiPrakerinContent = lazy(() => import('@/components/NilaiPrakerinContent'));
const LaporanPrakerinContent = lazy(() => import('@/components/LaporanPrakerinContent'));
const JadwalSidangContent = lazy(() => import('@/components/JadwalSidangContent'));

// Guru Pembimbing Dashboard
const GuruPembimbingDashboard = lazy(() => import('@/components/GuruPembimbingDashboard'));

export type MenuType = 
  | 'dashboard' 
  | 'sekolah' 
  | 'jurusan' 
  | 'kelas' 
  | 'siswa' 
  | 'prakerin' 
  | 'guru_pembimbing'
  | 'bimbingan'
  | 'nilai'
  | 'laporan_prakerin'
  | 'jadwal_sidang'
  | 'laporan' 
  | 'pengguna' 
  | 'pengaturan';

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const renderContent = () => {
    // Special dashboard for guru_pembimbing
    if (user?.role === 'guru_pembimbing') {
      return <GuruPembimbingDashboard user={user} />;
    }

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
      case 'guru_pembimbing':
        return <GuruPembimbingContent user={user} />;
      case 'bimbingan':
        return <BimbinganContent user={user} />;
      case 'nilai':
        return <NilaiPrakerinContent user={user} />;
      case 'laporan_prakerin':
        return <LaporanPrakerinContent user={user} />;
      case 'jadwal_sidang':
        return <JadwalSidangContent user={user} />;
      case 'laporan':
        return <LaporanContent user={user} />;
      case 'pengguna':
        return (user?.role === 'admin') ? <PenggunaContent user={user} /> : <PlaceholderContent title="Akses Ditolak" />;
      case 'pengaturan':
        return (user?.role === 'admin') ? <PengaturanContent user={user} /> : <PlaceholderContent title="Akses Ditolak" />;
      default:
        return <DashboardContent user={user} />;
    }
  };

  // Guru pembimbing gets a simplified interface
  if (user?.role === 'guru_pembimbing') {
    return (
      <div className="min-h-screen bg-background">
        <main className="overflow-auto">
          <div className="p-4 md:p-6">
            <Suspense fallback={<LoadingSpinner />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    );
  }

  const menuItems: MenuType[] = [
    'dashboard', 'sekolah', 'jurusan', 'kelas', 'siswa', 'prakerin', 
    'guru_pembimbing', 'bimbingan', 'nilai', 'laporan_prakerin', 'jadwal_sidang',
    'laporan', 'pengguna', 'pengaturan'
  ];
  
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile) {
        const currentIndex = menuItems.indexOf(activeMenu);
        if (currentIndex < menuItems.length - 1) {
          setActiveMenu(menuItems[currentIndex + 1]);
        }
      }
    },
    onSwipedRight: () => {
      if (isMobile) {
        const currentIndex = menuItems.indexOf(activeMenu);
        if (currentIndex > 0) {
          setActiveMenu(menuItems[currentIndex - 1]);
        }
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
        <Sidebar 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu}
          user={user}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}
      
      {/* Main Content */}
      <main {...handlers} className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-6">
          <Suspense fallback={<LoadingSpinner />}>
            {renderContent()}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNav 
          activeMenu={activeMenu} 
          setActiveMenu={setActiveMenu}
          user={user}
        />
      )}
    </div>
  );
};

export default Dashboard;
