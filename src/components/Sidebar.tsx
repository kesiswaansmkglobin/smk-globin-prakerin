import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MenuType } from '@/pages/Dashboard';

interface SidebarProps {
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
  user: any;
}

const Sidebar = ({ activeMenu, setActiveMenu, user }: SidebarProps) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sekolah', label: 'Data Sekolah', icon: School },
    { id: 'jurusan', label: 'Data Jurusan', icon: BookOpen },
    { id: 'kelas', label: 'Data Kelas', icon: GraduationCap },
    { id: 'siswa', label: 'Data Siswa', icon: UserCircle },
    { id: 'prakerin', label: 'Data Prakerin', icon: Briefcase },
    { id: 'laporan', label: 'Rekap dan Laporan', icon: FileText },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, adminOnly: true },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <Card className="w-64 h-screen rounded-none border-r border-border/50 card-gradient">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold gradient-text">SIM Prakerin</h2>
          <p className="text-sm text-muted-foreground">SMK GLOBIN</p>
        </div>

        {/* User Info */}
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
          <p className="text-xs text-muted-foreground">
            {user?.role === 'admin' ? 'Administrator' : `Kaprog ${user?.jurusan}`}
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                 className={`w-full justify-start text-left ${
                   isActive 
                     ? 'bg-primary text-primary-foreground glow-effect' 
                     : 'hover:bg-secondary/50'
                 }`}
                onClick={() => setActiveMenu(item.id as MenuType)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            variant="outline" 
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Sidebar;