import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useHackathon } from '../context/HackathonContext';
import { NavLink } from 'react-router-dom';
import {
  Trophy, Calendar, Users, Megaphone, BookOpen, Award, UserCheck, QrCode,
  History, Settings, FolderLock, PlusCircle, LayoutDashboard, ChevronLeft, Bell
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const { activeHackathon, activeHackathonRole, clearActiveHackathon } = useHackathon();

  if (!user) return null;

  // Active styles for NavLink
  const navLinkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  // Renders options when inside a Hackathon context
  const renderHackathonSidebar = () => (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={clearActiveHackathon}
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
        <NavLink to="/" end className={navLinkClass}>
          <Calendar size={18} />
          <span>Details & Schedule</span>
        </NavLink>
        <NavLink to="/announcements" className={navLinkClass}>
          <Megaphone size={18} />
          <span>Announcements</span>
        </NavLink>

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
            <NavLink to="/leaderboard" className={navLinkClass}>
              <Trophy size={18} />
              <span>Leaderboard</span>
            </NavLink>
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
        <NavLink to="/" end className={navLinkClass}>
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
    <aside className="w-64 bg-white border-r border-gray-100 h-[calc(100vh-61px)] sticky top-[61px] p-6 hidden md:block overflow-y-auto flex-shrink-0">
      {activeHackathon ? renderHackathonSidebar() : renderGeneralSidebar()}
    </aside>
  );
}
