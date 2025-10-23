import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react"; // ✅ import the TYPE, not a component

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;                 // ✅ correct icon type
  color: string;                    // tailwind gradient classes e.g. "from-blue-500 to-cyan-500"
  trend?: number;                   // e.g. +5, -2, 0
  delay?: number;
  valueSuffix?: string;             // e.g. "%", "ms" (optional)
  className?: string;               // allow container overrides
}

/** Formats numbers nicely, leaves strings as-is */
function renderValue(v: string | number, suffix?: string) {
  if (typeof v === "number" && Number.isFinite(v)) {
    const text = v.toLocaleString();
    return suffix ? `${text}${suffix}` : text;
  }
  return suffix ? `${v}${suffix}` : v;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  delay = 0,
  valueSuffix,
  className = "",
}) => {
  const trendSign = typeof trend === "number" ? (trend > 0 ? "+" : trend < 0 ? "−" : "") : "";
  const trendColor =
    typeof trend !== "number"
      ? "bg-gray-500/20 text-gray-400"
      : trend > 0
      ? "bg-green-500/20 text-green-400"
      : trend < 0
      ? "bg-red-500/20 text-red-400"
      : "bg-gray-500/20 text-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.05,
        // 3D tilt looks better with perspective
        // @ts-expect-error framer supports this inline
        rotateY: 5,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}
      className={`relative group ${className}`}
      aria-label={`${title}: ${typeof value === "number" ? value.toLocaleString() : value}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />

      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>

          {typeof trend === "number" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3 }}
              className={`text-xs px-2 py-1 rounded-full ${trendColor}`}
              aria-label={`Trend ${trend >= 0 ? "up" : "down"} ${Math.abs(trend)}%`}
            >
              {trendSign}
              {Math.abs(trend)}%
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.2 }}>
          <h3 className="text-gray-300 text-sm font-medium mb-1">{title}</h3>
          <motion.p
            className="text-3xl font-bold text-white"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.4, type: "spring", stiffness: 200 }}
          >
            {renderValue(value, valueSuffix)}
          </motion.p>
        </motion.div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};
