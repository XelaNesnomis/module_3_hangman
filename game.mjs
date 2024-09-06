// #region Dont look behind the curtain
// Do not worry about the next two lines, they just need to be there.
import * as readlinePromises from 'node:readline/promises';
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });

import { ANSI } from './ansi.mjs';
import { HANGMAN_UI } from './graphics.mjs';
import { readFileSync } from 'fs';

const FILE_PATH = './words.txt';
const WORD_PLACEHOLDER = '_';
const MAX_WRONG_GUESSES = HANGMAN_UI.length;
const ALREADY_GUESSED_MSG = ANSI.COLOR.YELLOW + "You've already guessed that letter!" + ANSI.RESET;
const GUESS_PROMPT = "Guess a letter or the word: ";
const EMPTY_WORD_LIST_ERROR = "Word list is empty. Make sure 'words.txt' has words in it.";
const GAME_OVER_WIN_MSG = ANSI.COLOR.YELLOW + "Congratulations! You guessed the word!" + ANSI.RESET;
const GAME_OVER_LOSS_MSG = ANSI.COLOR.RED + "Sorry, you lost. The word was: ";
const PLAY_AGAIN_PROMPT = "Do you want to play again? (yes/no) ";
const PLAY_AGAIN_OPTIONS = ['yes', 'y'];

function readWordsFromFile(filePath) {
    try {
        const data = readFileSync(filePath, 'utf8');
        return data.split(/\s+/).map(word => word.toLowerCase());
    } catch (error) {
        console.error('Error reading words file:', error);
        return [];
    }
}

function pickRandomWord(wordList) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}

function formatGuessedWord(guessedWord) {
    return guessedWord
        .split('')
        .map(char => char === WORD_PLACEHOLDER ? char : ANSI.COLOR.GREEN + char + ANSI.RESET)
        .join(' ');
}

function formatList(list, color) {
    return color + list.join(' ') + ANSI.RESET;
}

async function askQuestion(question) {
    return await rl.question(question);
}

function displayGameOver(wasGuessCorrect, correctWord, totalGuesses, wrongGuesses) {
    console.log(ANSI.CLEAR_SCREEN);
    console.log(wasGuessCorrect 
        ? GAME_OVER_WIN_MSG 
        : GAME_OVER_LOSS_MSG + correctWord + ANSI.RESET);
    
    console.log(`Stats: 
    - Total guesses: ${totalGuesses}
    - Wrong guesses: ${wrongGuesses.length}
    - Correct word: ${correctWord}`);
}

// Main game loop
async function playGame() {
    const wordList = readWordsFromFile(FILE_PATH);

    if (!wordList.length) {
        console.error(EMPTY_WORD_LIST_ERROR);
        process.exit();
    }

    const correctWord = pickRandomWord(wordList);
    let guessedWord = WORD_PLACEHOLDER.repeat(correctWord.length);
    let wrongGuesses = [];
    let correctGuesses = [];
    let totalGuesses = 0;
    let isGameOver = false;
    let wasGuessCorrect = false;

    while (!isGameOver) {
        console.log(ANSI.CLEAR_SCREEN);
        console.log(formatGuessedWord(guessedWord, correctWord));
        console.log("Wrong guesses: " + formatList(wrongGuesses, ANSI.COLOR.RED));
        console.log(HANGMAN_UI[wrongGuesses.length]);

        const answer = (await askQuestion(GUESS_PROMPT)).toLowerCase();

        if (correctGuesses.includes(answer) || wrongGuesses.includes(answer)) {
            console.log(ALREADY_GUESSED_MSG);
            continue;
        }

        totalGuesses++;

        if (answer === correctWord) {
            isGameOver = true;
            wasGuessCorrect = true;
        } else if (answer.length === 1 && correctWord.includes(answer)) {
            correctGuesses.push(answer);

            guessedWord = guessedWord
                .split('')
                .map((char, index) => correctWord[index] === answer || char !== WORD_PLACEHOLDER ? correctWord[index] : WORD_PLACEHOLDER)
                .join('');

            if (guessedWord === correctWord) {
                isGameOver = true;
                wasGuessCorrect = true;
            }
        } else if (answer.length === 1) {
            wrongGuesses.push(answer);

            if (wrongGuesses.length === MAX_WRONG_GUESSES) {
                isGameOver = true;
            }
        }
    }

    displayGameOver(wasGuessCorrect, correctWord, totalGuesses, wrongGuesses);

    const playAgain = (await askQuestion(PLAY_AGAIN_PROMPT)).toLowerCase();
    if (PLAY_AGAIN_OPTIONS.includes(playAgain)) {
        playGame();
    } else {
        process.exit();
    }
}

playGame();