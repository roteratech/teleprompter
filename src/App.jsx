import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import StudioPrompter from './components/StudioPrompter';
import Dashboard from './components/Dashboard';
import TakesModal from './components/TakesModal';
import SettingsModal from './components/SettingsModal';
import ScriptEditorModal from './components/ScriptEditorModal';
import ShortcutModal from './components/ShortcutModal';
import { AudioVADEngine } from './services/vadEngine';
import { SpeechEngine } from './services/speechEngine';
import { CameraRecordingService } from './services/cameraService';
import { ShieldAlert } from 'lucide-react';

const DEFAULT_SCRIPTS = [
  {
    id: 'script-1',
    title: 'Studio Broadcast Keynote Announcement',
    content: `Good evening and welcome to tonight's live broadcast.
We are presenting a groundbreaking innovation in teleprompter engineering.
Notice how the script stays perfectly anchored as you pause to take a breath.
When you proceed to the next paragraph, the text smoothly scrolls forward into your focal eye line.
This eliminates frantic pacing, unnatural reading cadences, and memorization anxiety.
Thank you for joining our keynote demonstration today.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'script-2',
    title: 'Product Review & Tech Deep-Dive',
    content: `Hello creators! Today we are testing high-framerate camera recording paired with voice-guided cues.
The built-in microphone listener continuously separates spoken speech from room resonance.
Whether you glance away or skip a word, the intelligent matching algorithm recovers your position seamlessly.
Make sure to subscribe, leave a comment below, and enjoy crystal-clear reading on camera.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'script-3',
    title: 'Azərbaycan / Canlı Yayım Təqdimatı',
    content: `Hörmətli tamaşaçılar, axşamınız xeyir olsun və bugünkü canlı təqdimatımıza xoş gəlmisiniz.
Biz nitq sinxronizasiyalı süni intellekt əsaslı professional teleprompter sistemini istifadə edirik.
Siz danışdıqca mətn avtomatik olaraq nitqinizə uyğun şəkildə irəliləyir və dəqiq oxumağa imkan yaradır.
Nəfəs aldığınız və ya dayandığınız an mətn hərəkətsiz qalır, davam etdiyinizdə isə rahat axır.
Uğurlu çəkilişlər arzulayırıq!`,
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  const [route, setRoute] = useState('studio'); // 'studio' | 'dashboard' | 'takes'
  const [scripts, setScripts] = useState(() => {
    try {
      const saved = localStorage.getItem('telesync.scripts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SCRIPTS;
  });

  const [activeScriptId, setActiveScriptId] = useState(() => {
    try {
      const savedId = localStorage.getItem('telesync.activeScriptId');
      if (savedId) return savedId;
    } catch (e) {}
    return DEFAULT_SCRIPTS[0].id;
  });

  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      scrollSpeedWpm: 140,
      vadThreshold: 18,
      speechLanguage: 'tr-TR',
      fontSize: 48,
      fontFamily: 'Inter, sans-serif',
      lineHeight: '1.7',
      textAlign: 'left',
      textColor: '#ffffff',
      cueColor: '#38bdf8',
      cameraEnabled: true,
      cameraOpacity: 65,
      shroudOpacity: 80,
      mirrorHorizontal: false,
      mirrorVertical: false,
      mode: 'hybrid' // 'speech' | 'auto' | 'manual' | 'hybrid'
    };

    try {
      const saved = localStorage.getItem('telesync.settings');
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
      // Autodetect browser language on first load
      const browserLang = (navigator.language || '').toLowerCase();
      if (browserLang.startsWith('az')) defaultSettings.speechLanguage = 'az-AZ';
      else if (browserLang.startsWith('tr')) defaultSettings.speechLanguage = 'tr-TR';
    } catch (e) {}
    return defaultSettings;
  });

  // Takes state
  const [takes, setTakes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingScript, setEditingScript] = useState(undefined); // undefined: closed, null: new, obj: edit
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHttpsWarning, setShowHttpsWarning] = useState(false);

  // VAD & Speech Telemetry
  const [audioRms, setAudioRms] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [vadActive, setVadActive] = useState(true);

  // Singletons for services initialized synchronously so children always receive valid instances
  const vadEngineRef = useRef(null);
  if (!vadEngineRef.current) {
    vadEngineRef.current = new AudioVADEngine();
  }
  const speechEngineRef = useRef(null);
  if (!speechEngineRef.current) {
    speechEngineRef.current = new SpeechEngine(settings.speechLanguage);
  }
  const cameraServiceRef = useRef(null);
  if (!cameraServiceRef.current) {
    cameraServiceRef.current = new CameraRecordingService();
  }

  const vad = vadEngineRef.current;
  const speech = speechEngineRef.current;
  const camera = cameraServiceRef.current;

  // Initialize Audio & Speech Services
  useEffect(() => {
    vad.setThreshold(settings.vadThreshold);
    camera.onTimerUpdate = (sec) => setRecordingTime(sec);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Start Audio and Speech
    vad.subscribe((data) => {
      setAudioRms(data.rms);
      setIsSpeaking(data.isSpeaking);
      setIsCalibrating(data.calibrating);
    });

    speech.onSpeechActivity = (speaking) => {
      if (isMobile) {
        setIsSpeaking(speaking);
        setAudioRms(speaking ? 0.45 : 0);
      }
    };

    const startAudioServices = async () => {
      // 1. Always prioritize SpeechRecognition directly
      speech.initialize();
      speech.start();
      setVadActive(true);

      // 2. On desktop, start AudioVADEngine for RMS meter.
      // On Android mobile, do not open concurrent getUserMedia to prevent Android mic locking.
      if (!isMobile) {
        try {
          const ok = await vad.start();
          if (!ok) setVadActive(true);
        } catch (e) {}
      }
    };

    // User gesture listener for Android/iOS mobile browsers
    const onUserGesture = () => {
      if (!speech.isRecognizing) {
        startAudioServices();
      }
    };

    window.addEventListener('touchstart', onUserGesture, { passive: true });
    window.addEventListener('click', onUserGesture, { passive: true });

    // Attempt direct startup (works on desktop if permission granted)
    startAudioServices();

    // Check secure context for mobile devices
    const isSecure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) setShowHttpsWarning(true);

    return () => {
      window.removeEventListener('touchstart', onUserGesture);
      window.removeEventListener('click', onUserGesture);
      vad.stop();
      speech.stop();
      camera.stopPreview();
    };
  }, []);

  // Update VAD threshold when settings change
  useEffect(() => {
    vad.setThreshold(settings.vadThreshold);
  }, [settings.vadThreshold]);

  // Update speech language when settings change
  useEffect(() => {
    speech.setLanguage(settings.speechLanguage);
  }, [settings.speechLanguage]);

  // Save scripts & settings to LocalStorage
  useEffect(() => {
    localStorage.setItem('telesync.scripts', JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    localStorage.setItem('telesync.activeScriptId', activeScriptId);
  }, [activeScriptId]);

  useEffect(() => {
    localStorage.setItem('telesync.settings', JSON.stringify(settings));
  }, [settings]);

  const activeScript = useMemo(() => {
    return scripts.find(s => s.id === activeScriptId) || scripts[0] || null;
  }, [scripts, activeScriptId]);

  const handleUpdateSettings = (newPartial) => {
    setSettings(prev => ({ ...prev, ...newPartial }));
  };

  const handleStartRecording = async () => {
    if (!cameraServiceRef.current) return;
    const ok = await cameraServiceRef.current.startRecording();
    if (ok) {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const handleStopRecording = async () => {
    if (!cameraServiceRef.current) return;
    const blob = await cameraServiceRef.current.stopRecording();
    setIsRecording(false);

    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const newTake = {
        id: Date.now().toString(),
        title: activeScript ? `${activeScript.title} - Take` : 'Studio Take',
        blobUrl,
        duration: recordingTime,
        createdAt: new Date().toISOString()
      };
      setTakes(prev => [newTake, ...prev]);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
      } catch (e) {}

      // Switch to takes review
      setRoute('takes');
    }
  };

  const handleDeleteTake = (id) => {
    setTakes(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveScript = (scriptData) => {
    setScripts(prev => {
      const idx = prev.findIndex(s => s.id === scriptData.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = scriptData;
        return copy;
      }
      return [scriptData, ...prev];
    });
    setActiveScriptId(scriptData.id);
  };

  const handleDeleteScript = (id) => {
    setScripts(prev => prev.filter(s => s.id !== id));
    if (activeScriptId === id) {
      const remaining = scripts.filter(s => s.id !== id);
      if (remaining.length) setActiveScriptId(remaining[0].id);
    }
  };

  const handleDuplicateScript = (script) => {
    const dup = {
      ...script,
      id: `script-${Date.now()}`,
      title: `${script.title} (Copy)`,
      updatedAt: new Date().toISOString()
    };
    setScripts(prev => [dup, ...prev]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* HTTPS Security Warning for mobile microphone access */}
      {showHttpsWarning && (
        <div style={{
          backgroundColor: '#d97706',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 60
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} />
            <span>
              <strong>HTTPS Tələb Olunur:</strong> Sayt <code>http://</code> üzərindədir. Mobil telefonlarda (Android/iOS) nitq tanıma və mikrofon icazəsi <strong>yalnız HTTPS (SSL)</strong> olduqda işləyir.
            </span>
          </div>
          <button
            onClick={() => setShowHttpsWarning(false)}
            style={{ background: '#b45309', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
          >
            Bağla
          </button>
        </div>
      )}

      {/* Main Studio Header */}
      <Header
        route={route}
        setRoute={setRoute}
        isRecording={isRecording}
        recordingTime={recordingTime}
        audioRms={audioRms}
        isSpeaking={isSpeaking}
        vadThreshold={settings.vadThreshold}
        isCalibrating={isCalibrating}
        vadActive={vadActive}
        takesCount={takes.length}
        onOpenSettings={() => setShowSettings(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      {/* Main Views */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {route === 'studio' && (
          <StudioPrompter
            script={activeScript}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            audioRms={audioRms}
            isSpeaking={isSpeaking}
            vadActive={vadActive}
            speechEngine={speech}
            cameraService={camera}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {route === 'dashboard' && (
          <Dashboard
            scripts={scripts}
            activeScriptId={activeScriptId}
            onSelectScript={(id) => setActiveScriptId(id)}
            onCreateScript={(data) => {
              const newS = {
                id: `script-${Date.now()}`,
                title: data.title || 'Untitled Script',
                content: data.content || '',
                updatedAt: new Date().toISOString()
              };
              handleSaveScript(newS);
            }}
            onEditScript={(scriptObj) => setEditingScript(scriptObj)}
            onDeleteScript={handleDeleteScript}
            onDuplicateScript={handleDuplicateScript}
            onOpenStudio={() => setRoute('studio')}
          />
        )}

        {route === 'takes' && (
          <TakesModal
            takes={takes}
            onDeleteTake={handleDeleteTake}
            onClose={() => setRoute('studio')}
          />
        )}
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showShortcuts && (
        <ShortcutModal
          onClose={() => setShowShortcuts(false)}
        />
      )}

      {editingScript !== undefined && (
        <ScriptEditorModal
          script={editingScript}
          onSave={handleSaveScript}
          onClose={() => setEditingScript(undefined)}
        />
      )}
    </div>
  );
}
