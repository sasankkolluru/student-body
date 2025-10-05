import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, GraduationCap, Shield, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, user, loading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const registrationSuccess = (location.state as any)?.message;
  const registeredEmail = (location.state as any)?.email;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  // Show registration success message
  useEffect(() => {
    if (registrationSuccess) {
      toast.success(registrationSuccess);
    }
  }, [registrationSuccess]);

  // Pre-fill email if coming from registration
  useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [registeredEmail]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
      clearError();
    }
  }, [authError, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await login({ 
        email, 
        password, 
        role,
        rememberMe 
      });
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = (selectedRole: 'admin' | 'student') => {
    setRole(selectedRole);
    setShowRoleSelection(true);
    // Focus on the email field after role selection
    setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.focus();
    }, 100);
  };

  const handleBack = () => {
    setShowRoleSelection(false);
  };

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-center text-gray-900 mb-6">Sign in as</h3>
      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => handleContinue('student')}
          className="px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50 text-gray-800 flex items-center justify-center transition-colors"
        >
          <div className="text-left">
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 text-indigo-600 mr-3" />
              <span className="text-lg font-medium">Student</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 text-left ml-9">Access events, voting, and student resources</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleContinue('admin')}
          className="px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50 text-gray-800 flex items-center justify-center transition-colors"
        >
          <div className="text-left">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-indigo-600 mr-3" />
              <span className="text-lg font-medium">Admin</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 text-left ml-9">Manage events, users, and system settings</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to role selection
        </button>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pr-12"
                placeholder="Enter your password"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            state={{ from: location.state?.from }}
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Create an account
          </Link>
        </p>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {showRoleSelection ? 'Sign In' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {showRoleSelection 
              ? `Sign in as ${role === 'admin' ? 'Admin' : 'Student'}`
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        {registrationSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {registrationSuccess}
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}

        {showRoleSelection ? renderLoginForm() : renderRoleSelection()}

        {!showRoleSelection && (
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register"
                state={{ from: location.state?.from }}
                className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
