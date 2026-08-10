import React from 'react';
import { Utensils, Activity, Calendar, BarChart3, Settings, Wifi, WifiOff, Sparkles } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenSettings, isDemo, connectionOk, lastUpdate, isStale }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-card)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
          }}>
            <Utensils size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
                급식통통
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                LIVE v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              실시간 급식실 대기줄 & 인기 메뉴 빅데이터 분석
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card)'
        }}>
          <button
            onClick={() => setActiveTab('queue')}
            className={activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              border: activeTab === 'queue' ? 'none' : 'transparent'
            }}
          >
            <Activity size={16} />
            실시간 대기줄
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              border: activeTab === 'menu' ? 'none' : 'transparent'
            }}
          >
            <Calendar size={16} />
            급식표
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              border: activeTab === 'analytics' ? 'none' : 'transparent'
            }}
          >
            <BarChart3 size={16} />
            인기 메뉴 분석
          </button>
        </nav>

        {/* Backend status & Settings button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isDemo ? (
            <div className="badge badge-warning" title="현재 시뮬레이션 모드로 작동 중입니다. 백엔드 연결 설정에서 변경 가능합니다.">
              <Sparkles size={13} />
              시뮬레이션 모드
            </div>
          ) : isStale ? (
            <div className="badge badge-danger" title="ESP32 수집 데이터 시각이 2분 이상 경과되었습니다 (연결 끊김).">
              <WifiOff size={13} />
              센서 연결 끊김
            </div>
          ) : connectionOk ? (
            <div className="badge badge-success" title="백엔드 REST API와 정상 연결되었습니다.">
              <Wifi size={13} />
              백엔드 GET 연결됨
            </div>
          ) : (
            <div className="badge badge-danger" title="백엔드 GET 요청 응답 오류">
              <WifiOff size={13} />
              GET 연결 오류
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            title="백엔드 API URL 및 연동 설정"
          >
            <Settings size={16} />
            <span style={{ display: 'none', minWidth: '600px' }}>서버 설정</span>
            서버 설정
          </button>
        </div>
      </div>
    </header>
  );
}
