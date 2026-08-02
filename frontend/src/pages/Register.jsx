import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, User, Phone, Lock, Eye, EyeOff, Rocket, Trophy, 
  Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Code2, Zap, Star, UserPlus, ArrowLeft,
  Briefcase, Check
} from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Developer');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    confirm_password: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Simple Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', score: 0, color: 'bg-slate-300' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { label: 'Weak', score: 25, color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { label: 'Good', score: 65, color: 'bg-amber-500' };
    return { label: 'Strong ✨', score: 100, color: 'bg-gradient-to-r from-emerald-500 to-teal-400' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      showToast(`Registration successful as ${selectedRole}! Welcome to HackathonHub.`, 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorVal = errors[firstErrorKey];
        showToast(`${firstErrorKey}: ${Array.isArray(firstErrorVal) ? firstErrorVal[0] : firstErrorVal}`, 'error');
      } else {
        showToast('Registration failed. Please check inputs.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative flex flex-col justify-between">
      
      {/* Background Decorative Gradient Glow Matching Landing Page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-r from-purple-200/70 via-indigo-200/60 to-blue-200/70 blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-indigo-200/50 blur-[140px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }} />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none"></div>

      {/* TOP NAVBAR */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <span className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold font-display text-lg shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all">
              H
            </span>
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-purple-500 rounded-full border-2 border-white animate-ping"></span>
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-slate-900">
            Hackathon<span className="text-blue-600">Hub</span>
          </span>
        </Link>

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
          
          {/* LEFT SHOWCASE CONTENT */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Badge Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-[11px] font-bold shadow-2xs">
              <UserPlus className="h-3.5 w-3.5 text-purple-600" />
              <span>Join 10,000+ Global Hackers</span>
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping"></span>
            </div>

            {/* Hero Heading - 1 Point Bigger Font */}
            <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Unlock Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-sweep-gradient">
                Developer Superpowers
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
              Create your free account to access live global hackathons, form winning teams, submit projects, and compete for cash prizes.
            </p>

            {/* Perks List */}
            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-sm flex items-start space-x-3 hover:shadow-sm transition">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Join Unlimited Hackathons</h4>
                  <p className="text-xs text-slate-500">Solo or team challenges across AI, Web3 & Cloud.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-sm flex items-start space-x-3 hover:shadow-sm transition">
                <div className="p-1 rounded-full bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Find Teammates Instantly</h4>
                  <p className="text-xs text-slate-500">Search developer profiles & build high-performing teams.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-sm flex items-start space-x-3 hover:shadow-md transition">
                <div className="p-1 rounded-full bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Real-Time QR & Live Scoring</h4>
                  <p className="text-xs text-slate-500">Automated event check-ins and live leaderboard scoring.</p>
                </div>
              </div>
            </div>

            {/* Free Banner */}
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs sm:text-sm font-bold text-blue-950">100% Free Developer Account</div>
                <div className="text-xs text-blue-700">No credit card or subscription required</div>
              </div>
              <span className="px-2.5 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-lg shadow-xs">
                Free Forever
              </span>
            </div>

          </div>

          {/* RIGHT REGISTRATION FORM CARD */}
          <div className="lg:col-span-7 relative">
            
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden transition-all duration-300">
              
              {/* Animated Top Accent Shimmer Gradient */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-sweep-gradient"></div>

              {/* Mode Switcher Tabs with Smooth Sliding Pill Indicator */}
              <div className="relative flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 mb-3 max-w-xs mx-auto overflow-hidden shadow-inner">
                {/* Smooth Sliding Active Background Pill */}
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg shadow-md transition-all duration-300 ease-out ${
                    activeTab === 'register' ? 'left-[calc(50%+2px)]' : 'left-1'
                  }`} 
                />
                <button 
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setTimeout(() => navigate('/login'), 200);
                  }}
                  className={`w-1/2 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 text-center ${
                    activeTab === 'login' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`w-1/2 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 text-center ${
                    activeTab === 'register' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>

              <div className="mb-3 text-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
                  Create your account ✨
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                  Fill in your details to start participating in hackathons today
                </p>
              </div>

              <form className="space-y-2.5" onSubmit={handleSubmit}>
                
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                    Username
                  </label>
                  <div className="relative rounded-xl shadow-2xs group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      placeholder="John"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="email" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                      Email address
                    </label>
                    <div className="relative rounded-xl shadow-2xs group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                      Phone Number
                    </label>
                    <div className="relative rounded-xl shadow-2xs group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        required
                        placeholder="+15550000000"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="password" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                      Password
                    </label>
                    <div className="relative rounded-xl shadow-2xs group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-9 pr-9 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm_password" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-0.5">
                      Confirm Password
                    </label>
                    <div className="relative rounded-xl shadow-2xs group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition duration-200">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className={`block w-full pl-9 pr-9 py-2 bg-slate-50/80 border rounded-xl text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all font-medium ${
                          formData.confirm_password && formData.password !== formData.confirm_password
                            ? 'border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="space-y-1 animate-fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Security:</span>
                      <span className={`font-bold ${
                        pwdStrength.label.includes('Strong') ? 'text-emerald-600' :
                        pwdStrength.label === 'Good' ? 'text-amber-600' : 'text-rose-600'
                      }`}>{pwdStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full ${pwdStrength.color} rounded-full transition-all duration-500`} 
                        style={{ width: `${pwdStrength.score}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Terms Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-600">
                      I agree to the <a href="#" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> & <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                </div>

                {/* Primary Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-blue-600/25 transition-all duration-200 hover:shadow-blue-600/40 flex items-center justify-center space-x-2 group disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <>
                        <span>Create Free Account</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition duration-200" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Bottom Login Link */}
              <p className="mt-3 text-center text-xs text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition">
                  Sign in
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
