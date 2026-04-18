import INDIA_LOCATIONS from './india-locations.json';

// Indian States and Cities Data
export const INDIA_STATES_AND_CITIES: Record<string, string[]> = INDIA_LOCATIONS;

// Get list of all states
export const INDIA_STATES = Object.keys(INDIA_STATES_AND_CITIES).sort();

// Get cities for a specific state
export const getCitiesForState = (state: string): string[] => {
    return INDIA_STATES_AND_CITIES[state] || [];
};

// Generate year options from 2000 to current year
export const generateYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 2000; year--) {
        years.push(year);
    }
    return years;
};

export const YEAR_OPTIONS = generateYearOptions();
