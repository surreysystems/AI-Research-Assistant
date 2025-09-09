
import React from 'react';
import type { Source } from '../types';

interface ArticleDisplayProps {
    article: string;
    sources: Source[];
}

// Simple markdown-to-html renderer
const renderMarkdown = (text: string) => {
    return text
        .split('\n')
        .map((line, index) => {
            if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-semibold mt-6 mb-2 text-slate-800">{line.substring(4)}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 border-b pb-2 text-slate-900">{line.substring(3)}</h2>;
            }
            if (line.startsWith('# ')) {
                return <h1 key={index} className="text-4xl font-extrabold mt-4 mb-6 text-slate-900">{line.substring(2)}</h1>;
            }
            if (line.trim() === '') {
                return <br key={index} />;
            }
            return <p key={index} className="text-slate-700 leading-relaxed mb-4">{line}</p>;
        });
};


const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ article, sources }) => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="prose prose-slate max-w-none">
                {renderMarkdown(article)}
            </div>

            <div className="mt-12 pt-6 border-t">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">Citations</h2>
                <ul className="space-y-3">
                    {sources.map((source, index) => (
                        <li key={index} className="flex items-start">
                            <span className="text-slate-500 mr-2">[{index + 1}]</span>
                            <a
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                            >
                                {source.title || source.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ArticleDisplay;
