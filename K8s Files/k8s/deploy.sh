#!/bin/bash

echo "Applying Kubernetes manifests..."

# Apply namespace first
kubectl apply -f manifests/namespace.yaml

# Apply ConfigMap and Secret
kubectl apply -f manifests/backend-configmap.yaml
kubectl apply -f manifests/backend-secret.yaml

# Apply PVCs
kubectl apply -f manifests/mongo-pvc.yaml
kubectl apply -f manifests/app-logs-pvc.yaml

# Apply deployments and services
kubectl apply -f manifests/mongo-deployment.yaml
kubectl apply -f manifests/backend-deployment.yaml
kubectl apply -f manifests/frontend-deployment.yaml

echo "All resources have been applied."
echo "Frontend service available at NodePort 30173"
echo "Backend service available at NodePort 30300" 