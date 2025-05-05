import rawData from "./data/questions.test.json";
import readlinePromises from "readline/promises";

interface Question {
    word: string;
    hint: string;
}

class Quiz {
    questions: Question[];

    constructor(questions: Question[]) {
        this.questions = questions;
    }

    /**
     * 次の質問が存在するか確認
     */
    hasNext(): boolean {
        return this.questions.length > 0;
    }

    /**
     * ランダムに質問を取得して、その質問をリストから削除
     */
    getNext(): Question {
        // 0以上、配列の長さ以下のランダムな配列を生成
        const idx = Math.floor(Math.random() * this.questions.length);
        // ランダムなインデックスidxを使って、questions配列から1つの問題を削除
        const [question] = this.questions.splice(idx, 1);
        return question;
    }

    /**
     * 残りの質問数を取得
     */
    lefts(): number {
        return this.questions.length;
    }
}

const questions: Question[] = rawData;
const quiz = new Quiz(questions);

interface UserInterface {
    input(): Promise<string>;

    clear(): void;

    destroy(): void;

    // otput(message: string, color?: Color): void;
    //
    // outputAnswer(message: string): void;
}

const rl = readlinePromises.createInterface({
    input: process.stdin,
    output: process.stdout
});

const CLI: UserInterface = {
    async input() {
        const input = await rl.question("文字または単語を推測してください： ");
        return input.replaceAll(" ", "").toLowerCase();
    },
    clear() {
        console.clear();
    },
    destroy() {
        rl.close();
    }
};

async function testQuestion() {
    CLI.clear();
    const userInput = await CLI.input();
    console.log(userInput);
    CLI.destroy();
}

testQuestion();
