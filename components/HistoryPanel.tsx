import React from 'react';
import type { HistoryItem } from '../types';
import { TrashIcon, XIcon } from './icons';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onView: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onView, onDelete, onClearAll }) => {
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Panel */}
            <aside
                className={`fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-panel-title"
            >
                <div className="flex flex-col h-full">
                    <header className="flex items-center justify-between p-4 border-b">
                        <h2 id="history-panel-title" className="text-xl font-semibold text-slate-900">Research History</h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"
                            aria-label="Close history panel"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                    </header>
                    <div className="flex-grow overflow-y-auto">
                        {history.length > 0 ? (
                            <ul className="divide-y">
                                {history.map(item => (
                                    <li key={item.id} className="p-4 group hover:bg-slate-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-800 line-clamp-2">{item.topic}</p>
                                                <p className="text-sm text-slate-500">{formatDate(item.timestamp)}</p>
                                            </div>
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label={`Delete report on ${item.topic}`}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => onView(item)}
                                            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            View Report
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                <p>No research history found.</p>
                                <p className="text-sm mt-1">Completed reports will appear here.</p>
                            </div>
                        )}
                    </div>
                    {history.length > 0 && (
                         <footer className="p-4 border-t">
                            <button
                                onClick={onClearAll}
                                className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                            >
                                Clear All History
                            </button>
                        </footer>
                    )}
                </div>
            </aside>
        </>
    );
};

export default HistoryPanel;
