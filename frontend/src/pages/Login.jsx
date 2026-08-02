import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  KeyRound, User, Eye, EyeOff, Rocket, Trophy, Sparkles, 
  ShieldCheck, CheckCircle2, ArrowRight, Code2, Zap, Star, ArrowLeft, 
  ChevronRight, Bot, MessageSquare, Flame, Check, HelpCircle, Activity, Globe, Compass
} from 'lucide-react';

/* Animated Number Ticker */
function AnimatedCounter({ end, prefix = '', suffix = '', duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const LIVE_ACTIVITIES = [
  { icon: Flame, color: 'text-amber-500', text: 'Alex C. just registered for AI Innovators Hack!' },
  { icon: Trophy, color: 'text-blue-500', text: 'Team Cyber-X won $15,000 Web3 Grand Prize!' },
  { icon: Zap, color: 'text-purple-500', text: 'Sarah M. formed a new team for ClimateTech 2026' },
  { icon: ShieldCheck, color: 'text-emerald-500', text: 'AI Judge verified 48 code repositories instantly' },
];

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState('prizes');
  const [activityIndex, setActivityIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  // Auto-Cycle Feature Tabs
  useEffect(() => {
    if (!autoRotate) return;
    const tabs = ['prizes', 'teams', 'ai'];
    const timer = setInterval(() => {
      setActiveFeatureTab((prev) => {
        const nextIdx = (tabs.indexOf(prev) + 1) % tabs.length;
        return tabs[nextIdx];
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [autoRotate]);

  // Auto-Rotate Activity Feed Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      await login(username, password);
      showToast('Welcome back to HackathonHub!', 'success');
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/dashboard');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Invalid username or password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Auto-Fill Demo Credentials Helper
  const handleQuickFill = (demoUser, demoPass, roleName) => {
    setUsername(demoUser);
    setPassword(demoPass);
    showToast(`Loaded ${roleName} credentials! Click Sign In below.`, 'info');
  };

  const CurrentActivityIcon = LIVE_ACTIVITIES[activityIndex].icon;

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative flex flex-col justify-between">
      
      {/* Background Decorative Animated Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-r from-blue-200/80 via-indigo-200/70 to-purple-200/60 blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-200/50 blur-[140px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none"></div>

      {/* TOP NAVBAR */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <span className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold font-display text-lg shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all">
              H
            </span>
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white animate-ping"></span>
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-slate-900">
            Hackathon<span className="text-blue-600">Hub</span>
          </span>
        </Link>

        {/* Live Event Ticker Badge in Navbar */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700 animate-fade-in">
          <CurrentActivityIcon className={`h-3.5 w-3.5 ${LIVE_ACTIVITIES[activityIndex].color} animate-bounce-subtle`} />
          <span className="truncate max-w-xs text-[11px]">{LIVE_ACTIVITIES[activityIndex].text}</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 my-auto flex-1 flex items-center overflow-hidden animate-page-enter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* LEFT SHOWCASE CONTENT WITH AUTO-CYCLED WIDGETS */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Floating Top Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Next-Gen Hackathon Platform</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping"></span>
            </div>

            {/* Hero Heading - 1 Point Bigger Font */}
            <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Welcome Back to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-sweep-gradient">
                HackathonHub
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Access your active hackathon workspace, collaborate with teammates in real-time, submit projects, and view live judge scoring.
            </p>

            {/* AUTO-ROTATING FEATURE SHOWCASE WIDGET */}
            <div 
              onMouseEnter={() => setAutoRotate(false)}
              onMouseLeave={() => setAutoRotate(true)}
              className="p-4 rounded-2xl bg-white/95 border border-slate-200/90 shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-300"
            >
              {/* Progress Indicator Bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500" style={{
                  width: activeFeatureTab === 'prizes' ? '33.3%' : activeFeatureTab === 'teams' ? '66.6%' : '100%'
                }}></div>
              </div>

              {/* Tab Selector Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 pt-0.5">
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveFeatureTab('prizes')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      activeFeatureTab === 'prizes' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Prize Pool</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFeatureTab('teams')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      activeFeatureTab === 'teams' 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Instant Match</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFeatureTab('ai')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                      activeFeatureTab === 'ai' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>AI Judging</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Auto ⚡</span>
              </div>

              {/* Tab Display Area */}
              <div className="pt-2.5">
                {activeFeatureTab === 'prizes' && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Featured Global Hackathon</span>
                      <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">Live Competition</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-2xs">AI</span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">AI Innovators Global 2026</h5>
                          <p className="text-xs text-slate-500">1,240 Participants</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-600">$50,000</span>
                        <p className="text-[10px] text-slate-400 font-medium">Grand Prize</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeatureTab === 'teams' && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Teammate Recommendation</span>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">98% Tech Match</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-50/80 to-indigo-50/50 border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img className="h-7 w-7 rounded-full object-cover ring-2 ring-purple-500 shadow-2xs" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Teammate" />
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">Sophia Martinez</h5>
                          <p className="text-xs text-purple-700 font-semibold">Python • LLMs • Full-Stack</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-600 text-white font-bold text-xs shadow-2xs">Connect</span>
                    </div>
                  </div>
                )}

                {activeFeatureTab === 'ai' && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Smart Code Verification</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">Automated Audit</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">Code Quality Audit</h5>
                          <p className="text-xs text-emerald-700 font-semibold">GitHub repository evaluation</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-2xs">96/100</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Ticker Stats Bar */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-center">
                <div className="text-lg font-black text-blue-600 font-display">
                  $<AnimatedCounter end={100} suffix="K+" />
                </div>
                <div className="text-xs font-semibold text-slate-500">Prizes Awarded</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-center">
                <div className="text-lg font-black text-purple-600 font-display">
                  <AnimatedCounter end={12400} suffix="+" />
                </div>
                <div className="text-xs font-semibold text-slate-500">Hackers Worldwide</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-center">
                <div className="text-lg font-black text-emerald-600 font-display">
                  <AnimatedCounter end={50} suffix="+" />
                </div>
                <div className="text-xs font-semibold text-slate-500">Global Events</div>
              </div>
            </div>

          </div>

          {/* RIGHT LOGIN FORM CARD */}
          <div className="lg:col-span-6 relative">
            
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl rounded-3xl p-5 sm:p-6 lg:p-7 relative overflow-hidden transition-all duration-300">
              
              {/* Animated Top Gradient Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-sweep-gradient"></div>

              {/* Mode Switcher Tabs with Smooth Sliding Pill Indicator */}
              <div className="relative flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 mb-3.5 max-w-xs mx-auto overflow-hidden shadow-inner">
                {/* Smooth Sliding Active Background Pill */}
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg shadow-md transition-all duration-300 ease-out ${
                    activeTab === 'register' ? 'left-[calc(50%+2px)]' : 'left-1'
                  }`} 
                />
                <button 
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`w-1/2 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 text-center ${
                    activeTab === 'login' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setTimeout(() => navigate('/register'), 200);
                  }}
                  className={`w-1/2 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 text-center ${
                    activeTab === 'register' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>

              <div className="mb-3 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
                  Sign in to your account
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                  Enter your credentials below to access your dashboard
                </p>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <div className="relative rounded-xl shadow-2xs group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative rounded-xl shadow-2xs group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between py-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-600">Remember me on this device</span>
                  </label>
                </div>

                {/* Primary Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-blue-600/25 transition-all duration-200 hover:shadow-blue-600/40 flex items-center justify-center space-x-2 group disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Dashboard</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition duration-200" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Bottom Navigation */}
              <p className="mt-4 text-center text-xs sm:text-sm text-slate-600 font-medium">
                Don't have an account yet?{' '}
                <Link to="/register" className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline transition">
                  Create free account
                </Link>
              </p>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-t border-slate-200/60 shrink-0 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-slate-500">
        <p>© 2026 HackathonHub. All rights reserved.</p>
        <div className="flex justify-center space-x-6 mt-1 sm:mt-0">
          <a href="#" className="hover:text-slate-900 transition">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition">Terms of Service</a>
          <a href="#" className="hover:text-slate-900 transition">Support</a>
        </div>
      </footer>

    </div>
  );
}




