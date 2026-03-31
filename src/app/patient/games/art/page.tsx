'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Eraser, Download, Undo, Paintbrush } from 'lucide-react';
import Link from 'next/link';

const COLORS = [
    '#A8DADC', '#457B9D', '#1D3557', '#E63946',
    '#F4A261', '#2A9D8F', '#264653', '#E9C46A',
    '#B5838D', '#6D6875', '#CDB4DB', '#FFC8DD',
    '#588157', '#344E41', '#DAD7CD', '#000000',
];

export default function ArtCanvasPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#457B9D');
    const [brushSize, setBrushSize] = useState(4);
    const [history, setHistory] = useState<ImageData[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Save initial state
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const undo = useCallback(() => {
        if (history.length <= 1) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        const newHistory = history.slice(0, -1);
        setHistory(newHistory);
        ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    }, [history]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `oraii-art-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen" style={{ background: 'var(--color-bg)' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <Link href="/patient/games" className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    <ArrowLeft size={16} /> Back
                </Link>
                <h1 className="font-bold text-base" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Creative Canvas
                </h1>
                <div className="flex items-center gap-2">
                    <button onClick={undo} className="p-2 rounded-lg hover:bg-gray-100" title="Undo" style={{ color: 'var(--color-text-muted)' }}>
                        <Undo size={16} />
                    </button>
                    <button onClick={clearCanvas} className="p-2 rounded-lg hover:bg-gray-100" title="Clear" style={{ color: 'var(--color-text-muted)' }}>
                        <Eraser size={16} />
                    </button>
                    <button onClick={downloadCanvas} className="p-2 rounded-lg hover:bg-gray-100" title="Download" style={{ color: 'var(--color-text-muted)' }}>
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-4">
                <canvas
                    ref={canvasRef}
                    className="w-full max-w-2xl rounded-2xl border cursor-crosshair touch-none"
                    style={{
                        aspectRatio: '4/3',
                        background: '#FFFFFF',
                        borderColor: 'var(--color-border)',
                        boxShadow: 'var(--shadow-card)',
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 border-t" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                                style={{
                                    background: c,
                                    border: color === c ? '3px solid var(--color-primary)' : '2px solid #E5E7EB',
                                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Paintbrush size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <input
                            type="range"
                            min={1}
                            max={20}
                            value={brushSize}
                            onChange={e => setBrushSize(Number(e.target.value))}
                            className="w-20"
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--color-text-muted)' }}>{brushSize}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
