import React from 'react';
import { LayoutGrid, MonitorPlay, Film, Settings, Keyboard, Maximize, Minimize } from 'lucide-react';
import VuMeter from './VuMeter';

export default function Header({
  route,
  setRoute,
  isRecording,
  recordingTime,
  audioRms,
  isSpeaking,
  vadThreshold,
  isCalibrating,
  vadActive,
  takesCount,
  onOpenSettings,
  onOpenShortcuts,
  isFullscreen,
  toggleFullscreen
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid var(--border-studio)',
      backgroundColor: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 30,
      userSelect: 'none'
    }}>
      {/* Brand logo & route navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '14px',
            color: '#fff',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
          }}>
            T
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px', color: '#fff' }}>
            TeleSync <span style={{ color: '#818cf8', fontWeight: 500, fontSize: '13px' }}>PRO</span>
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setRoute('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: route === 'dashboard' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: route === 'dashboard' ? '#818cf8' : '#94a3b8',
              fontWeight: route === 'dashboard' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={15} />
            Dashboard
          </button>

          <button
            onClick={() => setRoute('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: route === 'studio' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: route === 'studio' ? '#818cf8' : '#94a3b8',
              fontWeight: route === 'studio' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MonitorPlay size={15} />
            Studio
          </button>

          <button
            onClick={() => setRoute('takes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: route === 'takes' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: route === 'takes' ? '#818cf8' : '#94a3b8',
              fontWeight: route === 'takes' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Film size={15} />
            Takes
            {takesCount > 0 && (
              <span style={{
                backgroundColor: 'rgba(99, 102, 241, 0.3)',
                color: '#c7d2fe',
                borderRadius: '999px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {takesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Center recording live tally badge */}
      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        }}>
          <span className="tally-recording" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', letterSpacing: '0.5px' }}>REC</span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Right side controls: VU meter, shortcuts, settings, fullscreen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <VuMeter
          rms={audioRms}
          isSpeaking={isSpeaking}
          threshold={vadThreshold}
          isCalibrating={isCalibrating}
          active={vadActive}
        />

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-studio)' }} />

        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Keyboard size={17} />
        </button>

        <button
          onClick={onOpenSettings}
          title="Studio Settings"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Settings size={17} />
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
        </button>
      </div>
    </header>
  );
}
