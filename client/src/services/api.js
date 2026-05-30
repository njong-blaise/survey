import { supabase } from './supabase';
import { apiUrl } from '../config/api';

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

export const authFetch = async (path, options = {}) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logAuth('Session error:', error.message);
      await supabase.auth.signOut();
      redirectToLogin();
      throw new Error('Failed to get session. Please log in again.');
    }

    if (!session?.access_token) {
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

    const response = await fetch(apiUrl(path), {
      ...options,
      headers,
    });

    if (response.status === 401) {
      logAuth('401 received - session expired');
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
