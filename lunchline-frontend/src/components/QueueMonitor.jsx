import React from 'react';
import { Users, Clock, Flame, AlertCircle, RefreshCw, CheckCircle2, TrendingUp, Sparkles, UserCheck, Utensils, WifiOff } from 'lucide-react';

export default function QueueMonitor({ statusData, onRefresh, todayMenu }) {
  if (!statusData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '12px' }} />
        <p>실시간 대기줄 상태를 불러오는 중입니다...</p>
      </div>
    );
  }

  const { currentCount, estimatedWaitMinutes, servingRatePerMin, congestionLevel, timestamp, counterStatuses, isStale, staleMinutes } = statusData;


  // Congestion Level Helpers
  const getCongestionMeta = (level) => {
    switch (level) {
      case 'LIGHT':
        return {
          title: '여유로움',
          badgeClass: 'badge-success',
          color: '#10b981',
          bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
          desc: '줄이 매우 짧습니다! 지금 급식실로 출발하면 바로 식사 가능합니다.',
          recommendation: '🟢 지금 즉시 식사 추천'
        };
      case 'NORMAL':
        return {
          title: '보통 (원활)',
          badgeClass: 'badge-primary',
          color: '#6366f1',
          bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)',
          desc: '적당한 대기 인원이 있습니다. 5~8분 이내에 식사를 받으실 수 있습니다.',
          recommendation: '🔵 식사하기 적절한 타임'
        };
      case 'CROWDED':
        return {
          title: '혼잡함',
          badgeClass: 'badge-warning',
          color: '#f59e0b',
          bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
          desc: '대기줄이 다소 깁니다. 약 10~15분 가량 줄을 서야 할 수 있습니다.',
          recommendation: '🟡 10분 후 방문 권장'
        };
      case 'VERY_CROWDED':
      default:
        return {
          title: '매우 혼잡 (피크 타임)',
          badgeClass: 'badge-danger',
          color: '#ef4444',
          bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.08) 100%)',
          desc: '현재 최대 피크 타임입니다! 대기시간이 길어 15분 이후 방문을 강력 추천합니다.',
          recommendation: '🔴 15~20분 후 방문 권장'
        };
    }
  };

  const meta = getCongestionMeta(congestionLevel);
  const formattedTime = new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Generate visual avatar icons representing waiting students
  const displayAvatarsCount = Math.min(24, Math.max(3, Math.round(currentCount / 3)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ESP32 Camera Disconnected / Stale Data Alert Banner */}
      {isStale && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.6)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#fca5a5'
        }}>
          <WifiOff size={28} color="#ef4444" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ ESP32 센서 연결 끊김 경고
              <span className="badge badge-danger">연결 끊김 / Stale Data</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '4px', color: '#fca5a5', lineHeight: 1.4 }}>
              마지막으로 대기 인원 정보가 수집된 시각({formattedTime})으로부터 <strong>{staleMinutes > 0 ? `${staleMinutes}분 이상` : '일정 시간'}</strong>이 지났습니다.
              ESP32 카메라 수집 장치 또는 백엔드 연결 상태를 확인해주세요.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner: Today's Menu Highlight & Queue Alert */}
      {todayMenu && (
        <div className="glass-card" style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>🍱</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>TODAY MENU</span>
                <span className="badge badge-primary">{todayMenu.dayName}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                {todayMenu.mainMenu}
              </h3>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {todayMenu.tags?.map((t, idx) => (
              <span key={idx} className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Estimated Wait Time */}
        <div className="glass-card" style={{ padding: '24px', background: meta.bgGradient, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} color={meta.color} />
              예상 대기 시간
            </span>
            <span className={`badge ${meta.badgeClass}`}>{meta.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '16px 0 8px 0' }}>
            <span style={{ fontSize: '3.6rem', fontWeight: 800, lineHeight: 1, color: '#ffffff' }}>
              {estimatedWaitMinutes}
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: meta.color }}>분</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {meta.desc}
          </p>
        </div>

        {/* Card 2: Current Queue Count */}
        <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} color="#06b6d4" />
              현재 대기 인원
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="animate-live-dot"></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedTime} 기준</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '16px 0 8px 0' }}>
            <span style={{ fontSize: '3.6rem', fontWeight: 800, lineHeight: 1, color: '#ffffff' }}>
              {currentCount}
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#06b6d4' }}>명</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={14} color="#10b981" />
            <span>배식 속도: 약 <strong>{servingRatePerMin}명 / 분</strong></span>
          </div>
        </div>

        {/* Card 3: Action Recommendation */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
              <Sparkles size={18} color="#8b5cf6" />
              스마트 방문 가이드
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              {meta.recommendation}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              급식실 도착 후 수저 구비부터 식판 수령까지 포함된 실시간 추정값입니다.
            </p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>동기화 상태</span>
            <button onClick={onRefresh} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <RefreshCw size={13} />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Visual Queue Line representation (Interactive Graphic) */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#6366f1" />
              실시간 대기 줄 비주얼라이저
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              배식대부터 식당 입구까지의 대기줄 현황 (아바타 1개당 약 3~4명 표상)
            </p>
          </div>

          {/* Congestion Gauge Meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>혼잡도 게이지:</span>
            <div style={{ width: '120px', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (currentCount / 80) * 100)}%`,
                height: '100%',
                background: meta.color,
                transition: 'all 0.5s ease',
                boxShadow: `0 0 10px ${meta.color}`
              }} />
            </div>
          </div>
        </div>

        {/* Visualizer Track */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          position: 'relative'
        }}>
          {/* Serving Counter Target Zone */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-md)',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Utensils size={15} />
                배식구 (식판 수령)
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← 수저 & 식판 배식 진행 중</span>
            </div>

            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              정상 가동 중
            </span>
          </div>

          {/* Avatar Queue Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            overflowX: 'auto',
            padding: '12px 4px',
            scrollBehavior: 'smooth'
          }}>
            {Array.from({ length: displayAvatarsCount }).map((_, idx) => {
              const delay = (idx * 0.15).toFixed(2);
              const isFront = idx < 2;
              return (
                <div
                  key={idx}
                  className="animate-avatar"
                  style={{
                    animationDelay: `${delay}s`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '42px',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isFront 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isFront ? '0 0 12px rgba(16, 185, 129, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    {isFront ? (
                      <UserCheck size={18} color="#ffffff" />
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>#{idx + 1}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>
                    {isFront ? '배식중' : `${(idx + 1) * 3}번`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Counter Status Breakdown */}
        {counterStatuses && counterStatuses.length > 0 && (
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {counterStatuses.map((counter) => (
              <div key={counter.id} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{counter.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>대기: 약 {counter.waitCount}명</div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>운영중</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
