import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HackathonProvider, useHackathon } from './context/HackathonContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import HackathonsList from './pages/HackathonsList';
import HackathonDetails from './pages/HackathonDetails';
import CreateHackathon from './pages/CreateHackathon';
import EditHackathon from './pages/EditHackathon';
import RegistrationsList from './pages/RegistrationsList';
import MembersList from './pages/MembersList';
import TeamsList from './pages/TeamsList';
import MyTeam from './pages/MyTeam';
import JoinTeam from './pages/JoinTeam';
import AnnouncementsList from './pages/AnnouncementsList';
import Leaderboard from './pages/Leaderboard';
import NotificationsList from './pages/NotificationsList';
import QRCheckin from './pages/QRCheckin';
import JudgingPortal from './pages/JudgingPortal';
import SystemDashboard from './pages/SystemDashboard';
import SystemUsers from './pages/SystemUsers';
import OrganizerDashboard from './pages/OrganizerDashboard';

// Guest Route: redirects logged-in users to dashboard
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// Protected Layout: Verifies auth, sets up Layout with Navbar and Sidebar
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const { activeHackathon } = useHackathon();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    const currentPath = window.location.pathname + window.location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/40">
      <Navbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-61px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Admin Protection (Platform Owner)
const PlatformOwnerRoute = () => {
  const { user } = useAuth();
  if (!user || !user.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// Organizer Protection (specific to active hackathon)
const HackathonOrganizerRoute = () => {
  const { activeHackathonRole } = useHackathon();
  const { user } = useAuth();
  
  if (user?.is_superuser) return <Outlet />;
  if (activeHackathonRole !== 'Organizer') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// Volunteer/Organizer Protection
const HackathonVolunteerRoute = () => {
  const { activeHackathonRole } = useHackathon();
  const { user } = useAuth();
  
  if (user?.is_superuser) return <Outlet />;
  if (activeHackathonRole !== 'Organizer' && activeHackathonRole !== 'Volunteer') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// Judge Protection
const HackathonJudgeRoute = () => {
  const { activeHackathonRole } = useHackathon();
  const { user } = useAuth();
  
  if (user?.is_superuser) return <Outlet />;
  if (activeHackathonRole !== 'Judge') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// Active Hackathon Main Entry Route switching
// If hackathon is active, render HackathonDetails home page, else render general hackathons catalog list
const HackathonHomeRouter = () => {
  const { activeHackathonId, activeHackathon, activeHackathonRole } = useHackathon();
  
  if (activeHackathonId && activeHackathonRole === 'Participant' && activeHackathon?.active_team_status !== 'Approved') {
    return <Navigate to="/my-team" replace />;
  }
  
  return activeHackathonId ? <HackathonDetails /> : <HackathonsList />;
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <HackathonProvider>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />

                {/* Public Auth Routes */}
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Workspace Layout */}
                <Route element={<ProtectedLayout />}>
                  {/* Home resolves based on selected hackathon context */}
                  <Route path="/dashboard" element={<HackathonHomeRouter />} />
                  
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<NotificationsList />} />
                  <Route path="/create-hackathon" element={<CreateHackathon />} />
                  
                  {/* General Hackathon routes */}
                  <Route path="/announcements" element={<AnnouncementsList />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/my-team" element={<MyTeam />} />
                  <Route path="/join-team/:inviteCode" element={<JoinTeam />} />

                  {/* Organizer Management Routes */}
                  <Route element={<HackathonOrganizerRoute />}>
                    <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
                    <Route path="/edit-hackathon" element={<EditHackathon />} />
                    <Route path="/members" element={<MembersList />} />
                  </Route>

                  {/* Volunteer/Staff Management Routes */}
                  <Route element={<HackathonVolunteerRoute />}>
                    <Route path="/registrations" element={<RegistrationsList />} />
                    <Route path="/qr-checkin" element={<QRCheckin />} />
                    <Route path="/teams" element={<TeamsList />} />
                  </Route>

                  {/* Judge Routes */}
                  <Route element={<HackathonJudgeRoute />}>
                    <Route path="/judging" element={<JudgingPortal />} />
                  </Route>

                  {/* Platform Owner Routes */}
                  <Route element={<PlatformOwnerRoute />}>
                    <Route path="/system-dashboard" element={<SystemDashboard />} />
                    <Route path="/system-users" element={<SystemUsers />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HackathonProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
