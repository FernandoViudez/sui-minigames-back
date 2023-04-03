export const enum GameBoardError {
  cantStartGame = 'You cant start a game if you are not the creator',
  invalidStatusForStartingGame = 'Status of the game board must be playing',
  playerNotFound = 'Player not found in game board',
  incorrectTurn = 'Incorrect turn',
}
