'use client';

import { motion } from 'framer-motion';
import AuditScanner from '@/components/ai-auditor/AuditScanner';

export default function AiAuditorPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold neon-text mb-1">AI Auditor</h1>
                <p className="text-sm text-[var(--text-muted)]">
                    AI-powered prescription analysis for drug-drug interactions
                </p>
            </motion.div>

            {/* Scanner */}
            <AuditScanner />
        </div>
    );
}
