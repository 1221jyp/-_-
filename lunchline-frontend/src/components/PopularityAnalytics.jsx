import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Flame, Clock, Star, TrendingUp, Filter, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { fetchPopularityAnalytics, POPULARITY_ANALYTICS_DATA } from '../services/api';

export default function PopularityAnalytics() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('avgWaitPeople'); // avgWaitPeople | satisfactionScore | maxWaitMinutes
  const [analyticsData, setAnalyticsData] = useState(POPULARITY_ANALYTICS_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPopularityAnalytics().then((res) => {
      if (mounted && res) {
        setAnalyticsData(res);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const data = analyticsData;

  // Filter & Sort rankings
  const filteredRankings = (data.popularRankings || [])
    .filter(item => selectedCategory === '전체' || item.category === selectedCategory)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  // Chart data formatting
  const chartData = (data.popularRankings || []).map(item => ({
    name: item.menuName.split(' ')[0], // Short title for x-axis
    fullName: item.menuName,
    대기인원: item.avgWaitPeople,
    대기시간: item.maxWaitMinutes,
    만족도: item.satisfactionScore * 20
  }));

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '12px' }} />
        <p>백엔드 인기 메뉴 분석 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(15, 23, 42, 0.8) 100%)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-primary">대기줄 측정 30일 빅데이터 분석</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.measuredPeriod}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
              🔥 대기줄 연동 인기 메뉴 빅데이터 랭킹
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '700px' }}>
              급식실 센서/GET 요청으로 수집된 대기시간 측정치와 급식표를 자동 대조하여 
              학생들에게 가장 큰 반응과 길은 대기줄을 기록한 인기 메뉴를 분석했습니다.
            </p>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>총 대기줄 분석 데이터</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{data.totalDataPoints.toLocaleString()}건</div>
          </div>
        </div>
      </div>

      {/* Analytics Visual Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px'
      }}>
        {/* Chart 1: Menu Wait People Comparison Bar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#6366f1" />
            메뉴별 평균 대기 인원 (명)
          </h3>
          
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value, name) => [`${value}명`, '평균 대기 인원']}
                />
                <Bar dataKey="대기인원" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Queue Peak Trend Area Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#06b6d4" />
            점심시간 시간대별 대기인원 피크 추이
          </h3>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`${value}명`, '평균 대기인원']}
                />
                <Area type="monotone" dataKey="avgPeople" stroke="#06b6d4" fill="url(#areaGradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>카테고리:</span>
          {['전체', '한식', '양식', '중식'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>정렬 기준:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(256,256,256,0.05)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              padding: '6px 12px',
              fontSize: '0.85rem'
            }}
          >
            <option value="avgWaitPeople" style={{ background: '#0f172a' }}>평균 대기인원순</option>
            <option value="maxWaitMinutes" style={{ background: '#0f172a' }}>최장 대기시간순</option>
            <option value="satisfactionScore" style={{ background: '#0f172a' }}>학생 만족도순</option>
          </select>
        </div>
      </div>

      {/* Popular Ranking Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredRankings.map((item) => (
          <div
            key={item.rank}
            className="glass-card glass-card-interactive"
            style={{
              padding: '20px 24px',
              display: 'grid',
              gridTemplateColumns: '60px 2fr 1fr 1fr 120px',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            {/* Rank Badge */}
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: item.rank === 1 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                          item.rank === 2 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                          item.rank === 3 ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' :
                          'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#fff'
            }}>
              #{item.rank}
            </div>

            {/* Menu Title & Badge */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{item.category}</span>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{item.badge}</span>
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                {item.menuName}
              </h4>
            </div>

            {/* Avg Wait People */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>평균 대기 인원</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={16} />
                {item.avgWaitPeople}명
              </div>
            </div>

            {/* Max Wait Time */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>최장 대기 시간</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                약 {item.maxWaitMinutes}분
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>만족도</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <Star size={16} fill="#facc15" />
                {item.satisfactionScore} / 5.0
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
