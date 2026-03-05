'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
    requestPermission,
    scheduleMedicationReminders,
    clearAllTimers,
    getActiveTimerCount,
} from '@/services/pulse-notify';
import type { PrescriptionItem } from '@/types';

export function useNotifications(items: PrescriptionItem[]) {
    const [enabled, setEnabled] = useState(false);
    const [timerCount, setTimerCount] = useState(0);
    const initialized = useRef(false);

    const enable = useCallback(async () => {
        const granted = await requestPermission();
        setEnabled(granted);
        if (granted && items.length > 0) {
            scheduleMedicationReminders(items);
            setTimerCount(getActiveTimerCount());
        }
    }, [items]);

    useEffect(() => {
        if (!initialized.current && items.length > 0) {
            initialized.current = true;
            enable();
        }
        return () => clearAllTimers();
    }, [items, enable]);

    return { enabled, timerCount, enable };
}
