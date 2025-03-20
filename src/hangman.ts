import rawData from "./data/questions.test.json";

interface Question {
    word: string;
    hint: string;
}

const questions: Question[] = rawData;

class Quiz {
    questions: Question[];

    constructor(questions: Question[]) {
        this.questions = questions;
    }
}

const quiz = new Quiz(questions);
