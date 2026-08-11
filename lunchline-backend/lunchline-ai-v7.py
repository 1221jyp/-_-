import sys
import cv2
import os
import torch
import warnings

# 경고 메시지 숨김
warnings.filterwarnings("ignore")
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'
os.environ['YOLO_VERBOSE'] = 'False'

try:
    from ultralytics import YOLO
except ImportError:
    print("0")
    sys.exit(1)

def main():
    # Node.js(lunchline-ai-v7.js)에서 이미지 파일 경로를 인자로 전달받음
    if len(sys.argv) < 2:
        print("0")
        return
        
    image_path = sys.argv[1]
    
    try:
        # 모델 경로 (사용자가 지정한 위치 그대로 사용)
        model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n-pose.pt'
        
        # 모델 로드
        model = YOLO(model_path)
        
        # 이미지 읽기
        frame = cv2.imread(image_path)
        if frame is None:
            print("0")
            return
            
        # AI 모델 예측 수행
        results = model.predict(frame, verbose=False)
        
        person_count = 0
        
        # 결과 처리
        if len(results) > 0 and results[0].boxes is not None:
            # 바운딩 박스의 개수를 사람 수로 계산 (이전 코드 로직 참조)
            # track 대신 predict를 사용하므로 단순히 탐지된 객체의 수를 셉니다.
            person_count = len(results[0].boxes)
            
        # 순수하게 숫자만 출력해야 Node.js에서 정확히 인식함
        print(person_count)
        
    except Exception as e:
        # 에러 발생 시 0명으로 처리 (Node.js 측에 표준 오류로 에러 전송)
        sys.stderr.write(f"Error: {str(e)}\n")
        print("0")

if __name__ == "__main__":
    main()
