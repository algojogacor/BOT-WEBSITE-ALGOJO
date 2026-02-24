export class ChessView {
    constructor(elementId, onClickSquare) {
        this.boardElement = document.getElementById(elementId);
        this.onClickSquare = onClickSquare;
        
        // Simbol Unicode
        this.pieces = {
            'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟', 
            'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
        };
    }

    render(grid) {
        this.boardElement.innerHTML = ''; 

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                square.classList.add('square');
                
                // Tentukan Warna Kotak
                const isWhiteSquare = (r + c) % 2 === 0;
                square.classList.add(isWhiteSquare ? 'white' : 'black');
                
                square.dataset.row = r;
                square.dataset.col = c;
                
                square.addEventListener('click', () => {
                    this.onClickSquare(parseInt(square.dataset.row), parseInt(square.dataset.col));
                });

                // Tampilkan Bidak
                const pieceChar = grid[r][c];
                if (pieceChar) {
                    const pieceSpan = document.createElement('span');
                    pieceSpan.innerText = this.pieces[pieceChar] || pieceChar;
                    
                    // --- PERBAIKAN WARNA (HIGH CONTRAST) ---
                    const isWhitePiece = pieceChar === pieceChar.toUpperCase();
                    
                    // Bikin font lebih tebal
                    pieceSpan.style.fontWeight = '900'; 
                    pieceSpan.style.lineHeight = '1';

                    if (isWhitePiece) {
                        // BIDAK PUTIH: Warna Putih Bersih + Outline Hitam Tebal
                        pieceSpan.style.color = '#ffffff';
                        pieceSpan.style.textShadow = 
                            '2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, ' +
                            '1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000';
                    } else {
                        // BIDAK HITAM: Warna Hitam Pekat + Glow Putih Tipis
                        // (Supaya tetap kelihatan jelas di kotak hijau gelap)
                        pieceSpan.style.color = '#000000';
                        pieceSpan.style.textShadow = 
                            '1px 1px 0 rgba(255,255,255,0.7), -1px -1px 0 rgba(255,255,255,0.7)';
                    }
                    
                    square.appendChild(pieceSpan);
                }

                this.boardElement.appendChild(square);
            }
        }
    }

    highlightSquare(row, col, className) {
        const index = row * 8 + col;
        const squares = this.boardElement.children;
        if (squares[index]) {
            squares[index].classList.add(className);
        }
    }
}
