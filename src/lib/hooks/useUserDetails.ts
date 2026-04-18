'use client';

import { useState, useEffect } from 'react';
import type { IUser } from '@/lib/models/User';

interface UseUserDetailsReturn {
  users: Record<string, IUser>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserDetails(): UseUserDetailsReturn {
  const [users, setUsers] = useState<Record<string, IUser>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.users && Array.isArray(data.users)) {
        const userMap: Record<string, IUser> = {};
        data.users.forEach((user: IUser) => {
          userMap[user.email] = user;
        });
        setUsers(prev => ({ ...prev, ...userMap }));
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    refetch: () => fetchUserDetails(Object.keys(users))
  };
}