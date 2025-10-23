import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Hash,
  TrendingUp,
  Activity,
  Zap,
  Eye,
  AlertOctagon,
  Brain,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";

import type { LogEntry } from "../types";
import ApiService from '../services/api';
import { StatsCard } from "./StatsCard";
import { SecurityChart } from "./SecurityChart";

// Enhanced LogEntry type to include event_type
interface EnhancedLogEntry extends LogEntry {
  event_type?: string;
  additional_info?: any;
}

export const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<EnhancedLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EnhancedLogEntry | null>(null);

  // --- Helpers ---
  const normalizeLogs = (data: any[]): EnhancedLogEntry[] =>
    (Array.isArray(data) ? data : []).map((r: any) => ({
      id: r.id || r._id,
      timestamp: String(r.timestamp ?? ""),
      input_hash: String(r.input_hash ?? ""),
      mse: Number(r.mse),
      is_attack: r.is_attack === true || r.is_attack === 1 || r.is_attack === "1",
      event_type: String(r.event_type || "unknown"),
      additional_info: r.additional_info || {},
    }));

  const formatTimestamp = (timestamp: string) => {
    const isoLike = timestamp.includes(" ") ? timestamp.replace(" ", "T") : timestamp;
    const d = new Date(isoLike);
    return isNaN(d.getTime()) ? timestamp : d.toLocaleString();
  };

  const formatHash = (hash: string) =>
    hash && hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;

  // Enhanced status rendering function
  const renderStatus = (log: EnhancedLogEntry) => {
    if (!log.is_attack) {
      return (
        <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.05 }}>
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-sm font-bold rounded-xl border border-green-500/30">
            SECURE
          </span>
        </motion.div>
      );
    }

    // Determine threat type based on event_type
    let threatType = "THREAT DETECTED";
    let icon = <AlertTriangle className="h-5 w-5 text-red-400" />;
    let bgColor = "from-red-500/20 to-orange-500/20";
    let textColor = "text-red-300";
    let borderColor = "border-red-500/30";

    switch (log.event_type) {
      case "poisoning_check":
        threatType = "MODEL POISONING";
        icon = <Database className="h-5 w-5 text-purple-400" />;
        bgColor = "from-purple-500/20 to-pink-500/20";
        textColor = "text-purple-300";
        borderColor = "border-purple-500/30";
        break;
      case "extraction_check":
        threatType = "MODEL EXTRACTION";
        icon = <Brain className="h-5 w-5 text-orange-400" />;
        bgColor = "from-orange-500/20 to-red-500/20";
        textColor = "text-orange-300";
        borderColor = "border-orange-500/30";
        break;
      case "poisoning_check_error":
        threatType = "POISONING CHECK ERROR";
        icon = <AlertOctagon className="h-5 w-5 text-red-400" />;
        break;
      case "extraction_check_error":
        threatType = "EXTRACTION CHECK ERROR";
        icon = <AlertOctagon className="h-5 w-5 text-red-400" />;
        break;
      default:
        // Keep default red styling for unknown threats
        break;
    }

    return (
      <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.05 }}>
        {icon}
        <span className={`px-4 py-2 bg-gradient-to-r ${bgColor} ${textColor} text-sm font-bold rounded-xl border ${borderColor}`}>
          {threatType}
        </span>
      </motion.div>
    );
  };

  // Enhanced event type display
  const getEventTypeDisplay = (eventType: string) => {
    const eventTypes: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      poisoning_check: {
        label: "Poisoning Check",
        color: "text-purple-400",
        icon: <Database className="h-4 w-4" />
      },
      extraction_check: {
        label: "Extraction Check", 
        color: "text-orange-400",
        icon: <Brain className="h-4 w-4" />
      },
      prediction_success: {
        label: "Prediction",
        color: "text-blue-400",
        icon: <CheckCircle className="h-4 w-4" />
      },
      record_created: {
        label: "Record Created",
        color: "text-green-400",
        icon: <CheckCircle className="h-4 w-4" />
      },
      system_error: {
        label: "System Error",
        color: "text-red-400",
        icon: <AlertTriangle className="h-4 w-4" />
      },
      poisoning_check_error: {
        label: "Poisoning Error",
        color: "text-red-400",
        icon: <AlertOctagon className="h-4 w-4" />
      },
      extraction_check_error: {
        label: "Extraction Error",
        color: "text-red-400",
        icon: <AlertOctagon className="h-4 w-4" />
      }
    };

    const eventInfo = eventTypes[eventType] || {
      label: eventType || "Unknown",
      color: "text-gray-400",
      icon: <Activity className="h-4 w-4" />
    };

    return (
      <div className={`flex items-center space-x-2 ${eventInfo.color}`}>
        {eventInfo.icon}
        <span className="text-xs font-medium">{eventInfo.label}</span>
      </div>
    );
  };

  // --- Fetch ---
  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const raw = await ApiService.getLogs();
      const normalized = normalizeLogs(raw);
      setLogs(normalized);
      if (isRefresh) {
        toast.success("Data refreshed!", {
          style: { background: "#1F2937", color: "#10B981", border: "1px solid #10B981" },
        });
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch logs");
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const id = setInterval(() => fetchLogs(true), 10000);
    return () => clearInterval(id);
  }, []);

  // Enhanced derived metrics
  const { total, attackCount, normalCount, attackRate, avgMse, poisoningAttacks, extractionAttacks } = useMemo(() => {
    const total = logs.length;
    const attackCount = logs.filter((l) => !!l.is_attack).length;
    const normalCount = Math.max(0, total - attackCount);
    const attackRate = total ? ((attackCount / total) * 100).toFixed(1) : "0";
    const avgMse = total
      ? (logs.reduce((s, l) => s + Number(l.mse || 0), 0) / total).toFixed(6)
      : "0";
    
    // Count specific attack types
    const poisoningAttacks = logs.filter((l) => l.is_attack && l.event_type === "poisoning_check").length;
    const extractionAttacks = logs.filter((l) => l.is_attack && l.event_type === "extraction_check").length;

    return { total, attackCount, normalCount, attackRate, avgMse, poisoningAttacks, extractionAttacks };
  }, [logs]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
          />
          <span className="ml-4 text-2xl text-gray-300">Loading Security Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Security Command Center
        </h1>
        <p className="text-xl text-gray-300">Real-time threat monitoring and analytics</p>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatsCard
          title="Total Requests"
          value={total}
          icon={TrendingUp}
          color="from-blue-500 to-cyan-500"
          trend={5}
          delay={0}
        />
        <StatsCard
          title="Normal Requests"
          value={normalCount}
          icon={CheckCircle}
          color="from-green-500 to-emerald-500"
          trend={2}
          delay={0.1}
        />
        <StatsCard
          title="Total Threats"
          value={attackCount}
          icon={Shield}
          color="from-red-500 to-pink-500"
          trend={-1}
          delay={0.2}
        />
        <StatsCard
          title="Poisoning Attacks"
          value={poisoningAttacks}
          icon={Database}
          color="from-purple-500 to-pink-500"
          delay={0.3}
        />
        <StatsCard
          title="Extraction Attacks"
          value={extractionAttacks}
          icon={Brain}
          color="from-orange-500 to-red-500"
          delay={0.4}
        />
        <StatsCard
          title="Attack Rate"
          value={`${attackRate}%`}
          icon={AlertTriangle}
          color="from-orange-500 to-red-500"
          delay={0.5}
        />
      </div>

      {/* Charts */}
      <SecurityChart logs={logs} />

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-300">
            <Activity className="h-5 w-5 text-green-400" />
            <span>Live Monitoring Active</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <Zap className="h-5 w-5 text-blue-400" />
            <span>Avg MSE: {avgMse}</span>
          </div>
        </div>

        <motion.button
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </motion.button>
      </motion.div>

      {/* Enhanced Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <span>Security Event Log</span>
          </h2>
        </div>

        {error ? (
          <div className="p-8">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-lg">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <Shield className="h-16 w-16 text-gray-500 mx-auto mb-6" />
            <p className="text-gray-400 text-xl">No security events recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/60">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Timestamp</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4" />
                      <span>Input Hash</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    MSE Score
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <AnimatePresence>
                  {logs.map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/5 transition-all duration-300 group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-300">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm">
                        {getEventTypeDisplay(log.event_type || "")}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-mono text-gray-400">
                        <span className="bg-gray-800/50 px-3 py-1 rounded-lg">
                          {formatHash(log.input_hash)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold ${
                            Number(log.mse) > 0.1
                              ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border border-red-500/30"
                              : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30"
                          }`}
                        >
                          {Number(log.mse).toFixed(6)}
                        </motion.span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {renderStatus(log)}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <motion.button
                          onClick={() => setSelectedLog(log)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 border border-blue-500/30"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Enhanced Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Security Event Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Event ID</label>
                  <p className="text-white font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Event Type</label>
                  <div className="mt-1">
                    {getEventTypeDisplay(selectedLog.event_type || "")}
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Timestamp</label>
                  <p className="text-white">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Input Hash</label>
                  <p className="text-white font-mono break-all">{selectedLog.input_hash}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">MSE Score</label>
                  <p className="text-white">{Number(selectedLog.mse).toFixed(6)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Security Status</label>
                  <div className="mt-1">
                    {renderStatus(selectedLog)}
                  </div>
                </div>
                {selectedLog.additional_info && Object.keys(selectedLog.additional_info).length > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm">Additional Information</label>
                    <pre className="text-white text-xs bg-gray-800/50 p-3 rounded-lg mt-1 overflow-auto">
                      {JSON.stringify(selectedLog.additional_info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};