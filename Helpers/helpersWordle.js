import emojis from "../Assets/emojis.js"

export function getColoredWord(answer, guess) {
  let coloredWord = [];
  for (let i = 0; i < guess.length; i++) {
    coloredWord.push(emojis.gray[guess[i]]);
  }
  let guessLetters = guess.split("");
  let answerLetters = answer.split("");

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      coloredWord[i] = emojis.green[guessLetters[i]];
      answerLetters[i] = null;
      guessLetters[i] = null;
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] && answerLetters.includes(guessLetters[i])) {
      coloredWord[i] = emojis.yellow[guessLetters[i]];
      answerLetters[answerLetters.indexOf(guessLetters[i])] = null;
    }
  }
  return coloredWord;
}
