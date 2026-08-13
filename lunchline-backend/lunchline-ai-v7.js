const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * 이미지를 분석하여 사람 수를 반환하는 함수 (파이썬 스크립트 호출)
 * @param {Buffer} imageBuffer - 분석할 이미지 데이터 (Buffer 형식)
 * @returns {Promise<number>} - 감지된 사람 수
 */
async function analyzeImage(imageBuffer) {
    // 1. 메모리에 있는 이미지를 임시 파일로 저장 (파이썬이 읽을 수 있도록)
    const tempFileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    
    await fs.writeFile(tempFilePath, imageBuffer);

    return new Promise((resolve, reject) => {
        // 2. 파이썬 프로세스 생성하여 AI 모델(lunchline-ai-v7.py) 실행
        // 참고: 파이썬 실행 명령어가 환경에 따라 'python' 또는 'python3'일 수 있습니다.
        const pythonProcess = spawn('python', [path.join(__dirname, 'lunchline-ai-v7.py'), tempFilePath]);

        let outputData = '';

        // 파이썬에서 출력한 결과(사람 수) 가져오기
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        // 파이썬 에러 로그 출력
        pythonProcess.stderr.on('data', (data) => {
            console.error(`[AI 모델 에러 로그]: ${data.toString()}`);
        });

        // 프로세스 종료 시 결과 반환
        pythonProcess.on('close', async (code) => {
            // 3. 처리가 끝난 임시 이미지 파일 삭제
            try {
                await fs.unlink(tempFilePath);
            } catch (err) {
                console.error('임시 파일 삭제 실패:', err);
            }

            if (code !== 0) {
                console.error(`AI 모델 프로세스가 코드 ${code}로 종료되었습니다.`);
                return resolve(0); // 에러 발생 시 기본값 0명 처리
            }

            // 출력된 문자열에서 숫자(사람 수)만 추출
            const count = parseInt(outputData.trim(), 10);
            if (isNaN(count)) {
                console.error('AI 모델이 올바른 숫자를 반환하지 않았습니다:', outputData);
                resolve(0);
            } else {
                resolve(count);
            }
        });
    });
}

module.exports = {
    analyzeImage
};
