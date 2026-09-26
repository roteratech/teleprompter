import React, { useState } from 'react';
import { X, Sparkles, FileText } from 'lucide-react';

export default function ScriptEditorModal({ script, onSave, onClose }) {
  const [title, setTitle] = useState(script ? script.title : 'New Script');
  const [content, setContent] = useState(script ? script.content : '');

  const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const mins = Math.floor(words / 140);
  const secs = Math.round(((words / 140) - mins) * 60);

  const applyTemplate = (type) => {
    if (type === 'keynote') {
      setTitle("Studio Keynote Broadcast");
      setContent(`Good evening and welcome to tonight's live keynote broadcast.
We are presenting a groundbreaking innovation in teleprompter engineering.
Notice how the script stays perfectly anchored as you pause to take a breath.
When you proceed to the next paragraph, the text smoothly scrolls forward into your focal eye line.
This eliminates frantic pacing, unnatural reading cadences, and memorization anxiety.
Thank you for joining our keynote demonstration today.`);
    } else if (type === 'review') {
      setTitle("Tech Review & Creator Intro");
      setContent(`Hello creators and welcome back to the channel!
Today we are testing high-framerate camera recording paired with voice-guided cues.
The built-in microphone listener continuously separates spoken speech from room resonance.
Whether you glance away or skip a word, the intelligent matching algorithm recovers your position seamlessly.
Make sure to subscribe, leave a comment below, and enjoy crystal-clear reading on camera.`);
    } else if (type === 'turkish') {
      setTitle("Canlı Yayın Açılış Metni");
      setContent(`Değerli izleyiciler, bu axşamkı canlı yayımımıza xoş gəlmisiniz.
Bu gün nitq sinxronizasiyalı yeni nəsil teleprompter sistemini təqdim edirik.
Siz danışdıqca mətn avtomatik olaraq səsinizin tempinə uyğunlaşır və rahat oxumağı təmin edir.
Fasilə verdiyiniz zaman mətn dayanır, davam etdiyinizdə isə axıcı şəkildə irəliləyir.
Bizi izlədiyiniz üçün təşəkkür edirik!`);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: script ? script.id : `script-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

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
        maxWidth: '680px',
        maxHeight: '90vh',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-studio)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {script ? 'Edit Script' : 'Create New Script'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Script Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Live Keynote Announcement"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-studio)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Quick template seeds */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="#f59e0b" />
              Templates:
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('keynote')}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-studio)', borderRadius: '6px', padding: '3px 8px', color: '#cbd5e1', fontSize: '11px', cursor: 'pointer' }}
            >
              Keynote
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('review')}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-studio)', borderRadius: '6px', padding: '3px 8px', color: '#cbd5e1', fontSize: '11px', cursor: 'pointer' }}
            >
              Creator Review
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('turkish')}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-studio)', borderRadius: '6px', padding: '3px 8px', color: '#cbd5e1', fontSize: '11px', cursor: 'pointer' }}
            >
              TR / AZ Nümunə
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Script Content
              </label>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                {words} words • ~{mins}:{secs.toString().padStart(2, '0')} min
              </span>
            </div>
            <textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write your speech script here..."
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-studio)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-studio)',
          backgroundColor: 'rgba(5, 7, 10, 0.4)'
        }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Script
          </button>
        </div>
      </div>
    </div>
  );
}
