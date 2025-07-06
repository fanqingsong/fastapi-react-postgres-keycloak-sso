FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/python:3.8-slim

WORKDIR /backend

# 使用中科大apt源加速，适配Debian 12 (bookworm)
RUN echo "deb https://mirrors.ustc.edu.cn/debian/ bookworm main" > /etc/apt/sources.list \
    && echo "deb https://mirrors.ustc.edu.cn/debian/ bookworm-updates main" >> /etc/apt/sources.list \
    && echo "deb https://mirrors.ustc.edu.cn/debian-security bookworm-security main" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY ./ /backend

# 使用国内pip镜像源
RUN python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn
RUN python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/ --trusted-host pypi.tuna.tsinghua.edu.cn

ENTRYPOINT [ "./entrypoint.sh" ]
