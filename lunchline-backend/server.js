const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

// 🛡️ 보안 1: CORS 허용 (X-Token 헤더 추가 허용)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Token');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

const db = new sqlite3.Database('./lunchline.db', (err) => {
    if (err) console.error('DB 에러:', err.message);
    else {
        console.log('데이터베이스 준비 완료! 🧠');
        db.run(`CREATE TABLE IF NOT EXISTS queue_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            count INTEGER,
            estimatedWaitMinutes INTEGER
        )`);
    }
});

// 🚨 우리 서버만의 비밀번호
const SECRET_TOKEN = "lunchline-secure-2024";

// 📝 [API] 카메라가 사람 수 보내는 곳
app.post('/api/count', (req, res) => {
    // 🛡️ 보안 2: X-Token 검증 (암호 틀리면 쫓아냄)
    const clientToken = req.headers['x-token'];
    if (clientToken !== SECRET_TOKEN) {
        return res.status(401).send({ message: '접근 거부: 유효하지 않은 토큰입니다.' });
    }

    const newCount = Number(req.body.count);

    // 🛡️ 보안 3: 데이터 유효성 검사 (이상한 글자나 음수 튕겨내기)
    if (!Number.isFinite(newCount) || newCount < 0) {
        return res.status(400).send({ message: '유효한 숫자를 보내주세요.' });
    }

    const now = new Date().toISOString();
    const waitTime = Math.round(newCount * 0.5);

    // 🛡️ 보안 4: SQL 인젝션 방어 (? 사용)
    db.run(
        `INSERT INTO queue_log (timestamp, count, estimatedWaitMinutes) VALUES (?, ?, ?)`,
        [now, newCount, waitTime],
        function(err) {
            if (err) return res.status(500).send({ message: 'DB 저장 실패' });
            res.send({ message: '저장 성공!', count: newCount });
        }
    );
});

// 📱 [API] 프론트엔드가 상태 물어보는 곳
app.get('/api/queue/status', (req, res) => {
    db.get(`SELECT * FROM queue_log ORDER BY id DESC LIMIT 1`, (err, row) => {
        if (err) return res.status(500).send({ message: 'DB 조회 실패' });
        if (!row) return res.send({ currentCount: 0, estimatedWaitMinutes: 0, timestamp: null });

        res.send({
            currentCount: row.count,
            estimatedWaitMinutes: row.estimatedWaitMinutes,
            timestamp: row.timestamp
        });
    });
});

app.listen(3000, () => {
    console.log('백엔드 보안 서버가 3000번 포트에서 돌아가고 있어요! 🚀🛡️');
});
