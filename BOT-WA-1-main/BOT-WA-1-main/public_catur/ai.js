import { Rules } from './rules.js';

export class ChessAI {
    constructor(board) {
        this.board = board;
        // Tabel Nilai Posisi (Piece-Square Tables)
        this.pst = {
            p: [ 
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            n: [ 
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ]
        };
    }

    getBestMove(color, level) {
        // LEVEL 1: MUDAH (Random Move)
        if (level === 1) {
            const moves = this.getAllValidMoves(this.board, color);
            return moves[Math.floor(Math.random() * moves.length)];
        }

        // LEVEL 2 & 3: MIKIR (Minimax)
        // Level 3 lebih dalam (3 langkah ke depan), Level 2 cuma 2 langkah
        const depth = (level === 3) ? 3 : 2;
        return this.minimaxRoot(depth, color, true);
    }

    // Fungsi Akar Minimax (Langkah Awal)
    minimaxRoot(depth, color, isMaximizing) {
        const moves = this.getAllValidMoves(this.board, color);
        let bestMove = null;
        let bestValue = isMaximizing ? -Infinity : Infinity;

        moves.sort(() => Math.random() - 0.5); // Acak biar tidak kaku

        for (const move of moves) {
            // WAJIB: board.js harus punya fungsi clone()
            const tempBoard = this.board.clone(); 
            
            // --- FIX PROMOSI WARNA ---
            let promo = null;
            if (move.piece.toLowerCase() === 'p' && (move.row === 0 || move.row === 7)) {
                promo = (color === 'white') ? 'Q' : 'q';
            }
            
            tempBoard.movePiece(move.fromRow, move.fromCol, move.row, move.col, promo);

            const value = this.minimax(tempBoard, depth - 1, -Infinity, Infinity, !isMaximizing, color);

            if (isMaximizing) {
                if (value > bestValue) { bestValue = value; bestMove = move; }
            } else {
                if (value < bestValue) { bestValue = value; bestMove = move; }
            }
        }
        return bestMove;
    }

    // Algoritma Minimax dengan Alpha-Beta Pruning
    minimax(board, depth, alpha, beta, isMaximizing, myColor) {
        if (depth === 0) {
            return this.evaluateBoard(board, myColor);
        }

        const turnColor = isMaximizing ? myColor : (myColor === 'white' ? 'black' : 'white');
        const moves = this.getAllValidMoves(board, turnColor);

        // Cek Skakmat / Remis
        if (moves.length === 0) {
            if (Rules.isKingInCheck(board, turnColor)) {
                return isMaximizing ? -9999 : 9999; 
            }
            return 0; 
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const tempBoard = board.clone();
                
                // FIX PROMOSI DI REKURSIF
                let promo = null;
                if (move.piece.toLowerCase() === 'p' && (move.row === 0 || move.row === 7)) {
                    promo = (turnColor === 'white') ? 'Q' : 'q';
                }

                tempBoard.movePiece(move.fromRow, move.fromCol, move.row, move.col, promo);

                const evalVal = this.minimax(tempBoard, depth - 1, alpha, beta, false, myColor);
                maxEval = Math.max(maxEval, evalVal);
                alpha = Math.max(alpha, evalVal);
                if (beta <= alpha) break; 
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const tempBoard = board.clone();

                // FIX PROMOSI DI REKURSIF
                let promo = null;
                if (move.piece.toLowerCase() === 'p' && (move.row === 0 || move.row === 7)) {
                    promo = (turnColor === 'white') ? 'Q' : 'q';
                }

                tempBoard.movePiece(move.fromRow, move.fromCol, move.row, move.col, promo);

                const evalVal = this.minimax(tempBoard, depth - 1, alpha, beta, true, myColor);
                minEval = Math.min(minEval, evalVal);
                beta = Math.min(beta, evalVal);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    getAllValidMoves(board, color) {
        let moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece(r, c);
                if (piece && Rules.getPieceColor(piece) === color) {
                    const validMoves = Rules.getValidMoves(board, r, c);
                    validMoves.forEach(m => {
                        m.fromRow = r; m.fromCol = c; m.piece = piece;
                        moves.push(m);
                    });
                }
            }
        }
        return moves;
    }

    evaluateBoard(board, myColor) {
        let score = 0;
        const pieceVal = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board.getPiece(r, c);
                if (piece) {
                    const type = piece.toLowerCase();
                    const isWhite = piece === piece.toUpperCase();
                    let value = pieceVal[type] || 0;

                    if (this.pst[type]) {
                        if (isWhite) {
                            value += this.pst[type][r][c];
                        } else {
                            value += this.pst[type][7-r][c]; 
                        }
                    }

                    if (isWhite) score += value;
                    else score -= value;
                }
            }
        }
        return (myColor === 'white') ? score : -score;
    }
}
