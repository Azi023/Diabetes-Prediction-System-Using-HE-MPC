import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Database,
  Lock,
  Zap,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  Brain,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HospitalData {
  count: number;
  sample_nics: string[];
  all_nics: string[];
}

interface PSIResult {
  common_count: number;
  common_nics: string[];
  message: string;
}

interface MPCPredictionResult {
  nic: string;
  secure_score: number;
  probability: number;
  prediction: string;
  features: Record<string, any>;
}

export const MPCDashboard: React.FC = () => {
  const [hospitalA, setHospitalA] = useState<HospitalData | null>(null);
  const [hospitalB, setHospitalB] = useState<HospitalData | null>(null);
  const [psiResult, setPsiResult] = useState<PSIResult | null>(null);
  const [mpcResult, setMpcResult] = useState<MPCPredictionResult | null>(null);
  const [selectedNIC, setSelectedNIC] = useState<string>('');
  
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingPSI, setLoadingPSI] = useState(false);
  const [loadingMPC, setLoadingMPC] = useState(false);

  // Fetch hospital data
  const fetchHospitalData = async () => {
    setLoadingHospitals(true);
    try {
      const response = await fetch('/api/mpc/hospital-data?hospital=both&limit=50');
      const data = await response.json();

      if (data.ok) {
        setHospitalA(data.data.hospital_a);
        setHospitalB(data.data.hospital_b);
        setPsiResult(null);
        setMpcResult(null);
        toast.success('Hospital data loaded successfully!', {
          style: {
            background: '#1F2937',
            color: '#10B981',
            border: '1px solid #10B981',
          },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch hospital data');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load hospital data');
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Perform PSI
  const performPSI = async () => {
    if (!hospitalA || !hospitalB) {
      toast.error('Please load hospital data first');
      return;
    }

    setLoadingPSI(true);
    try {
      const response = await fetch('/api/mpc/psi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nics_a: hospitalA.all_nics,
          nics_b: hospitalB.all_nics,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setPsiResult(data);
        setMpcResult(null);
        toast.success(`PSI Complete! Found ${data.common_count} common patients`, {
          style: {
            background: '#1F2937',
            color: '#10B981',
            border: '1px solid #10B981',
          },
        });
      } else {
        throw new Error(data.error || 'PSI failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'PSI protocol failed');
    } finally {
      setLoadingPSI(false);
    }
  };

  // Perform MPC Prediction
  const performMPCPrediction = async () => {
    if (!selectedNIC) {
      toast.error('Please select a patient NIC');
      return;
    }

    setLoadingMPC(true);
    try {
      const response = await fetch(`/api/mpc/predict/${selectedNIC}`);
      const data = await response.json();

      if (data.ok) {
        setMpcResult(data);
        toast.success('MPC Prediction complete!', {
          style: {
            background: '#1F2937',
            color: '#10B981',
            border: '1px solid #10B981',
          },
        });
      } else {
        throw new Error(data.error || 'MPC prediction failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'MPC prediction failed');
    } finally {
      setLoadingMPC(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Multi-Party Computation Collaboration
        </h1>
        <p className="text-xl text-gray-300">
          Secure diabetes prediction using Private Set Intersection and MPC
        </p>
      </motion.div>

      {/* Step 1: Load Hospital Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
              <Database className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Step 1: Load Hospital Data</h2>
              <p className="text-gray-400 text-sm">Fetch patient NICs from both hospitals</p>
            </div>
          </div>
          
          <motion.button
            onClick={fetchHospitalData}
            disabled={loadingHospitals}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
          >
            {loadingHospitals ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                <span>Load Data</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Hospital Data Display */}
        {(hospitalA || hospitalB) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Hospital A */}
            {hospitalA && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-blue-300">Hospital A</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-4">{hospitalA.count} Patients</p>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-semibold">Sample NICs:</p>
                  {hospitalA.sample_nics.slice(0, 5).map((nic, idx) => (
                    <div key={idx} className="text-gray-300 text-sm font-mono bg-black/30 px-3 py-1 rounded">
                      {nic}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Hospital B */}
            {hospitalB && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-purple-300">Hospital B</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-4">{hospitalB.count} Patients</p>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-semibold">Sample NICs:</p>
                  {hospitalB.sample_nics.slice(0, 5).map((nic, idx) => (
                    <div key={idx} className="text-gray-300 text-sm font-mono bg-black/30 px-3 py-1 rounded">
                      {nic}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Step 2: Run PSI */}
      {hospitalA && hospitalB && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Step 2: Private Set Intersection</h2>
                <p className="text-gray-400 text-sm">Find common patients without revealing identities</p>
              </div>
            </div>

            <motion.button
              onClick={performPSI}
              disabled={loadingPSI}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              {loadingPSI ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Running PSI...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Run PSI Protocol</span>
                </>
              )}
            </motion.button>
          </div>

          {/* PSI Results */}
          {psiResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="text-2xl font-bold text-green-300">
                    {psiResult.common_count} Common Patients Found
                  </h3>
                  <p className="text-gray-400 text-sm">{psiResult.message}</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-gray-400 text-sm font-semibold">Common NICs:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {psiResult.common_nics.map((nic, idx) => (
                    <div
                      key={idx}
                      className="text-gray-300 text-sm font-mono bg-black/30 px-3 py-2 rounded hover:bg-black/50 transition-colors"
                    >
                      {nic}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Step 3: MPC Prediction */}
      {psiResult && psiResult.common_nics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl">
              <Brain className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Step 3: Secure MPC Prediction</h2>
              <p className="text-gray-400 text-sm">Run encrypted diabetes prediction on common patient</p>
            </div>
          </div>

          {/* NIC Selection */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Select Patient NIC for Prediction:
            </label>
            <div className="flex items-center space-x-4">
              <select
                value={selectedNIC}
                onChange={(e) => setSelectedNIC(e.target.value)}
                className="flex-1 px-4 py-3 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
              >
                <option value="">-- Select a NIC --</option>
                {psiResult.common_nics.map((nic) => (
                  <option key={nic} value={nic}>
                    {nic}
                  </option>
                ))}
              </select>

              <motion.button
                onClick={performMPCPrediction}
                disabled={loadingMPC || !selectedNIC}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
              >
                {loadingMPC ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Computing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Run MPC</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* MPC Result */}
          <AnimatePresence>
            {mpcResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-gradient-to-r ${
                  mpcResult.prediction === 'Diabetic'
                    ? 'from-orange-500/10 to-red-500/10 border-orange-500/30'
                    : 'from-green-500/10 to-emerald-500/10 border-green-500/30'
                } border rounded-xl p-6`}
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div
                    className={`p-4 rounded-xl ${
                      mpcResult.prediction === 'Diabetic'
                        ? 'bg-orange-500/20'
                        : 'bg-green-500/20'
                    }`}
                  >
                    {mpcResult.prediction === 'Diabetic' ? (
                      <AlertCircle className="h-8 w-8 text-orange-400" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-2xl font-bold ${
                        mpcResult.prediction === 'Diabetic'
                          ? 'text-orange-300'
                          : 'text-green-300'
                      }`}
                    >
                      Prediction: {mpcResult.prediction}
                    </h3>
                    <p className="text-gray-400 text-sm">Patient NIC: {mpcResult.nic}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Secure Score</p>
                    <p className="text-2xl font-bold text-white">
                      {mpcResult.secure_score.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Probability</p>
                    <p className="text-2xl font-bold text-white">
                      {(mpcResult.probability * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Risk Level</p>
                    <p
                      className={`text-2xl font-bold ${
                        mpcResult.prediction === 'Diabetic' ? 'text-orange-400' : 'text-green-400'
                      }`}
                    >
                      {mpcResult.prediction === 'Diabetic' ? 'High' : 'Low'}
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-gray-400 text-sm font-semibold mb-3">Patient Features:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {Object.entries(mpcResult.features).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
      >
        <div className="flex items-start space-x-3">
          <Activity className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-blue-300 mb-2">How It Works</h3>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>
                <strong>Load Hospital Data:</strong> Fetch patient NICs from both Hospital A and
                Hospital B without revealing full records
              </li>
              <li>
                <strong>Private Set Intersection (PSI):</strong> Find common patients between
                hospitals using cryptographic hashing, without exposing individual identities
              </li>
              <li>
                <strong>Secure MPC Prediction:</strong> Run diabetes risk prediction on a common
                patient using Multi-Party Computation, ensuring data privacy throughout
              </li>
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
