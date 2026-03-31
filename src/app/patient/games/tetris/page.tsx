'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const COLS = 10;
const ROWS = 20;
const CELL = 28;

// Calming ORAII-palette tetromino colors
const COLORS: Record<string, string> = {
    I: '#0891B2',
    O: '#D97706',
    T: '#7C3AED',
    S: '#059669',
    Z: '#E63946',
    J: '#2D6A4F',
    L: '#B7935A',
};

const SHAPES: Record<string, number[][]> = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
};

type Board = (string | null)[][];

function createBoard(): Board {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
    const keys = Object.keys(SHAPES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { type: key, shape: SHAPES[key], x: Math.floor(COLS / 2) - 1, y: 0 };
}

function rotate(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = shape[r][c];
        }
    }
    return rotated;
}

function isValid(board: Board, shape: number[][], x: number, y: number): boolean {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const nx = x + c;
                const ny = y + r;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                if (ny >= 0 && board[ny][nx]) return false;
            }
        }
    }
    return true;
}

function placePiece(board: Board, piece: { type: string; shape: number[][]; x: number; y: number }): Board {
    const newBoard = board.map(row => [...row]);
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                const ny = piece.y + r;
                const nx = piece.x + c;
                if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
                    newBoard[ny][nx] = piece.type;
                }
            }
        }
    }
    return newBoard;
}

function clearLines(board: Board): { board: Board; cleared: number } {
    const newBoard = board.filter(row => row.some(cell => !cell));
    const cleared = ROWS - newBoard.length;
    while (newBoard.length < ROWS) {
        newBoard.unshift(Array(COLS).fill(null));
    }
    return { board: newBoard, cleared };
}

export default function TetrisPage() {
    const [board, setBoard] = useState<Board>(createBoard);
    const [piece, setPiece] = useState(randomPiece);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [paused, setPaused] = useState(true);
    const boardRef = useRef(board);
    const pieceRef = useRef(piece);

    boardRef.current = board;
    pieceRef.current = piece;

    const drop = useCallback(() => {
        if (gameOver || paused) return;
        const p = pieceRef.current;
        const b = boardRef.current;

        if (isValid(b, p.shape, p.x, p.y + 1)) {
            setPiece(prev => ({ ...prev, y: prev.y + 1 }));
        } else {
            const newBoard = placePiece(b, p);
            const { board: clearedBoard, cleared } = clearLines(newBoard);
            setBoard(clearedBoard);
            setScore(s => s + cleared * 100 + 10);

            const next = randomPiece();
            if (!isValid(clearedBoard, next.shape, next.x, next.y)) {
                setGameOver(true);
            } else {
                setPiece(next);
            }
        }
    }, [gameOver, paused]);

    useEffect(() => {
        if (paused || gameOver) return;
        const speed = Math.max(100, 600 - Math.floor(score / 500) * 50);
        const interval = setInterval(drop, speed);
        return () => clearInterval(interval);
    }, [drop, paused, gameOver, score]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameOver || paused) return;
            const p = pieceRef.current;
            const b = boardRef.current;

            switch (e.key) {
                case 'ArrowLeft':
                    if (isValid(b, p.shape, p.x - 1, p.y)) setPiece(prev => ({ ...prev, x: prev.x - 1 }));
                    break;
                case 'ArrowRight':
                    if (isValid(b, p.shape, p.x + 1, p.y)) setPiece(prev => ({ ...prev, x: prev.x + 1 }));
                    break;
                case 'ArrowDown':
                    drop();
                    break;
                case 'ArrowUp': {
                    const rotated = rotate(p.shape);
                    if (isValid(b, rotated, p.x, p.y)) setPiece(prev => ({ ...prev, shape: rotated }));
                    break;
                }
                case ' ':
                    // Hard drop
                    let dropY = p.y;
                    while (isValid(b, p.shape, p.x, dropY + 1)) dropY++;
                    setPiece(prev => ({ ...prev, y: dropY }));
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [drop, gameOver, paused]);

    const restart = () => {
        setBoard(createBoard());
        setPiece(randomPiece());
        setScore(0);
        setGameOver(false);
        setPaused(false);
    };

    // Mobile controls
    const moveLeft = () => {
        if (isValid(board, piece.shape, piece.x - 1, piece.y)) setPiece(prev => ({ ...prev, x: prev.x - 1 }));
    };
    const moveRight = () => {
        if (isValid(board, piece.shape, piece.x + 1, piece.y)) setPiece(prev => ({ ...prev, x: prev.x + 1 }));
    };
    const rotatePiece = () => {
        const rotated = rotate(piece.shape);
        if (isValid(board, rotated, piece.x, piece.y)) setPiece(prev => ({ ...prev, shape: rotated }));
    };

    // Render board with current piece
    const renderBoard = placePiece(board, piece);

    return (
        <div className="min-h-[calc(100vh-56px)] lg:min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
            <Link href="/patient/games" className="absolute top-20 lg:top-6 left-6 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <ArrowLeft size={16} /> Back
            </Link>

            <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                Mindful Blocks
            </h1>

            <div className="flex items-start gap-4">
                {/* Board */}
                <div
                    className="border rounded-xl overflow-hidden"
                    style={{
                        borderColor: 'var(--color-border)',
                        boxShadow: 'var(--shadow-card)',
                        width: COLS * CELL + 2,
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                            gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
                            background: '#F8FAFC',
                        }}
                    >
                        {renderBoard.map((row, r) =>
                            row.map((cell, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    style={{
                                        width: CELL,
                                        height: CELL,
                                        background: cell ? COLORS[cell] || '#999' : r % 2 === c % 2 ? '#F1F5F9' : '#F8FAFC',
                                        border: cell ? `1px solid ${COLORS[cell]}CC` : '1px solid #E2E8F0',
                                        borderRadius: cell ? 3 : 0,
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Score Panel */}
                <div className="space-y-3">
                    <div className="rounded-xl p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Score</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{score}</p>
                    </div>
                    <button
                        onClick={() => paused ? setPaused(false) : setPaused(true)}
                        className="w-full py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                        style={{ background: paused ? 'var(--color-primary)' : '#D97706' }}
                    >
                        {paused ? <><Play size={14} /> Play</> : <><Pause size={14} /> Pause</>}
                    </button>
                    <button
                        onClick={restart}
                        className="w-full py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-2"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                        <RotateCcw size={14} /> Restart
                    </button>
                </div>
            </div>

            {/* Mobile Controls */}
            <div className="lg:hidden flex items-center gap-3 mt-4">
                <button onClick={moveLeft} className="w-12 h-12 rounded-xl border text-lg font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>←</button>
                <button onClick={rotatePiece} className="w-12 h-12 rounded-xl border text-lg font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>↻</button>
                <button onClick={drop} className="w-12 h-12 rounded-xl border text-lg font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>↓</button>
                <button onClick={moveRight} className="w-12 h-12 rounded-xl border text-lg font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>→</button>
            </div>

            {/* Game Over */}
            {gameOver && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="rounded-3xl p-8 text-center" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-hover)' }}>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>Game Over</h2>
                        <p className="text-3xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>{score} pts</p>
                        <button onClick={restart} className="px-6 py-3 rounded-full text-white font-bold" style={{ background: 'var(--color-primary)' }}>
                            Play Again
                        </button>
                    </div>
                </div>
            )}

            <p className="text-[10px] mt-4" style={{ color: 'var(--color-text-muted)' }}>
                Arrow keys to move · Up to rotate · Space to hard drop
            </p>
        </div>
    );
}
