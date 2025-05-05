import rawData from "./data/questions.test.json";
import readlinePromises from "readline/promises";
import chalk from "chalk";
import figlet from "figlet";

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

    output(message: string, color?: Color): void;

    outputAnswer(message: string): void;
}

type Color = "red" | "green" | "yellow" | "white";

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
    },
    output(message: string, color: Color = "white") {
        console.log(chalk[color](message), "\n");
    },
    outputAnswer(message: string) {
        console.log(figlet.textSync(message, {font: "Big"}), "\n");
    }
};

async function testQuestion() {
    CLI.clear();
    const userInput = await CLI.input();
    console.log(userInput);
    CLI.destroy();
}

// testQuestion();
console.log(chalk.green("正解！！"));

class Stage {
    answer: string; // 解答の状態
    leftAttempts: number = 5; // 試行回数
    question: Question; // 出題中の問題

    constructor(question: Question) {
        this.question = question;
        // answerにブランク"_"の羅列を設定
        this.answer = new Array(question.word.length).fill("_").join("");
    }

    updateAnswer(userInput: string = ""): void {
        if (!userInput) return;

        const regex = new RegExp(userInput, "g");
        const answerArray = this.answer.split("");

        let matches: RegExpExecArray | null;

        while ((matches = regex.exec(this.question.word))) {
            const foundIdx = matches.index;
            answerArray.splice(foundIdx, userInput.length, ...userInput);

            this.answer = answerArray.join("");
        }
    }

    isTooLong(userInput: string): boolean {
        return userInput.length > this.question.word.length;
    }

    isIncludes(userInput: string): boolean {
        return this.question.word.includes(userInput);
    }

    isCorrect(): boolean {
        return this.answer === this.question.word;
    }

    decrementAttempts(): number {
        return --this.leftAttempts;
    }

    isGameOver(): boolean {
        return this.leftAttempts === 0;
    }
}
