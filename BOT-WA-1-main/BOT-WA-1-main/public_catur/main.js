// public_catur/main.js

// --- IMPORTS ---
import { Board } from './board.js';
import { ChessView } from './view.js';
import { Rules } from './rules.js';
import { ChessAI } from './ai.js';

// --- 1. SETUP AWAL & BACA URL ---
const urlParams = new URLSearchParams(window.location.search);
const userWA = urlParams.get('user');
const betAmount = urlParams.get('bet');

// Validasi
if (!userWA || !betAmount) {
    console.warn("⚠️ Mode Latihan: Data user/taruhan tidak ditemukan di URL.");
}

// Inisialisasi Komponen
const board = new Board();
const ai = new ChessAI(board);
const view = new ChessView('chessboard', handleSquareClick);

// State Game
let selectedSquare = null;
let possibleMoves = [];
let isGameOver = false;

// --- FUNGSI UTAMA ---

function initGame() {
    view.render(board.grid);
    updateStatus();
}

// Update teks status (Giliran, Skak, dll)
function updateStatus(result = null) {
    const statusEl = document.getElementById('status');
    
    if (result) {
        statusEl.innerText = result;
        statusEl.style.color = 'red';
        statusEl.style.fontWeight = 'bold';
        return;
    }
    
    const inCheck = Rules.isKingInCheck(board, board.turn);
    const turnText = board.turn === 'white' ? 'Putih (Kamu)' : 'Hitam (Bot)';
    statusEl.innerText = `Giliran: ${turnText} ${inCheck ? '⚠️(SKAK!)' : ''} | 50-Move: ${board.halfMoveClock}/100`;
    statusEl.style.color = inCheck ? 'orange' : '#eee'; 
}

// Handle Klik User
function handleSquareClick(row, col) {
    // Stop jika game selesai atau giliran bot
    if (isGameOver || board.turn === 'black') return;

    const clickedPiece = board.getPiece(row, col);
    const isWhitePiece = clickedPiece && clickedPiece === clickedPiece.toUpperCase();
    const isOwnPiece = isWhitePiece && board.turn === 'white';

    // 1. PILIH BIDAK (Select)
    if (isOwnPiece) {
        selectedSquare = { row, col };
        possibleMoves = Rules.getValidMoves(board, row, col);
        
        view.render(board.grid);
        view.highlightSquare(row, col, 'selected');
        possibleMoves.forEach(m => view.highlightSquare(m.row, m.col, 'possible-move'));
        return;
    }

    // 2. JALANKAN BIDAK (Move)
    if (selectedSquare) {
        const moveData = possibleMoves.find(m => m.row === row && m.col === col);

        if (moveData) {
            // PROMOSI PION (User Putih)
            let promoPiece = null;
            const movingPiece = board.getPiece(selectedSquare.row, selectedSquare.col);
            const isPawn = movingPiece && movingPiece.toLowerCase() === 'p';
            const isPromotion = isPawn && row === 0;

            if (isPromotion) {
                let choice = prompt("Promosi! Pilih: Q (Menteri), R (Benteng), B (Gajah), N (Kuda)", "Q") || 'Q';
                choice = choice.toUpperCase();
                if (!['Q', 'R', 'B', 'N'].includes(choice)) choice = 'Q';
                promoPiece = choice; 
            }

            executeMove(selectedSquare.row, selectedSquare.col, row, col, moveData, promoPiece);

        } else {
            // Klik sembarang = batal pilih
            resetSelection();
            view.render(board.grid);
        }
    }
}

// Fungsi Eksekusi Langkah (Internal & Tampilan)
function executeMove(fromRow, fromCol, toRow, toCol, moveData, promoPiece) {
    board.movePiece(fromRow, fromCol, toRow, toCol, promoPiece);

    // Handle Rokade
    if (moveData.isCastling === 'king-side') {
        board.movePiece(toRow, 7, toRow, 5);
        board.turn = (board.turn === 'white') ? 'black' : 'white'; 
    }
    if (moveData.isCastling === 'queen-side') {
        board.movePiece(toRow, 0, toRow, 3);
        board.turn = (board.turn === 'white') ? 'black' : 'white';
    }
    // Handle En Passant
    if (moveData.isEnPassant) {
        board.grid[moveData.captureRow][moveData.captureCol] = null;
    }

    resetSelection();
    checkGameOver();

    if (!isGameOver) {
        view.render(board.grid);
        updateStatus();

        // Jika giliran hitam, panggil Bot
        if (board.turn === 'black') {
            setTimeout(makeBotMove, 250);
        }
    }
}

// --- LOGIKA BOT (AI) ---
function makeBotMove() {
    if (isGameOver) return;

    // 🔥 PENTING: Ambil Level yang dipilih User (Medium/Hard)
    const levelEl = document.getElementById('difficulty');
    const level = levelEl ? parseInt(levelEl.value) : 2; 

    setTimeout(() => {
        // AI mikir berdasarkan Level
        const bestMove = ai.getBestMove('black', level);

        if (bestMove) {
            let promo = null;
            const isPawn = bestMove.piece.toLowerCase() === 'p';
            // Bot Hitam promosi di baris 7
            if (isPawn && bestMove.row === 7) promo = 'q'; 

            executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.row, bestMove.col, bestMove, promo);
        } else {
            checkGameOver();
        }
    }, 10);
}

// --- WASIT (GAME OVER CHECK) ---
function checkGameOver() {
    const nextTurn = board.turn;
    
    if (Rules.isInsufficientMaterial(board)) {
        finishGame("REMIS (Materi Kurang)", "Draw! Materi tidak cukup.");
        return;
    }
    if (board.halfMoveClock >= 100) {
        finishGame("REMIS (50 Langkah)", "Draw! Aturan 50 langkah.");
        return;
    }
    if (board.getRepetitionCount() >= 3) {
        finishGame("REMIS (3x Pengulangan)", "Draw! Posisi berulang 3x.");
        return;
    }

    let totalValidMoves = 0;
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const piece = board.getPiece(r, c);
            if (piece && Rules.getPieceColor(piece) === nextTurn) {
                const moves = Rules.getValidMoves(board, r, c);
                totalValidMoves += moves.length;
            }
        }
    }

    if (totalValidMoves === 0) {
        if (Rules.isKingInCheck(board, nextTurn)) {
            const winner = (nextTurn === 'white') ? 'Hitam (Bot)' : 'Putih (Kamu)';
            finishGame(`SKAKMAT! Pemenang: ${winner}`, `Game Over! Pemenang: ${winner}`);
        } else {
            finishGame("REMIS (Stalemate)", "Draw (Stalemate)! Raja terjebak.");
        }
    }
}

// --- LAPOR KE SERVER ---
function finishGame(statusText, alertText) {
    isGameOver = true;
    view.render(board.grid);
    updateStatus(statusText); 
    
    // 🔥 PENTING: Ambil Level terakhir untuk dikirim ke Server
    const levelEl = document.getElementById('difficulty');
    const selectedLevel = levelEl ? parseInt(levelEl.value) : 2;

    setTimeout(() => {
        alert(alertText);

        if (userWA && betAmount) {
            let result = 'lose';
            
            if (statusText.includes("Putih") && statusText.includes("Pemenang")) {
                result = 'win'; 
            } else if (statusText.includes("REMIS") || statusText.includes("Draw") || statusText.includes("Stalemate")) {
                result = 'draw';
            }

            console.log("Lapor ke bot...", { userWA, result, level: selectedLevel });
            
            // KIRIM DATA LENGKAP KE INDEX.JS
            fetch('/api/catur-finish', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    user: userWA, 
                    bet: betAmount, 
                    result: result,
                    level: selectedLevel // <--- Server butuh ini buat hitung bonus
                })
            })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'ok') {
                    alert("✅ " + data.message);
                } else {
                    alert("⚠️ " + data.message);
                }
            })
            .catch(err => {
                console.error("Error:", err);
                alert("❌ Gagal lapor ke bot. Cek koneksi.");
            });
        }
    }, 100);
}

function resetSelection() { 
    selectedSquare = null; 
    possibleMoves = []; 
}

// Mulai
initGame();
