// import React from 'react';
// import { motion } from 'framer-motion';
// import { Activity, Shield, BarChart3, Brain, Zap } from 'lucide-react';

// interface HeaderProps {
//   activeTab: 'predict' | 'dashboard';
//   onTabChange: (tab: 'predict' | 'dashboard') => void;
// }

// export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
//   return (
//     <motion.header 
//       initial={{ y: -100, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       transition={{ duration: 0.8, ease: "easeOut" }}
//       className="relative bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl"
//     >
//       <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
      
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center py-6">
//           <motion.div 
//             className="flex items-center space-x-4"
//             whileHover={{ scale: 1.02 }}
//             transition={{ type: "spring", stiffness: 300 }}
//           >
//             <div className="relative">
//               <motion.div 
//                 className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded-2xl shadow-2xl"
//                 animate={{ 
//                   boxShadow: [
//                     "0 0 20px rgba(59, 130, 246, 0.5)",
//                     "0 0 30px rgba(147, 51, 234, 0.5)",
//                     "0 0 20px rgba(59, 130, 246, 0.5)"
//                   ]
//                 }}
//                 transition={{ duration: 3, repeat: Infinity }}
//               >
//                 <Brain className="h-8 w-8 text-white" />
//               </motion.div>
//               <motion.div
//                 className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"
//                 animate={{ scale: [1, 1.2, 1] }}
//                 transition={{ duration: 2, repeat: Infinity }}
//               />
//             </div>
            
//             <div>
//               <motion.h1 
//                 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.3 }}
//               >
//                 AI MedGuard Pro
//               </motion.h1>
//               <motion.p 
//                 className="text-blue-200 text-sm flex items-center space-x-2"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.5 }}
//               >
//                 <Zap className="h-4 w-4" />
//                 <span>Advanced ML-Powered Health Analytics & Threat Detection</span>
//               </motion.p>
//             </div>
//           </motion.div>
          
//           <nav className="flex space-x-2 bg-black/30 backdrop-blur-lg p-2 rounded-2xl border border-white/10">
//             {[
//               { id: 'predict', label: 'AI Prediction', icon: Shield },
//               { id: 'dashboard', label: 'Security Center', icon: BarChart3 }
//             ].map((tab) => (
//               <motion.button
//                 key={tab.id}
//                 onClick={() => onTabChange(tab.id as 'predict' | 'dashboard')}
//                 className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
//                   activeTab === tab.id
//                     ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
//                     : 'text-blue-200 hover:text-white hover:bg-white/10'
//                 }`}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <tab.icon className="h-4 w-4" />
//                 <span>{tab.label}</span>
//               </motion.button>
//             ))}
//           </nav>
//         </div>
//       </div>
//     </motion.header>
//   );
// };

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, BarChart3, Brain, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeTab: 'predict' | 'dashboard';
  onTabChange: (tab: 'predict' | 'dashboard') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  
  // Define tabs based on user role
  const tabs = [
    { id: 'predict', label: 'AI Prediction', icon: Shield, roles: ['patient', 'admin'] }
  ];

  // Only show dashboard for admins
  if (user?.role === 'admin') {
  tabs.push({ id: 'dashboard', label: 'Security Center', icon: BarChart3, roles: ['admin'] });
  tabs.push({ id: 'mpc', label: 'MPC Collaboration', icon: Brain, roles: ['admin'] });
  }

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded-2xl shadow-2xl"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 30px rgba(147, 51, 234, 0.5)",
                    "0 0 20px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Brain className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            <div>
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                AI MedGuard Pro
              </motion.h1>
              <motion.p 
                className="text-blue-200 text-sm flex items-center space-x-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Zap className="h-4 w-4" />
                <span>Advanced ML-Powered Health Analytics & Threat Detection</span>
              </motion.p>
            </div>
          </motion.div>
          
          <nav className="flex space-x-2 bg-black/30 backdrop-blur-lg p-2 rounded-2xl border border-white/10">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id as 'predict' | 'dashboard')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </div>
    </motion.header>
  );
};