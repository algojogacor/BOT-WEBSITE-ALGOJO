export class Rules {
    
    // 1. FUNGSI UTAMA: MENGAMBIL LANGKAH VALID (ANTI BUNUH DIRI)
    static getValidMoves(board, row, col) {
        const pseudoMoves = this.getPseudoLegalMoves(board, row, col);
        const validMoves = [];
        const myColor = board.turn;

        // Filter: Hapus gerakan yang membuat Raja sendiri mati
        pseudoMoves.forEach(move => {
            // Simulasi: Buat papan bayangan
            const tempBoard = board.clone();
            
            // Jalankan langkah di papan bayangan
            // (Kita kirim null untuk promoPiece karena di simulasi tidak penting jadi apa)
            tempBoard.movePiece(row, col, move.row, move.col);
            
            // Cek apakah setelah jalan, Raja kita aman?
            if (!this.isKingInCheck(tempBoard, myColor)) {
                validMoves.push(move);
            }
        });

        return validMoves;
    }

    // 2. CEK APAKAH RAJA SEDANG DI-SKAK
    static isKingInCheck(board, color) {
        // Cari lokasi Raja
        let kingRow, kingCol;
        for (let r=0; r<8; r++) {
            for (let c=0; c<8; c++) {
                const p = board.getPiece(r, c);
                if (p && p.toLowerCase() === 'k' && this.getPieceColor(p) === color) {
                    kingRow = r; kingCol = c;
                    break;
                }
            }
        }
        
        if (kingRow === undefined) return true; // Raja hilang (seharusnya gak mungkin)

        const enemyColor = (color === 'white') ? 'black' : 'white';
        
        // Cek serangan musuh
        for (let r=0; r<8; r++) {
            for (let c=0; c<8; c++) {
                const p = board.getPiece(r, c);
                if (p && this.getPieceColor(p) === enemyColor) {
                    const moves = this.getPseudoLegalMoves(board, r, c);
                    if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 3. CEK MATERI KURANG (UNTUK REMIS OTOMATIS)
    static isInsufficientMaterial(board) {
        const pieces = [];
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const p = board.getPiece(r, c);
                if (p) pieces.push(p.toLowerCase());
            }
        }

        // Raja vs Raja
        if (pieces.length === 2) return true;

        // Raja + Kuda vs Raja
        if (pieces.length === 3 && pieces.includes('n')) return true;

        // Raja + Gajah vs Raja
        if (pieces.length === 3 && pieces.includes('b')) return true;

        return false;
    }

    // --- LOGIKA GERAKAN MURNI (PSEUDO MOVES) ---
    static getPseudoLegalMoves(board, row, col) {
        const piece = board.getPiece(row, col);
        if (!piece) return [];
        const moves = [];
        const isWhite = piece === piece.toUpperCase();

        switch (piece.toLowerCase()) {
            case 'p': this.getPawnMoves(board, row, col, isWhite, moves); break;
            case 'r': this.getSlidingMoves(board, row, col, isWhite, moves, [[1,0],[-1,0],[0,1],[0,-1]]); break;
            case 'b': this.getSlidingMoves(board, row, col, isWhite, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]); break;
            case 'q': this.getSlidingMoves(board, row, col, isWhite, moves, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
            case 'n': this.getKnightMoves(board, row, col, isWhite, moves); break;
            case 'k': 
                this.getKingMoves(board, row, col, isWhite, moves);
                this.getCastlingMoves(board, row, col, isWhite, moves);
                break;
        }
        return moves;
    }

    static getPawnMoves(board, row, col, isWhite, moves) {
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        // Maju 1
        const f1 = row + direction;
        if (board.isValidPos(f1, col) && board.getPiece(f1, col) === null) {
            moves.push({ row: f1, col: col });
            // Maju 2
            const f2 = row + (direction * 2);
            if (row === startRow && board.getPiece(f2, col) === null) {
                moves.push({ row: f2, col: col });
            }
        }
        
        // Makan
        [col-1, col+1].forEach(c => {
            if (board.isValidPos(f1, c)) {
                const target = board.getPiece(f1, c);
                if (target && this.isEnemy(isWhite, target)) {
                    moves.push({ row: f1, col: c });
                }
            }
        });

        // En Passant
        if (board.lastMove) {
            const lm = board.lastMove;
            if (lm.piece.toLowerCase() === 'p' && Math.abs(lm.fromRow - lm.toRow) === 2) {
                if (lm.toRow === row && Math.abs(lm.toCol - col) === 1) {
                    moves.push({ 
                        row: f1, 
                        col: lm.toCol, 
                        isEnPassant: true, 
                        captureRow: row, 
                        captureCol: lm.toCol 
                    });
                }
            }
        }
    }

    static getSlidingMoves(board, row, col, isWhite, moves, dirs) {
        dirs.forEach(d => {
            let r=row+d[0], c=col+d[1];
            while(board.isValidPos(r,c)){
                const t=board.getPiece(r,c);
                if(t===null) moves.push({row:r,col:c});
                else { if(this.isEnemy(isWhite,t)) moves.push({row:r,col:c}); break; }
                r+=d[0]; c+=d[1];
            }
        });
    }

    static getKnightMoves(board, row, col, isWhite, moves) {
        [[ -2, -1], [ -2, 1], [ -1, -2], [ -1, 2], [ 1, -2], [ 1, 2], [ 2, -1], [ 2, 1]].forEach(o=>{
            let r=row+o[0], c=col+o[1];
            if(board.isValidPos(r,c)){
                const t=board.getPiece(r,c);
                if(t===null||this.isEnemy(isWhite,t)) moves.push({row:r,col:c});
            }
        });
    }

    static getKingMoves(board, row, col, isWhite, moves) {
        [[ -1, -1], [ -1, 0], [ -1, 1], [ 0, -1], [ 0, 1], [ 1, -1], [ 1, 0], [ 1, 1]].forEach(o=>{
            let r=row+o[0], c=col+o[1];
            if(board.isValidPos(r,c)){
                const t=board.getPiece(r,c);
                if(t===null||this.isEnemy(isWhite,t)) moves.push({row:r,col:c});
            }
        });
    }

    static getCastlingMoves(board, row, col, isWhite, moves) {
        if (board.hasPieceMoved(row, col)) return;
        const rank = isWhite ? 7 : 0;
        if (row !== rank) return;
        
        // King Side
        if (!board.hasPieceMoved(rank, 7) && board.getPiece(rank, 5)===null && board.getPiece(rank, 6)===null) {
            moves.push({ row: rank, col: 6, isCastling: 'king-side' });
        }
        // Queen Side
        if (!board.hasPieceMoved(rank, 0) && board.getPiece(rank, 1)===null && board.getPiece(rank, 2)===null && board.getPiece(rank, 3)===null) {
            moves.push({ row: rank, col: 2, isCastling: 'queen-side' });
        }
    }

    static isEnemy(isMyWhite, target) { return target && (target === target.toUpperCase()) !== isMyWhite; }
    static getPieceColor(p) { return (p === p.toUpperCase()) ? 'white' : 'black'; }
}