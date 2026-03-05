'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import NeonButton from '@/components/ui/NeonButton';
import ScanLine from '@/components/ui/ScanLine';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden gradient-mesh">
      <ScanLine />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="w-20 h-20 rounded-2xl bg-[var(--pulse-cyan)] flex items-center justify-center text-4xl font-black text-[var(--bg-void)] mb-8 shadow-[0_0_40px_var(--pulse-cyan-glow)]"
        >
          C
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-black mb-4 tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="neon-text">Cyber</span>
          <span className="text-[var(--text-primary)]">-Clinic</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-[var(--text-muted)] max-w-xl mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Neural Hospital Management System
        </motion.p>

        <motion.p
          className="text-sm text-[var(--text-muted)] max-w-lg mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          AI-powered prescription analysis · AES-256 encrypted medical records ·
          Real-time vitals monitoring · OCR report extraction
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link href="/login">
            <NeonButton size="lg">Access Terminal</NeonButton>
          </Link>
          <Link href="/signup">
            <NeonButton variant="secondary" size="lg">
              Register Identity
            </NeonButton>
          </Link>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { icon: '🧬', title: 'AI Auditor', desc: 'Drug interaction scanning' },
            { icon: '🔐', title: 'Crypto-Vault', desc: 'AES-256 encrypted records' },
            { icon: '👁', title: 'Vision-Sync', desc: 'OCR report extraction' },
          ].map((f) => (
            <div
              key={f.title}
              className="glass-panel p-5 text-center space-y-2"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-sm font-bold text-[var(--pulse-cyan)]">
                {f.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Background glow orbs */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 rounded-full bg-[var(--pulse-cyan)] opacity-[0.03] blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[var(--bio-emerald)] opacity-[0.03] blur-3xl pointer-events-none" />
    </div>
  );
}
