import React, { useState } from 'react';
import { X, Server, RefreshCw, CheckCircle2, AlertTriangle, Code, Play, Sparkles } from 'lucide-react';
import { saveConfig, getConfig } from '../services/api';

export default function ApiConfigModal({ onClose, onSave }) {
  const currentConfig = getConfig();

  const [backendUrl, setBackendUrl] = useState(currentConfig.backendUrl);
  const [pollingInterval, setPollingInterval] = useState(currentConfig.pollingInterval);
  const [demoMode, setDemoMode] = useState(currentConfig.demoMode);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(backendUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`서버 응답 상태 코드: ${res.status}`);
      }

      const json = await res.json();
      setTestResult({
        success: true,
        message: 'GET 요청에 성공하였습니다!',
        json
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `연결 실패: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveConfig({
      backendUrl,
      pollingInterval: parseInt(pollingInterval, 10),
      demoMode
    });
    onSave();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card" style={{ maxWidth: '640px', width: '100%', padding: '32px', background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              <Server size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>백엔드 서버 & GET API 연동 설정</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>외부 백엔드 개발자 API 연결 주소 및 폴링 환경을 설정합니다.</p>
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 10px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mode Switcher Toggle */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#f59e0b" />
                자체 시뮬레이션 모드 사용
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                백엔드 서버가 준비되지 않은 동안 가상의 대기줄 변동 데이터를 생성합니다.
              </p>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#6366f1' }}
              />
            </label>
          </div>

          {/* Backend GET API Endpoint URL */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              백엔드 GET 요청 API 엔드포인트 URL
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3000/api/queue/status"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
                disabled={demoMode}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={demoMode || testing}
                className="btn-outline-cyan"
                style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
              >
                {testing ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                GET 테스트
              </button>
            </div>
          </div>

          {/* Test Connection Output Box */}
          {testResult && (
            <div style={{
              background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: testResult.success ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {testResult.message}
              </div>
              {testResult.json && (
                <pre style={{
                  marginTop: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#a7f3d0',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(testResult.json, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Polling Interval Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                자동 GET 요청 주기 (Polling Interval)
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{pollingInterval}초 마다</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(e.target.value)}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>

          {/* Backend Spec Guide for API Developers */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>
              <Code size={16} />
              백엔드 개발자용 권장 JSON 응답 스펙
            </div>
            <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
{`// GET ${backendUrl || '/api/queue/status'}
{
  "status": "success",
  "data": {
    "currentCount": 45,            // 현재 대기 인원수
    "estimatedWaitMinutes": 12,    // 예상 대기시간 (분)
    "servingRatePerMin": 3.6,      // 분당 배식속도
    "congestionLevel": "CROWDED",  // LIGHT | NORMAL | CROWDED | VERY_CROWDED
    "timestamp": "${new Date().toISOString()}"
  }
}`}
            </pre>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" className="btn-primary">
              설정 저장
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
