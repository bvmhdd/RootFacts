import { useEffect, useRef, useState, useCallback } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG, isValidDetection } from './utils/config';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const lastDetectionTime = useRef(0);
  const [currentTone, setCurrentTone] = useState('normal');

  useEffect(() => {
    let isMounted = true;

    const initServices = async () => {
      try {
        const camera = new CameraService();
        const detector = new DetectionService();
        const generator = new RootFactsService();

        actions.setServices({ camera, detector, generator });

        actions.setModelStatus('Memuat Model Deteksi Sayuran (1/2)... 0%');
        await detector.loadModel((fraction) => {
          actions.setModelStatus(`Memuat Model Deteksi Sayuran (1/2)... ${Math.round(fraction * 100)}%`);
        });

        actions.setModelStatus('Memuat Model AI Fun Fact (2/2)...');
        
        let encoderText = '0%';
        let decoderText = '0%';

        await generator.loadModel((info) => {
          if (info.status === 'progress') {
            const formatProgress = (item) => {
              if (item.progress) return `${Math.round(item.progress)}%`;
              if (item.loaded) return `${(item.loaded / 1024 / 1024).toFixed(1)} MB`;
              return '...';
            };
            
            if (info.file.includes('encoder')) {
              encoderText = formatProgress(info);
            } else if (info.file.includes('decoder')) {
              decoderText = formatProgress(info);
            }
            actions.setModelStatus(`Mengunduh model AI... Encoder: ${encoderText} | Decoder: ${decoderText}`);
          } else if (info.status === 'ready') {
            actions.setModelStatus(`Memuat ${info.file}...`);
          } else if (info.status === 'initiate') {
            actions.setModelStatus(`Menginisialisasi ${info.file}...`);
          } else if (info.status === 'download') {
            actions.setModelStatus(`Mulai mengunduh ${info.file}...`);
          } else if (info.status === 'done') {
            actions.setModelStatus(`Selesai mengunduh ${info.file}`);
          }
        });

        if (isMounted) {
          actions.setModelStatus('Model AI Siap');
        }
      } catch (err) {
        console.error('Gagal inisialisasi:', err);
        if (isMounted) actions.setError('Gagal memuat model. Pastikan perangkat Anda mendukung WebGL/WebGPU atau memiliki RAM yang cukup.');
      }
    };

    initServices();

    return () => {
      isMounted = false;
      if (detectionCleanupRef.current) {
        cancelAnimationFrame(detectionCleanupRef.current);
      }
      if (state.services.camera) {
        state.services.camera.stopCamera();
      }
    };
  }, []);

  const detectLoop = useCallback(async () => {
    if (!isRunningRef.current || !state.services.detector || !state.services.camera) return;

    try {
      if (state.services.camera.isReady() && state.appState === 'idle') {
        const now = Date.now();
        if (now - lastDetectionTime.current >= APP_CONFIG.detectionRetryInterval) {
          const result = await state.services.detector.predict(state.services.camera.video);

          if (isValidDetection(result)) {
            lastDetectionTime.current = now;
            actions.setDetectionResult(result);
            actions.setAppState('result');

            setTimeout(async () => {
              if (!isRunningRef.current) return;
              try {
                const fact = await state.services.generator.generateFacts(result.label);
                actions.setFunFactData(fact);

                setTimeout(() => {
                  if (isRunningRef.current) {
                    actions.resetResults();
                    detectionCleanupRef.current = requestAnimationFrame(detectLoop);
                  }
                }, APP_CONFIG.factsGenerationDelay + 3000);

                return;
              } catch (err) {
                actions.setError(`Gagal menghasilkan fakta: ${  err.message}`);
                actions.setFunFactData('error');

                setTimeout(() => {
                  if (isRunningRef.current) {
                    actions.resetResults();
                    detectionCleanupRef.current = requestAnimationFrame(detectLoop);
                  }
                }, 3000);
              }
            }, APP_CONFIG.analyzingDelay);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error saat deteksi:', err);
    }

    detectionCleanupRef.current = requestAnimationFrame(detectLoop);
  }, [state.services, state.appState, actions]);

  const handleToggleCamera = async (cameraType) => {
    if (state.isRunning) {
      actions.setRunning(false);
      state.services.camera.stopCamera();
    } else {
      actions.setRunning(true);
      await state.services.camera.startCamera(cameraType);
    }
  };

  useEffect(() => {
    isRunningRef.current = state.isRunning;
    if (state.isRunning) {
      actions.resetResults();
      detectionCleanupRef.current = requestAnimationFrame(detectLoop);
    } else {
      if (detectionCleanupRef.current) {
        cancelAnimationFrame(detectionCleanupRef.current);
      }
      actions.resetResults();
    }
  }, [state.isRunning, detectLoop, actions]);

  const handleToneChange = (newTone) => {
    setCurrentTone(newTone);
    if (state.services.generator) {
      state.services.generator.setTone(newTone);
    }
  };

  const handleCopyFact = useCallback(() => {
    if (state.funFactData && state.funFactData !== 'error') {
      navigator.clipboard.writeText(state.funFactData)
        .then(() => {
          console.log('Fakta disalin ke clipboard!');
        })
        .catch((err) => {
          console.error('Gagal menyalin:', err);
          actions.setError('Gagal menyalin teks ke clipboard');
        });
    }
  }, [state.funFactData, actions]);

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
