import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import QueueMonitor from './components/QueueMonitor';
import MenuCalendar from './components/MenuCalendar';
import PopularityAnalytics from './components/PopularityAnalytics';
import ApiConfigModal from './components/ApiConfigModal';
import { fetchQueueStatus, getWeeklyMenu, saveWeeklyMenu, getConfig } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'menu' | 'analytics'
  const [statusData, setStatusData] = useState(null);
  const [connectionOk, setConnectionOk] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDemo, setIsDemo] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Weekly Menu state
  const [weeklyMenu, setWeeklyMenu] = useState(() => getWeeklyMenu());

  // Polling data fetcher
  const loadQueueStatus = useCallback(async () => {
    const res = await fetchQueueStatus();
    if (res.success) {
      setStatusData(res.data);
      setIsDemo(res.isDemo);
      setConnectionOk(true);
      setErrorMessage(null);
    } else {
      setConnectionOk(false);
      setIsDemo(false);
      setErrorMessage(res.error);
      if (res.fallbackData && !statusData) {
        setStatusData(res.fallbackData);
      }
    }
  }, [statusData]);

  // Handle Polling interval loop
  useEffect(() => {
    loadQueueStatus();
    const config = getConfig();
    const intervalMs = Math.max(1, config.pollingInterval) * 1000;

    const timer = setInterval(() => {
      loadQueueStatus();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [loadQueueStatus, showConfigModal]);

  // Handle Menu Updates
  const handleUpdateMenu = (newMenuList) => {
    setWeeklyMenu(newMenuList);
    saveWeeklyMenu(newMenuList);
  };

  const todayMenu = weeklyMenu.find(m => m.dayName.includes('오늘')) || weeklyMenu[3];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setShowConfigModal(true)}
        isDemo={isDemo}
        connectionOk={connectionOk}
        lastUpdate={statusData?.timestamp}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        flex: 1
      }}>

        {/* Error notification banner if backend GET fails */}
        {!connectionOk && errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#f87171',
            fontSize: '0.875rem'
          }}>
            <div>
              <strong>⚠️ 백엔드 API 연결 오류:</strong> {errorMessage}
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              설정 변경
            </button>
          </div>
        )}

        {/* Tab 1: Real-time Queue Monitor */}
        {activeTab === 'queue' && (
          <QueueMonitor
            statusData={statusData}
            onRefresh={loadQueueStatus}
            todayMenu={todayMenu}
          />
        )}

        {/* Tab 2: Weekly Menu Calendar */}
        {activeTab === 'menu' && (
          <MenuCalendar
            menuList={weeklyMenu}
            onUpdateMenu={handleUpdateMenu}
          />
        )}

        {/* Tab 3: Popularity Analytics */}
        {activeTab === 'analytics' && (
          <PopularityAnalytics />
        )}

      </main>

      {/* Settings Modal */}
      {showConfigModal && (
        <ApiConfigModal
          onClose={() => setShowConfigModal(false)}
          onSave={loadQueueStatus}
        />
      )}

      {/* Modern Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-card)',
        background: 'rgba(9, 13, 22, 0.9)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '0.825rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            🍱 <strong>급식통통</strong> — React 실시간 대기줄 & 인기 메뉴 빅데이터 분석 시스템
          </div>
          <div>
            백엔드 REST GET API 규격 호환됨 • 개발자 문의 연동 지원
          </div>
        </div>
      </footer>

    </div>
  );
}
