const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // 1. SQLite(기억 장치) 불러오기

const app = express();
app.use(express.json());

// CORS 허용 (프론트엔드 연결을 위해 필수)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// 2. 데이터베이스(수첩) 준비하기
// lunchline.db 라는 파일이 생성되면서 여기에 모든 기록이 영구 저장됨!
const db = new sqlite3.Database('./lunchline.db', (err) => {
    if (err) {
        console.error('DB 에러:', err.message);
    } else {
        console.log('데이터베이스 준비 완료! 🧠');
        // 기록을 남길 표(테이블) 만들기
        db.run(`CREATE TABLE IF NOT EXISTS queue_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            count INTEGER,
            estimatedWaitMinutes INTEGER
        )`);
    }
});

// [1] 카메라 서버가 사람 수를 보내는 곳 (데이터 저장)
app.post('/api/count', (req, res) => {
    const newCount = Number(req.body.count);

    if (!Number.isFinite(newCount) || newCount < 0) {
        return res.status(400).send({ message: '유효한 숫자를 보내주세요.' });
    }

    // 현재 시간(timestamp)과 예상 대기 시간(예: 1명당 0.5분) 계산
    const now = new Date().toISOString();
    const waitTime = Math.round(newCount * 0.5);

    // DB에 기록 저장! (이제 서버가 꺼져도 안 날아감)
    db.run(
        `INSERT INTO queue_log (timestamp, count, estimatedWaitMinutes) VALUES (?, ?, ?)`,
        [now, newCount, waitTime],
        function(err) {
            if (err) {
                return res.status(500).send({ message: 'DB 저장 실패' });
            }
            console.log(`[${now}] ${newCount}명 저장 완료! (대기 예상: ${waitTime}분)`);
            res.send({ message: '저장 성공!', count: newCount });
        }
    );
});

// [2] 프론트엔드(화면)가 현재 상태를 물어보는 곳 (선생님 요청대로 주소 변경)
app.get('/api/queue/status', (req, res) => {
    // DB에서 가장 최근 기록 1개만 가져오기
    db.get(`SELECT * FROM queue_log ORDER BY id DESC LIMIT 1`, (err, row) => {
        if (err) {
            return res.status(500).send({ message: 'DB 조회 실패' });
        }
        
        if (!row) {
            // 아직 카메라가 보낸 기록이 하나도 없을 때
            return res.send({ currentCount: 0, estimatedWaitMinutes: 0, timestamp: null });
        }

        // 프론트엔드가 원하는 형태로 맞춰서 보내주기
        res.send({
            currentCount: row.count,
            estimatedWaitMinutes: row.estimatedWaitMinutes,
            timestamp: row.timestamp
        });
    });
});

// 서버 켜기
app.listen(3000, () => {
    console.log('백엔드 서버가 3000번 포트에서 돌아가고 있어요! 🚀');
});
