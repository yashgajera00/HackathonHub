import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, Users, Trophy, Shield, Zap, Globe, ArrowRight,
  Code2, Calendar, Star, ChevronRight, Monitor, Award,
  Menu, X, Sparkles, TrendingUp, Heart,
  GitBranch, MessageSquare, BarChart3, Clock, Target,
  Layers, Play, ArrowUpRight, CheckCircle2, CheckCircle, Search, Bell,
  FileCode, Terminal, Check, Flame, QrCode, Sparkle, Compass,
  ChevronDown, Cpu, Activity, UserPlus
} from 'lucide-react';

/* ─────────────────── Animated Counter Component ─────────────────── */
function AnimatedCounter({ end, suffix = '', duration = 1600 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─────────────────── Featured Hackathons Data ─────────────────── */
const FEATURED_HACKATHONS = [
  {
    id: 1,
    title: 'AI Innovators Global Hack 2026',
    organizer: 'OpenAI & DevCommunity',
    category: 'Artificial Intelligence',
    prize: '$50,000',
    participants: 1240,
    daysLeft: '3 Days Left',
    tags: ['AI/ML', 'Python', 'LLMs'],
    topAccent: 'border-t-4 border-blue-500',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    glowBg: 'from-blue-500/15 via-indigo-500/10 to-transparent',
  },
  {
    id: 2,
    title: 'Web3 & Decentralized Future',
    organizer: 'Ethereum Foundation',
    category: 'Blockchain & Web3',
    prize: '$35,000',
    participants: 890,
    daysLeft: '6 Days Left',
    tags: ['Solidity', 'Smart Contracts', 'DeFi'],
    topAccent: 'border-t-4 border-purple-500',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    glowBg: 'from-purple-500/15 via-violet-500/10 to-transparent',
  },
  {
    id: 3,
    title: 'ClimateTech & Sustainability',
    organizer: 'GreenTech Alliance',
    category: 'Sustainability',
    prize: '$25,000',
    participants: 620,
    daysLeft: '12 Days Left',
    tags: ['IoT', 'Data Science', 'CleanTech'],
    topAccent: 'border-t-4 border-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    glowBg: 'from-emerald-500/15 via-teal-500/10 to-transparent',
  },
];

/* ─────────────────── Main Landing Page Component ─────────────────── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroTab, setHeroTab] = useState('leaderboard');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">

      {/* ╔═══════════════════════════════════════════════╗
          ║                   NAVBAR                      ║
          ╚═══════════════════════════════════════════════╝ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-xs'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <span className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold font-display text-lg shadow-sm shadow-blue-600/30 group-hover:scale-105 transition-all">
                H
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900">
                Hackathon<span className="text-blue-600">Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#events" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">Browse Hackathons</a>
              <a href="#features" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#workflow" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">Workspaces</a>
              <a href="#testimonials" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">Testimonials</a>
              <a href="#faq" className="text-base font-medium text-slate-600 hover:text-blue-600 transition-colors">FAQ</a>
            </nav>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link to="/login" className="px-4 py-2 text-base font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-5 py-2.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm shadow-blue-600/20 transition-all hover:shadow-md">
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-lg">
            <a href="#events" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-slate-700 hover:text-blue-600 py-1">Browse Hackathons</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-slate-700 hover:text-blue-600 py-1">Features</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-slate-700 hover:text-blue-600 py-1">Workspaces</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-slate-700 hover:text-blue-600 py-1">Testimonials</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-base font-medium text-slate-700 hover:text-blue-600 py-1">FAQ</a>
            <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
              <Link to="/login" className="w-full text-center py-2.5 text-base font-semibold text-slate-700 bg-slate-100 rounded-lg">Sign In</Link>
              <Link to="/register" className="w-full text-center py-2.5 text-base font-semibold text-white bg-blue-600 rounded-lg">Get Started Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ╔═══════════════════════════════════════════════╗
          ║                   HERO                        ║
          ╚═══════════════════════════════════════════════╝ */}
      <section className="relative pt-24 sm:pt-32 pb-16 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-r from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Accent Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-sm font-semibold text-blue-700 mb-6 shadow-2xs">
            <Sparkles size={15} className="text-amber-500" />
            <span>The Complete Platform for Hackathons & Developers</span>
            <ArrowUpRight size={15} className="text-blue-500" />
          </div>

          {/* Headline - +1 point bigger */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display tracking-tight text-slate-900 leading-[1.15] mb-5">
            Host & Participate in<br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Extraordinary Hackathons
            </span>
          </h1>

          {/* Subtitle - +1 point bigger */}
          <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            From team creation and live judging rubrics to instant QR check-ins and real-time leaderboards — empower your next big tech event.
          </p>

          {/* Action CTAs - +1 point bigger */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <Rocket size={18} />
              <span>Start Your Hackathon</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all hover:shadow-md flex items-center justify-center space-x-2"
            >
              <Play size={18} className="text-blue-600 fill-blue-600" />
              <span>Explore Live Workspace</span>
            </Link>
          </div>

          {/* Key Value Points */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-600 mb-12">
            <span className="flex items-center space-x-1.5"><Check size={16} className="text-blue-600 font-bold" /><span>Instant Team Matchmaking</span></span>
            <span className="flex items-center space-x-1.5"><Check size={16} className="text-violet-600 font-bold" /><span>Real-Time Judge Scoring</span></span>
            <span className="flex items-center space-x-1.5"><Check size={16} className="text-emerald-600 font-bold" /><span>Mobile QR Gate Scanning</span></span>
          </div>

          {/* Product Interface Showcase */}
          <div id="demo" className="relative max-w-4xl mx-auto text-left">
            <div className="absolute -left-5 -top-4 bg-white/95 rounded-xl shadow-lg border border-blue-200/80 px-4 py-2 hidden lg:flex items-center space-x-2.5 z-10">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-800">1,240 Participants Live</span>
            </div>
            <div className="absolute -right-5 top-1/3 bg-white/95 rounded-xl shadow-lg border border-amber-200/80 px-4 py-2 hidden lg:flex items-center space-x-2.5 z-10">
              <Trophy size={18} className="text-amber-500" />
              <span className="text-sm font-bold text-slate-800">$50,000 Prize Pool</span>
            </div>

            {/* Window Container */}
            <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="bg-slate-100/90 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs sm:text-sm font-mono text-slate-400">hackathonhub.app/live-workspace</span>
                </div>

                <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs sm:text-sm font-medium">
                  <button
                    onClick={() => setHeroTab('leaderboard')}
                    className={`px-3.5 py-1 rounded-md transition ${heroTab === 'leaderboard' ? 'bg-white text-blue-600 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Leaderboard
                  </button>
                  <button
                    onClick={() => setHeroTab('teams')}
                    className={`px-3.5 py-1 rounded-md transition ${heroTab === 'teams' ? 'bg-white text-blue-600 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Team Hub
                  </button>
                  <button
                    onClick={() => setHeroTab('checkin')}
                    className={`px-3.5 py-1 rounded-md transition ${heroTab === 'checkin' ? 'bg-white text-blue-600 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    QR Check-in
                  </button>
                </div>
              </div>

              {/* Dynamic View */}
              <div className="p-5 sm:p-6 bg-slate-50/50">
                {heroTab === 'leaderboard' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base font-display">AI Innovation Challenge — Live Standings</h4>
                        <p className="text-xs sm:text-sm text-slate-500">Real-time automated score aggregation from 6 assigned judges</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                        Live Scoring Active
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 text-xs sm:text-sm shadow-2xs">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">1</span>
                          <div>
                            <div className="font-bold text-slate-900">NeuralFlow AI</div>
                            <div className="text-xs text-slate-500">Category: AI & Medical Tech • 4 Members</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-blue-700 text-base">98.5 / 100</span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded block mt-0.5">1st Place</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/70 text-xs sm:text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">2</span>
                          <div>
                            <div className="font-semibold text-slate-800">EcoTrack IoT</div>
                            <div className="text-xs text-slate-400">Category: Sustainability • 3 Members</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 text-base">95.2 / 100</span>
                          <span className="text-xs text-slate-500 font-medium block">Runner Up</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {heroTab === 'teams' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base font-display">Team Matchmaking & Formation</h4>
                        <p className="text-xs sm:text-sm text-slate-500">Invite teammates with unique codes or browse hacker requests</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                        312 Teams Formed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="font-bold text-slate-900">CodeWarriors</span>
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">Full (4/4)</span>
                        </div>
                        <p className="text-xs text-slate-500">Building an automated code review bot using Gemini API.</p>
                        <div className="text-xs text-blue-600 font-semibold">Invite Code: CW-2026-X</div>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="font-bold text-slate-900">DevArchitects</span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">Need 1 UI Designer</span>
                        </div>
                        <p className="text-xs text-slate-500">Building a smart green energy tracker for smart cities.</p>
                        <div className="text-xs text-blue-600 font-semibold">Invite Code: DA-7701-Y</div>
                      </div>
                    </div>
                  </div>
                )}

                {heroTab === 'checkin' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base font-display">Fast Gate QR Check-in</h4>
                        <p className="text-xs sm:text-sm text-slate-500">Staff scan digital QR badges for instant venue entry</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                        96.4% Attendance
                      </span>
                    </div>

                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs sm:text-sm flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                          <QrCode size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-emerald-900">Verified Attendee Pass #1042</div>
                          <div className="text-xs text-emerald-700">Participant: Sarah Connor • Role: Developer</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md">Gate Entry Approved</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║                TRUST LOGOS                    ║
          ╚═══════════════════════════════════════════════╝ */}
      <section className="py-3.5 sm:py-4 bg-white border-y border-slate-200/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Empowering innovation at world-class organizations
          </p>
          <div className="relative overflow-hidden py-1">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee space-x-12 text-slate-400 font-display font-bold text-base sm:text-lg opacity-75">
              {[
                'Google', 'Microsoft', 'GitHub', 'Stripe', 'Amazon', 'Meta', 'OpenAI', 'Figma', 'Spotify', 'Netflix', 'Slack', 'Airbnb',
                'Google', 'Microsoft', 'GitHub', 'Stripe', 'Amazon', 'Meta', 'OpenAI', 'Figma', 'Spotify', 'Netflix', 'Slack', 'Airbnb'
              ].map((logo, idx) => (
                <span key={idx} className="whitespace-nowrap select-none hover:text-slate-700 transition-colors">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║             FEATURED HACKATHONS               ║
          ╚═══════════════════════════════════════════════╝ */}
      <section id="events" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-md mb-2">
                <Trophy size={14} />
                <span>Active Competitions</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 tracking-tight">
                Featured Hackathons
              </h2>
            </div>
            <Link to="/login" className="text-base font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>View All Hackathons</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED_HACKATHONS.map((h) => (
              <div
                key={h.id}
                className={`group relative bg-white rounded-2xl border border-slate-200/90 ${h.topAccent} p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between`}
              >
                {/* Animated Background Glow */}
                <div
                  className={`absolute -inset-10 bg-gradient-to-br ${h.glowBg} opacity-70 group-hover:opacity-100 animate-pulse pointer-events-none transition-all duration-500`}
                  style={{ animationDuration: '4s' }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${h.badgeBg}`}>
                      {h.category}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-500">{h.daysLeft}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 font-display">{h.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-4">{h.organizer}</p>

                  <div className="flex items-center space-x-2 mb-5">
                    {h.tags.map((tag) => (
                      <span key={tag} className="text-xs font-medium px-2.5 py-0.5 bg-slate-100/90 text-slate-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">Prize Pool</div>
                    <div className="text-lg font-extrabold text-slate-900 font-display">{h.prize}</div>
                  </div>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 rounded-xl transition-all shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║   STATS HIGHLIGHTS — UNSTOP PASTEL CARDS      ║
          ╚═══════════════════════════════════════════════╝ */}
      <section className="py-14 sm:py-20 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Card 1: Soft Pink — Hackathons Hosted */}
            <div className="bg-[#FEEBF0] rounded-3xl p-6 sm:p-7 relative overflow-hidden text-left border border-pink-200/50 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
              <div>
                <div className="text-4xl sm:text-5xl font-black font-display text-slate-900 tracking-tight mb-1">
                  <AnimatedCounter end={500} suffix="+" />
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-700 font-display">Hackathons Hosted</div>
              </div>

              {/* Bottom Right Globe + Floating Badges */}
              <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-pink-300/40 rounded-full flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <div className="w-28 h-28 bg-pink-400/50 rounded-full flex items-center justify-center">
                  <Globe size={48} className="text-pink-600/60" />
                </div>
                {/* Floating mini brand bubbles */}
                <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full shadow-md text-[10px] font-bold text-slate-800 flex items-center space-x-1">
                  <Trophy size={10} className="text-amber-500" />
                  <span>500+</span>
                </div>
                <div className="absolute bottom-6 right-4 bg-white p-1.5 rounded-full shadow-md text-slate-700">
                  <Flame size={12} className="text-rose-500" />
                </div>
              </div>
            </div>

            {/* Card 2: Soft Sky Blue — Participants Joined (with Verified Badge) */}
            <div className="bg-[#E1F0FF] rounded-3xl p-6 sm:p-7 relative overflow-hidden text-left border border-blue-200/50 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
              <div>
                <div className="text-4xl sm:text-5xl font-black font-display text-slate-900 tracking-tight mb-1">
                  <AnimatedCounter end={25000} suffix="+" />
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-700 font-display mb-3">Active Participants</div>
                
                {/* Avatars row */}
                <div className="flex items-center space-x-1">
                  {['PS', 'AC', 'MR', 'JK'].map((initials, idx) => (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full ${
                        ['bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-pink-600'][idx]
                      } text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white`}
                    >
                      {initials}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-white">
                    <CheckCircle size={14} className="fill-white text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Overlapping Verified Star Seal (as seen in photo 1) */}
              <div className="absolute -bottom-8 -right-6 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                <div className="w-28 h-28 bg-[#0075FF] rounded-3xl rotate-12 flex items-center justify-center shadow-lg">
                  <Check size={44} className="text-white font-black stroke-[3.5]" />
                </div>
              </div>
            </div>

            {/* Card 3: Soft Pastel Yellow — Teams Formed (with floating cards) */}
            <div className="bg-[#FFF7D6] rounded-3xl p-6 sm:p-7 relative overflow-hidden text-left border border-amber-200/60 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
              <div>
                <div className="text-4xl sm:text-5xl font-black font-display text-slate-900 tracking-tight mb-1">
                  <AnimatedCounter end={8500} suffix="+" />
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-700 font-display">Teams Formed</div>
              </div>

              {/* Floating Applicant Cards (like photo 1) */}
              <div className="absolute bottom-2 -right-2 space-y-1.5 pointer-events-none group-hover:translate-x-1 transition-transform duration-500">
                <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-amber-100 flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">SS</div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-900 leading-none">Shivam Sharma</div>
                    <div className="text-[9px] text-slate-400">Team CodeWarriors</div>
                  </div>
                </div>

                <div className="bg-amber-400 text-slate-900 px-3 py-1.5 rounded-xl shadow-md flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">VS</div>
                  <div>
                    <div className="text-[10px] font-bold leading-none">Vishalika S.</div>
                    <div className="text-[9px] text-slate-800 font-medium">Joined Team</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Soft Mint/Emerald — Partner Organizations */}
            <div className="bg-[#E6F8F3] rounded-3xl p-6 sm:p-7 relative overflow-hidden text-left border border-emerald-200/50 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[200px] flex flex-col justify-between group">
              <div>
                <div className="text-4xl sm:text-5xl font-black font-display text-slate-900 tracking-tight mb-1">
                  <AnimatedCounter end={150} suffix="+" />
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-700 font-display">Organizations</div>
              </div>

              {/* Bottom Right Verified Partner Seal */}
              <div className="absolute -bottom-8 -right-6 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                <div className="w-28 h-28 bg-emerald-600 rounded-3xl -rotate-12 flex items-center justify-center shadow-lg">
                  <Shield size={44} className="text-white fill-emerald-500" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║                   FEATURES                    ║
          ╚═══════════════════════════════════════════════╝ */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-md mb-3">
              <Zap size={14} />
              <span>Platform Capabilities</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-slate-900 tracking-tight mb-3">
              Built for Every Role in the Event
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Custom-built tools designed for organizers, hackers, judges, and staff volunteers.
            </p>
          </div>

          {/* 4 Unstop-Style Vertical Feature Cards (Matching Photo 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Card 1: Soft Purple Gradient — Easy Event Posting */}
            <div className="rounded-3xl bg-gradient-to-b from-indigo-100/80 via-purple-50/40 to-white border border-indigo-200/60 p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Top Graphic Illustration Box */}
                <div className="h-52 bg-white/90 rounded-2xl border border-indigo-100/80 p-3.5 mb-6 shadow-inner relative overflow-hidden flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="bg-blue-600 rounded-xl p-3 text-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-md bg-white text-blue-600 font-extrabold flex items-center justify-center text-[10px]">H</span>
                        <span>HackathonHub</span>
                      </div>
                      <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-extrabold">APPLY NOW</span>
                    </div>
                    <div className="text-[10px] text-blue-100 font-medium">Program Manager • AI Event</div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 text-xs flex items-center justify-between shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700">✓ Posted Hackathons</span>
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1">
                      <Sparkles size={9} />
                      <span>Generate with AI</span>
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold font-display text-slate-900 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
                  Easy Event Posting & Employer Branding
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Post hackathons for free in 3 minutes with a dedicated no-code microsite. Showcase your brand while tracking all real-time stats.
                </p>
              </div>
            </div>

            {/* Card 2: Soft Golden/Yellow Gradient — Online Assessment */}
            <div className="rounded-3xl bg-gradient-to-b from-amber-100/80 via-yellow-50/40 to-white border border-amber-200/60 p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Top Graphic Illustration Box */}
                <div className="h-52 bg-white/90 rounded-2xl border border-amber-100/80 p-3.5 mb-6 shadow-inner relative overflow-hidden flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center">H</div>
                      <span className="text-xs font-bold text-slate-900">UI UX Hackathon</span>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">+ Rounds</span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-emerald-900">Round 1: Assessment</span>
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Live</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-slate-700">Round 2: Team Interview</span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">Scheduled</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold font-display text-slate-900 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
                  Online Assessment & Team Screening
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Add online team screening rules tailored for roles or skills. Shortlist top teams with automated scoring and team limits with ease.
                </p>
              </div>
            </div>

            {/* Card 3: Soft Sky Blue Gradient — Built-in Applicant Tracking */}
            <div className="rounded-3xl bg-gradient-to-b from-blue-100/80 via-cyan-50/40 to-white border border-blue-200/60 p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Top Graphic Illustration Box */}
                <div className="h-52 bg-white/90 rounded-2xl border border-blue-100/80 p-3.5 mb-6 shadow-inner relative overflow-hidden flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">RK</div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 leading-none">Radhika Kumar</div>
                        <div className="text-[9px] text-slate-400">Team Leader</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-600">97% Match</span>
                  </div>

                  <div className="flex space-x-1.5 text-[9px]">
                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md font-bold">✓ Shortlist</span>
                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded-md font-bold">✕ Reject</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>✓ Projects Evaluation</span>
                      <span className="font-bold text-emerald-600">97%</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>✓ Technical Rubric</span>
                      <span className="font-bold text-emerald-600">95%</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold font-display text-slate-900 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
                  Built-in Judging & Scoring System
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Smart judging rubrics record candidate and team score info in a single dashboard. Assess, track, and rank teams without toggling tools.
                </p>
              </div>
            </div>

            {/* Card 4: Soft Rose/Pink Gradient — Bulk Virtual Gate Passes */}
            <div className="rounded-3xl bg-gradient-to-b from-rose-100/80 via-pink-50/40 to-white border border-rose-200/60 p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Top Graphic Illustration Box */}
                <div className="h-52 bg-white/90 rounded-2xl border border-rose-100/80 p-3.5 mb-6 shadow-inner relative overflow-hidden flex flex-col justify-between group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex space-x-1">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">✓ Shortlisted</span>
                    </div>
                    <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">✓ Verified Pass</span>
                  </div>

                  <div className="bg-amber-400 text-slate-900 p-2.5 rounded-xl shadow-md space-y-1">
                    <div className="text-[11px] font-extrabold font-display">John Carter - Winner Pass</div>
                    <div className="text-[9px] font-semibold text-slate-800">Congratulations John Carter! Entry Approved.</div>
                  </div>
                </div>

                <h3 className="text-xl font-bold font-display text-slate-900 mb-2.5 leading-snug group-hover:text-blue-600 transition-colors">
                  QR Gate Check-in & Role Controls
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Fast gate scanning for event staff, real-time attendance dashboards, and granular role-based workspace access for all event members.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║                 WHY US                        ║
          ╚═══════════════════════════════════════════════╝ */}
      <section id="why-us" className="py-16 sm:py-24 bg-slate-50/70 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-md mb-3">
                <Target size={14} />
                <span>Why Choose HackathonHub</span>
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-slate-900 tracking-tight mb-4">
                Less Administrative Work,<br />More Innovation
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 leading-relaxed">
                HackathonHub replaces fragmented spreadsheets, forms, and chat groups with a unified workspace built for seamless hackathons.
              </p>

              <div className="space-y-3.5">
                {[
                  { text: 'Set up your event in less than 5 minutes', iconColor: 'text-blue-600 bg-blue-50' },
                  { text: 'Live real-time analytics & attendance dashboards', iconColor: 'text-violet-600 bg-violet-50' },
                  { text: 'Multi-hackathon context switching from a single account', iconColor: 'text-emerald-600 bg-emerald-50' },
                  { text: 'Enterprise-grade security & permission controls', iconColor: 'text-amber-600 bg-amber-50' },
                  { text: 'Intuitive, mobile-responsive user experience', iconColor: 'text-indigo-600 bg-indigo-50' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center space-x-3">
                    <div className={`w-5.5 h-5.5 rounded-full ${item.iconColor} flex items-center justify-center flex-shrink-0`}>
                      <Check size={13} className="font-bold" />
                    </div>
                    <span className="text-base font-medium text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Showcase Cards */}
            <div className="space-y-3.5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-display">Instant Event Onboarding</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Launch public registrations and team invites in minutes.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-display">Automated Score Calculations</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Judges score independently; rankings update instantly.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={22} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-display">Verified QR Check-in</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Fast gate scanning to eliminate check-in bottlenecks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║               TESTIMONIALS                    ║
          ╚═══════════════════════════════════════════════╝ */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-md mb-3">
              <Star size={14} />
              <span>Community Feedback</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-slate-900 tracking-tight mb-3">
              Loved by Hackers & Hosts
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                role: 'University Hackathon Director',
                quote: 'HackathonHub streamlined our team formation and live check-in completely. Saved our organizing team countless hours!',
                avatarBg: 'bg-blue-600 text-white',
              },
              {
                name: 'Alex Chen',
                role: 'Senior Full-Stack Developer',
                quote: 'Finding teammates and checking live leaderboard scores during the hackathon was super smooth and intuitive.',
                avatarBg: 'bg-violet-600 text-white',
              },
              {
                name: 'Maria Rodriguez',
                role: 'Tech Community Lead',
                quote: 'The judging rubric system is fantastic. Multi-criterion scoring with automatic leaderboard updates made our event stress-free.',
                avatarBg: 'bg-emerald-600 text-white',
              },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center space-x-1 mb-3 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-base text-slate-600 leading-relaxed italic mb-6">"{t.quote}"</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl ${t.avatarBg} font-bold text-xs flex items-center justify-center font-display`}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900 font-display">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║                   FAQ                         ║
          ╚═══════════════════════════════════════════════╝ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50/50 border-t border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-600">Quick answers to common questions about HackathonHub.</p>
          </div>

          <div className="space-y-3.5">
            {[
              { q: 'Is HackathonHub free for participants?', a: 'Yes! Hackers can browse events, join teams, and submit projects completely free.' },
              { q: 'How long does it take to create a hackathon?', a: 'Under 5 minutes. You can set rules, team sizes, schedule phases, and publish immediately.' },
              { q: 'Can I manage multiple hackathons simultaneously?', a: 'Yes. Our context switcher lets you manage or participate in multiple hackathons seamlessly.' },
              { q: 'How does live judging work?', a: 'Organizers add judges with custom scoring rubrics. Scores automatically compute onto the event leaderboard.' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 text-left font-bold text-slate-900 text-base flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <span className="flex items-center space-x-3">
                    <Check size={18} className="text-blue-600 flex-shrink-0" />
                    <span>{item.q}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed pl-10 border-t border-slate-100">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║                 FINAL CTA                     ║
          ╚═══════════════════════════════════════════════╝ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-600/20">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display mb-3">
              Ready to Host or Join a Hackathon?
            </h2>
            <p className="text-base sm:text-lg text-blue-100 max-w-xl mx-auto mb-6">
              Create your account today and start building with thousands of innovators.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="w-full sm:w-auto px-7 py-3.5 text-base font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-xl shadow-sm transition">
                Get Started Free
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white border border-blue-400/80 rounded-xl hover:bg-blue-700 transition">
                Sign In to Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════════╗
          ║                  FOOTER                       ║
          ╚═══════════════════════════════════════════════╝ */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-xs sm:text-sm">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-display text-sm">H</span>
                <span className="text-base font-bold font-display text-white">Hackathon<span className="text-blue-500">Hub</span></span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">The all-in-one workspace for managing and joining hackathons worldwide.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#events" className="hover:text-white transition">Browse Events</a></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#demo" className="hover:text-white transition">Interactive Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Resources</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><Link to="/login" className="hover:text-white transition">Dashboard</Link></li>
                <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500">
            <p>© {new Date().getFullYear()} HackathonHub. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Designed for developers & innovators.</p>
          </div>
        </div>
      </footer>

      {/* ── Animation Styles ── */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
      `}</style>
    </div>
  );
}
