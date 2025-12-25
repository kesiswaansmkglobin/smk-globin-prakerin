import React, { memo } from 'react';
import { MenuType } from '@/pages/Dashboard';
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
  MoreHorizontal,
  UserCheck,
  ClipboardList,
  Star,
  FileCheck,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BottomNavProps {
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
  user: any;
}

const BottomNav = ({ activeMenu, setActiveMenu, user }: BottomNavProps) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sekolah', label: 'Sekolah', icon: School, adminOnly: true },
    { id: 'jurusan', label: 'Jurusan', icon: BookOpen, adminOnly: true },
    { id: 'kelas', label: 'Kelas', icon: GraduationCap },
    { id: 'siswa', label: 'Siswa', icon: UserCircle },
    { id: 'guru_pembimbing', label: 'Guru', icon: UserCheck },
    { id: 'prakerin', label: 'Prakerin', icon: Briefcase },
    { id: 'bimbingan', label: 'Bimbingan', icon: ClipboardList },
    { id: 'nilai', label: 'Nilai', icon: Star },
    { id: 'laporan_prakerin', label: 'Laporan PKL', icon: FileCheck },
    { id: 'jadwal_sidang', label: 'Sidang', icon: Calendar },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'pengguna', label: 'Pengguna', icon: Users, adminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings, adminOnly: true },
  ];

  const filteredMenuItems = allMenuItems.filter(item => {
    // Admin can access everything
    if (user?.role === 'admin') return true;
    
    if (item.adminOnly) return false;
    
    if (user?.role === 'kaprog') {
      return ['dashboard', 'kelas', 'siswa', 'guru_pembimbing', 'prakerin', 'bimbingan', 'nilai', 'laporan_prakerin', 'jadwal_sidang', 'laporan'].includes(item.id);
    }
    
    if (user?.role === 'kepala_sekolah') {
      return !item.adminOnly;
    }
    
    return true;
  });

  // Show first 4 items in bottom nav, rest in "More" menu
  const mainItems = filteredMenuItems.slice(0, 4);
  const moreItems = filteredMenuItems.slice(4);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveMenu(item.id as MenuType)}
              className={`flex-1 flex flex-col items-center justify-center h-full gap-1 ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
        
        {moreItems.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 flex flex-col items-center justify-center h-full gap-1 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-xs font-medium">Lainnya</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Menu Lainnya</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <div className="space-y-2 pb-6">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        size="lg"
                        onClick={() => setActiveMenu(item.id as MenuType)}
                        className="w-full justify-start"
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span>{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
};

export default memo(BottomNav);
