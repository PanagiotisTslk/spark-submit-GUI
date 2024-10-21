#!/bin/bash

tee ~/.kube/config-kubectl > /dev/null <<EOT
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${CERTIFICATE_AUTHORITY_DATA}
    server: ${SERVER}
  name: microk8s-cluster
contexts:
- context:
    cluster: microk8s-cluster
    user: admin
  name: microk8s
current-context: microk8s
kind: Config
preferences: {}
users:
- name: admin
  user:
    client-certificate-data: ${CLIENT_CERTIFICATE_DATA}
    client-key-data: ${CLIENT_KEY_DATA}
EOT
