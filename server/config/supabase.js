const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.https//supabase.com/dashboard/project/jotgnadycbnaotjookvx;
const supabaseServiceKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGduYWR5Y2JuYW90am9va3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU3MTY0OSwiZXhwIjoyMDk1MTQ3NjQ5fQ.g0RQIqzLjcAkhknOUPwnZezXAw1XPwB31ans3MpSnJA;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

const serviceKeyPayload = decodeJwtPayload(supabaseServiceKey);

if (serviceKeyPayload?.role && serviceKeyPayload.role !== 'service_role') {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the Supabase service_role key, not the anon key.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
