import cv2
import os
import traceback
import torch
import urllib.request
import numpy as np
import requests
import threading
import time
import base64

# 윈도우 환경 AI 엔진 충돌 방지
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

# --- [서버 통신 설정] ---
SERVER_URL = "http://127.0.0.1:3000/api/analyze"

def send_frame_to_server(person_count, base64_image):
    """1초마다 캡처된 이미지와 인원수를 백엔드로 전송하는 함수"""
    payload = {
        "count": person_count,
        "image": base64_image
    }
    try:
        requests.post(SERVER_URL, json=payload, timeout=2)
    except Exception:
        pass # 백엔드 서버 오류로 인해 메인 영상이 멈추지 않도록 무시

camera_url = "http://10.119.221.235:81/stream"

def connect_camera():
    """카메라 무전망 연결 및 자동 재연결 루프"""
    while True:
        try:
            print("📡 카메라 무전망 접속 시도 중...")
            req = urllib.request.Request(camera_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            stream = urllib.request.urlopen(req, timeout=5)
            print("✔ 카메라 연결 성공!")
            return stream
        except Exception as e:
            print(f"❌ 카메라 연결 실패 ({e}). 2초 후 재연결을 시도합니다...")
            time.sleep(2)

try:
    from ultralytics import YOLO

    print("\n=========================================")
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"🚀 최정예 특수부대 가동: {gpu_name} (GPU 100% 활성화)")
    else:
        print("⚠️ 경고: 일반 벙커(CPU)에서 연산을 담당합니다.")
    print("=========================================\n")

    print("AI 두뇌(Pose Skeleton Model)를 불러오는 중입니다...")
    model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n-pose.pt'  
    model = YOLO(model_path)

    # 최초 카메라 연결
    stream = connect_camera()
    byte_data = b''
    last_sent_time = time.time()

    print("✔ 시스템 준비 완료! 사람 추적 및 자동 재연결 감시를 시작합니다. (종료: 'q' 키)")

    while True:
        try:
            # 1. 무전 데이터 수신 (네트워크 끊김 감지 구역)
            chunk = stream.read(4096)
            if not chunk:
                raise Exception("카메라로부터 데이터 수신이 중단되었습니다.")
            byte_data += chunk

            # 메모리 비대화 방지
            if len(byte_data) > 1024 * 1024:
                byte_data = b''
                continue

            # 2. JPEG 이미지 프레임 추출
            a = byte_data.find(b'\xff\xd8')
            b = byte_data.find(b'\xff\xd9')
            
            if a != -1 and b != -1:
                jpg = byte_data[a:b+2]
                byte_data = byte_data[b+2:]
                frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)

                if frame is not None:
                    # AI Pose 추적
                    results = model.track(frame, persist=True, tracker="bytetrack.yaml", verbose=False)
                    person_count = 0 
                    
                    if results[0].boxes is not None and results[0].boxes.id is not None:
                        boxes = results[0].boxes.xyxy.cpu().numpy()
                        track_ids = results[0].boxes.id.int().cpu().tolist()
                        keypoints = results[0].keypoints.xy.cpu().numpy()
                        
                        person_count = len(track_ids)
                        
                        for box, track_id, kpts in zip(boxes, track_ids, keypoints):
                            x1, y1, x2, y2 = map(int, box)
                            left_ankle, right_ankle = kpts[15], kpts[16]
                            
                            valid_x, valid_y = [], []
                            if left_ankle[0] != 0: valid_x.append(left_ankle[0]); valid_y.append(left_ankle[1])
                            if right_ankle[0] != 0: valid_x.append(right_ankle[0]); valid_y.append(right_ankle[1])
                                
                            if len(valid_x) > 0:
                                cx = int(sum(valid_x) / len(valid_x))
                                cy = int(sum(valid_y) / len(valid_y))
                            else:
                                cx = int((x1 + x2) / 2); cy = y2 
                                
                            color = (0, 255, 0)
                            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                            cv2.putText(frame, f"ID:{track_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                            cv2.circle(frame, (cx, cy), 6, (255, 0, 255), -1)

                    cv2.putText(frame, f'AI People Count: {person_count}', (20, 50), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)

                    # 3. 백엔드 서버 1초 주기 전송
                    current_time = time.time()
                    if current_time - last_sent_time >= 1.0:
                        last_sent_time = current_time
                        
                        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 60]
                        success, buffer = cv2.imencode('.jpg', frame, encode_param)
                        
                        if success:
                            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                            threading.Thread(target=send_frame_to_server, args=(person_count, jpg_as_text), daemon=True).start()

                    cv2.imshow('Snoopy Patrol - Auto Reconnect Protected', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        except Exception as net_err:
            print(f"\n🚨 [통신 끊김 감지] 원인: {net_err}")
            print("🔄 네트워크 복구를 위해 재연결을 시도합니다...")
            byte_data = b''
            stream = connect_camera() # 자동으로 다시 연결 후 계속 진행

    cv2.destroyAllWindows()

except Exception as e:
    print("\n=========================================")
    print("🚨 시스템 심각한 에러 발생 🚨")
    traceback.print_exc()
    print("=========================================\n")
