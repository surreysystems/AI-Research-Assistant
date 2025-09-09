
import { GoogleGenAI, Type } from "@google/genai";
import type { Perspective, ResearchData, ResearchResult, Source } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const perspectivesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            perspective: {
                type: Type.STRING,
                description: "A unique, high-level perspective or theme on the main topic.",
            },
            questions: {
                type: Type.ARRAY,
                description: "A list of 2-3 specific, researchable questions related to this perspective.",
                items: {
                    type: Type.STRING,
                },
            },
        },
        required: ["perspective", "questions"],
    },
};

export const generatePerspectivesAndQuestions = async (topic: string): Promise<Perspective[]> => {
    const prompt = `
        As an expert researcher, your task is to break down the topic "${topic}" into multiple, diverse perspectives to create a comprehensive overview.
        
        Instructions:
        1. Brainstorm 3-4 distinct perspectives or sub-topics. Think about historical context, technological aspects, social impact, key figures, future developments, etc.
        2. For each perspective, formulate 2-3 specific, fact-based questions that can be answered through web research. These questions should guide the creation of a detailed, well-structured article.
        3. Ensure the questions are open-ended and encourage detailed answers rather than simple yes/no responses.

        Return the result as a JSON array.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: perspectivesSchema,
        },
    });
    
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as Perspective[];
    } catch (e) {
        console.error("Failed to parse perspectives JSON:", jsonText);
        throw new Error("The AI returned an invalid format for perspectives and questions.");
    }
};

export const researchQuestion = async (question: string): Promise<ResearchResult> => {
    const prompt = `
        Please provide a comprehensive, factual answer to the following question: "${question}".
        Cite your sources. Your answer should be detailed and well-supported by the search results.
        Synthesize the information from the web to provide a clear and concise answer.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const answer = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: Source[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled Source'
        }))
        .filter((source: Source) => source.uri);

    return { answer, sources };
};

export const generateOutline = async (topic: string, researchData: ResearchData[]): Promise<string> => {
    const researchContext = researchData.map(data => `Question: ${data.question}\nAnswer: ${data.answer}`).join('\n\n---\n\n');

    const prompt = `
        Based on the following research data for the topic "${topic}", create a detailed, hierarchical outline for a comprehensive article.
        The outline should be structured logically, like a Wikipedia article, with a clear introduction, main body sections with sub-points, and a conclusion.
        Use Roman numerals (I, II, III) for main sections and capital letters (A, B, C) for sub-sections.

        Here is the research data you must synthesize:
        ${researchContext}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text;
};

export const generateArticle = async (topic: string, outline: string, researchData: ResearchData[]): Promise<string> => {
    const researchContext = researchData.map(data => `Question: ${data.question}\nAnswer: ${data.answer}`).join('\n\n---\n\n');

    const prompt = `
        You are an expert writer tasked with creating a comprehensive, well-structured, and encyclopedic article on the topic "${topic}".
        Your response must be written in a neutral, objective tone, similar to a high-quality Wikipedia entry.

        You MUST adhere to the following structure provided in the outline.
        You MUST use the provided research data to write the content for each section.
        
        Do not invent information. Base your writing solely on the research data provided.
        Format the article using Markdown for headings (e.g., # for title, ## for main sections, ### for sub-sections).

        **Topic:**
        ${topic}

        **Article Outline:**
        ${outline}

        **Research Data:**
        ${researchContext}

        Now, write the full article based on these instructions.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text;
};
