import cv2
import os
import traceback
import torch
import urllib.request
import numpy as np

# 윈도우 환경 AI 엔진 충돌 방지
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

# 4개의 좌표를 담아 2차원 '면(Polygon)'을 형성할 리스트
region_points = []

# 마우스 클릭을 4번 받아 방어 구역을 설정하는 함수
def draw_region(event, x, y, flags, param):
    global region_points
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(region_points) < 4:
            region_points.append((x, y))
            print(f"📍 통제 구역 좌표 확정: ({x}, {y})")

try:
    from ultralytics import YOLO
    from ultralytics.solutions import ObjectCounter

    print("\n=========================================")
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"🚀 UC, Inc. 최정예 특수부대 가동: {gpu_name} (GPU 100% 활성화)")
    else:
        print("⚠️ 경고: 일반 벙커(CPU)에서 연산을 담당합니다.")
        gpu_name = "CPU"
    print("=========================================\n")

    print("AI 두뇌를 불러오는 중입니다...")
    # 경로를 사용자의 환경에 맞게 정확히 확인해 주십시오.
    model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n.pt'  
    camera_url = "http://10.119.221.235:81/stream"

    print("📡 S Inc. 전용 무전망(Raw Byte Stream)을 개설하여 스누피와 연결합니다...")
    req = urllib.request.Request(camera_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    stream = urllib.request.urlopen(req, timeout=10)
    byte_data = b''

    print("초기 구역 설정을 위한 첫 프레임을 확보 중입니다...")
    first_frame = None
    
    while True:
        byte_data += stream.read(4096)
        a = byte_data.find(b'\xff\xd8')
        b = byte_data.find(b'\xff\xd9')
        if a != -1 and b != -1:
            jpg = byte_data[a:b+2]
            byte_data = byte_data[b+2:]
            first_frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
            break

    if first_frame is None:
        print("❌ 영상을 확보하지 못했습니다.")
        exit()

    print("\n=========================================")
    print("🛠️ [다차원 통제 구역(Polygon) 설정 모드]")
    print("화면에 마우스 왼쪽 버튼을 총 '4번' 클릭하여")
    print("사람이 지나갈 두툼한 사각형 구역을 그려주세요.")
    print("=========================================\n")

    cv2.namedWindow("Set Patrol Zone")
    cv2.setMouseCallback("Set Patrol Zone", draw_region)

    # 4개의 점이 모두 찍힐 때까지 대기하며, 실시간으로 다각형을 그려줍니다.
    while len(region_points) < 4:
        temp_frame = first_frame.copy()
        for i, pt in enumerate(region_points):
            cv2.circle(temp_frame, pt, 5, (0, 0, 255), -1)
            if i > 0:
                cv2.line(temp_frame, region_points[i-1], pt, (0, 255, 0), 2)
        cv2.imshow("Set Patrol Zone", temp_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cv2.destroyWindow("Set Patrol Zone")

    if len(region_points) < 4:
        print("❌ 구역 설정이 취소되었습니다.")
        exit()

    # UC, Inc. 솔루션에 4개의 점(Region)을 전달하여 면적 기반 카운팅 개시
    counter = ObjectCounter(
        model=model_path,
        region=region_points,
        classes=[0],  # 사람만 인식
        show=False,   
        line_width=2
    )

    print("✔ 구역 설정 완료! 강력한 프레임 방어력을 갖춘 카운팅을 시작합니다. (종료: 'q' 키)")

    while True:
        byte_data += stream.read(4096)
        a = byte_data.find(b'\xff\xd8')
        b = byte_data.find(b'\xff\xd9')
        
        if a != -1 and b != -1:
            jpg = byte_data[a:b+2]
            byte_data = byte_data[b+2:]
            frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)

            if frame is not None:
                # 2차원 구역 통과 여부를 계산합니다.
                results = counter(frame)
                frame = results.plot_im if hasattr(results, 'plot_im') else frame

                cv2.putText(frame, f'Engine: {gpu_name} (Polygon Mode)', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

                cv2.imshow('Snoopy Patrol Zone - AI Counting', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()

except Exception as e:
    print("\n=========================================")
    print("🚨 시스템 에러 발생 🚨")
    print("=========================================")
    traceback.print_exc()
    print("=========================================\n")
