import cv2
import os
import traceback

os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

try:
    from ultralytics import YOLO

    print("AI 모델을 불러오는 중입니다...")
    
    # 💡 수정된 부분: 바탕화면에 있는 파일의 '절대 경로'를 직접 짚어줍니다.
    # 문자열 앞에 'r'을 붙여 윈도우 경로를 안전하게 읽도록 합니다.
    model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n.pt'
    model = YOLO(model_path) 

    camera_url = "http://10.119.221.235:81/stream"  
    cap = cv2.VideoCapture(camera_url)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("❌ 카메라 연결에 실패했습니다.")
        input("엔터 키를 누르면 종료됩니다...")
        exit()

    print("✔ AI 카메라가 작동을 시작합니다! (종료: 'q' 키)")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ 영상 신호를 잃어버렸습니다. (핫스팟 연결을 확인하세요)")
            break
        
        # 사람(classes=[0])만 찾습니다.
        results = model(frame, conf=0.5, classes=[0], verbose=False)
        person_count = 0
        
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                person_count += 1
                
        cv2.putText(frame, f'AI People Count: {person_count}', (20, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3)

        cv2.imshow('AI People Counting', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

except Exception as e:
    print("\n=========================================")
    print("🚨 프로그램에 에러가 발생하여 멈췄습니다 🚨")
    print("=========================================")
    traceback.print_exc()
    print("=========================================\n")
    input("엔터 키를 누르면 종료됩니다...")
