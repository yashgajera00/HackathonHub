import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHackathon } from '../context/HackathonContext';
import api from '../services/api';
import { Bell, LogOut, User, ChevronDown, Check, LayoutGrid, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { activeHackathonId, activeHackathon, selectHackathon, activeHackathonRole } = useHackathon();
  const [myHackathons, setMyHackathons] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  // Refs for click-outside detection
  const hackathonDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        hackathonDropdownRef.current &&
        !hackathonDropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserHackathons();
      fetchNotificationsCount();
      
      const interval = setInterval(() => {
        fetchUserHackathons();
        fetchNotificationsCount();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user, activeHackathonId]);

  const fetchUserHackathons = async () => {
    try {
      // Fetch user's hackathons list
      const response = await api.get('/memberships/my_memberships/');
      // Map to hackathon details
      const list = response.data.map(m => ({
        id: m.hackathon,
        title: m.hackathon_details.title,
        role: m.role
      }));
      setMyHackathons(list);
    } catch (e) {
      console.error("Failed to load user hackathons", e);
    }
  };

  const fetchNotificationsCount = async () => {
    try {
      const response = await api.get('/notifications/');
      const unread = response.data.results ? response.data.results.filter(n => !n.read).length : response.data.filter(n => !n.read).length;
      setUnreadNotifications(unread);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleHackathonChange = (id) => {
    selectHackathon(id);
    setShowDropdown(false);
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between shadow-xs">
      {/* Brand logo & Selection */}
      <div className="flex items-center space-x-3 md:space-x-6">
        {/* Hamburger Menu Toggle Button for mobile */}
        {user && (
          <button
            onClick={onToggleSidebar}
            className="block md:hidden p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <Link to="/" className="flex items-center space-x-2">
          <span className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-display">H</span>
          <span className="hidden sm:inline text-xl font-bold font-display tracking-tight text-gray-900">Hackathon<span className="text-blue-600">Hub</span></span>
        </Link>

        {/* Hackathon Selector (Role Switching) */}
        {user && (
          <div className="relative" ref={hackathonDropdownRef}>
            <button
              onClick={() => { setShowDropdown(!showDropdown); setShowProfileDropdown(false); }}
              className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-lg text-sm text-gray-700 transition max-w-[140px] sm:max-w-[220px]"
            >
              <LayoutGrid size={15} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium truncate">
                {activeHackathon ? activeHackathon.title : 'My Hackathons'}
              </span>
              {activeHackathonRole && (
                <span className="hidden sm:inline ml-1.5 px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 font-semibold rounded-md border border-blue-100 flex-shrink-0">
                  {activeHackathonRole}
                </span>
              )}
              <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </button>

            {showDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                <button
                  onClick={() => handleHackathonChange(null)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-500">General Hub (Global)</span>
                  {!activeHackathonId && <Check size={14} className="text-blue-600" />}
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                {myHackathons.length > 0 ? (
                  myHackathons.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleHackathonChange(h.id)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">{h.title}</span>
                        <span className="text-xs text-gray-400">Role: {h.role}</span>
                      </div>
                      {activeHackathonId == h.id && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-xs text-gray-400">No joined hackathons</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications & Avatar */}
      {user && (
        <div className="flex items-center space-x-4">
          {/* Notifications Icon */}
          <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-50 transition">
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
                {unreadNotifications}
              </span>
            )}
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowDropdown(false); }}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold uppercase text-sm">
                  {user.username.slice(0, 2)}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-700 leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                </span>
                {user.is_superuser && <span className="text-[10px] text-red-500 font-bold tracking-wider uppercase">Platform Owner</span>}
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden md:block" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <User size={15} />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileDropdown(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <ChevronDown size={15} className="rotate-90" />
                  <span>Account Settings</span>
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
