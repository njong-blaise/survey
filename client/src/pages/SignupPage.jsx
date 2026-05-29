import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, LogIn, CheckCircle } from 'lucide-react';
import { EmailInput, PasswordInput, ErrorMessage, validateEmail, validatePassword, validatePasswordMatch } from '../components/AuthForm';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate inputs
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password, 6);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setError(matchError);
      setLoading(false);
      return;
    }

    try {
      await signup(email, password);
      setSuccess(true);
    } catch (error) {
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1 p-8">
          <div className="w-full max-w-md animate-fade-in">
            <div className="card">
              <div className="card-header text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-success-600" />
                </div>
                <h1 className="heading-2">Check your email</h1>
                <p className="text-body mt-2">
                  We've sent a confirmation link to <span className="font-semibold">{email}</span>. Please check your inbox and click the link to activate your account.
                </p>
              </div>
              <div className="card-body text-center">
                <Link
                  to="/login"
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="flex items-center justify-center flex-1 p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="card">
            <div className="card-header text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="heading-2">Create your account</h1>
              <p className="text-body mt-2">
                Or{' '}
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:underline flex items-center gap-1 inline-flex"
                >
                  <LogIn className="h-4 w-4" />
                  sign in to your existing account
                </Link>
              </p>
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
                  placeholder="Create a password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  helperText="Must be at least 6 characters"
                />

                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  placeholder="Confirm your password"
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-md">
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'loading' : ''}`}
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
