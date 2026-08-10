const express = require('express');
const app = express();

app.use(express.json());
// 간단한 CORS 허용 (프론트엔드가 다른 포트에서 접근할 경우)
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (req.method === 'OPTIONS') return res.sendStatus(204);
	next();
});

let peopleCount = 0;

// [1] 카메라 서버가 사람 수를 보내는 곳 (POST 요청)
app.post('/api/count', (req, res) => {
	const raw = req.body.count;
	const newCount = Number(raw);

	if (!Number.isFinite(newCount) || newCount < 0) {
		return res.status(400).send({ message: '유효한 숫자(count, 0 이상의 정수)를 보내주세요.' });
	}

	peopleCount = Math.floor(newCount);
	console.log(`[업데이트] 현재 대기 인원: ${peopleCount}명`);
	res.send({ message: '성공적으로 업데이트 되었습니다.', currentCount: peopleCount });
});

// [2] 프론트엔드가 사람 수를 가져가는 곳 (GET 요청)
app.get('/api/count', (req, res) => {
	res.send({ currentCount: peopleCount });
});

// [3] 서버 켜기 (3000번 포트)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`급식 줄 대기열 서버가 ${PORT}번 포트에서 실행 중입니다! 🚀`);
});
