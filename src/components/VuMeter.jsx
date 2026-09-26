import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VuMeter({ rms = 0, isSpeaking = false, threshold = 18, isCalibrating = false, active = true }) {
  const percent = Math.min(100, Math.round(rms * 280));
  const thresholdPct = Math.min(100, Math.round(threshold));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title={`Audio Level: ${percent}% | Gate: ${thresholdPct}%`}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        backgroundColor: !active ? 'rgba(239, 68, 68, 0.15)' : isSpeaking ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
        color: !active ? '#ef4444' : isSpeaking ? '#10b981' : '#94a3b8',
        transition: 'all 0.15s ease'
      }}>
        {!active ? <MicOff size={14} /> : <Mic size={14} />}
      </div>

      <div style={{ position: 'relative', width: '70px', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Dynamic Level Bar */}
        <div style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: isSpeaking ? '#10b981' : percent > 40 ? '#f59e0b' : '#38bdf8',
          transition: 'width 0.08s ease-out',
          boxShadow: isSpeaking ? '0 0 10px #10b981' : 'none'
        }} />

        {/* Gate Threshold Marker */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${thresholdPct}%`,
          width: '2px',
          backgroundColor: '#ef4444',
          opacity: 0.8
        }} />
      </div>

      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isCalibrating ? '#f59e0b' : isSpeaking ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
        {isCalibrating ? 'CALIB...' : isSpeaking ? 'VOICE' : 'IDLE'}
      </span>
    </div>
  );
}
