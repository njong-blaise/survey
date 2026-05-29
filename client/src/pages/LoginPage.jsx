import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { EmailInput, PasswordInput, ErrorMessage, validateEmail, validatePassword } from '../components/AuthForm';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate inputs
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password, 1);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      const signedInUser = result?.user ?? result?.session?.user;

      if (!signedInUser) {
        throw new Error('Unable to verify login. Please try again.');
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <div className="flex items-center justify-center flex-1 p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="card">
            <div className="card-header text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <LogIn className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="heading-2">Welcome back</h1>
              <p className="text-body mt-2">Sign in to your account to continue</p>
            </div>
            
            <form className="card-body" onSubmit={handleSubmit}>
              <ErrorMessage error={error} />
              
              <div className="space-y-lg">
                <EmailInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="space-y-md">
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'loading' : ''}`}
                >
                  <LogIn className="h-4 w-4" />
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <div className="text-center">
                  <Link to="/forgot-password" className="text-small text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </form>

            <div className="card-footer text-center">
              <p className="text-body flex items-center justify-center gap-2">
                <span>Don't have an account?</span>
                <Link to="/signup" className="text-primary font-semibold hover:underline flex items-center gap-1">
                  <UserPlus className="h-4 w-4" />
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
