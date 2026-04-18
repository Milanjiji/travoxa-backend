'use client';

import { useState, useEffect } from 'react';
import type { BackpackerGroup } from '@/data/backpackers';

interface UseGroupsReturn {
  groups: BackpackerGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<BackpackerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/groups');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.groups || !Array.isArray(data.groups)) {
        throw new Error('Invalid response format from server');
      }
      
      setGroups(data.groups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
  };
}