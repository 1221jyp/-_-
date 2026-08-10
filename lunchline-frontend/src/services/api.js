/**
 * 급식실 대기줄 & 인기 메뉴 데이터 서비스
 */

// 로컬 스토리지 키
const API_URL_KEY = 'lunch_line_backend_url';
const POLLING_INTERVAL_KEY = 'lunch_line_polling_interval';
const DEMO_MODE_KEY = 'lunch_line_demo_mode';

// 기본 설정값 (실제 백엔드 연결 & 데모 모드 끎)
export const DEFAULT_CONFIG = {
  backendUrl: 'http://localhost:3000/api/queue/status',
  pollingInterval: 3, // 초 단위
  demoMode: false // 실제 백엔드 연동 모드
};

export const getConfig = () => {
  return {
    backendUrl: localStorage.getItem(API_URL_KEY) || DEFAULT_CONFIG.backendUrl,
    pollingInterval: parseInt(localStorage.getItem(POLLING_INTERVAL_KEY) || DEFAULT_CONFIG.pollingInterval, 10),
    demoMode: localStorage.getItem(DEMO_MODE_KEY) !== null 
      ? localStorage.getItem(DEMO_MODE_KEY) === 'true'
      : DEFAULT_CONFIG.demoMode
  };
};

export const saveConfig = (config) => {
  localStorage.setItem(API_URL_KEY, config.backendUrl);
  localStorage.setItem(POLLING_INTERVAL_KEY, config.pollingInterval.toString());
  localStorage.setItem(DEMO_MODE_KEY, config.demoMode.toString());
};

export const getApiBaseUrl = () => {
  const config = getConfig();
  try {
    const url = new URL(config.backendUrl);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    return 'http://localhost:3000';
  }
};

// 가상 대기줄 변동 시뮬레이션 상태
let simCount = 38;

/**
 * 대기줄 상태 Fetch (백엔드 GET 요청 또는 시뮬레이션)
 */
export const fetchQueueStatus = async () => {
  const config = getConfig();

  if (config.demoMode) {
    // 시뮬레이션 데이터 생성 (현실적인 움직임)
    const randomChange = Math.floor(Math.random() * 5) - 2;
    simCount = Math.max(3, Math.min(120, simCount + randomChange));

    // 1명당 평균 배식 시간 ~ 15~18초 (분당 3.5~4.0명 처리)
    const servingRatePerMin = 3.6;
    const estimatedWaitMinutes = Math.ceil(simCount / servingRatePerMin);

    let congestionLevel = 'LIGHT';
    if (simCount > 60) congestionLevel = 'VERY_CROWDED';
    else if (simCount > 35) congestionLevel = 'CROWDED';
    else if (simCount > 15) congestionLevel = 'NORMAL';

    return {
      success: true,
      isDemo: true,
      data: {
        currentCount: simCount,
        estimatedWaitMinutes,
        servingRatePerMin,
        congestionLevel,
        timestamp: new Date().toISOString(),
        isStale: false,
        staleMinutes: 0
      }
    };
  }

  // 실제 백엔드 GET 요청
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4초 타임아웃

    const response = await fetch(config.backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    
    // 백엔드 데이터 구조 유연 처리
    const resData = json.data || json;
    const currentCount = resData.currentCount ?? resData.count ?? resData.waitingPeople ?? 0;
    const servingRate = resData.servingRatePerMin ?? 3.5;
    const estimatedWaitMinutes = resData.estimatedWaitMinutes ?? Math.ceil(currentCount / servingRate);
    
    let congestionLevel = resData.congestionLevel;
    if (!congestionLevel) {
      if (currentCount > 60) congestionLevel = 'VERY_CROWDED';
      else if (currentCount > 35) congestionLevel = 'CROWDED';
      else if (currentCount > 15) congestionLevel = 'NORMAL';
      else congestionLevel = 'LIGHT';
    }

    const timestamp = resData.timestamp || new Date().toISOString();
    const timestampMs = new Date(timestamp).getTime();
    const diffMs = Date.now() - timestampMs;
    // 2분(120초) 이상 데이터 수집이 지연된 경우 stale (연결 끊김) 처리
    const STALE_THRESHOLD_MS = 2 * 60 * 1000;
    const isStale = Number.isFinite(timestampMs) && diffMs > STALE_THRESHOLD_MS;
    const staleMinutes = isStale ? Math.floor(diffMs / 60000) : 0;

    return {
      success: true,
      isDemo: false,
      data: {
        currentCount,
        estimatedWaitMinutes,
        servingRatePerMin: servingRate,
        congestionLevel,
        timestamp,
        isStale,
        staleMinutes,
        counterStatuses: resData.counterStatuses || null
      }
    };
  } catch (err) {
    return {
      success: false,
      isDemo: false,
      error: `GET 요청 실패 (${config.backendUrl}): ${err.message}`,
      fallbackData: {
        currentCount: 0,
        estimatedWaitMinutes: 0,
        servingRatePerMin: 3.5,
        congestionLevel: 'LIGHT',
        timestamp: new Date().toISOString(),
        isStale: true,
        staleMinutes: 0
      }
    };
  }
};

/**
 * 주간 급식표 데이터 및 백엔드 API 연동
 */
const MENU_STORAGE_KEY = 'lunch_line_weekly_menu';

export const INITIAL_WEEKLY_MENU = [
  {
    date: '2026-08-03',
    dayName: '월요일',
    mainMenu: '수제왕돈까스 & 일식카레',
    sideMenus: ['흑미밥', '팽이버섯장국', '양배추샐러드*참깨D', '포기김치', '아이스망고'],
    calories: '860 kcal',
    category: '양식/인기',
    tags: ['🔥 인기폭발', '돈까스', '인기탑']
  },
  {
    date: '2026-08-04',
    dayName: '화요일',
    mainMenu: '우삼겹 마라탕',
    sideMenus: ['계란볶음밥', '꿔바로우(3ea)', '짜사이무침', '단무지', '청포도에이드'],
    calories: '910 kcal',
    category: '중식/특식',
    tags: ['🔥 마라홀릭', '매콤함', '인기탑']
  },
  {
    date: '2026-08-05',
    dayName: '수요일',
    mainMenu: '크리스피 통다리 치킨밥',
    sideMenus: ['유부장국', '콘샐러드', '배추김치', '치킨무', '샤인머스캣'],
    calories: '890 kcal',
    category: '양식/특식',
    tags: ['🔥 치킨데이', '인기폭발']
  },
  {
    date: '2026-08-06',
    dayName: '목요일 (오늘)',
    mainMenu: '치즈 닭갈비 덮밥',
    sideMenus: ['콩나물국', '소세지야채볶음', '감자채볶음', '깍두기', '요구르트'],
    calories: '820 kcal',
    category: '한식',
    tags: ['치즈듬뿍', '오늘의메뉴']
  },
  {
    date: '2026-08-07',
    dayName: '금요일',
    mainMenu: '해물 해장 순두부찌개',
    sideMenus: ['현미밥', '떡갈비구이', '시금치나물무침', '포기김치', '수박'],
    calories: '740 kcal',
    category: '한식/건강',
    tags: ['얼큰속풀이', '불금메뉴']
  }
];

export const fetchWeeklyMenu = async () => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${baseUrl}/api/menu`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const menus = json.data || json;
      if (Array.isArray(menus) && menus.length > 0) {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menus));
        return menus;
      }
    }
  } catch (e) {
    console.warn('백엔드 급식 메뉴 GET 실패, 로컬 캐시/기본값 사용:', e);
  }
  return getWeeklyMenu();
};

export const saveWeeklyMenuApi = async (menus) => {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menus));
  const baseUrl = getApiBaseUrl();
  try {
    await fetch(`${baseUrl}/api/menu`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menus)
    });
  } catch (e) {
    console.warn('백엔드 급식 메뉴 PUT 실패 (로컬 스토리지에 저장됨):', e);
  }
};

export const getWeeklyMenu = () => {
  const stored = localStorage.getItem(MENU_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse weekly menu', e);
    }
  }
  return INITIAL_WEEKLY_MENU;
};

export const saveWeeklyMenu = (menus) => {
  saveWeeklyMenuApi(menus);
};

/**
 * 인기 메뉴 분석 데이터 백엔드 API 연동
 */
export const POPULARITY_ANALYTICS_DATA = {
  measuredPeriod: '2026.07.01 ~ 2026.08.06 (최근 30일 측정)',
  totalDataPoints: 1240,
  popularRankings: [
    {
      rank: 1,
      menuName: '수제 왕돈까스 & 카레',
      category: '양식',
      avgWaitPeople: 78,
      maxWaitMinutes: 24,
      satisfactionScore: 4.9,
      peakTime: '12:15 ~ 12:45',
      badge: '🏆 종합 1위',
      color: '#ef4444'
    },
    {
      rank: 2,
      menuName: '우삼겹 마라탕 & 꿔바로우',
      category: '중식',
      avgWaitPeople: 74,
      maxWaitMinutes: 22,
      satisfactionScore: 4.8,
      peakTime: '12:10 ~ 12:40',
      badge: '🥈 줄서기 최장',
      color: '#f59e0b'
    },
    {
      rank: 3,
      menuName: '크리스피 통다리 치킨',
      category: '양식',
      avgWaitPeople: 69,
      maxWaitMinutes: 20,
      satisfactionScore: 4.8,
      peakTime: '12:15 ~ 12:50',
      badge: '🥉 만족도 최고',
      color: '#8b5cf6'
    },
    {
      rank: 4,
      menuName: '치즈 닭갈비 덮밥',
      category: '한식',
      avgWaitPeople: 58,
      maxWaitMinutes: 17,
      satisfactionScore: 4.6,
      peakTime: '12:20 ~ 12:45',
      badge: '🔥 핫메뉴',
      color: '#10b981'
    },
    {
      rank: 5,
      menuName: '차돌 짬뽕 & 군만두',
      category: '중식',
      avgWaitPeople: 52,
      maxWaitMinutes: 15,
      satisfactionScore: 4.5,
      peakTime: '12:15 ~ 12:40',
      badge: '⭐ 베스트',
      color: '#06b6d4'
    },
    {
      rank: 6,
      menuName: '해물 순두부찌개 & 떡갈비',
      category: '한식',
      avgWaitPeople: 41,
      maxWaitMinutes: 12,
      satisfactionScore: 4.3,
      peakTime: '12:25 ~ 12:45',
      badge: '👍 스테디셀러',
      color: '#6366f1'
    }
  ],
  hourlyTrend: [
    { time: '11:40', avgPeople: 8, waitMin: 2 },
    { time: '11:50', avgPeople: 18, waitMin: 5 },
    { time: '12:00', avgPeople: 42, waitMin: 12 },
    { time: '12:10', avgPeople: 68, waitMin: 19 },
    { time: '12:20', avgPeople: 82, waitMin: 23 },
    { time: '12:30', avgPeople: 71, waitMin: 20 },
    { time: '12:40', avgPeople: 45, waitMin: 13 },
    { time: '12:50', avgPeople: 22, waitMin: 6 },
    { time: '13:00', avgPeople: 9, waitMin: 3 }
  ],
  dayOfWeekAverage: [
    { day: '월', count: 62, topMenu: '왕돈까스' },
    { day: '화', count: 68, topMenu: '마라탕' },
    { day: '수', count: 65, topMenu: '통다리치킨' },
    { day: '목', count: 54, topMenu: '닭갈비덮밥' },
    { day: '금', count: 42, topMenu: '순두부찌개' }
  ]
};

export const fetchPopularityAnalytics = async () => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${baseUrl}/api/analytics`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json.data) return json.data;
    }
  } catch (e) {
    console.warn('백엔드 분석 API GET 실패, 정적 폴백 데이터 사용:', e);
  }
  return POPULARITY_ANALYTICS_DATA;
};

