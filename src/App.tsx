// import React, { useState } from 'react';
// import { Toaster } from 'react-hot-toast';
// import { AnimatedBackground } from './components/AnimatedBackground';
// import { Header } from './components/Header';
// import { PredictionForm } from './components/PredictionForm';
// import { Dashboard } from './components/Dashboard';

// function App() {
//   const [activeTab, setActiveTab] = useState<'predict' | 'dashboard'>('predict');

//   return (
//     <div className="min-h-screen relative overflow-hidden">
//       <AnimatedBackground />
      
//       <div className="relative z-10">
//         <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
//         <main className="py-12 px-4 sm:px-6 lg:px-8">
//           {activeTab === 'predict' ? <PredictionForm /> : <Dashboard />}
//         </main>
        
//         <footer className="relative bg-black/20 backdrop-blur-xl border-t border-white/10 mt-20">
//           <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
//             <div className="text-center">
//               <p className="text-gray-300 text-lg font-medium">
//                  AI MedGuard Pro - Enterprise Health Analytics Platform
//               </p>
//               <p className="text-gray-400 text-sm mt-2">
//                 Powered by Advanced Machine Learning & Real-time Security Intelligence
//               </p>
//             </div>
//           </div>
//         </footer>
//       </div>
      
//       <Toaster 
//         position="top-right"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             background: '#1F2937',
//             color: '#F9FAFB',
//             border: '1px solid rgba(255, 255, 255, 0.1)',
//             borderRadius: '12px',
//             backdropFilter: 'blur(16px)',
//           },
//         }}
//       />
//     </div>
//   );
// }

// export default App;


import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Header } from './components/Header';
import { PredictionForm } from './components/PredictionForm';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './utils/ProtectedRoute';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'predict' | 'dashboard'>('predict');

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* User Info Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                <UserIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-sm">
                  Role: <span className="text-blue-400">{user?.role}</span>
                </p>
              </div>
            </div>
            
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 border border-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </motion.div>
        </div>
        
        <main className="py-12 px-4 sm:px-6 lg:px-8">
          {/* Prediction Form - Only for patients and admins */}
          {activeTab === 'predict' && (
            <ProtectedRoute allowedRoles={['patient', 'admin']}>
              <PredictionForm />
            </ProtectedRoute>
          )}
          
          {/* Dashboard - Only for admins */}
          {activeTab === 'dashboard' && (
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          )}
        </main>
        
        <footer className="relative bg-black/20 backdrop-blur-xl border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-300 text-lg font-medium">
                AI MedGuard Pro - Enterprise Health Analytics Platform
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Powered by Advanced Machine Learning & Real-time Security Intelligence
              </p>
            </div>
          </div>
        </footer>
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(16px)',
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;