import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar, TabKey } from './components/layout/Navbar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { DevoteeList } from './components/devotees/DevoteeList';
import { DevoteeBirthdayWishDashboard } from './components/celebrations/DevoteeBirthdayWishDashboard';
import { ParcelManager } from './components/parcel/ParcelManager';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { UserManager } from './components/users/UserManager';
import { ArchitectureFlow } from './components/architecture/ArchitectureFlow';
import { DevoteeModal } from './components/devotees/DevoteeModal';
import { DevoteeDetailModal } from './components/devotees/DevoteeDetailModal';
import { SupabaseConnectModal } from './components/common/SupabaseConnectModal';
import { LoginPortal } from './components/auth/LoginPortal';
import { RemovalRecords } from './components/removals/RemovalRecords';
import { Devotee } from './types';
import { getCelebrations } from './utils/dateUtils';

const MainPortal: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const { devotees, auditLogs, parcelDispatches, birthdayRemovals, anniversaryRemovals, softDeletedDevotees } = useData();
  const removalsCount = birthdayRemovals.length + anniversaryRemovals.length + (softDeletedDevotees?.length || 0);

  // Strict Panel Routing: Staff cannot access Admin tabs
  useEffect(() => {
    if (!isSuperAdmin) {
      const adminOnlyTabs: TabKey[] = ['removals', 'audit', 'users', 'architecture'];
      if (adminOnlyTabs.includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    }
  }, [isSuperAdmin, currentTab]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevotee, setEditingDevotee] = useState<Devotee | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDevotee, setSelectedDevotee] = useState<Devotee | null>(null);

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const celebrations = getCelebrations(devotees);
  const todayCelebrationsCount = celebrations.filter((c) => c.isToday).length;

  const handleOpenNewDevotee = () => {
    setEditingDevotee(null);
    setIsModalOpen(true);
  };

  const handleEditDevotee = (dev: Devotee) => {
    setEditingDevotee(dev);
    setIsModalOpen(true);
  };

  const handleSelectDevotee = (dev: Devotee) => {
    setSelectedDevotee(dev);
    setIsDetailOpen(true);
  };

  const handleSelectDevoteeById = (devId: string) => {
    const dev = devotees.find((d) => d.id === devId);
    if (dev) {
      setSelectedDevotee(dev);
      setIsDetailOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Header with Integrated Horizontal Navigation Menu Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        celebrationsCount={todayCelebrationsCount}
        auditCount={auditLogs.length}
        parcelCount={parcelDispatches.length}
        removalsCount={removalsCount}
        onOpenNewDevotee={handleOpenNewDevotee}
        onNavigateToArchitecture={() => setCurrentTab('architecture')}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Workspace (Full-Width Spacious Canvas!) */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <OverviewDashboard
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenNewDevotee={handleOpenNewDevotee}
              onSelectDevotee={handleSelectDevoteeById}
            />
          )}

          {currentTab === 'devotees' && (
            <DevoteeList
              onSelectDevotee={handleSelectDevotee}
              onEditDevotee={handleEditDevotee}
              onAddNewDevotee={handleOpenNewDevotee}
            />
          )}

          {currentTab === 'celebrations' && (
            <DevoteeBirthdayWishDashboard
              onSelectDevotee={handleSelectDevoteeById}
            />
          )}

          {currentTab === 'parcels' && (
            <ParcelManager />
          )}

          {currentTab === 'removals' && isSuperAdmin && (
            <RemovalRecords />
          )}

          {currentTab === 'audit' && isSuperAdmin && (
            <AuditLogViewer />
          )}

          {currentTab === 'users' && isSuperAdmin && (
            <UserManager />
          )}

          {currentTab === 'architecture' && isSuperAdmin && (
            <ArchitectureFlow />
          )}
        </main>

      {/* Add / Edit Devotee Modal */}
      <DevoteeModal
        devotee={editingDevotee}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDevotee(null);
        }}
      />

      {/* Devotee Profile Details Modal */}
      <DevoteeDetailModal
        devotee={selectedDevotee}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDevotee(null);
        }}
        onEdit={(dev) => {
          setIsDetailOpen(false);
          handleEditDevotee(dev);
        }}
      />

      {/* Supabase Realtime Connection Modal */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  return <MainPortal />;
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RootApp />
      </DataProvider>
    </AuthProvider>
  );
}
