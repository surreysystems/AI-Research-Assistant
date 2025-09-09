import React, { useState, useEffect, useCallback } from 'react';
import type { Perspective, ResearchData, Source, ResearchStage } from './types';
import { generatePerspectivesAndQuestions, researchQuestion, generateOutline, generateArticle } from './services/geminiService';
import StatusBar from './components/StatusBar';
import LoadingSpinner from './components/LoadingSpinner';
import ArticleDisplay from './components/ArticleDisplay';
import { StormIcon } from './components/icons';

const App: React.FC = () => {
    const [topic, setTopic] = useState<string>('');
    const [inputTopic, setInputTopic] = useState<string>('');
    const [researchStage, setResearchStage] = useState<ResearchStage>('IDLE');
    const [perspectives, setPerspectives] = useState<Perspective[]>([]);
    const [researchData, setResearchData] = useState<ResearchData[]>([]);
    const [outline, setOutline] = useState<string>('');
    const [article, setArticle] = useState<string>('');
    const [sources, setSources] = useState<Source[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentResearchIndex, setCurrentResearchIndex] = useState(0);

    const allQuestions = perspectives.flatMap(p => p.questions);
    const isResearching = researchStage !== 'IDLE' && researchStage !== 'DONE';

    const handleReset = () => {
        setTopic('');
        setInputTopic('');
        setResearchStage('IDLE');
        setPerspectives([]);
        setResearchData([]);
        setOutline('');
        setArticle('');
        setSources([]);
        setError(null);
        setCurrentResearchIndex(0);
    };

    const startResearch = useCallback(async () => {
        const currentTopic = inputTopic; // Capture topic before any state changes
        if (!currentTopic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        
        handleReset(); // Reset all state for a fresh start.
        setInputTopic(currentTopic); // Restore the input topic so it's visible during research.
        setTopic(currentTopic); // Set the topic for the new research session.
        setResearchStage('GENERATING_QUESTIONS');
        setError(null);

        try {
            const result = await generatePerspectivesAndQuestions(currentTopic);
            setPerspectives(result);
            setResearchStage('RESEARCHING');
        } catch (e) {
            console.error(e);
            setError('Failed to generate research questions. Please check your API key and try again.');
            setResearchStage('IDLE');
        }
    }, [inputTopic]);

    const researchNextQuestion = useCallback(async () => {
        const question = allQuestions[currentResearchIndex];
        try {
            const result = await researchQuestion(question);
            setResearchData(prev => [...prev, { question, answer: result.answer }]);
            setSources(prev => {
                const newSources = result.sources.filter(
                    newSrc => newSrc.uri && !prev.some(existingSrc => existingSrc.uri === newSrc.uri)
                );
                return [...prev, ...newSources];
            });
            setCurrentResearchIndex(prev => prev + 1);
        } catch (e) {
            console.error(e);
            setError(`Failed to research question: "${question}". Skipping.`);
            // Skip to next question even on error to not block the process
            setCurrentResearchIndex(prev => prev + 1);
        }
    }, [allQuestions, currentResearchIndex]);

    useEffect(() => {
        // This effect orchestrates the research stage.
        if (researchStage === 'RESEARCHING' && perspectives.length > 0) {
            if (currentResearchIndex < allQuestions.length) {
                // We still have questions to research.
                researchNextQuestion();
            } else if (allQuestions.length > 0) {
                // We have finished researching all questions, move to the next stage.
                setResearchStage('GENERATING_OUTLINE');
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [researchStage, perspectives, currentResearchIndex]);
    
    useEffect(() => {
        const processResearch = async () => {
            if (researchStage === 'GENERATING_OUTLINE') {
                try {
                    const generatedOutline = await generateOutline(topic, researchData);
                    setOutline(generatedOutline);
                    setResearchStage('GENERATING_ARTICLE');
                } catch (e) {
                    console.error(e);
                    setError('Failed to generate the article outline.');
                    setResearchStage('DONE'); // End process on failure
                }
            } else if (researchStage === 'GENERATING_ARTICLE') {
                try {
                    const generatedArticle = await generateArticle(topic, outline, researchData);
                    setArticle(generatedArticle);
                    setResearchStage('DONE');
                } catch (e) {
                    console.error(e);
                    setError('Failed to generate the final article.');
                    setResearchStage('DONE');
                }
            }
        };
        processResearch();
    }, [researchStage, researchData, outline, topic]);

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <StormIcon className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-slate-900">AI Research Assistant</h1>
                    </div>
                    {researchStage !== 'IDLE' && (
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                        >
                            New Research
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {researchStage === 'IDLE' && (
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-3xl font-bold mb-2">Start Your Research Journey</h2>
                            <p className="text-slate-600 mb-6">Enter a topic below, and the AI will generate a comprehensive, well-cited article, similar to Wikipedia.</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={inputTopic}
                                    onChange={(e) => setInputTopic(e.target.value)}
                                    placeholder="e.g., The History of Artificial Intelligence"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    onKeyDown={(e) => e.key === 'Enter' && startResearch()}
                                    disabled={isResearching}
                                />
                                <button
                                    onClick={() => startResearch()}
                                    disabled={isResearching || !inputTopic.trim()}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isResearching ? <LoadingSpinner /> : 'Start Research'}
                                </button>
                            </div>
                            {error && <p className="text-red-500 mt-4">{error}</p>}
                        </div>
                    </div>
                )}

                {researchStage !== 'IDLE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <aside className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
                                <h3 className="text-lg font-semibold text-slate-900 border-b pb-3 mb-4">Research Overview</h3>
                                <div className="space-y-2 mb-6">
                                    <p className="text-sm text-slate-500">Topic:</p>
                                    <p className="font-semibold text-slate-800">{topic}</p>
                                </div>
                                <StatusBar currentStage={researchStage} questionsCount={allQuestions.length} researchProgress={currentResearchIndex} />
                            </div>
                        </aside>

                        <div className="lg:col-span-2 space-y-8">
                             {perspectives.length > 0 && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Generated Perspectives & Questions</h3>
                                    <ul className="space-y-4">
                                        {perspectives.map((p, pIndex) => (
                                            <li key={pIndex}>
                                                <p className="font-semibold text-blue-700">{p.perspective}</p>
                                                <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-slate-600">
                                                    {p.questions.map((q, qIndex) => (
                                                        <li key={qIndex}>{q}</li>
                                                    ))}
                                                </ul>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                             {researchData.length > 0 && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Research Findings</h3>
                                    <div className="space-y-6 max-h-96 overflow-y-auto pr-4">
                                        {researchData.map((data, index) => (
                                            <div key={index} className="border-b pb-4 last:border-b-0">
                                                <p className="font-semibold text-slate-800 mb-2">{data.question}</p>
                                                <p className="text-slate-600 text-sm line-clamp-3">{data.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {outline && (
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Generated Outline</h3>
                                    <pre className="whitespace-pre-wrap bg-slate-50 p-4 rounded-md font-mono text-sm text-slate-700">{outline}</pre>
                                </div>
                            )}
                            
                            {article && (
                               <ArticleDisplay article={article} sources={sources} />
                            )}
                            
                            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;