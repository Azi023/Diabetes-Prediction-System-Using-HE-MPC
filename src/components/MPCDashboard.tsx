import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Database,
  Lock,
  Users,
  CheckCircle,
  Loader2,
  RefreshCw,
  Activity,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface HospitalData {
  hashed_nics: string[];
  sample_hashes: string[];
  count: number;
}

interface PSIResult {
  ok: boolean;
  common_count: number;
  // keep generic so we can show message if backend returns it
  message?: string;
}

export const MPCDashboard: React.FC = () => {
  const [hospitalA, setHospitalA] = useState<HospitalData | null>(null);
  const [hospitalB, setHospitalB] = useState<HospitalData | null>(null);
  const [psiResult, setPsiResult] = useState<PSIResult | null>(null);

  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingPSI, setLoadingPSI] = useState(false);

  // normalize backend payload in case field names differ slightly
  const normalizeHospitalData = (raw: any): HospitalData => {
    const hashed_nics: string[] = raw?.hashed_nics ?? raw?.nics ?? [];
    const sample_hashes: string[] = raw?.sample_hashes ?? raw?.sample_nics ?? [];
    const count: number =
      raw?.count ??
      raw?.total_count ??
      (Array.isArray(hashed_nics) ? hashed_nics.length : 0);
    return { hashed_nics, sample_hashes, count };
  };

  // Step 1: Load hospital data 
const fetchHospitalData = async () => {
  setLoadingHospitals(true);
  try {
    const response = await fetch('/api/mpc/hospital-data?hospital=both', {
      method: 'GET',
    });

    const data = await response.json();

    if (data.ok) {
      // Direct assignment - no normalization needed
      setHospitalA(data.hospital_a);
      setHospitalB(data.hospital_b);
      setPsiResult(null);
      toast.success('Hospital data loaded successfully', {
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

  // Step 2: Perform PSI on hashed data
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
          nics_a: hospitalA.hashed_nics, // send hashed NICs only
          nics_b: hospitalB.hashed_nics,
        }),
      });

      const data: PSIResult = await response.json();

      if ((data as any).ok !== false) {
        setPsiResult(data);
        toast.success(`PSI Complete: Found ${data.common_count} common patients`, {
          style: {
            background: '#1F2937',
            color: '#10B981',
            border: '1px solid #10B981',
          },
        });
      } else {
        throw new Error((data as any).error || 'PSI failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'PSI protocol failed');
    } finally {
      setLoadingPSI(false);
    }
  };

  // helper to truncate long hashes for display
  const shortHash = (h: string) => (h?.length > 16 ? `${h.slice(0, 16)}…` : h);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Private Set Intersection Demo
          </h1>
          <p className="text-gray-400 mt-4">
            Secure Multi-Party Computation for Healthcare Data (PSI focus)
          </p>
        </motion.div>

        {/* Step 1: Load Hospital Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Step 1: Load Encrypted Hospital Data</h2>
                <p className="text-gray-400 text-sm">
                  Fetch hashed patient identifiers from both hospitals (50 records)
                </p>
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
                  <p className="text-3xl font-bold text-white mb-4">
                    {hospitalA.count ?? 50} Patients
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-semibold">Hashed IDs (sample):</p>
                    {(hospitalA.sample_hashes ?? []).slice(0, 3).map((h, idx) => (
                      <div
                        key={idx}
                        className="text-gray-300 text-sm font-mono bg-black/30 px-3 py-1 rounded"
                      >
                        {shortHash(h)}
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
                  <p className="text-3xl font-bold text-white mb-4">
                    {hospitalB.count ?? 50} Patients
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-semibold">Hashed IDs (sample):</p>
                    {(hospitalB.sample_hashes ?? []).slice(0, 3).map((h, idx) => (
                      <div
                        key={idx}
                        className="text-gray-300 text-sm font-mono bg-black/30 px-3 py-1 rounded"
                      >
                        {shortHash(h)}
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
            className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                  <Lock className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Step 2: Private Set Intersection</h2>
                  <p className="text-gray-400 text-sm">
                    Find common patients using **only** hashed identifiers
                  </p>
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-green-300">
                      {psiResult.common_count} Common Patients Found
                    </h3>
                    {psiResult.message && (
                      <p className="text-gray-400 text-sm">{psiResult.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-black/40 rounded-lg">
                  <p className="text-sm text-gray-400">
                    ✓ Original NICs never exposed<br />
                    ✓ Patient names remain encrypted<br />
                    ✓ Addresses remain encrypted<br />
                    ✓ Only secure hashes processed client ↔ server
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Info Footer (PSI-only) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <Activity className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-300 mb-2">How It Works</h3>
              <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                <li>
                  <strong>Load Hospital Data:</strong> Fetch hashed patient IDs from Hospital A & B (no PII).
                </li>
                <li>
                  <strong>Private Set Intersection:</strong> Compute overlaps using hashes—no raw identifiers are shared.
                </li>
              </ol>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
