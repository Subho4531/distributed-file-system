import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Upload as UploadIcon, Files, Shield, Menu, X, LogOut, User, Cpu, Info } from "lucide-react";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import FileList from "./pages/FileList";
import FileDetails from "./pages/FileDetails";
import Comparison from "./pages/Comparison";
import SystemInfo from "./pages/SystemInfo";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { cn } from "./lib/utils";

function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div className="aurora-blur aurora-1" />
      <div className="aurora-blur aurora-2" />
      <div className="aurora-blur aurora-3" />
      <div className="aurora-blur aurora-4" />
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/upload", label: "Upload", icon: UploadIcon },
    { path: "/files", label: "Files", icon: Files },
    { path: "/comparison", label: "Protocols", icon: Cpu },
    { path: "/info", label: "System", icon: Info },
  ];

  if (location.pathname === "/login") return null;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-500 border-b",
        isScrolled
          ? "bg-slate-950/80 backdrop-blur-xl border-white/10 py-3"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
              ShardX
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center space-x-2",
                    isActive
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-4"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Online</span>
            </div>

            {user && (
              <div className="flex items-center space-x-4 border-l border-white/10 pl-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Node</span>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-300 group"
                  title="Terminate Session"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        isActive
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {user && (
                <div className="pt-4 border-t border-white/5">
                  <div className="px-4 py-3 flex items-center justify-between text-slate-400">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5" />
                      <span className="text-sm font-bold truncate max-w-[200px]">{user.email}</span>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-rose-400 font-black text-[10px] uppercase tracking-widest"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><PageWrapper><Upload /></PageWrapper></ProtectedRoute>} />
        <Route path="/files" element={<ProtectedRoute><PageWrapper><FileList /></PageWrapper></ProtectedRoute>} />
        <Route path="/file/:fileId" element={<ProtectedRoute><PageWrapper><FileDetails /></PageWrapper></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><PageWrapper><Comparison /></PageWrapper></ProtectedRoute>} />
        <Route path="/info" element={<ProtectedRoute><PageWrapper><SystemInfo /></PageWrapper></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen relative selection:bg-blue-500/30">
          <AuroraBackground />
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <AnimatedRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}


