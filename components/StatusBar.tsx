
import React from 'react';
import type { ResearchStage } from '../types';
import { BrainCircuitIcon, SearchIcon, ListTreeIcon, FileTextIcon, CheckCircle2Icon, LoaderIcon } from './icons';

interface StatusBarProps {
    currentStage: ResearchStage;
    questionsCount: number;
    researchProgress: number;
}

const Stage: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    isActive: boolean;
    isCompleted: boolean;
}> = ({ icon, title, description, isActive, isCompleted }) => {
    const getStatusClasses = () => {
        if (isActive) return { text: 'text-blue-600', icon: 'text-blue-600' };
        if (isCompleted) return { text: 'text-green-600', icon: 'text-green-600' };
        return { text: 'text-slate-500', icon: 'text-slate-400' };
    };

    const { text, icon: iconClass } = getStatusClasses();
    const iconToShow = isActive ? <LoaderIcon className={`h-6 w-6 animate-spin ${iconClass}`} /> : isCompleted ? <CheckCircle2Icon className={`h-6 w-6 ${iconClass}`} /> : icon;

    return (
        <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 ${iconClass}`}>
                {iconToShow}
            </div>
            <div>
                <h4 className={`font-semibold ${text}`}>{title}</h4>
                <p className={`text-sm ${text}`}>{description}</p>
            </div>
        </div>
    );
};


const StatusBar: React.FC<StatusBarProps> = ({ currentStage, questionsCount, researchProgress }) => {
    const stages: { id: ResearchStage; title: string; description: string, icon: React.ReactNode }[] = [
        { id: 'GENERATING_QUESTIONS', title: 'Generating Questions', description: 'Creating diverse perspectives.', icon: <BrainCircuitIcon className="h-6 w-6" /> },
        { id: 'RESEARCHING', title: 'Gathering Information', description: `Researching ${researchProgress} of ${questionsCount} questions.`, icon: <SearchIcon className="h-6 w-6" /> },
        { id: 'GENERATING_OUTLINE', title: 'Creating Outline', description: 'Structuring the article.', icon: <ListTreeIcon className="h-6 w-6" /> },
        { id: 'GENERATING_ARTICLE', title: 'Writing Article', description: 'Drafting the final text.', icon: <FileTextIcon className="h-6 w-6" /> },
        { id: 'DONE', title: 'Completed', description: 'Research process finished.', icon: <CheckCircle2Icon className="h-6 w-6" /> },
    ];

    const currentStageIndex = stages.findIndex(s => s.id === currentStage);

    return (
        <div className="space-y-4">
            {stages.map((stage, index) => (
                <Stage
                    key={stage.id}
                    icon={stage.icon}
                    title={stage.title}
                    description={stage.id === 'RESEARCHING' && questionsCount > 0 ? `Researching ${researchProgress} of ${questionsCount} questions.` : stage.description}
                    isActive={currentStage === stage.id && currentStage !== 'DONE'}
                    isCompleted={currentStage === 'DONE' || index < currentStageIndex}
                />
            ))}
        </div>
    );
};

export default StatusBar;
