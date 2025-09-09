import React, { useState, useRef } from 'react';
import type { Source, RewriteStyle, LanguageVariant } from '../types';
import { DownloadIcon, RewriteIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

// Type definitions for libraries loaded from CDN
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

interface ArticleDisplayProps {
    article: string;
    sources: Source[];
    topic: string;
    onRewrite: (style: RewriteStyle, language: LanguageVariant) => void;
    onRevert: () => void;
    isRewriting: boolean;
    isRewritten: boolean;
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


const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ article, sources, topic, onRewrite, onRevert, isRewriting, isRewritten }) => {
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const articleRef = useRef<HTMLDivElement>(null);
    const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>('New Scientist');
    const [languageVariant, setLanguageVariant] = useState<LanguageVariant>('International English');
    
    const generateFilename = (extension: 'md' | 'pdf') => {
        const sanitizedTopic = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return `${sanitizedTopic || 'research-article'}.${extension}`;
    };

    const handleExportMarkdown = () => {
        let markdownContent = article;
        markdownContent += '\n\n---\n\n## Citations\n\n';
        sources.forEach((source, index) => {
            markdownContent += `${index + 1}. **${source.title}**: [${source.uri}](${source.uri})\n`;
        });

        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateFilename('md');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = async () => {
        const content = articleRef.current;
        if (!content || !window.jspdf || !window.html2canvas) {
            console.error("Export dependencies not loaded or content ref not found.");
            return;
        }
        setIsExportingPdf(true);
        try {
            const { jsPDF } = window.jspdf;
            const canvas = await window.html2canvas(content, { scale: 2, useCORS: true });
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / pdfWidth;
            const imgHeight = canvasHeight / ratio;
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            let position = 0;
            let heightLeft = imgHeight;

            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(generateFilename('pdf'));
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally, set an error state to inform the user
        } finally {
            setIsExportingPdf(false);
        }
    };


    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 border-b pb-4 gap-4">
                <h2 className="text-3xl font-bold text-slate-900 flex-shrink-0">Generated Article</h2>
                <div className="flex gap-2 flex-shrink-0">
                    <button 
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                    >
                        <DownloadIcon className="h-4 w-4" />
                        <span>Markdown</span>
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:bg-slate-200 disabled:cursor-wait transition-colors"
                    >
                        {isExportingPdf ? <LoadingSpinner className="text-slate-600" /> : <DownloadIcon className="h-4 w-4" />}
                        <span>{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-6">
                <h4 className="font-semibold text-slate-800 mb-3">Rewrite Article</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="rewrite-style" className="block text-sm font-medium text-slate-600 mb-1">Style</label>
                        <select
                            id="rewrite-style"
                            value={rewriteStyle}
                            onChange={(e) => setRewriteStyle(e.target.value as RewriteStyle)}
                            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={isRewriting}
                        >
                            <option>New Scientist</option>
                            <option>Wired Magazine</option>
                            <option>The Guardian</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="language-variant" className="block text-sm font-medium text-slate-600 mb-1">Language</label>
                        <select
                            id="language-variant"
                            value={languageVariant}
                            onChange={(e) => setLanguageVariant(e.target.value as LanguageVariant)}
                            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={isRewriting}
                        >
                            <option>International English</option>
                            <option>British English</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                    <button
                        onClick={() => onRewrite(rewriteStyle, languageVariant)}
                        disabled={isRewriting}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isRewriting ? <LoadingSpinner /> : <RewriteIcon className="h-5 w-5" />}
                        <span>{isRewriting ? 'Rewriting...' : 'Rewrite'}</span>
                    </button>
                    {isRewritten && (
                        <button
                            onClick={onRevert}
                            disabled={isRewriting}
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            Revert to Original
                        </button>
                    )}
                </div>
            </div>


            <div ref={articleRef}>
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
        </div>
    );
};

export default ArticleDisplay;
