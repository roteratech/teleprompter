import React, { useState } from 'react';
import { Plus, Search, FileText, Clock, Play, Edit3, Trash2, Copy, Download, Upload } from 'lucide-react';

export default function Dashboard({
  scripts,
  activeScriptId,
  onSelectScript,
  onCreateScript,
  onEditScript,
  onDeleteScript,
  onDuplicateScript,
  onOpenStudio
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScripts = scripts.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateStats = (text) => {
    if (!text) return { words: 0, duration: '0:00' };
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const totalMinutes = words / 140; // baseline 140 wpm
    const mins = Math.floor(totalMinutes);
    const secs = Math.round((totalMinutes - mins) * 60);
    return {
      words,
      duration: `${mins}:${secs.toString().padStart(2, '0')}`
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const title = file.name.replace(/\.[^/.]+$/, "");
        onCreateScript({ title, content });
      }
    };
    reader.readAsText(file);
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
        {/* Top Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Script Library
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Manage, organize, and launch your speech-synchronized scripts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={15} />
              <span>Import .txt</span>
              <input type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            <button onClick={() => onEditScript(null)} className="btn-primary">
              <Plus size={16} />
              <span>New Script</span>
            </button>
          </div>
        </div>

        {/* Search bar & quick filters */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '420px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search scripts by title or words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(16, 22, 35, 0.8)',
                border: '1px solid var(--border-studio)',
                borderRadius: '10px',
                padding: '9px 12px 9px 36px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {filteredScripts.length} {filteredScripts.length === 1 ? 'script' : 'scripts'}
          </span>
        </div>

        {/* Script Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {filteredScripts.map((s) => {
            const stats = calculateStats(s.content);
            const isActive = s.id === activeScriptId;

            return (
              <div
                key={s.id}
                className="glass-panel"
                style={{
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isActive ? '1px solid var(--brand-500)' : '1px solid var(--border-studio)',
                  boxShadow: isActive ? '0 0 20px rgba(99, 102, 241, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                      {s.title}
                    </h3>
                    {isActive && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        letterSpacing: '0.5px'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {s.content}
                  </p>
                </div>

                <div>
                  {/* Metadata: word count and estimated reading time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', borderTop: '1px solid var(--border-studio)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      <FileText size={13} />
                      <span>{stats.words} words</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      <Clock size={13} />
                      <span>~{stats.duration} min</span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => {
                        onSelectScript(s.id);
                        onOpenStudio();
                      }}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      <Play size={13} />
                      <span>Launch Studio</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => onEditScript(s)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer', borderRadius: '6px' }}
                        title="Edit Script"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => onDuplicateScript(s)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer', borderRadius: '6px' }}
                        title="Duplicate Script"
                      >
                        <Copy size={15} />
                      </button>

                      {scripts.length > 1 && (
                        <button
                          onClick={() => onDeleteScript(s.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', padding: '6px', cursor: 'pointer', borderRadius: '6px' }}
                          title="Delete Script"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
