import type { HistoryItem } from '../types';

const HISTORY_KEY = 'aiResearchHistory';

export const getHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        if (historyJson) {
            const history = JSON.parse(historyJson) as HistoryItem[];
            // Sort by most recent first
            return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        return [];
    }
    return [];
};

export const saveResearch = (item: HistoryItem): HistoryItem[] => {
    const history = getHistory();
    const updatedHistory = [item, ...history];
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to save research to localStorage", error);
    }
    return updatedHistory;
};

export const deleteHistoryItem = (id: string): HistoryItem[] => {
    let history = getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to delete item from localStorage", error);
    }
    return updatedHistory;
};

export const clearHistory = (): void => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error("Failed to clear history from localStorage", error);
    }
};
