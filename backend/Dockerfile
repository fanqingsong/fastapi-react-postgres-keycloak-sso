
FROM python:3.8.0

WORKDIR /backend

RUN apt-get install libpq-dev

COPY ./ /backend

RUN python -m pip install --upgrade pip -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
RUN python -m pip install -r requirements.txt -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com

ENTRYPOINT [ "./entrypoint.sh" ]
