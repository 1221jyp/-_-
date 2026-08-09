import cv2
import os
import traceback

# 윈도우 환경 AI 엔진 충돌 방지
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

# 사용자가 마우스로 클릭한 가상 선의 좌표를 저장할 리스트
line_points = []

# 마우스 클릭 이벤트를 처리하여 선의 시작점과 끝점을 받는 함수
def draw_line(event, x, y, flags, param):
    global line_points
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(line_points) < 2:
            line_points.append((x, y))
            print(f"📍 좌표 선택됨: ({x}, {y})")

try:
    from ultralytics import YOLO
    from ultralytics.solutions import ObjectCounter

    print("AI 모델을 불러오는 중입니다...")
    model_path = r'C:\Users\SNOOPY 1517\Desktop\yolov8n.pt'
    model = YOLO(model_path) 

    camera_url = "http://10.119.221.235:81/stream"  
    cap = cv2.VideoCapture(camera_url)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("❌ 카메라 연결에 실패했습니다.")
        input("엔터 키를 누르면 종료됩니다...")
        exit()

    # 1. 첫 프레임을 읽어와서 선을 긋기 위한 화면을 띄웁니다.
    ret, first_frame = cap.read()
    if not ret:
        print("❌ 첫 프레임을 읽어오지 못했습니다.")
        exit()

    print("\n=========================================")
    print("🛠️ [가상 선 긋기 모드]")
    print("화면에 나타난 영상에서 마우스 왼쪽 버튼을 두 번 클릭하여")
    print("사람들이 통과할 기준선을 그려주세요.")
    print("=========================================\n")

    cv2.namedWindow("Draw Line")
    cv2.setMouseCallback("Draw Line", draw_line)

    # 2번 클릭할 때까지 대기
    while len(line_points) < 2:
        temp_frame = first_frame.copy()
        if len(line_points) == 1:
            cv2.circle(temp_frame, line_points[0], 5, (0, 0, 255), -1)
        cv2.imshow("Draw Line", temp_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cv2.destroyWindow("Draw Line")

    if len(line_points) < 2:
        print("❌ 선 긋기가 취소되었습니다.")
        exit()

    # 2. 최신 버전 규격에 맞춘 Object Counter 초기화
    # region 인자에 우리가 마우스로 찍은 2개의 좌표(선)를 전달합니다.
    counter = ObjectCounter(
        model=model_path,
        region=line_points,
        classes=[0],  # 사람(0번 클래스)만 타겟팅
        show=False,   # OpenCV 창을 직접 제어하기 위해 False로 설정
        line_width=2
    )

    print("✔ 선 긋기 완료! AI 카메라가 IN/OUT 카운팅을 시작합니다. (종료: 'q' 키)")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ 영상 신호를 잃어버렸습니다.")
            break
        
        # 3. 최신 ObjectCounter는 객체 추적과 카운팅을 한 번에 수행합니다.
        # 반환된 결과 객체(results)에서 그림이 그려진 프레임을 꺼내옵니다.
        results = counter(frame)
        frame = results.plot_im if hasattr(results, 'plot_im') else frame

        cv2.imshow('AI People IN/OUT Counting', frame)

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
