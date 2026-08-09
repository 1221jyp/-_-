import cv2

# 마크다운 링크 기호를 제거하고 순수한 주소 텍스트만 남겼습니다.
camera_url = "http://10.119.221.235:81/stream"  

print("ESP32-CAM에 연결을 시도합니다...")
cap = cv2.VideoCapture(camera_url)

# ▼ 이 코드를 새로 추가합니다. (임시 저장 공간을 1장으로 최소화) ▼
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    print("❌ 카메라 연결에 실패했습니다.")
    exit()

# 카메라 연결 여부 확인
if not cap.isOpened():
    print("❌ 카메라 연결에 실패했습니다.")
    print("확인해 주세요: 1. PC와 ESP32-CAM이 같은 와이파이/핫스팟인가요? 2. 주소가 올바른가요?")
    exit()

print("✔ 카메라 연결 성공! 영상을 불러옵니다.")
print("종료하려면 영상 창을 클릭한 뒤 키보드의 'q' 키를 누르세요.")

while True:
    # 카메라로부터 실시간 사진(프레임)을 한 장씩 가져옵니다.
    ret, frame = cap.read()

    if not ret:
        print("❌ 영상을 받아오는 데 실패했습니다.")
        break

    # PC 화면에 'ESP32-CAM Test'라는 이름의 창으로 영상을 띄웁니다.
    cv2.imshow('ESP32-CAM Test', frame)

    # 키보드 'q'를 누르면 창이 닫히도록 대기합니다.
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 사용이 끝난 자원을 정리합니다.
cap.release()
cv2.destroyAllWindows()
print("프로그램이 정상적으로 종료되었습니다.")
