import React from 'react';
import { motion } from 'framer-motion';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { LogEntry } from '../types';

interface SecurityChartProps {
  logs: LogEntry[];
}

export const SecurityChart: React.FC<SecurityChartProps> = ({ logs }) => {
  // ✅ Time series (last 20 events)
  const timeSeriesData = logs.slice(-20).map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString(),
    mse: log.mse,
    isAttack: Number(log.is_attack), // normalize
  }));

  // ✅ Distribution data
  const attackCount = logs.filter(log => Number(log.is_attack) === 1).length;
  const normalCount = logs.filter(log => Number(log.is_attack) === 0).length;

  const pieData = [
    { name: 'Normal', value: normalCount, color: '#10B981' },
    { name: 'Attacks', value: attackCount, color: '#EF4444' }
  ];

  // ✅ Custom tooltip for MSE chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white text-sm">{`Time: ${label}`}</p>
          <p className="text-blue-400 text-sm">{`MSE: ${entry.mse.toFixed(6)}`}</p>
          <p className={`text-sm ${entry.isAttack ? 'text-red-400' : 'text-green-400'}`}>
            {entry.isAttack ? 'Attack Detected' : 'Normal'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* MSE Time Series */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          <span>Real-time MSE Analysis</span>
        </h3>

        {timeSeriesData.length === 0 ? (
          <p className="text-gray-400 text-center mt-12">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="mseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mse"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#mseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Attack Distribution */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
          <span>Security Status Distribution</span>
        </h3>

        {normalCount + attackCount === 0 ? (
          <p className="text-gray-400 text-center mt-12">No data available</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center space-x-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-300 text-sm">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
