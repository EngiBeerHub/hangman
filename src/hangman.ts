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

class Message {
    ui: UserInterface;

    constructor(ui: UserInterface) {
        this.ui = ui;
    }

    askQuestion(stage: Stage) {
        this.ui.output(`Hint: ${stage.question.hint}`, "yellow");
        this.ui.outputAnswer(stage.answer.replaceAll("", " ").trim());
        this.ui.output(`（残りの試行回数： ${stage.leftAttempts}`);
    }

    leftQuestions(quiz: Quiz) {
        this.ui.output(`残り${quiz.lefts() + 1}問`);
    }

    start() {
        this.ui.output("\nGame Start!!");
    }

    enterSomething() {
        this.ui.output(`何か文字を入力してください。`, "red");
    }

    notInclude(input: string) {
        this.ui.output(`"${input}" は単語に含まれていません。`, "red");
    }

    notCorrect(input: string) {
        this.ui.output(`残念！ "${input}" は正解ではありません。`, "red");
    }

    hit(input: string) {
        this.ui.output(`"${input}" がHit!`, "green");
    }

    correct(question: Question) {
        this.ui.output(`正解！ 単語は "${question.word}" でした。`, "green");
    }

    gameOver(question: Question) {
        this.ui.output(`正解は ${question.word} でした。`);
    }

    end() {
        this.ui.output("ゲーム終了です！お疲れ様でした！");
    }
}

interface GameState {
    stage: Stage;
    done: boolean;
}

class Game {
    quiz: Quiz;
    message: Message;
    stage: Stage;
    ui: UserInterface;


    constructor(quiz: Quiz, message: Message, ui: UserInterface) {
        this.quiz = quiz;
        this.message = message;
        this.ui = ui;
        this.stage = new Stage(this.quiz.getNext());
    }

    shouldEnd(): boolean {
        if (this.stage.isGameOver()) {
            return true;
        }

        if (!this.quiz.hasNext() && this.stage.isCorrect()) {
            return true;
        }

        return false;
    }

    next(isCorrect: boolean): GameState {
        if (!isCorrect) {
            this.stage.decrementAttempts();
        }

        if (this.shouldEnd()) {
            return {stage: this.stage, done: true};
        }

        if (isCorrect) {
            this.stage = new Stage(this.quiz.getNext());
        }

        return {stage: this.stage, done: false};
    }

    async start(): Promise<void> {
        this.ui.clear();
        this.message.start();

        let state: GameState = {
            stage: this.stage,
            done: false
        };

        while (!state.done) {
            if (state.stage === undefined) break;

            const {stage} = state;

            this.message.leftQuestions(this.quiz);
            this.message.askQuestion(stage);

            const userInput = await this.ui.input();

            if (!userInput) {
                this.message.enterSomething();
                state = this.next(false);
                continue;
            }

            stage.updateAnswer(userInput);

            if (stage.isCorrect()) {
                this.message.correct(stage.question);
                state = this.next(true);
                continue;
            }

            if (stage.isTooLong(userInput)) {
                this.message.notCorrect(userInput);
                state = this.next(false);
                continue;
            }

            if (stage.isIncludes(userInput)) {
                this.message.hit(userInput);
                continue;
            }

            this.message.notInclude(userInput);
            state = this.next(false);
        }

        if (state.stage.isGameOver()) {
            this.message.gameOver(this.stage.question);
        }

        this.message.end();

        this.ui.destroy();
    }
}

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

const questions: Question[] = rawData;
const quiz = new Quiz(questions);
const message = new Message(CLI);
const game = new Game(quiz, message, CLI);

game.start();
