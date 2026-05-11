import { useState } from 'react';
import type { User } from '../types';
import { Button } from '../components/ui/Button';
import { LifeBuoy, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
}

export function LoginPage({ users, onLogin }: LoginPageProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      setError('No account found with this email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    onLogin(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSuccessMessage('Account created successfully! You can now log in.');
    setView('login');
    setEmail(regEmail);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirm('');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setSuccessMessage('Password reset link sent to your email.');
    setTimeout(() => {
      setView('login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 -left-10 w-64 h-64 rounded-full border border-white" />
          <div className="absolute bottom-32 -right-20 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center mb-16">
            <div className="bg-[#ef7c21] p-2.5 rounded-xl mr-3">
              <LifeBuoy className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              HelpDesk Pro
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6">
            Streamline your
            <br />
            support workflow
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Manage tickets, track time, and deliver exceptional support — all in
            one place.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex -space-x-2">
              {['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'].map(
                (color, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${color} border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-white`}
                  >
                    {['JD', 'MC', 'PM', 'SG'][i]}
                  </div>
                )
              )}
            </div>
            <span className="text-sm text-slate-400">Join your team today</span>
          </div>
          <p className="text-xs text-slate-600">
            © 2024 HelpDesk Pro. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="bg-[#ef7c21] p-2 rounded-xl mr-2.5">
              <LifeBuoy className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              HelpDesk Pro
            </span>
          </div>

          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {view === 'login' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Welcome back
              </h2>
              <p className="text-slate-500 mb-8">
                Sign in to your account to continue
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                        setSuccessMessage('');
                      }}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-xs text-[#ef7c21] hover:text-[#d96a1a] font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-medium">
                  Sign in
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <div className="mt-6 p-3 bg-slate-100 rounded-lg">
                <p className="text-xs text-slate-500 mb-2 font-medium">
                  Demo accounts:
                </p>
                <div className="space-y-1">
                  {[
                    { email: 'jean.dupont@company.com', role: 'Admin' },
                    { email: 'marie.curie@company.com', role: 'Agent' },
                    { email: 'admin@acme.com', role: 'Client' },
                    { email: 'alice@acme.com', role: 'Subclient' }
                  ].map((demo) => (
                    <button
                      key={demo.email}
                      onClick={() => {
                        setEmail(demo.email);
                        setPassword('demo123');
                      }}
                      className="w-full text-left text-xs text-slate-600 hover:text-[#ef7c21] py-0.5 transition-colors"
                    >
                      <span className="font-mono">{demo.email}</span>
                      <span className="text-slate-400 ml-2">({demo.role})</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setView('register');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-[#ef7c21] hover:text-[#d96a1a] font-medium"
                >
                  Create one
                </button>
              </p>
            </div>
          )}

          {view === 'register' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Create an account
              </h2>
              <p className="text-slate-500 mb-8">
                Get started with HelpDesk Pro
              </p>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setError('');
                    }}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => {
                      setRegConfirm(e.target.value);
                      setError('');
                    }}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-medium">
                  Create account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-[#ef7c21] hover:text-[#d96a1a] font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {view === 'forgot' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Reset your password
              </h2>
              <p className="text-slate-500 mb-8">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-medium">
                  Send reset link
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <button
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-[#ef7c21] hover:text-[#d96a1a] font-medium"
                >
                  Back to sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
