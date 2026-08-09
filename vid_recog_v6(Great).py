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

    print("AI 두뇌(Pose Skeleton Model)를 불러오는 중입니다...")
    # 겉모습이 아닌 골격을 투시하는 Pose 모델 사용
    model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n-pose.pt'  
    model = YOLO(model_path)
    
    camera_url = "http://10.119.221.235:81/stream"

    print("📡 S Inc. 전용 무전망(Raw Byte Stream)을 개설하여 스누피와 연결합니다...")
    req = urllib.request.Request(camera_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    stream = urllib.request.urlopen(req, timeout=10)
    byte_data = b''

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
    enter_count = 0
    exit_count = 0
    
    print("\n✔ 공간 위상 설정 완료! 골격 기반 벡터 추적 감시를 시작합니다. (종료: 'q' 키)")

    while True:
        byte_data += stream.read(4096)
        a = byte_data.find(b'\xff\xd8')
        b = byte_data.find(b'\xff\xd9')
        
        if a != -1 and b != -1:
            jpg = byte_data[a:b+2]
            byte_data = byte_data[b+2:]
            frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)

            if frame is not None:
                # Pose 모델을 활용한 추적 (관절 좌표 반환)
                results = model.track(frame, persist=True, tracker="bytetrack.yaml", verbose=False)
                
                cv2.polylines(frame, [polygon_np], isClosed=True, color=(0, 255, 0), thickness=2)
                cv2.arrowedLine(frame, (poly_center_x, poly_center_y), inside_point, (255, 0, 0), 3, tipLength=0.2)
                cv2.putText(frame, "INSIDE", (inside_point[0]+10, inside_point[1]-10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

                if results[0].boxes is not None and results[0].boxes.id is not None:
                    boxes = results[0].boxes.xyxy.cpu().numpy()
                    track_ids = results[0].boxes.id.int().cpu().tolist()
                    keypoints = results[0].keypoints.xy.cpu().numpy() # [N, 17, 2] 형태의 관절 데이터
                    
                    for box, track_id, kpts in zip(boxes, track_ids, keypoints):
                        x1, y1, x2, y2 = map(int, box)
                        
                        # --- [본질 투시: 발목 관절 기반 위치 계산] ---
                        # COCO 기준: 15번(왼쪽 발목), 16번(오른쪽 발목)
                        left_ankle = kpts[15]
                        right_ankle = kpts[16]
                        
                        valid_x, valid_y = [], []
                        if left_ankle[0] != 0: # 발목이 화면에 인식된 경우
                            valid_x.append(left_ankle[0])
                            valid_y.append(left_ankle[1])
                        if right_ankle[0] != 0:
                            valid_x.append(right_ankle[0])
                            valid_y.append(right_ankle[1])
                            
                        # 발목 관절이 잡히면 두 발목의 중앙을, 안 잡히면 바운딩 박스 하단을 기준점으로 사용
                        if len(valid_x) > 0:
                            cx = int(sum(valid_x) / len(valid_x))
                            cy = int(sum(valid_y) / len(valid_y))
                        else:
                            cx = int((x1 + x2) / 2)
                            cy = y2 
                            
                        is_in_zone = cv2.pointPolygonTest(polygon_np, (cx, cy), False) >= 0
                        
                        if track_id not in person_tracks:
                            person_tracks[track_id] = {'zone_status': 'OUT', 'entry_point': None, 'final_decision': 'DETECTED'}
                            
                        track = person_tracks[track_id]
                        
                        # --- [궤적 벡터(Trajectory Vector) 분석] ---
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
                                        enter_count += 1
                                    else:
                                        track['final_decision'] = 'EXITED (OUT)'
                                        exit_count += 1
                                        
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
                            
                        # 추적 박스 렌더링
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        
                        # 실제 동물의 '발자국(발목 중앙)' 위치를 표시
                        cv2.circle(frame, (cx, cy), 6, (255, 0, 255), -1)
                        
                        if track['zone_status'] == 'IN_ZONE' and track['entry_point'] is not None:
                            cv2.line(frame, track['entry_point'], (cx, cy), color, 2)

                        cv2.putText(frame, f"ID:{track_id} {decision}", (x1, y1 - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                # 누적 출입 인원 표시
                cv2.putText(frame, f'ENTERED (IN) : {enter_count}', (20, 40), 
                            cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 0, 255), 2)
                cv2.putText(frame, f'EXITED (OUT) : {exit_count}', (20, 80), 
                            cv2.FONT_HERSHEY_DUPLEX, 1.0, (255, 150, 0), 2)

                cv2.imshow('Snoopy Patrol Zone - Skeleton Tracking', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cv2.destroyAllWindows()

except Exception as e:
    print("\n=========================================")
    print("🚨 통신 두절: 시스템 에러 발생 🚨")
    print("=========================================")
    traceback.print_exc()
    print("=========================================\n")
