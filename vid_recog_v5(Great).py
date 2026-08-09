import cv2
import os
import traceback
import torch
import urllib.request
import numpy as np

# 윈도우 환경 AI 엔진 충돌 방지
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

# --- [UC, Inc. 공간 인지 변수] ---
region_points = []
inside_point = None

def draw_region_and_inside(event, x, y, flags, param):
    global region_points, inside_point
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(region_points) < 4:
            region_points.append((x, y))
            print(f"📍 동물 국가 국경(Boundary) 좌표 설정: ({x}, {y})")
        elif inside_point is None:
            inside_point = (x, y)
            print(f"🏠 스누피의 안식처(Inside) 방향 설정 완료: ({x}, {y})")

try:
    from ultralytics import YOLO

    print("\n=========================================")
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"🚀 UC, Inc. 최정예 특수부대 가동: {gpu_name} (GPU 100% 활성화)")
    else:
        print("⚠️ 경고: 일반 벙커(CPU)에서 연산을 담당합니다.")
        gpu_name = "CPU"
    print("=========================================\n")

    print("AI 두뇌(Nano Model)를 불러오는 중입니다...")
    model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n.pt'  
    model = YOLO(model_path)
    
    camera_url = "http://10.119.221.235:81/stream"

    print("📡 S Inc. 전용 무전망(Raw Byte Stream)을 개설하여 스누피와 연결합니다...")
    req = urllib.request.Request(camera_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    stream = urllib.request.urlopen(req, timeout=10)
    byte_data = b''

    print("초기 공간 구성을 위한 첫 프레임을 확보 중입니다...")
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
        print("❌ 영상을 확보하지 못했습니다. 통신망을 확인하십시오.")
        exit()

    print("\n=========================================")
    print("🛠️ [동물 국가 국경 및 내부(Inside) 지정 모드]")
    print("1. 마우스 왼쪽 버튼을 '4번' 클릭하여 두툼한 국경선(다각형)을 만드세요.")
    print("2. '5번째 클릭'으로 절대 보호 구역인 '안(Inside)'의 방향을 찍어주세요.")
    print("=========================================\n")

    cv2.namedWindow("Snoopy Patrol Zone")
    cv2.setMouseCallback("Snoopy Patrol Zone", draw_region_and_inside)

    poly_center_x, poly_center_y = 0, 0

    while inside_point is None:
        temp_frame = first_frame.copy()
        
        for i, pt in enumerate(region_points):
            cv2.circle(temp_frame, pt, 5, (0, 0, 255), -1)
            if i > 0:
                cv2.line(temp_frame, region_points[i-1], pt, (0, 255, 0), 2)
        
        if len(region_points) == 4:
            cv2.line(temp_frame, region_points[3], region_points[0], (0, 255, 0), 2)
            
            poly_center_x = int(sum([p[0] for p in region_points]) / 4)
            poly_center_y = int(sum([p[1] for p in region_points]) / 4)
            cv2.circle(temp_frame, (poly_center_x, poly_center_y), 5, (255, 255, 255), -1)
            
            if inside_point is not None:
                cv2.circle(temp_frame, inside_point, 8, (255, 0, 0), -1)
                cv2.arrowedLine(temp_frame, (poly_center_x, poly_center_y), inside_point, (255, 0, 0), 3, tipLength=0.2)
                cv2.putText(temp_frame, "INSIDE (Doghouse)", (inside_point[0]+10, inside_point[1]-10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

        cv2.imshow("Snoopy Patrol Zone", temp_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cv2.destroyWindow("Snoopy Patrol Zone")

    if inside_point is None:
        print("❌ 공간 인지 설정이 완료되지 않았습니다. 작전을 취소합니다.")
        exit()

    base_vector_x = inside_point[0] - poly_center_x
    base_vector_y = inside_point[1] - poly_center_y
    polygon_np = np.array(region_points, np.int32)

    person_tracks = {} 
    
    # 누적 인원 카운팅 변수 초기화
    enter_count = 0
    exit_count = 0
    
    print("\n✔ 공간 위상 설정 완료! 스누피의 벡터 추적 감시를 시작합니다. (종료: 'q' 키)")

    while True:
        byte_data += stream.read(4096)
        a = byte_data.find(b'\xff\xd8')
        b = byte_data.find(b'\xff\xd9')
        
        if a != -1 and b != -1:
            jpg = byte_data[a:b+2]
            byte_data = byte_data[b+2:]
            frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)

            if frame is not None:
                results = model.track(frame, persist=True, classes=[0], tracker="bytetrack.yaml", verbose=False)
                
                # 1. 국경선(Polygon) 렌더링
                cv2.polylines(frame, [polygon_np], isClosed=True, color=(0, 255, 0), thickness=2)
                
                # 2. 안과 밖 방향(Inside Vector) 지속 렌더링
                cv2.arrowedLine(frame, (poly_center_x, poly_center_y), inside_point, (255, 0, 0), 3, tipLength=0.2)
                cv2.putText(frame, "INSIDE", (inside_point[0]+10, inside_point[1]-10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

                if results[0].boxes.id is not None:
                    boxes = results[0].boxes.xyxy.cpu().numpy()
                    track_ids = results[0].boxes.id.int().cpu().tolist()
                    
                    for box, track_id in zip(boxes, track_ids):
                        x1, y1, x2, y2 = map(int, box)
                        cx = int((x1 + x2) / 2)
                        cy = y2 
                        
                        is_in_zone = cv2.pointPolygonTest(polygon_np, (cx, cy), False) >= 0
                        
                        if track_id not in person_tracks:
                            person_tracks[track_id] = {'zone_status': 'OUT', 'entry_point': None, 'final_decision': 'DETECTED'}
                            
                        track = person_tracks[track_id]
                        
                        if is_in_zone:
                            if track['zone_status'] == 'OUT':
                                track['zone_status'] = 'IN_ZONE'
                                track['entry_point'] = (cx, cy)
                        else:
                            if track['zone_status'] == 'IN_ZONE':
                                exit_point = (cx, cy)
                                entry_point = track['entry_point']
                                
                                track_vector_x = exit_point[0] - entry_point[0]
                                track_vector_y = exit_point[1] - entry_point[1]
                                
                                distance = np.sqrt(track_vector_x**2 + track_vector_y**2)
                                
                                if distance > 20: 
                                    dot_product = (base_vector_x * track_vector_x) + (base_vector_y * track_vector_y)
                                    
                                    if dot_product > 0:
                                        track['final_decision'] = 'ENTERED (IN)'
                                        enter_count += 1  # 내부 진입 인원 누적
                                    else:
                                        track['final_decision'] = 'EXITED (OUT)'
                                        exit_count += 1   # 외부 퇴출 인원 누적
                                        
                                track['zone_status'] = 'OUT' 

                        decision = track['final_decision']
                        
                        if "ENTERED" in decision:
                            color = (0, 0, 255) 
                        elif "EXITED" in decision:
                            color = (255, 150, 0) 
                        elif track['zone_status'] == 'IN_ZONE':
                            color = (0, 255, 255) 
                        else:
                            color = (0, 255, 0) 
                            
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.circle(frame, (cx, cy), 6, color, -1)
                        
                        if track['zone_status'] == 'IN_ZONE' and track['entry_point'] is not None:
                            cv2.line(frame, track['entry_point'], (cx, cy), color, 2)

                        cv2.putText(frame, f"ID:{track_id} {decision}", (x1, y1 - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                # 3. 화면 좌상단 누적 출입 인원 표시 (0명일 때도 출력)
                cv2.putText(frame, f'ENTERED (IN) : {enter_count}', (20, 40), 
                            cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 0, 255), 2)
                cv2.putText(frame, f'EXITED (OUT) : {exit_count}', (20, 80), 
                            cv2.FONT_HERSHEY_DUPLEX, 1.0, (255, 150, 0), 2)

                cv2.imshow('Snoopy Patrol Zone - AI Tracking', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()

except Exception as e:
    print("\n=========================================")
    print("🚨 통신 두절: 시스템 에러 발생 🚨")
    print("=========================================")
    traceback.print_exc()
    print("=========================================\n")
