import { useEffect, useState } from 'react';
import { CMS_BASE } from '../config/api';

const EMPTY_FLAGS = Object.freeze({});

export default function useFeatureFlagMap() {
  const [flags, setFlags] = useState(EMPTY_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch(`${CMS_BASE}/feature-flags?map=true`);
        const json = await response.json().catch(() => ({}));
        if (!mounted) return;

        const map = json && typeof json.data === 'object' && json.data !== null
          ? json.data
          : EMPTY_FLAGS;

        setFlags(map);
      } catch (_error) {
        if (!mounted) return;
        setFlags(EMPTY_FLAGS);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { flags, loading };
}
