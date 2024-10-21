FROM python:3.11
LABEL authors="panagiotis_tsolkas"

ENV DB_URL='localhost'
ENV DB_USERNAME=''
ENV DB_PASSWORD=''
ENV DB_PORT=27017
ENV DB_NAME='Kubernetes'
ENV PROXMOX='https://node83.imslab.gr/api2/json'

WORKDIR /KubernetesAPI
COPY ./* .
RUN python3 -m pip install -r requirements.txt
CMD ["python3", "app.py"]
