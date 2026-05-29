import { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../services/api';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // First check if user has admin role by trying to access admin profile
      const response = await authFetch('/admin/profile');
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setIsSuperAdmin(data.user.role === 'super_admin');
        setAdminProfile(data.user);
        setPermissions(data.permissions || []);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminProfile(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Admin status check error:', error);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminProfile(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (isSuperAdmin) return true; // Super admins have all permissions
    return permissions.includes(permission);
  };

  const canAccessUsers = () => hasPermission('view_all_users');
  const canManageUsers = () => hasPermission('manage_users');
  const canAccessSurveys = () => hasPermission('view_all_surveys');
  const canManageSurveys = () => hasPermission('manage_all_surveys');
  const canAccessSystemAdmin = () => hasPermission('system_admin');

  const refreshAdminStatus = () => {
    setLoading(true);
    checkAdminStatus();
  };

  const value = {
    isAdmin,
    isSuperAdmin,
    adminProfile,
    permissions,
    loading,
    hasPermission,
    canAccessUsers,
    canManageUsers,
    canAccessSurveys,
    canManageSurveys,
    canAccessSystemAdmin,
    refreshAdminStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
