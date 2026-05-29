import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const DEBUG_AUTH = import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === 'true';

const maskToken = (token) => {
  if (!token) return null;
  return `${token.slice(0, 12)}...${token.slice(-8)} (${token.length} chars)`;
};

const logAuth = (...args) => {
  if (DEBUG_AUTH) {
    console.log('[authFetch]', ...args);
  }
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
};

const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    logAuth('getSession error:', error.message);
    return null;
  }

  logAuth('session:', {
    hasSession: Boolean(data.session),
    userId: data.session?.user?.id,
    expiresAt: data.session?.expires_at,
    token: maskToken(data.session?.access_token),
  });

  return data.session;
};

const refreshCurrentSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    logAuth('refreshSession error:', error.message);
    return null;
  }

  logAuth('refreshed session:', {
    hasSession: Boolean(data.session),
    userId: data.session?.user?.id,
    expiresAt: data.session?.expires_at,
    token: maskToken(data.session?.access_token),
  });

  return data.session;
};

export const authFetch = async (path, options = {}) => {
  try {
    // Get current session - Supabase automatically handles token refresh
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logAuth('Session error:', error.message);
      await supabase.auth.signOut();
      redirectToLogin();
      throw new Error('Failed to get session. Please log in again.');
    }

    if (!session || !session.access_token) {
      logAuth('No valid session found');
      await supabase.auth.signOut();
      redirectToLogin();
      throw new Error('No valid session. Please log in.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${session.access_token}`);

    logAuth(`${options.method || 'GET'} ${path}`, {
      authorization: `Bearer ${maskToken(session.access_token)}`,
      userId: session.user?.id,
    });

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    // If we get 401, let Supabase handle it - it will automatically refresh tokens
    if (response.status === 401) {
      logAuth('401 received - Supabase will handle token refresh automatically');
      
      // Sign out and redirect to login - let user re-authenticate
      await supabase.auth.signOut();
      redirectToLogin();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
    
  } catch (error) {
    logAuth('Auth fetch error:', error.message);
    throw error;
  }
};
