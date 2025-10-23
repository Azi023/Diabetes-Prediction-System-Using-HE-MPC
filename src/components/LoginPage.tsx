import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Shield, Brain, Zap, AlertCircle, CheckCircle, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials, RegisterCredentials } from '../types/auth';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { login, register, error, isLoading, clearError } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState<RegisterCredentials>({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    role: 'patient',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(credentials);
      toast.success('Login successful!');
    } catch (err) {
      // Error is handled by the context and useEffect above
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password || !registerData.username || 
        !registerData.firstName || !registerData.lastName) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await register(registerData);
      toast.success('Registration successful!');
      setIsRegisterMode(false);
    } catch (err) {
      // Error is handled by the context and useEffect above
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        
        {/* Animated Particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
        
        {/* Floating Orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center lg:text-left"
        >
          <motion.div 
            className="flex items-center justify-center lg:justify-start space-x-4 mb-8"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 rounded-3xl shadow-2xl"
                animate={{ 
                  boxShadow: [
                    "0 0 30px rgba(59, 130, 246, 0.5)",
                    "0 0 50px rgba(147, 51, 234, 0.5)",
                    "0 0 30px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Brain className="h-12 w-12 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            </div>
            
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                AI MedGuard Pro
              </h1>
              <p className="text-blue-200 text-lg flex items-center space-x-2 mt-2">
                <Zap className="h-5 w-5" />
                <span>Enterprise Health Analytics Platform</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Advanced AI-Powered Healthcare Solutions
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Secure, intelligent, and real-time health monitoring with cutting-edge machine learning algorithms and enterprise-grade security protocols.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {[
                { icon: Shield, title: "Advanced Security", desc: "Real-time threat detection" },
                { icon: Brain, title: "AI Analytics", desc: "Machine learning predictions" },
                { icon: Zap, title: "Real-time Monitoring", desc: "Live health tracking" },
                { icon: CheckCircle, title: "Enterprise Grade", desc: "Production-ready platform" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-black/30 transition-all duration-300"
                >
                  <feature.icon className="h-8 w-8 text-blue-400 mb-2" />
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
          
          <div className="relative bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">
                {isRegisterMode ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p className="text-gray-300">
                {isRegisterMode ? 'Register for AI MedGuard Pro' : 'Sign in to access your dashboard'}
              </p>
            </div>

            <form onSubmit={isRegisterMode ? handleRegister : handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {isRegisterMode && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="First name"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="Last name"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={registerData.username}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full pl-12 pr-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="Choose a username"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={isRegisterMode ? registerData.email : credentials.email}
                      onChange={(e) => {
                        if (isRegisterMode) {
                          setRegisterData(prev => ({ ...prev, email: e.target.value }));
                        } else {
                          setCredentials(prev => ({ ...prev, email: e.target.value }));
                        }
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={isRegisterMode ? registerData.password : credentials.password}
                      onChange={(e) => {
                        if (isRegisterMode) {
                          setRegisterData(prev => ({ ...prev, password: e.target.value }));
                        } else {
                          setCredentials(prev => ({ ...prev, password: e.target.value }));
                        }
                      }}
                      className="w-full pl-12 pr-12 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl shadow-blue-500/25 flex items-center justify-center space-x-3"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>{isRegisterMode ? 'Creating Account...' : 'Authenticating...'}</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key={isRegisterMode ? "register" : "signin"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {isRegisterMode ? (
                        <div className="flex items-center space-x-2">
                          <UserPlus className="h-5 w-5" />
                          <span>Create Account</span>
                        </div>
                      ) : (
                        <span>Sign In</span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Toggle Register/Login */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-400 mb-4">
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <motion.button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300"
              >
                {isRegisterMode ? 'Sign In' : 'Create Account'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};