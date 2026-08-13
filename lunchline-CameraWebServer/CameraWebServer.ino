/*
  ESP32-CAM 10초 주기 이미지 캡처 및 HTTP POST 전송 코드
*/

#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ==========================================
// 1. 사용자 설정값 (Wi-Fi, 서버, 주기)
// ==========================================
const char *ssid            = "SK_9CF0_2.4G";
const char *password        = "ASQ10@9421";
const char *serverUrl       = "https://api.onamhlunchline.live/api/count";
const unsigned long CAPTURE_INTERVAL_MS = 10000; // 10초마다 전송

unsigned long lastCaptureTime = 0;

// ==========================================
// 2. ESP32-CAM (AI-Thinker 모듈) 핀 설정
// ==========================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define LED_GPIO_NUM       4

// ==========================================
// 3. 카메라 초기화 함수
// ==========================================
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 12;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 15;
    config.fb_count = 1;
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[ERROR] 카메라 초기화 실패! 에러 코드: 0x%x\n", err);
    return false;
  }

  Serial.println("[INFO] 카메라 초기화 성공");
  return true;
}

// ==========================================
// 4. 이미지 캡처 및 HTTP POST 전송 함수
// ==========================================
void captureAndSendImage() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] Wi-Fi 연결 해제됨. 전송 취소.");
    return;
  }

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[ERROR] 이미지 캡처 실패");
    return;
  }

  Serial.printf("[INFO] 이미지 캡처 성공! 크기: %u bytes\n", fb->len);

  WiFiClientSecure client;
  client.setInsecure(); // 인증서 검증 생략 (간단하게 하기 위함)

  HTTPClient http;
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Token", "lunchline-secure-2024");
  http.setTimeout(5000);

  int httpResponseCode = http.POST(fb->buf, fb->len);

  if (httpResponseCode > 0) {
    Serial.printf("[SUCCESS] HTTP POST 성공! 응답 코드: %d\n", httpResponseCode);
  } else {
    Serial.printf("[ERROR] HTTP POST 실패! 에러 내용: %s (코드: %d)\n", http.errorToString(httpResponseCode).c_str(), httpResponseCode);
  }

  http.end();
  esp_camera_fb_return(fb); // 이 줄 꼭 있어야 함, 없으면 몇 장 찍고 멈춤
}

// ==========================================
// 5. Setup & Loop
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== ESP32-CAM 10초 주기 HTTP POST 클라이언트 ===");

  if (!initCamera()) {
    Serial.println("[FATAL] 카메라 초기화 실패로 시스템을 정지합니다.");
    while (true) { delay(1000); }
  }

  WiFi.begin(ssid, password);
  WiFi.setSleep(false);

  Serial.print("[INFO] Wi-Fi 연결 중");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.printf("[INFO] Wi-Fi 연결 완료! IP 주소: %s\n", WiFi.localIP().toString().c_str());
}

void loop() {
  unsigned long currentMillis = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] Wi-Fi 연결 끊김. 재연결 시도 중...");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  if (currentMillis - lastCaptureTime >= CAPTURE_INTERVAL_MS) {
    lastCaptureTime = currentMillis;
    captureAndSendImage();
  }
}