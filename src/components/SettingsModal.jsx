import React from 'react';
import { X, Mic, Type, Camera, Monitor, Sliders, ShieldAlert } from 'lucide-react';

export default function SettingsModal({ settings, onUpdateSettings, onClose }) {
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
        maxWidth: '560px',
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
            <Sliders size={18} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              Studio Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. Speech Recognition Settings */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Mic size={15} color="#38bdf8" />
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Speech & Microphone
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Speech Recognition Language
                </label>
                <select
                  value={settings.speechLanguage}
                  onChange={(e) => onUpdateSettings({ speechLanguage: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-studio)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="tr-TR">Turkish (Türkçe)</option>
                  <option value="az-AZ">Azerbaijani (Azərbaycan)</option>
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="ru-RU">Russian (Русский)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="de-DE">German (Deutsch)</option>
                  <option value="fr-FR">French (Français)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#cbd5e1' }}>VAD Noise Gate Threshold:</span>
                  <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {settings.vadThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={settings.vadThreshold}
                  onChange={(e) => onUpdateSettings({ vadThreshold: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                  Higher gate values filter out ambient studio reverberation and room fan noise.
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-studio)' }} />

          {/* 2. Typography & Layout */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Type size={15} color="#a855f7" />
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Typography & Reading Line
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Font Family</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-studio)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="Inter, sans-serif">Inter (Modern Sans)</option>
                  <option value="Montserrat, sans-serif">Montserrat (Broadcast)</option>
                  <option value="JetBrains Mono, monospace">JetBrains Mono (Tech)</option>
                  <option value="Merriweather, Georgia, serif">Merriweather (Serif)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Text Alignment</label>
                <select
                  value={settings.textAlign}
                  onChange={(e) => onUpdateSettings({ textAlign: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-studio)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="left">Left Aligned</option>
                  <option value="center">Center Aligned</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>Font Size:</span>
                <span style={{ color: '#818cf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {settings.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="28"
                max="92"
                step="2"
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--brand-500)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Text Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => onUpdateSettings({ textColor: e.target.value })}
                    style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{settings.textColor}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Eye-Line Cue Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={settings.cueColor}
                    onChange={(e) => onUpdateSettings({ cueColor: e.target.value })}
                    style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{settings.cueColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-studio)' }} />

          {/* 3. Camera & Prompter Hardware Display */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Monitor size={15} color="#10b981" />
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Hardware & Teleprompter Rig
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Horizontal Mirror (Teleprompter Glass)</span>
                <input
                  type="checkbox"
                  checked={settings.mirrorHorizontal}
                  onChange={(e) => onUpdateSettings({ mirrorHorizontal: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Vertical Mirror (Ceiling Rigs)</span>
                <input
                  type="checkbox"
                  checked={settings.mirrorVertical}
                  onChange={(e) => onUpdateSettings({ mirrorVertical: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Live Camera Preview</span>
                <input
                  type="checkbox"
                  checked={settings.cameraEnabled}
                  onChange={(e) => onUpdateSettings({ cameraEnabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-studio)',
          backgroundColor: 'rgba(5, 7, 10, 0.4)'
        }}>
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
