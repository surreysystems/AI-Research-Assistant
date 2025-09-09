export interface Perspective {
    perspective: string;
    questions: string[];
}

export interface ResearchData {
    question: string;
    answer: string;
}

export interface Source {
    uri: string;
    title: string;
}

export interface ResearchResult {
    answer: string;
    sources: Source[];
}

export type ResearchStage = 
    | 'IDLE' 
    | 'GENERATING_QUESTIONS' 
    | 'RESEARCHING' 
    | 'GENERATING_OUTLINE' 
    | 'GENERATING_ARTICLE' 
    | 'DONE';

export interface HistoryItem {
    id: string;
    topic: string;
    article: string;
    sources: Source[];
    timestamp: string;
}
