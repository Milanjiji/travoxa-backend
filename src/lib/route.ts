// lib/route.ts
'use client';

const HISTORY_KEY = 'navigation_history';
const MAX_HISTORY = 50;

interface NavigationEntry {
  path: string;
  timestamp: number;
  search?: string;
}

// Store current page before navigating
const storeCurrentPage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    const history = getStoredHistory();
    const entry: NavigationEntry = {
      path: currentPath,
      timestamp: Date.now(),
      search: currentSearch || undefined,
    };
    
    history.push(entry);
    
    // Keep only last MAX_HISTORY entries
    const trimmed = history.slice(-MAX_HISTORY);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error storing navigation history:', error);
  }
};

// Get stored history
const getStoredHistory = (): NavigationEntry[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading navigation history:', error);
    return [];
  }
};

/**
 * Navigate to a new page and store current page in session storage
 * @param path - The path to navigate to (e.g., '/dashboard', '/profile')
 * @param options - Optional navigation options
 */
export const route = (
  path: string,
  options?: {
    replace?: boolean; // Replace current history entry instead of pushing
    scroll?: boolean;  // Scroll to top after navigation (default: true)
  }
): void => {
  if (typeof window === 'undefined') return;
  
  // Store current page before navigating
  if (!options?.replace) {
    storeCurrentPage();
  }
  
  // Navigate to new page
  if (options?.replace) {
    window.location.replace(path);
  } else {
    window.location.href = path;
  }
};

/**
 * Get navigation history from storage
 * @returns Array of previous navigation entries
 */
export const getNavigationHistory = (): NavigationEntry[] => {
  return getStoredHistory();
};

/**
 * Get the previous page from history
 * @returns Previous navigation entry or null
 */
export const getPreviousPage = (): NavigationEntry | null => {
  const history = getStoredHistory();
  return history.length > 1 ? history[history.length - 2] : null;
};

/**
 * Navigate back to previous page
 */
export const goBack = (): void => {
  if (typeof window === 'undefined') return;
  
  const previous = getPreviousPage();
  if (previous) {
    const fullPath = previous.path + (previous.search || '');
    window.location.href = fullPath;
  } else {
    window.history.back();
  }
};

/**
 * Clear navigation history
 */
export const clearNavigationHistory = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing navigation history:', error);
  }
};

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Basic navigation in any client component
// app/dashboard/page.tsx
/*
'use client';

import { route } from '@/lib/route';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => route('/profile')}>
        Go to Profile
      </button>
      <button onClick={() => route('/settings')}>
        Go to Settings
      </button>
    </div>
  );
}
*/

// Example 2: Use in multiple components
// components/Header.tsx
/*
'use client';

import { route, goBack } from '@/lib/route';

export function Header() {
  return (
    <header>
      <button onClick={() => route('/')}>Home</button>
      <button onClick={() => route('/about')}>About</button>
      <button onClick={goBack}>Back</button>
    </header>
  );
}
*/

// Example 3: View navigation history
// app/history/page.tsx
/*
'use client';

import { getNavigationHistory, clearNavigationHistory } from '@/lib/route';
import { useState } from 'react';

export default function HistoryPage() {
  const [history, setHistory] = useState(getNavigationHistory());

  return (
    <div>
      <h1>Navigation History</h1>
      <button onClick={() => {
        clearNavigationHistory();
        setHistory([]);
      }}>
        Clear History
      </button>
      <ul>
        {history.map((entry, index) => (
          <li key={index}>
            {entry.path} - {new Date(entry.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
*/

// Example 4: Use in event handlers
// components/ProductCard.tsx
/*
'use client';

import { route } from '@/lib/route';

export function ProductCard({ productId }: { productId: string }) {
  const handleClick = () => {
    route(`/products/${productId}`);
  };

  return (
    <div onClick={handleClick}>
      <h3>Product {productId}</h3>
    </div>
  );
}
*/
