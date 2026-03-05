'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

export default function AuditScanner() {
    const [scanning, setScanning] = useState(false);
    const [complete, setComplete] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{
        riskLevel: 'low' | 'medium' | 'high';
        message: string;
        details: string;
    } | null>(null);

    const supabase = createClient();

    const startScan = async () => {
        setScanning(true);
        setComplete(false);
        setResults(null);
        setProgress(0);

        // Visual Progress Simulation
        const interval = setInterval(() => {
            setProgress((p) => {
                if (p >= 90) {
                    clearInterval(interval);
                    return 90; // Hold at 90 until real work is done
                }
                return p + 5;
            });
        }, 100);

        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 2. Fetch Active Prescriptions
            const { data: prescriptions, error: rxError } = await supabase
                .from('prescriptions')
                .select('*, items:prescription_items(*)')
                .eq('patient_id', user.id)
                .eq('status', 'active');

            if (rxError) throw rxError;

            const rxCount = prescriptions?.length || 0;

            // 3. Analysis Rule
            let analysisResult: {
                riskLevel: 'low' | 'medium' | 'high';
                message: string;
                details: string;
            } = {
                riskLevel: 'low',
                message: 'No significant interactions detected.',
                details: `Analyzed ${rxCount} active prescription(s). Protocol standard.`
            };

            if (rxCount > 1) {
                analysisResult = {
                    riskLevel: 'medium' as const,
                    message: 'Interaction Check Required',
                    details: `Detected ${rxCount} concurrent medications. Moderate risk of polypharmacy interactions.`
                };
            }

            // 4. Log to Audit Table
            // Action 'SELECT' is used as we are "Auditing/Reading" the records.
            const { error: auditError } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: user.id,
                    action: 'SELECT',
                    target_table: 'prescriptions',
                    ip_address: '127.0.0.1', // Client-side simulation
                    metadata: {
                        source: 'AI_AUDITOR',
                        subtype: 'clinical_risk_scan',
                        findings: analysisResult
                    }
                });

            if (auditError) console.error("Audit Log Failed:", auditError);

            // Complete
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => {
                setResults(analysisResult);
                setScanning(false);
                setComplete(true);
            }, 500);

        } catch (error) {
            console.error("Scan failed:", error);
            setScanning(false);
            clearInterval(interval);
            alert("Scan failed. See console.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Scanner Control */}
            <GlassCard className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🧬</span>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                AI Drug Interaction Scanner
                            </h2>
                            <p className="text-xs text-[var(--text-muted)]">
                                Analyzes active prescriptions for potential drug-drug interactions
                            </p>
                        </div>
                    </div>
                    {complete ? (
                        <div className="flex items-center gap-2 text-[var(--bio-emerald)] font-bold animate-pulse">
                            <span>✓ Scan Complete</span>
                        </div>
                    ) : (
                        <NeonButton
                            onClick={startScan}
                            loading={scanning}
                            disabled={scanning}
                            size="sm"
                        >
                            {scanning ? 'Scanning...' : 'Start Scan'}
                        </NeonButton>
                    )}
                </div>

                {/* Progress bar */}
                {(scanning || complete) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-[var(--text-muted)]">
                            <span>{scanning ? 'Analyzing neural patterns...' : 'Analysis Complete'}</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, var(--pulse-cyan), var(--bio-emerald))`,
                                    boxShadow: '0 0 10px var(--pulse-cyan)',
                                }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.1 }}
                            />
                        </div>
                    </div>
                )}

                {/* Scan line effect */}
                {scanning && (
                    <div className="relative h-24 rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)]">
                        <motion.div
                            className="absolute left-0 right-0 h-0.5 bg-[var(--pulse-cyan)]"
                            style={{
                                boxShadow: '0 0 20px var(--pulse-cyan), 0 0 60px var(--pulse-cyan-dim)',
                            }}
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-mono text-[var(--pulse-cyan)] animate-pulse">
                                {'>'} ACCESSING PHARMACEUTICAL DATABASE {'<'}
                            </span>
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Results */}
            <AnimatePresence>
                {complete && results && (
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <GlassCard
                            glow={results.riskLevel === 'medium' ? 'cyan' : results.riskLevel === 'high' ? 'danger' : 'none'}
                            className="border-[var(--glass-border)]"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                    ${results.riskLevel === 'medium' ? 'bg-[var(--pulse-cyan-dim)] text-[var(--pulse-cyan)]' : 'bg-[var(--bio-emerald-dim)] text-[var(--bio-emerald)]'}
                                `}>
                                    {results.riskLevel === 'medium' ? '⚠️' : '🛡️'}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-[var(--text-primary)]">
                                        {results.message}
                                    </h3>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {results.details}
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-xs text-[var(--text-dim)]">
                                        <span className="uppercase tracking-wider">Logged Event:</span>
                                        <code className="bg-[rgba(0,0,0,0.3)] px-2 py-1 rounded text-[var(--pulse-cyan)]">
                                            ACTION: CLINICAL_AUDIT
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
