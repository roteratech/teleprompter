import React, { useState } from 'react';
import { Film, Download, Trash2, Play, Calendar, Clock, Video } from 'lucide-react';

export default function TakesModal({ takes, onDeleteTake, onClose }) {
  const [selectedTake, setSelectedTake] = useState(takes.length ? takes[0] : null);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = (take) => {
    if (!take || !take.blobUrl) return;
    const a = document.createElement('a');
    a.href = take.blobUrl;
    a.download = `${take.title || 'Studio-Take'}-${take.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 56px)',
      overflowY: 'auto',
      backgroundColor: 'var(--bg-studio-950)',
      padding: '32px 40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Recorded Studio Takes
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Review, play back, and export your recorded teleprompter sessions.
            </p>
          </div>
        </div>

        {!takes.length ? (
          <div className="glass-panel" style={{ borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
            <Video size={48} color="#64748b" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>No Takes Recorded Yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0' }}>
              Go to the Studio and press the Record button (or press 'R' on your keyboard) to record your reading with camera overlay.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Left: Video Player */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedTake ? (
                <>
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    backgroundColor: '#000',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <video
                      key={selectedTake.id}
                      src={selectedTake.blobUrl}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                        {selectedTake.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        <span>Duration: {formatDuration(selectedTake.duration)}</span>
                        <span>•</span>
                        <span>{new Date(selectedTake.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(selectedTake)}
                      className="btn-primary"
                    >
                      <Download size={15} />
                      Download Video (.webm)
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-dim)' }}>
                  Select a take from the list to preview
                </div>
              )}
            </div>

            {/* Right: Takes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {takes.map((t, idx) => {
                const isSelected = selectedTake?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTake(t)}
                    className="glass-panel"
                    style={{
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--brand-500)' : '1px solid var(--border-studio)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 22, 35, 0.75)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Film size={16} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                            Take #{takes.length - idx}
                          </h4>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                            {formatDuration(t.duration)} • {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTake(t.id);
                          if (selectedTake?.id === t.id) {
                            setSelectedTake(takes.find(x => x.id !== t.id) || null);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                        title="Delete Take"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
