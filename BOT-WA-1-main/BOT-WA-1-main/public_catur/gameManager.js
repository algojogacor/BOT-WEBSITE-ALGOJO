// helpers/chess/gameManager.js
import { Board } from './board.js';
import { ChessAI } from './ai.js';

// Map untuk menyimpan sesi game: { 'nomor_wa': { board, ai } }
export const games = new Map();

// Fungsi Helper: Mulai Game Baru
export function startGame(sender) {
    const newBoard = new Board();
    const newAI = new ChessAI(newBoard);
    games.set(sender, { board: newBoard, ai: newAI });
    return newBoard;
}

// Fungsi Helper: Ambil Game Seseorang
export function getGame(sender) {
    return games.get(sender);
}

// Fungsi Helper: Hapus Game
export function stopGame(sender) {
    games.delete(sender);
}