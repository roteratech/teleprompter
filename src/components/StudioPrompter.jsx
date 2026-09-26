import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, Video, Square, FlipHorizontal, Sliders,
  Mic, Gauge, Eye, Volume2, Camera, CameraOff, ChevronUp, ChevronDown
} from 'lucide-react';
import { normalizeWord, isWordMatch } from '../utils/textMatcher';

export default function StudioPrompter({
  script,
  settings,
  onUpdateSettings,
  audioRms,
  isSpeaking,
  vadActive,
  onToggleVad,
  speechEngine,
  cameraService,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onOpenSettings
}) {
  const viewportRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Prompter states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showTranscriptPill, setShowTranscriptPill] = useState(false);
  const transcriptTimerRef = useRef(null);

  // Animation scroll ref
  const scrollAnimRef = useRef({
    targetScrollTop: 0,
    currentScrollTop: 0,
    rafId: null,
    lastFrameTime: performance.now(),
    isUserTouching: false
  });

  // Tokenize the active script text
  const tokens = useMemo(() => {
    if (!script || !script.content) return [];
    const words = [];
    const paragraphs = script.content.split(/\n+/);
    let id = 0;

    paragraphs.forEach((pText, pIndex) => {
      if (!pText.trim()) return;
      const pWords = pText.trim().split(/\s+/).map((word) => {
        const clean = normalizeWord(word);
        const item = {
          id: id++,
          word,
          cleanWord: clean,
          paragraphIndex: pIndex
        };
        return item;
      });
      words.push(...pWords);
    });
    return words;
  }, [script]);

  // Video element binding for Camera Preview
  useEffect(() => {
    if (videoPreviewRef.current && cameraService) {
      cameraService.setVideoElement(videoPreviewRef.current);
      if (settings.cameraEnabled) {
        cameraService.startPreview();
      }
    }
    return () => {
      if (cameraService) cameraService.stopPreview();
    };
  }, [cameraService, settings.cameraEnabled]);

  // Alignment calculation
  const alignViewportToIndex = useCallback((index, immediate = false) => {
    if (!viewportRef.current) return;
    const viewport = viewportRef.current;
    const tokenEl = viewport.querySelector(`[data-token-id="${index}"]`);
    if (!tokenEl) return;

    const tokenRect = tokenEl.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const offsetInView = tokenRect.top - viewportRect.top;
    const desiredOffset = viewport.clientHeight * 0.35; // cue anchor at 35% height
    const target = Math.max(0, viewport.scrollTop + (offsetInView - desiredOffset));

    if (immediate) {
      scrollAnimRef.current.targetScrollTop = target;
      scrollAnimRef.current.currentScrollTop = target;
      viewport.scrollTop = target;
    } else {
      scrollAnimRef.current.targetScrollTop = target;
    }
  }, []);

  // Jump to specific token
  const handleTokenClick = (idx) => {
    setCurrentIndex(idx);
    alignViewportToIndex(idx, true);
  };

  // Reset Prompter to beginning
  const handleReset = () => {
    setCurrentIndex(0);
    alignViewportToIndex(0, true);
  };

  // Toggle playback
  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // Cumulative speech recognition alignment callback
  useEffect(() => {
    if (!speechEngine) return;

    speechEngine.onInterimTranscript = (text) => {
      setLiveTranscript(text);
      setShowTranscriptPill(true);
      if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current);
      transcriptTimerRef.current = setTimeout(() => setShowTranscriptPill(false), 2200);
    };

    speechEngine.onTokensMatched = (spokenTokens) => {
      if (!isPlaying || !tokens.length || currentIndex >= tokens.length - 1) return;
      if (!spokenTokens || !spokenTokens.length) return;

      const recentSpoken = spokenTokens.slice(-10);
      const SEARCH_WINDOW = 60;
      const searchStart = currentIndex;
      const searchEnd = Math.min(tokens.length - 1, searchStart + SEARCH_WINDOW);

      let bestScriptIdx = -1;

      for (let sIdx = recentSpoken.length - 1; sIdx >= 0; sIdx--) {
        const spokenWord = recentSpoken[sIdx];
        if (!spokenWord || spokenWord.length < 2) continue;

        for (let tIdx = searchStart; tIdx <= searchEnd; tIdx++) {
          if (!isWordMatch(spokenWord, tokens[tIdx].cleanWord)) continue;

          // Extend match forward
          let ext = 0;
          let sTest = sIdx + 1;
          let tTest = tIdx + 1;
          while (sTest < recentSpoken.length && tTest < tokens.length && ext < 8) {
            if (isWordMatch(recentSpoken[sTest], tokens[tTest].cleanWord)) {
              ext++;
              sTest++;
              tTest++;
            } else if (tTest + 1 < tokens.length && isWordMatch(recentSpoken[sTest], tokens[tTest + 1].cleanWord)) {
              ext++;
              sTest++;
              tTest += 2;
            } else break;
          }

          const scriptEndIdx = tIdx + ext;
          if (scriptEndIdx > bestScriptIdx) {
            bestScriptIdx = scriptEndIdx;
          }
          break;
        }
        if (bestScriptIdx >= 0) break;
      }

      if (bestScriptIdx >= 0 && bestScriptIdx >= currentIndex) {
        const newIdx = Math.min(tokens.length - 1, bestScriptIdx + 1);
        if (newIdx > currentIndex) {
          setCurrentIndex(newIdx);
          alignViewportToIndex(newIdx, false);
        }
      }
    };
  }, [speechEngine, isPlaying, tokens, currentIndex, alignViewportToIndex]);

  // Main Smooth Lerp & Auto-scroll RAF Loop
  useEffect(() => {
    let active = true;
    scrollAnimRef.current.lastFrameTime = performance.now();

    const loop = () => {
      if (!active) return;
      const now = performance.now();
      const delta = (now - scrollAnimRef.current.lastFrameTime) / 1000;
      scrollAnimRef.current.lastFrameTime = now;

      const viewport = viewportRef.current;
      if (viewport && isPlaying) {
        const vadSpeaking = isSpeaking;

        // In 'auto' mode: constant scroll
        // In 'hybrid' or 'speech' mode: scroll smoothly while speaking, pause when silent
        const shouldAdvance = settings.mode === 'auto' || (vadSpeaking && settings.mode !== 'manual');

        if (shouldAdvance) {
          const pixPerSec = settings.scrollSpeedWpm * 1.8;
          const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
          if (scrollAnimRef.current.targetScrollTop < maxScroll) {
            scrollAnimRef.current.targetScrollTop = Math.min(
              maxScroll,
              scrollAnimRef.current.targetScrollTop + pixPerSec * delta
            );

            // Advance current word based on vertical position
            const cueY = viewport.clientHeight * 0.35;
            const vTop = viewport.getBoundingClientRect().top;
            if (currentIndex < tokens.length - 1) {
              const nextEl = viewport.querySelector(`[data-token-id="${currentIndex + 1}"]`);
              if (nextEl && nextEl.getBoundingClientRect().top - vTop <= cueY + 20) {
                setCurrentIndex(prev => Math.min(tokens.length - 1, prev + 1));
              }
            }
          }
        }
      }

      // Smooth Lerp toward targetScrollTop
      if (viewport && !scrollAnimRef.current.isUserTouching) {
        const diff = scrollAnimRef.current.targetScrollTop - scrollAnimRef.current.currentScrollTop;
        if (Math.abs(diff) > 0.1) {
          scrollAnimRef.current.currentScrollTop += Math.sign(diff) * Math.max(0.4, Math.abs(diff) * 0.15);
          if (Math.abs(scrollAnimRef.current.targetScrollTop - scrollAnimRef.current.currentScrollTop) < 0.5) {
            scrollAnimRef.current.currentScrollTop = scrollAnimRef.current.targetScrollTop;
          }
          viewport.scrollTop = Math.round(scrollAnimRef.current.currentScrollTop);
        }
      }

      scrollAnimRef.current.rafId = requestAnimationFrame(loop);
    };

    scrollAnimRef.current.rafId = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (scrollAnimRef.current.rafId) {
        cancelAnimationFrame(scrollAnimRef.current.rafId);
      }
    };
  }, [isPlaying, isSpeaking, settings.mode, settings.scrollSpeedWpm, currentIndex, tokens.length]);

  // Touch and manual wheel scroll event binding
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onTouchStart = () => { scrollAnimRef.current.isUserTouching = true; };
    const onTouchEnd = () => { scrollAnimRef.current.isUserTouching = false; };
    const onScroll = () => {
      if (scrollAnimRef.current.isUserTouching) {
        scrollAnimRef.current.currentScrollTop = vp.scrollTop;
        scrollAnimRef.current.targetScrollTop = vp.scrollTop;
      }
    };

    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    vp.addEventListener('mousedown', onTouchStart, { passive: true });
    window.addEventListener('mouseup', onTouchEnd, { passive: true });
    vp.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchend', onTouchEnd);
      vp.removeEventListener('mousedown', onTouchStart);
      window.removeEventListener('mouseup', onTouchEnd);
      vp.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        onUpdateSettings({ scrollSpeedWpm: Math.min(300, settings.scrollSpeedWpm + 10) });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        onUpdateSettings({ scrollSpeedWpm: Math.max(60, settings.scrollSpeedWpm - 10) });
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onUpdateSettings({ mirrorHorizontal: !settings.mirrorHorizontal });
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (isRecording) onStopRecording();
        else onStartRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, isRecording, onUpdateSettings, onStartRecording, onStopRecording, isPlaying]);

  const mirrorClass = settings.mirrorHorizontal && settings.mirrorVertical
    ? 'mirror-both'
    : settings.mirrorHorizontal
    ? 'mirror-horizontal'
    : settings.mirrorVertical
    ? 'mirror-vertical'
    : '';

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', overflow: 'hidden', backgroundColor: 'var(--bg-studio-950)' }}>
      {/* BACKGROUND CAMERA PREVIEW */}
      {settings.cameraEnabled && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          opacity: settings.cameraOpacity / 100,
          overflow: 'hidden'
        }}>
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // Mirror camera preview by default
            }}
          />
          {/* Studio overlay gradient mask */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(5, 7, 10, ${settings.shroudOpacity / 100})`
          }} />
        </div>
      )}

      {/* FLOATING CUE FOCUS GUIDE */}
      <div
        className="cue-focus-bar"
        style={{
          top: '35%',
          transform: 'translateY(-50%)',
          color: settings.cueColor
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(5,7,10,0.85)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${settings.cueColor}` }}>
          <Eye size={12} />
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>EYE-LINE</span>
        </div>
        <div
          className="cue-focus-line"
          style={{
            backgroundColor: settings.cueColor,
            boxShadow: `0 0 12px ${settings.cueColor}`
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(5,7,10,0.85)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${settings.cueColor}` }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {tokens.length ? `${Math.round((currentIndex / tokens.length) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* FLOATING LIVE SPEECH RECOGNITION HUD PILL */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        transition: 'opacity 0.25s ease',
        opacity: showTranscriptPill ? 1 : 0,
        pointerEvents: 'none'
      }}>
        <div className="glass-pill" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
        }}>
          <Volume2 size={14} color="#38bdf8" />
          <span style={{ fontSize: '12px', color: '#e0f2fe', fontWeight: 500, maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            "{liveTranscript}"
          </span>
        </div>
      </div>

      {/* PROMPTER SCROLL VIEWPORT */}
      <div
        ref={viewportRef}
        className={`prompter-viewport ${mirrorClass}`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          overflowY: 'auto',
          padding: '0 10vw',
          textAlign: settings.textAlign,
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          color: settings.textColor
        }}
      >
        <div style={{
          paddingTop: '35vh',
          paddingBottom: '55vh',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {!tokens.length ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '18px' }}>
              Script is empty. Select or create a script in the Dashboard.
            </div>
          ) : (
            <div>
              {tokens.map((t, idx) => {
                const isPassed = idx < currentIndex;
                const isActive = idx === currentIndex;
                let statusClass = 'prompter-token-upcoming';
                if (isPassed) statusClass = 'prompter-token-spoken';
                if (isActive) statusClass = 'prompter-token-active';

                return (
                  <span
                    key={t.id}
                    data-token-id={t.id}
                    className={`prompter-token ${statusClass}`}
                    onClick={() => handleTokenClick(t.id)}
                    style={{
                      color: isActive ? settings.cueColor : isPassed ? '#64748b' : settings.textColor,
                      background: isActive ? `${settings.cueColor}28` : 'transparent',
                      boxShadow: isActive ? `0 0 16px ${settings.cueColor}55` : 'none'
                    }}
                  >
                    {t.word}{' '}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING STUDIO BOTTOM CONTROLLER PILL */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '20px',
        backgroundColor: 'rgba(10, 14, 23, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Play / Pause Toggle */}
        <button
          onClick={handleTogglePlay}
          className="btn-primary"
          style={{ width: '42px', height: '42px', borderRadius: '12px', padding: 0, justifyContent: 'center' }}
          title={isPlaying ? "Pause Prompter (Space)" : "Start Prompter (Space)"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="btn-secondary"
          style={{ width: '42px', height: '42px', borderRadius: '12px', padding: 0, justifyContent: 'center' }}
          title="Restart to top (Esc)"
        >
          <RotateCcw size={16} />
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-studio)', margin: '0 4px' }} />

        {/* Mode Selector */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '3px' }}>
          <button
            onClick={() => onUpdateSettings({ mode: 'hybrid' })}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: settings.mode === 'hybrid' ? 'var(--brand-500)' : 'transparent',
              color: settings.mode === 'hybrid' ? '#fff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Speech Sync + VAD Gating"
          >
            Voice Sync
          </button>
          <button
            onClick={() => onUpdateSettings({ mode: 'auto' })}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: settings.mode === 'auto' ? 'var(--brand-500)' : 'transparent',
              color: settings.mode === 'auto' ? '#fff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Continuous Auto Scroll"
          >
            Auto
          </button>
          <button
            onClick={() => onUpdateSettings({ mode: 'manual' })}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: settings.mode === 'manual' ? 'var(--brand-500)' : 'transparent',
              color: settings.mode === 'manual' ? '#fff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Manual scroll only"
          >
            Manual
          </button>
        </div>

        {/* Speed WPM Adjuster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
          <Gauge size={14} color="#818cf8" />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: '55px' }}>
            {settings.scrollSpeedWpm} WPM
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <button
              onClick={() => onUpdateSettings({ scrollSpeedWpm: Math.min(320, settings.scrollSpeedWpm + 10) })}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={() => onUpdateSettings({ scrollSpeedWpm: Math.max(50, settings.scrollSpeedWpm - 10) })}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-studio)', margin: '0 4px' }} />

        {/* Camera Overlay Toggle */}
        <button
          onClick={() => onUpdateSettings({ cameraEnabled: !settings.cameraEnabled })}
          className="btn-secondary"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            padding: 0,
            justifyContent: 'center',
            color: settings.cameraEnabled ? '#38bdf8' : '#94a3b8',
            borderColor: settings.cameraEnabled ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-studio)'
          }}
          title={settings.cameraEnabled ? "Disable Camera Background" : "Enable Camera Background"}
        >
          {settings.cameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
        </button>

        {/* Mirror Horizontal Toggle */}
        <button
          onClick={() => onUpdateSettings({ mirrorHorizontal: !settings.mirrorHorizontal })}
          className="btn-secondary"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            padding: 0,
            justifyContent: 'center',
            color: settings.mirrorHorizontal ? '#a855f7' : '#94a3b8',
            borderColor: settings.mirrorHorizontal ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-studio)'
          }}
          title="Mirror Prompter Display (M)"
        >
          <FlipHorizontal size={16} />
        </button>

        {/* Record Take Button */}
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          className={isRecording ? "btn-danger" : "btn-secondary"}
          style={{
            borderRadius: '12px',
            padding: '8px 14px',
            height: '42px'
          }}
          title={isRecording ? "Stop Recording (R)" : "Record Studio Take (R)"}
        >
          {isRecording ? <Square size={15} /> : <Video size={15} color="#ef4444" />}
          <span style={{ fontSize: '12px' }}>{isRecording ? "Stop Take" : "Record"}</span>
        </button>
      </div>
    </div>
  );
}
