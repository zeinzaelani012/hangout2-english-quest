import { useState, useRef, useEffect } from 'react';
import type { Activity, ListenAndDrawPayload } from '../../types';
import { AudioButton } from '../AudioButton';
import { Eraser, Eye, Check } from 'lucide-react';
import { playUiSound } from '../../lib/audio';

interface Props {
  activity: Activity;
  onResult: (correct: boolean, error?: { correctAnswer: string; rule: string }) => void;
}

export function ListenAndDraw({ activity, onResult }: Props) {
  const payload = activity.payload as ListenAndDrawPayload;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState(payload.tools[0]?.id || 'pencil');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [completed, setCompleted] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const colors: Record<string, string> = {};
  payload.tools.forEach(t => { colors[t.id] = t.color; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCoords(e);
    if (!point) return;
    setDrawing(true);
    lastPointRef.current = point;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const point = getCoords(e);
    if (!point || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = colors[activeTool] || '#172033';
    ctx.lineWidth = activeTool === 'pencil' ? 2 : 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
  };

  const stopDraw = () => {
    setDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleComplete = () => {
    playUiSound('next');
    setCompleted(true);
    onResult(true, {
      correctAnswer: payload.modelSentence,
      rule: 'Great drawing! No wrong answer here — you earn full XP for trying.',
    });
  };

  return (
    <div>
      {/* Audio player */}
      <div className="flex items-center gap-3 mb-4">
        <AudioButton
          audioKey={`listen-draw-${activity.id}`}
          fallbackText={payload.audioPrompt}
          rate={activity.difficulty === 'challenging' ? 1.0 : 0.9}
          label="Listen"
        />
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="action-secondary text-sm"
          style={{ minHeight: 44 }}
          aria-expanded={showTranscript}
        >
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
      </div>

      {showTranscript && (
        <div className="mb-4 rounded-xl border border-violet/20 bg-violet/5 p-4">
          <p className="text-sm italic leading-6 text-ink">{payload.transcript}</p>
        </div>
      )}

      {/* Tools */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {payload.tools.map(tool => {
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                activeTool === tool.id
                  ? 'border-brand bg-teal-50 text-brand ring-2 ring-brand/15'
                  : 'border-slate-200 bg-white text-ink hover:bg-slate-50'
              }`}
              style={{ minHeight: 44 }}
              aria-label={`${tool.label} tool`}
              aria-pressed={activeTool === tool.id}
            >
              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: tool.color }} />
              {tool.label}
            </button>
          );
        })}
        <button
          onClick={clearCanvas}
          className="action-secondary text-sm"
          style={{ minHeight: 44 }}
          aria-label="Clear canvas"
        >
          <Eraser size={16} /> Clear
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        className="w-full touch-none rounded-xl border-2 border-slate-200"
        style={{ aspectRatio: '4/3', background: '#FFFFFF' }}
        aria-label="Drawing canvas"
        role="img"
      />

      {/* Reveal and complete */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowReveal(!showReveal)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-violet/20 bg-violet/5 px-4 py-2.5 text-sm font-bold text-violet transition-colors hover:bg-violet/10"
          style={{ minHeight: 44 }}
        >
          <Eye size={16} /> Show me
        </button>
        {!completed && (
          <button
            onClick={handleComplete}
            className="action-primary bg-mint text-sm hover:bg-emerald-700"
            style={{ minHeight: 44 }}
          >
            <Check size={16} /> I'm done
          </button>
        )}
      </div>

      {showReveal && (
        <div className="mt-4 rounded-xl border border-violet/20 bg-violet/5 p-4">
          <p className="eyebrow mb-1">Model sentence</p>
          <p className="text-sm font-semibold text-violet">{payload.modelSentence}</p>
        </div>
      )}

      {completed && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-ink">Great work. You completed the drawing task.</p>
        </div>
      )}
    </div>
  );
}
