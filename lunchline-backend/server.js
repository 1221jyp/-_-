const express = require('express');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite'); // 1. SQLite(기억 장치) 불러오기 (Node 내장 모듈)
const multer = require('multer'); // 이미지 업로드를 처리하기 위한 라이브러리
const aiModel = require('./lunchline-ai-v7'); // AI 모델 모듈 불러오기

const app = express();
app.use(express.json());

// multer 메모리 스토리지 설정 (파일을 메모리에 임시 보관)
const upload = multer({ storage: multer.memoryStorage() });

// CORS 허용 (프론트엔드 연결을 위해 필수)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. 데이터베이스(수첩) 준비하기
// data/lunchline.db 라는 파일이 생성되면서 여기에 모든 기록이 영구 저장됨! (도커 볼륨 마운트 지점)
fs.mkdirSync('./data', { recursive: true });
const db = new DatabaseSync('./data/lunchline.db');
console.log('데이터베이스 준비 완료! 🧠');
// 기록을 남길 표(테이블) 만들기
db.exec(`CREATE TABLE IF NOT EXISTS queue_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    count INTEGER,
    estimatedWaitMinutes INTEGER
)`);

// [1] 카메라 서버가 사람 수를 보내는 곳 (데이터 저장)
// 이제 카메라(ESP32-CAM)에서 'image' 필드로 사진을 보내면 AI 모델이 분석합니다.
app.post('/api/count', upload.single('image'), async (req, res) => {
    let newCount = 0;

    try {
        if (req.file && req.file.buffer) {
            // 1) multipart/form-data로 이미지가 수신된 경우: AI 모델을 이용해 인원 파악
            console.log('이미지 파일 수신됨. AI 모델 분석 시작...');
            newCount = await aiModel.analyzeImage(req.file.buffer);
        } else if (req.body.image) {
            // 2) JSON (Base64 등) 형식으로 이미지가 수신된 경우
            console.log('Base64 이미지 데이터 수신됨. AI 모델 분석 시작...');
            const imageBuffer = Buffer.from(req.body.image, 'base64');
            newCount = await aiModel.analyzeImage(imageBuffer);
        } else if (req.body.count !== undefined) {
            // 3) 기존처럼 단순 숫자로 들어온 경우 호환성 유지
            newCount = Number(req.body.count);
        } else {
            return res.status(400).send({ message: '이미지 파일이나 사람 수 데이터(count)를 전송해주세요.' });
        }

        if (!Number.isFinite(newCount) || newCount < 0) {
            return res.status(400).send({ message: '유효한 인원수를 도출할 수 없습니다.' });
        }

        // 현재 시간(timestamp)과 예상 대기 시간(예: 1명당 0.5분) 계산
        const now = new Date().toISOString();
        const waitTime = Math.round(newCount * 0.5);

        // DB에 기록 저장! (이제 서버가 꺼져도 안 날아감)
        db.prepare(
            `INSERT INTO queue_log (timestamp, count, estimatedWaitMinutes) VALUES (?, ?, ?)`
        ).run(now, newCount, waitTime);
        console.log(`[${now}] AI 분석/데이터: ${newCount}명 저장 완료! (대기 예상: ${waitTime}분)`);
        res.send({ message: '저장 성공!', count: newCount });
    } catch (error) {
        console.error('AI 분석 또는 처리 중 에러 발생:', error);
        return res.status(500).send({ message: '서버 내부 오류가 발생했습니다.' });
    }
});

// [2] 프론트엔드(화면)가 현재 상태를 물어보는 곳 (선생님 요청대로 주소 변경)
app.get('/api/queue/status', (req, res) => {
    try {
        // DB에서 가장 최근 기록 1개만 가져오기
        const row = db.prepare(`SELECT * FROM queue_log ORDER BY id DESC LIMIT 1`).get();

        if (!row) {
            // 아직 카메라가 보낸 기록이 하나도 없을 때
            return res.send({ currentCount: 0, estimatedWaitMinutes: 0, timestamp: null });
        }

        // 프론트엔드가 원하는 형태로 보내주기
        res.send({
            currentCount: row.count,
            estimatedWaitMinutes: row.estimatedWaitMinutes,
            timestamp: row.timestamp
        });
    } catch (err) {
        res.status(500).send({ message: 'DB 조회 실패' });
    }
});

// 서버 켜기
app.listen(3000, () => {
    console.log('백엔드 서버가 3000번 포트에서 돌아가고 있어요! 🚀');
});
