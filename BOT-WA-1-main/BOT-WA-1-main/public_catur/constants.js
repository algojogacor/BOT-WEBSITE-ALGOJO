export const COLORS = {
    WHITE: 'white',
    BLACK: 'black'
};

export const PIECES = {
    r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟', // Hitam
    R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙'  // Putih
};

export const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];