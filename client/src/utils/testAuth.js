import { supabase } from '../services/supabase';

// Test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase test error:', err);
    return false;
  }
};

// Test authentication with dummy credentials
export const testAuth = async () => {
  console.log('Testing authentication...');
  
  try {
    // Test with invalid credentials to see error handling
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'invalidpassword'
    });
    
    if (error) {
      console.log('Auth error (expected):', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('Auth test unexpected success');
    return { success: true, data };
  } catch (err) {
    console.error('Auth test error:', err);
    return { success: false, error: err.message };
  }
};
