import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const HackathonContext = createContext(null);

export const HackathonProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeHackathonId, setActiveHackathonId] = useState(null);
  const [activeHackathon, setActiveHackathon] = useState(null);
  const [activeHackathonRole, setActiveHackathonRole] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reload state if active hackathon is in storage
    const savedHackathonId = localStorage.getItem('active_hackathon_id');
    const savedRole = localStorage.getItem('active_hackathon_role');
    
    if (savedHackathonId) {
      setActiveHackathonId(savedHackathonId);
      setActiveHackathonRole(savedRole);
      fetchDetails(savedHackathonId);
    } else {
      clearActiveHackathon();
    }
  }, [user]);

  const fetchDetails = async (id) => {
    try {
      setLoading(true);
      // Temporarily store in local storage so the api request interceptor attaches it
      localStorage.setItem('active_hackathon_id', id);
      const response = await api.get(`/hackathons/${id}/`);
      
      setActiveHackathon(response.data);
      // Role is returned inside Hackathon data based on context
      const userRole = response.data.role;
      setActiveHackathonRole(userRole);
      
      if (userRole) {
        localStorage.setItem('active_hackathon_role', userRole);
      } else {
        localStorage.removeItem('active_hackathon_role');
      }
    } catch (e) {
      console.error("Failed to load active hackathon details", e);
      clearActiveHackathon();
    } finally {
      setLoading(false);
    }
  };

  const selectHackathon = async (id) => {
    if (!id) {
      clearActiveHackathon();
      return;
    }
    setActiveHackathonId(id);
    localStorage.setItem('active_hackathon_id', id);
    await fetchDetails(id);
  };

  const clearActiveHackathon = () => {
    setActiveHackathonId(null);
    setActiveHackathon(null);
    setActiveHackathonRole(null);
    localStorage.removeItem('active_hackathon_id');
    localStorage.removeItem('active_hackathon_role');
  };

  return (
    <HackathonContext.Provider value={{
      activeHackathonId,
      activeHackathon,
      activeHackathonRole,
      loading,
      selectHackathon,
      clearActiveHackathon,
      refreshHackathonDetails: () => fetchDetails(activeHackathonId)
    }}>
      {children}
    </HackathonContext.Provider>
  );
};

export const useHackathon = () => useContext(HackathonContext);
