export type Language = 'el' | 'en' | 'de';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizSettings {
    language: Language;
    difficulty: Difficulty;
}

export interface Question {
    id: number;
    language: Language;
    difficulty: Difficulty;
    question: string;
    options: string[];
    correctAnswer: number;
}