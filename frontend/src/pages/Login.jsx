import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, ArrowRight } from 'lucide-react';

const Login = () => {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isAdminMode, setIsAdminMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const allowedEmails = ['gantannagarisrinath123@gmail.com', 'gajulasahithi2006@gmail.com'];
    if (!allowedEmails.includes(email.toLowerCase().trim())) {
      setError('Access Denied: High-level clearance required.');
      return;
    }

    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid matching credentials for admin node.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-accent/30 transition-colors duration-500">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 clay-card !bg-surface/40 border-none ring-1 ring-border/20 mb-8 shadow-xl animate-float">
            <Shield className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-6xl font-l1-hero text-text-primary tracking-wider mb-2 uppercase">Sentinel</h1>
          <p className="font-l5-micro text-accent tracking-[0.4em]">Risk Intelligence Terminal</p>
        </div>

        <div className="clay-card !p-10 !bg-surface/30 backdrop-blur-2xl border-none ring-1 ring-border/20 shadow-2xl">
          {!isAdminMode ? (
            <div className="space-y-8">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-l2-card text-text-primary mb-2">Operator Portal</h2>
                <p className="font-l5-micro text-text-muted lowercase italic">Authorize to access global spatial theatre</p>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="clay-btn-primary w-full py-4 !rounded-2xl group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-4 py-4">
                <div className="h-px bg-border/50 flex-1"></div>
                <span className="font-l5-micro text-text-muted">Secure Access</span>
                <div className="h-px bg-border/50 flex-1"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setIsAdminMode(true)}
                  className="clay-surface !p-5 flex flex-col items-center gap-3 group hover:ring-accent/40 transition-all bg-surface/40 border-none ring-1 ring-border/20"
                 >
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 group-hover:shadow-[0_0_15px_var(--color-accent)] transition-all">
                       <Lock className="w-5 h-5 text-accent" />
                    </div>
                    <span className="font-l5-micro text-text-muted group-hover:text-accent">Admin Command</span>
                 </button>
                 <div className="clay-surface !p-5 flex flex-col items-center gap-3 opacity-40 cursor-not-allowed border-none ring-1 ring-border/10">
                    <div className="p-3 rounded-xl bg-text-muted/10 border border-text-muted/10">
                       <Globe className="w-5 h-5 text-text-muted" />
                    </div>
                    <span className="font-l5-micro text-text-muted">External SSO</span>
                 </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-l2-card text-text-primary flex items-center gap-3 uppercase tracking-tight">
                   <Lock className="w-5 h-5 text-accent" />
                   Authorization
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="font-l5-micro text-text-muted hover:text-accent transition-colors"
                >
                  &larr; Exit
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-l5-micro text-text-muted ml-1">Email Node</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sentinel.ai"
                    className="clay-surface w-full !bg-surface/50 border-none ring-1 ring-border/20 px-6 py-4 text-sm font-l4-body text-text-primary focus:ring-accent/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-l5-micro text-text-muted ml-1">Secure Protocol</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="clay-surface w-full !bg-surface/50 border-none ring-1 ring-border/20 px-6 py-4 text-sm font-l4-body text-text-primary focus:ring-accent/50 transition-all outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="clay-card !bg-danger/10 border-danger/30 p-4 text-danger font-l5-micro !tracking-normal">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                className="clay-btn-primary w-full py-4 !rounded-2xl group"
              >
                Execute Authorization
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-12 font-l5-micro text-text-muted !tracking-[0.4em] opacity-40">
          ISO-27001 Certified System &bull; © 2026 Sentinel Logistics
        </p>
      </div>
    </div>
  );
};

export default Login;
