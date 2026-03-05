'use client';

import { useEffect } from 'react';
import NeonButton from '@/components/ui/NeonButton';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error Boundary caught:', error);
    }, [error]);

    const isChunkError = error.name === 'ChunkLoadError' || error.message.includes('Loading chunk');

    return (
        <html>
            <body className="bg-[var(--bg-void)] text-[var(--text-primary)] min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full glass-panel p-8 text-center space-y-6 border border-[var(--danger-red)] shadow-[0_0_50px_rgba(255,0,0,0.2)]">
                    <div className="w-16 h-16 rounded-full bg-[var(--danger-red-dim)] flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>

                    <h2 className="text-2xl font-bold neon-text text-[var(--danger-red)]">
                        System Critical Error
                    </h2>

                    <p className="text-[var(--text-muted)]">
                        {isChunkError
                            ? 'A network interruption prevented a module from loading.'
                            : 'An unexpected runtime error occurred.'}
                    </p>

                    <div className="text-xs font-mono bg-black/50 p-4 rounded text-left overflow-auto max-h-32 mb-4 border border-[var(--glass-border)]">
                        {error.message || 'Unknown Error'}
                        {error.digest && <div className="mt-1 text-[var(--text-muted)]">Digest: {error.digest}</div>}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <NeonButton onClick={() => window.location.reload()} variant="primary" className="flex-1">
                            System Reboot (Refresh)
                        </NeonButton>
                        <NeonButton onClick={() => reset()} variant="secondary" className="flex-1">
                            Retry
                        </NeonButton>
                    </div>
                </div>
            </body>
        </html>
    );
}
