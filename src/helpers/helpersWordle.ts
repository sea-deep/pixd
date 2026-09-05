import emojis from "../Assets/emojis.js"

export function getColoredWord(answer: string, guess: string) {
  let coloredWord = [];
  for (let i = 0; i < guess.length; i++) {
    coloredWord.push(emojis.gray[guess[i] as keyof typeof emojis.gray]);
  }
  let guessLetters = guess.split("");
  let answerLetters = answer.split("");

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      coloredWord[i] = emojis.green[guessLetters[i] as keyof typeof emojis.green];
      answerLetters[i] = "";
      guessLetters[i] = "";
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] && answerLetters.includes(guessLetters[i])) {
      coloredWord[i] = emojis.yellow[guessLetters[i] as keyof typeof emojis.yellow];
      answerLetters[answerLetters.indexOf(guessLetters[i])] = "";
    }
  }
  return coloredWord;
}
