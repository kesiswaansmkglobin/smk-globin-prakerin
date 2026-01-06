import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Briefcase, 
  FileText, 
  School, 
  GraduationCap, 
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  ClipboardList,
  Star,
  FileCheck,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MenuType } from '@/pages/Dashboard';
import ThemeToggle from '@/components/ThemeToggle';

interface SidebarProps {
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
  user: any;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ activeMenu, setActiveMenu, user, collapsed, setCollapsed }: SidebarProps) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sekolah', label: 'Data Sekolah', icon: School, adminOnly: true },
    { id: 'jurusan', label: 'Data Jurusan', icon: BookOpen, adminOnly: true },
    { id: 'kelas', label: 'Data Kelas', icon: GraduationCap },
    { id: 'siswa', label: 'Data Siswa', icon: UserCircle },
    { id: 'guru_pembimbing', label: 'Guru Pembimbing', icon: UserCheck },
    { id: 'prakerin', label: 'Data Prakerin', icon: Briefcase },
    { id: 'bimbingan', label: 'Bimbingan', icon: ClipboardList },
    { id: 'nilai', label: 'Nilai Prakerin', icon: Star },
    { id: 'laporan_prakerin', label: 'Laporan Prakerin', icon: FileCheck },
    { id: 'jadwal_sidang', label: 'Jadwal Sidang', icon: Calendar },
    { id: 'laporan', label: 'Rekap dan Laporan', icon: FileText },
    { id: 'pengguna', label: 'Data Pengguna', icon: Users, adminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, adminOnly: true },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredMenuItems = menuItems.filter(item => {
    // Admin can access everything
    if (user?.role === 'admin') return true;
    
    // Skip admin-only items for non-admins
    if (item.adminOnly) return false;
    
    // For kaprog, show relevant menus
    if (user?.role === 'kaprog') {
      return ['dashboard', 'kelas', 'siswa', 'guru_pembimbing', 'prakerin', 'bimbingan', 'nilai', 'laporan_prakerin', 'jadwal_sidang', 'laporan'].includes(item.id);
    }
    
    // For kepala_sekolah, show all menus except admin-only
    if (user?.role === 'kepala_sekolah') {
      return !item.adminOnly;
    }
    
    return true;
  });

  return (
    <Card className={`${collapsed ? 'w-16' : 'w-64'} min-h-screen h-full rounded-none border-r border-border/50 card-gradient transition-all duration-300 relative overflow-hidden flex flex-col`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
      <div className={`${collapsed ? 'p-2' : 'p-6'} flex-1 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className={`${collapsed ? 'hidden' : 'flex items-center space-x-3 flex-1'}`}>
            <img 
              src="/lovable-uploads/05a99674-2f4f-42a1-b184-4bab79cc07c7.png" 
              alt="SMK Globin Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h2 className="text-lg font-bold text-primary">SIM Prakerin</h2>
              <p className="text-xs text-muted-foreground">SMK GLOBIN BOGOR</p>
            </div>
          </div>
          {collapsed && (
            <div className="flex items-center justify-center w-full">
              <img 
                src="/lovable-uploads/05a99674-2f4f-42a1-b184-4bab79cc07c7.png" 
                alt="SMK Globin Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {!collapsed && <ThemeToggle />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-secondary/50"
            >
              {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'admin' 
                ? 'Administrator' 
                : user?.role === 'kepala_sekolah'
                ? 'Kepala Sekolah'
                : `Kaprog ${user?.jurusan}`}
            </p>
          </div>
        )}

        {/* Navigation Menu with ScrollArea - always show scrollbar */}
        <ScrollArea className="flex-1 -mx-2 px-2 my-4 [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-320px)] [&_[data-radix-scroll-area-scrollbar]]:!opacity-100">
          <nav className="space-y-2 pr-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                   className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'} text-left ${
                     isActive 
                       ? 'bg-primary text-primary-foreground glow-effect' 
                       : 'hover:bg-secondary/50'
                   }`}
                  onClick={() => setActiveMenu(item.id as MenuType)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`${collapsed ? '' : 'mr-3'} h-4 w-4`} />
                  {!collapsed && item.label}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            size={collapsed ? "sm" : "default"}
            className={`w-full text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/20 ${collapsed ? 'px-2' : ''} transition-colors`}
            onClick={handleLogout}
            title={collapsed ? "Keluar" : undefined}
          >
            <LogOut className={`${collapsed ? '' : 'mr-2'} h-4 w-4`} />
            {!collapsed && "Keluar"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default memo(Sidebar);
