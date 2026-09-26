import React from 'react';
import { X, Keyboard } from 'lucide-react';

export default function ShortcutModal({ onClose }) {
  const shortcuts = [
    { key: 'Space', desc: 'Start / Pause Prompter Scrolling' },
    { key: 'Esc', desc: 'Reset Teleprompter to the Beginning' },
    { key: '↑ / ↓', desc: 'Increase / Decrease WPM Scrolling Speed' },
    { key: 'M', desc: 'Toggle Horizontal Mirror (Prompter Glass)' },
    { key: 'R', desc: 'Start / Stop Studio Video Recording Take' },
    { key: 'F', desc: 'Toggle Fullscreen Mode' },
    { key: 'Word Click', desc: 'Instant Jump to any word in script' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-modal" style={{
        width: '100%',
        maxWidth: '480px',
        borderRadius: '20px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-studio)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              Studio Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shortcuts.map((s, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < shortcuts.length - 1 ? '1px solid var(--border-studio)' : 'none' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{s.desc}</span>
              <kbd style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-studio)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#818cf8',
                fontWeight: 700
              }}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '14px 24px',
          borderTop: '1px solid var(--border-studio)',
          backgroundColor: 'rgba(5, 7, 10, 0.4)'
        }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
