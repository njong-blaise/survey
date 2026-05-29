import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export const EmailInput = ({ value, onChange, placeholder = 'Enter your email', id = 'email-address', name = 'email', autoComplete = 'email' }) => (
  <div className="form-group">
    <label htmlFor={id} className="form-label">
      Email address
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Mail className="h-5 w-5 text-gray-400" />
      </div>
      <input
        id={id}
        name={name}
        type="email"
        autoComplete={autoComplete}
        required
        className="form-input pl-10"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

export const PasswordInput = ({ 
  value, 
  onChange, 
  showPassword, 
  onTogglePassword, 
  placeholder = 'Enter your password',
  id = 'password',
  name = 'password',
  autoComplete = 'current-password',
  helperText = null
}) => (
  <div className="form-group">
    <label htmlFor={id} className="form-label">
      Password
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-gray-400" />
      </div>
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        className="form-input pl-10 pr-12"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        onClick={onTogglePassword}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        ) : (
          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>
    </div>
    {helperText && <p className="text-xs text-secondary mt-1">{helperText}</p>}
  </div>
);

export const ErrorMessage = ({ error }) => (
  error && (
    <div className="error mb-6 animate-slide-in flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      {error}
    </div>
  )
);

export const validateEmail = (email) => {
  if (!email || !email.includes('@')) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password, minLength = 6) => {
  if (!password || password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  return null;
};

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};
