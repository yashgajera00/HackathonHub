import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useHackathon } from '../context/HackathonContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Trophy, Calendar, Users, Megaphone, BookOpen, Award, UserCheck, QrCode,
  History, Settings, FolderLock, PlusCircle, LayoutDashboard, ChevronLeft, Bell, MessageSquare
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { activeHackathon, activeHackathonRole, clearActiveHackathon } = useHackathon();
  const navigate = useNavigate();

  if (!user) return null;

  // Active styles for NavLink
  const navLinkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const handleLeaveContext = () => {
    clearActiveHackathon();
    navigate('/dashboard');
  };

  // Renders options when inside a Hackathon context
  const renderHackathonSidebar = () => (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={handleLeaveContext}
          className="flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider px-3 transition"
        >
          <ChevronLeft size={14} />
          <span>Leave Hackathon Context</span>
        </button>
      </div>

      {/* Selected Hackathon Brief */}
      <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
        <h4 className="text-sm font-bold text-gray-800 truncate">{activeHackathon.title}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">
            {activeHackathonRole}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {activeHackathon.status}
          </span>
        </div>
      </div>

      {/* Role specific links */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Hackathon Menu
        </div>
        {(activeHackathonRole !== 'Participant' || activeHackathon?.active_team_status === 'Approved') && (
          <>
            <NavLink to="/dashboard" end className={navLinkClass}>
              <Calendar size={18} />
              <span>Details & Schedule</span>
            </NavLink>
            <NavLink to="/announcements" className={navLinkClass}>
              <Megaphone size={18} />
              <span>Announcements</span>
            </NavLink>
          </>
        )}

        {/* Organizer Options */}
        {activeHackathonRole === 'Organizer' && (
          <>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 mb-2">
              Organizer Panel
            </div>
            <NavLink to="/organizer-dashboard" className={navLinkClass}>
              <LayoutDashboard size={18} />
              <span>Analytics & Logs</span>
            </NavLink>
            <NavLink to="/edit-hackathon" className={navLinkClass}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
            <NavLink to="/registrations" className={navLinkClass}>
              <UserCheck size={18} />
              <span>Registrations</span>
            </NavLink>
            <NavLink to="/qr-checkin" className={navLinkClass}>
              <QrCode size={18} />
              <span>Scan QR Check-in</span>
            </NavLink>
            <NavLink to="/members" className={navLinkClass}>
              <Users size={18} />
              <span>Staff & Roles</span>
            </NavLink>
            <NavLink to="/teams" className={navLinkClass}>
              <Trophy size={18} />
              <span>Teams & Projects</span>
            </NavLink>
          </>
        )}

        {/* Volunteer Options */}
        {activeHackathonRole === 'Volunteer' && (
          <>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 mb-2">
              Volunteer Panel
            </div>
            <NavLink to="/registrations" className={navLinkClass}>
              <UserCheck size={18} />
              <span>Attendance list</span>
            </NavLink>
            <NavLink to="/qr-checkin" className={navLinkClass}>
              <QrCode size={18} />
              <span>Scan QR Check-in</span>
            </NavLink>
            <NavLink to="/teams" className={navLinkClass}>
              <Trophy size={18} />
              <span>Teams & Projects</span>
            </NavLink>
          </>
        )}

        {/* Judge Options */}
        {activeHackathonRole === 'Judge' && (
          <>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 mb-2">
              Judging Portal
            </div>
            <NavLink to="/judging" className={navLinkClass}>
              <Award size={18} />
              <span>Evaluate Teams</span>
            </NavLink>
            <NavLink to="/leaderboard" className={navLinkClass}>
              <Trophy size={18} />
              <span>Leaderboard</span>
            </NavLink>
          </>
        )}

        {/* Mentor Options */}
        {activeHackathonRole === 'Mentor' && (
          <>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 mb-2">
              Mentor Panel
            </div>
            <NavLink to="/teams" className={navLinkClass}>
              <Users size={18} />
              <span>Teams Feed</span>
            </NavLink>
          </>
        )}

        {/* Participant Options */}
        {activeHackathonRole === 'Participant' && (
          <>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 mb-2">
              Participant Panel
            </div>
            <NavLink to="/my-team" className={navLinkClass}>
              <Users size={18} />
              <span>My Team</span>
            </NavLink>
            <NavLink to="/team-chat" className={navLinkClass}>
              <MessageSquare size={18} />
              <span>Team Chat</span>
            </NavLink>
            {activeHackathon?.active_team_status === 'Approved' && (
              <NavLink to="/leaderboard" className={navLinkClass}>
                <Trophy size={18} />
                <span>Leaderboard</span>
              </NavLink>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Renders generic options when outside any Hackathon context
  const renderGeneralSidebar = () => (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
          General Menu
        </div>
        <NavLink to="/dashboard" end className={navLinkClass}>
          <Trophy size={18} />
          <span>Discover Hackathons</span>
        </NavLink>
        {(user.can_create_hackathon || user.is_superuser) && (
          <NavLink to="/create-hackathon" className={navLinkClass}>
            <PlusCircle size={18} />
            <span>Create Hackathon</span>
          </NavLink>
        )}
        <NavLink to="/notifications" className={navLinkClass}>
          <Bell size={18} />
          <span>My Alerts</span>
        </NavLink>
        <NavLink to="/profile" className={navLinkClass}>
          <Settings size={18} />
          <span>Profile Settings</span>
        </NavLink>
      </div>

      {/* Platform Owner specific links */}
      {user.is_superuser && (
        <div className="space-y-1.5 pt-4 border-t border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Owner Controls
          </div>
          <NavLink to="/system-dashboard" className={navLinkClass}>
            <LayoutDashboard size={18} />
            <span>Owner Dashboard</span>
          </NavLink>
          <NavLink to="/system-users" className={navLinkClass}>
            <Users size={18} />
            <span>Users & Permissions</span>
          </NavLink>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 top-[61px] bg-black/40 backdrop-blur-xs z-25 md:hidden"
        ></div>
      )}
      <aside 
        onClick={(e) => { if (e.target.closest('a') || e.target.closest('button')) onClose(); }}
        className={`w-64 bg-white border-r border-gray-100 p-6 overflow-y-auto scrollbar-hide flex-shrink-0 transition-transform duration-300 ease-in-out
          fixed inset-y-[61px] left-0 z-30 shadow-xl md:shadow-none md:fixed md:top-[61px] md:bottom-0 md:left-0 md:z-20 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {activeHackathon ? renderHackathonSidebar() : renderGeneralSidebar()}
      </aside>
    </>
  );
}
