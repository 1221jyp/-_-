FROM node:24-bookworm-slim

WORKDIR /app

# 파이썬 런타임 + AI 모델(opencv/torch)이 필요로 하는 최소 시스템 라이브러리
# libgl1: ultralytics가 내부적으로 opencv-python(non-headless)도 같이 요구해서 필요함
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

# Node 의존성 설치
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 파이썬 의존성 설치
# torch/torchvision을 CPU 전용 버전으로 고정한 뒤 나머지와 한 번에 설치해야
# pip가 GPU(CUDA)용 torch로 재해석하며 수백MB짜리 wheel을 반복 다운로드하는 걸 막을 수 있음
COPY requirements.txt ./
RUN pip install --no-cache-dir --break-system-packages \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        torch==2.6.0 torchvision==0.21.0 \
        -r requirements.txt

# 앱 소스 복사
COPY . .

# YOLO 모델을 빌드 타임에 미리 받아서 이미지에 포함 (런타임에 인터넷 필요 없게)
RUN python -c "from ultralytics import YOLO; YOLO('/app/yolov8n-pose.pt')"

EXPOSE 3000

CMD ["node", "server.js"]
