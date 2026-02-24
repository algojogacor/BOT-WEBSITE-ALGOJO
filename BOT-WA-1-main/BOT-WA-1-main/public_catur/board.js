import { INITIAL_BOARD } from './constants.js';

export class Board {
    constructor(grid = null, turn = 'white', hasMoved = null, lastMove = null, halfMoveClock = 0, history = []) {
        this.grid = grid ? JSON.parse(JSON.stringify(grid)) : JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.turn = turn;
        this.hasMoved = hasMoved ? new Set(hasMoved) : new Set();
        this.lastMove = lastMove;
        
        // 1. Counter untuk Aturan 50 Langkah (Setiap kali pion gerak atau makan, reset ke 0)
        this.halfMoveClock = halfMoveClock; 
        
        // 2. Sejarah Posisi (Array berisi "Foto" papan dalam bentuk string)
        this.history = history; 
        if (!grid) this.recordPosition(); // Rekam posisi awal
    }

    getPiece(row, col) { return this.grid[row][col]; }

    movePiece(fromRow, fromCol, toRow, toCol, promoPiece = null) {
        const piece = this.grid[fromRow][fromCol];
        const target = this.grid[toRow][toCol];

        // --- ATURAN 50 LANGKAH ---
        // Reset counter jika: Pion gerak ATAU ada yang dimakan
        if (piece.toLowerCase() === 'p' || target !== null) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++; // Kalau cuma geser benteng/raja, tambah counter
        }

        // Simpan info langkah (Untuk En Passant)
        this.lastMove = { fromRow, fromCol, toRow, toCol, piece };

        // Eksekusi Pindah
        // Kalau ada promoPiece (misal user pilih 'r'), pakai itu. Kalau gak, pakai bidak asal.
        this.grid[toRow][toCol] = promoPiece ? promoPiece : piece; 
        this.grid[fromRow][fromCol] = null;
        
        this.hasMoved.add(`${fromRow},${fromCol}`);
        this.hasMoved.add(`${toRow},${toCol}`);

        // Ganti giliran
        this.turn = (this.turn === 'white') ? 'black' : 'white';
        
        // Rekam posisi baru ke sejarah
        this.recordPosition();
    }

    // Fungsi bikin "Foto" papan jadi string unik
    recordPosition() {
        // Kita gabungkan: Posisi Bidak + Giliran + Siapa Boleh Rokade
        // (Sederhananya kita pakai JSON grid + turn)
        const signature = JSON.stringify(this.grid) + "|" + this.turn;
        this.history.push(signature);
    }

    // Hitung berapa kali posisi ini sudah terjadi
    getRepetitionCount() {
        const currentSig = this.history[this.history.length - 1];
        return this.history.filter(sig => sig === currentSig).length;
    }

    clone() {
        return new Board(this.grid, this.turn, this.hasMoved, this.lastMove, this.halfMoveClock, [...this.history]);
    }

    hasPieceMoved(row, col) { return this.hasMoved.has(`${row},${col}`); }
    isValidPos(row, col) { return row >= 0 && row < 8 && col >= 0 && col < 8; }
}