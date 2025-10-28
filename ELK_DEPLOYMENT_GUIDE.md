# ELK Stack Deployment Guide

Complete guide for deploying Elasticsearch, Logstash, and Kibana (ELK Stack) for centralized logging.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Usage](#usage)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The ELK Stack provides centralized logging for the RWA DeFi Platform:

- **Elasticsearch**: Distributed search and analytics engine for log storage
- **Logstash**: Data processing pipeline for log ingestion and transformation
- **Kibana**: Visualization and exploration interface
- **Filebeat**: Lightweight log shipper for collecting container logs

### Architecture

```
┌─────────────┐
│  Filebeat   │ (DaemonSet on each node)
│  (Shipper)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Logstash   │ (Processing Pipeline)
│ (Processor) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Elasticsearch│ (Storage & Search)
│  (Storage)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Kibana    │ (Visualization)
│    (UI)     │
└─────────────┘
```

---

## Prerequisites

### System Requirements

- Kubernetes cluster with at least 3 nodes
- 12 GB RAM minimum (4 GB per Elasticsearch node)
- 300 GB storage for logs
- StorageClass with SSD for performance

### Tools Required

- kubectl configured
- Helm (optional, for easier deployment)
- Access to cluster with admin privileges

---

## Deployment Steps

### 1. Create Namespace

```bash
kubectl create namespace logging
```

### 2. Deploy Elasticsearch

```bash
# Deploy Elasticsearch StatefulSet
kubectl apply -f k8s/production/logging/elasticsearch-deployment.yaml

# Wait for Elasticsearch to be ready
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s

# Verify Elasticsearch cluster health
kubectl exec -it elasticsearch-0 -n logging -- curl -X GET "localhost:9200/_cluster/health?pretty"
```

Expected output:
```json
{
  "cluster_name" : "rwa-platform-logs",
  "status" : "green",
  "number_of_nodes" : 3,
  "number_of_data_nodes" : 3
}
```

### 3. Deploy Logstash

```bash
# Deploy Logstash
kubectl apply -f k8s/production/logging/logstash-deployment.yaml

# Wait for Logstash to be ready
kubectl wait --for=condition=ready pod -l app=logstash -n logging --timeout=180s

# Check Logstash logs
kubectl logs -l app=logstash -n logging --tail=50
```

### 4. Deploy Kibana

```bash
# Deploy Kibana
kubectl apply -f k8s/production/logging/kibana-deployment.yaml

# Wait for Kibana to be ready
kubectl wait --for=condition=ready pod -l app=kibana -n logging --timeout=180s

# Get Kibana URL
kubectl get svc kibana -n logging
```

### 5. Deploy Filebeat

```bash
# Deploy Filebeat DaemonSet
kubectl apply -f k8s/production/logging/filebeat-daemonset.yaml

# Verify Filebeat is running on all nodes
kubectl get pods -l app=filebeat -n logging -o wide
```

---

## Configuration

### Elasticsearch Configuration

#### Index Lifecycle Management

Create ILM policy for log rotation:

```bash
kubectl exec -it elasticsearch-0 -n logging -- curl -X PUT "localhost:9200/_ilm/policy/rwa-platform-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

#### Index Template

```bash
kubectl exec -it elasticsearch-0 -n logging -- curl -X PUT "localhost:9200/_index_template/rwa-platform-template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["rwa-platform-*"],
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "index.lifecycle.name": "rwa-platform-policy",
      "index.lifecycle.rollover_alias": "rwa-platform"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "service": { "type": "keyword" },
        "environment": { "type": "keyword" },
        "kubernetes": {
          "properties": {
            "namespace": { "type": "keyword" },
            "pod": { "type": "keyword" },
            "container": { "type": "keyword" }
          }
        }
      }
    }
  }
}
'
```

### Kibana Configuration

#### Access Kibana

```bash
# Port forward to access locally
kubectl port-forward svc/kibana 5601:5601 -n logging

# Open browser
open http://localhost:5601
```

#### Create Index Pattern

1. Navigate to **Management** > **Stack Management** > **Index Patterns**
2. Click **Create index pattern**
3. Enter pattern: `rwa-platform-*`
4. Select time field: `@timestamp`
5. Click **Create index pattern**

#### Import Dashboards

Create a dashboard for monitoring:

1. Go to **Dashboard** > **Create dashboard**
2. Add visualizations:
   - Log volume over time (Line chart)
   - Error rate (Metric)
   - Top services by log count (Pie chart)
   - Recent errors (Data table)
   - Log level distribution (Bar chart)

---

## Verification

### 1. Check All Components

```bash
# Check all pods in logging namespace
kubectl get pods -n logging

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# elasticsearch-0             1/1     Running   0          10m
# elasticsearch-1             1/1     Running   0          9m
# elasticsearch-2             1/1     Running   0          8m
# logstash-xxx-yyy            1/1     Running   0          5m
# logstash-xxx-zzz            1/1     Running   0          5m
# kibana-xxx-yyy              1/1     Running   0          3m
# filebeat-xxx                1/1     Running   0          2m
# filebeat-yyy                1/1     Running   0          2m
```

### 2. Test Log Flow

```bash
# Generate test logs
kubectl run test-logger --image=busybox --restart=Never -- sh -c "while true; do echo 'Test log message'; sleep 1; done"

# Wait a minute, then search in Kibana
# Search query: message:"Test log message"

# Cleanup
kubectl delete pod test-logger
```

### 3. Check Elasticsearch Indices

```bash
kubectl exec -it elasticsearch-0 -n logging -- curl -X GET "localhost:9200/_cat/indices?v"
```

---

## Usage

### Searching Logs

#### Basic Search

In Kibana Discover:

```
# Search by service
kubernetes.labels.app:"rwa-backend"

# Search by log level
level:"ERROR"

# Search by time range
@timestamp:[now-1h TO now]

# Combine filters
level:"ERROR" AND kubernetes.labels.app:"rwa-backend"
```

#### Advanced Queries

```
# Search for specific error
message:"Database connection failed"

# Search with wildcards
message:*timeout*

# Search by user ID
user_id:"123456"

# Search for slow queries
response_time:>1000
```

### Creating Alerts

1. Go to **Stack Management** > **Rules and Connectors**
2. Click **Create rule**
3. Select **Elasticsearch query**
4. Configure:
   - Index: `rwa-platform-*`
   - Query: `level:"ERROR"`
   - Threshold: Count > 10 in 5 minutes
5. Add action (email, Slack, webhook)

### Saved Searches

Common saved searches:

1. **Critical Errors**
   ```
   level:"ERROR" OR level:"CRITICAL"
   ```

2. **Slow API Requests**
   ```
   response_time:>1000 AND kubernetes.labels.app:"rwa-backend"
   ```

3. **Failed Transactions**
   ```
   message:*transaction*failed*
   ```

4. **Security Events**
   ```
   message:*unauthorized* OR message:*forbidden*
   ```

---

## Maintenance

### Daily Tasks

```bash
# Check cluster health
kubectl exec -it elasticsearch-0 -n logging -- curl -X GET "localhost:9200/_cluster/health?pretty"

# Check disk usage
kubectl exec -it elasticsearch-0 -n logging -- df -h /usr/share/elasticsearch/data
```

### Weekly Tasks

```bash
# Review index sizes
kubectl exec -it elasticsearch-0 -n logging -- curl -X GET "localhost:9200/_cat/indices?v&s=store.size:desc"

# Check for unassigned shards
kubectl exec -it elasticsearch-0 -n logging -- curl -X GET "localhost:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason"
```

### Monthly Tasks

- Review and adjust ILM policies
- Optimize index templates
- Update Elasticsearch/Kibana versions
- Review and clean up old dashboards

### Backup

```bash
# Create snapshot repository
kubectl exec -it elasticsearch-0 -n logging -- curl -X PUT "localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backup"
  }
}
'

# Create snapshot
kubectl exec -it elasticsearch-0 -n logging -- curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_$(date +%Y%m%d)" -H 'Content-Type: application/json' -d'
{
  "indices": "rwa-platform-*",
  "ignore_unavailable": true,
  "include_global_state": false
}
'
```

---

## Troubleshooting

### Elasticsearch Issues

#### Cluster Status Yellow/Red

```bash
# Check shard allocation
kubectl exec -it elasticsearch-0 -n logging -- curl -X GET "localhost:9200/_cluster/allocation/explain?pretty"

# Retry failed shards
kubectl exec -it elasticsearch-0 -n logging -- curl -X POST "localhost:9200/_cluster/reroute?retry_failed=true"
```

#### Out of Disk Space

```bash
# Check disk usage
kubectl exec -it elasticsearch-0 -n logging -- df -h

# Delete old indices
kubectl exec -it elasticsearch-0 -n logging -- curl -X DELETE "localhost:9200/rwa-platform-2024.01.*"

# Or adjust watermark settings
kubectl exec -it elasticsearch-0 -n logging -- curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "90%",
    "cluster.routing.allocation.disk.watermark.high": "95%"
  }
}
'
```

### Logstash Issues

#### Pipeline Not Processing

```bash
# Check Logstash logs
kubectl logs -l app=logstash -n logging --tail=100

# Test Logstash configuration
kubectl exec -it $(kubectl get pod -l app=logstash -n logging -o jsonpath='{.items[0].metadata.name}') -n logging -- /usr/share/logstash/bin/logstash --config.test_and_exit -f /usr/share/logstash/pipeline/logstash.conf
```

### Kibana Issues

#### Cannot Connect to Elasticsearch

```bash
# Check Kibana logs
kubectl logs -l app=kibana -n logging --tail=100

# Verify Elasticsearch service
kubectl get svc elasticsearch -n logging

# Test connection from Kibana pod
kubectl exec -it $(kubectl get pod -l app=kibana -n logging -o jsonpath='{.items[0].metadata.name}') -n logging -- curl http://elasticsearch:9200
```

### Filebeat Issues

#### Not Collecting Logs

```bash
# Check Filebeat logs
kubectl logs -l app=filebeat -n logging --tail=100

# Verify Filebeat can reach Logstash
kubectl exec -it $(kubectl get pod -l app=filebeat -n logging -o jsonpath='{.items[0].metadata.name}') -n logging -- curl -v telnet://logstash:5044
```

---

## Performance Tuning

### Elasticsearch

```yaml
# Increase heap size
env:
- name: ES_JAVA_OPTS
  value: "-Xms4g -Xmx4g"

# Adjust thread pools
- name: thread_pool.write.queue_size
  value: "1000"
```

### Logstash

```yaml
# Increase workers
env:
- name: PIPELINE_WORKERS
  value: "4"
- name: PIPELINE_BATCH_SIZE
  value: "250"
```

---

## Security

### Enable Authentication

```yaml
# Elasticsearch
env:
- name: xpack.security.enabled
  value: "true"
- name: ELASTIC_PASSWORD
  valueFrom:
    secretKeyRef:
      name: elastic-credentials
      key: password
```

### Enable TLS

```yaml
# Generate certificates
kubectl create secret generic elastic-certificates \
  --from-file=elastic-certificates.p12 \
  -n logging

# Configure Elasticsearch
env:
- name: xpack.security.transport.ssl.enabled
  value: "true"
- name: xpack.security.transport.ssl.keystore.path
  value: "/usr/share/elasticsearch/config/elastic-certificates.p12"
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-28  
**Maintained By**: DevOps Team
