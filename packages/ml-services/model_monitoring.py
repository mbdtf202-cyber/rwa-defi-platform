"""
Model Monitoring and Drift Detection
Monitors model performance and detects data/concept drift
"""

import numpy as np
import pandas as pd
from scipy import stats
from datetime import datetime, timedelta
import logging
import json
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitor:
    """Monitor ML model performance and detect drift"""
    
    def __init__(self, model_name, window_size=1000):
        self.model_name = model_name
        self.window_size = window_size
        
        # Prediction history
        self.predictions = deque(maxlen=window_size)
        self.actuals = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        
        # Feature distributions (for drift detection)
        self.feature_distributions = {}
        self.baseline_distributions = {}
        
        # Performance metrics history
        self.metrics_history = []
        
        # Alert thresholds
        self.drift_threshold = 0.05  # KS test p-value
        self.performance_degradation_threshold = 0.10  # 10% degradation
    
    def log_prediction(self, features, prediction, actual=None):
        """Log a prediction for monitoring"""
        self.predictions.append(prediction)
        self.timestamps.append(datetime.now())
        
        if actual is not None:
            self.actuals.append(actual)
        
        # Update feature distributions
        for feature_name, feature_value in features.items():
            if feature_name not in self.feature_distributions:
                self.feature_distributions[feature_name] = deque(maxlen=self.window_size)
            self.feature_distributions[feature_name].append(feature_value)
    
    def set_baseline(self, features_df):
        """Set baseline feature distributions"""
        for column in features_df.columns:
            self.baseline_distributions[column] = features_df[column].values
        logger.info(f"Baseline set for {len(self.baseline_distributions)} features")
    
    def detect_data_drift(self):
        """Detect data drift using Kolmogorov-Smirnov test"""
        drift_detected = {}
        
        for feature_name, current_dist in self.feature_distributions.items():
            if feature_name not in self.baseline_distributions:
                continue
            
            baseline = self.baseline_distributions[feature_name]
            current = list(current_dist)
            
            if len(current) < 30:  # Need sufficient samples
                continue
            
            # Perform KS test
            statistic, p_value = stats.ks_2samp(baseline, current)
            
            drift_detected[feature_name] = {
                'statistic': float(statistic),
                'p_value': float(p_value),
                'drift': p_value < self.drift_threshold
            }
            
            if p_value < self.drift_threshold:
                logger.warning(f"Data drift detected in {feature_name}: p-value={p_value:.4f}")
        
        return drift_detected
    
    def detect_concept_drift(self):
        """Detect concept drift by monitoring prediction accuracy over time"""
        if len(self.actuals) < 50:
            return None
        
        # Calculate recent performance
        recent_predictions = list(self.predictions)[-50:]
        recent_actuals = list(self.actuals)[-50:]
        
        recent_mae = np.mean(np.abs(np.array(recent_predictions) - np.array(recent_actuals)))
        
        # Calculate historical performance
        if len(self.actuals) > 100:
            historical_predictions = list(self.predictions)[-100:-50]
            historical_actuals = list(self.actuals)[-100:-50]
            historical_mae = np.mean(np.abs(np.array(historical_predictions) - np.array(historical_actuals)))
            
            # Check for degradation
            degradation = (recent_mae - historical_mae) / historical_mae
            
            if degradation > self.performance_degradation_threshold:
                logger.warning(f"Concept drift detected: {degradation*100:.2f}% performance degradation")
                return {
                    'recent_mae': float(recent_mae),
                    'historical_mae': float(historical_mae),
                    'degradation': float(degradation),
                    'drift_detected': True
                }
        
        return {
            'recent_mae': float(recent_mae),
            'drift_detected': False
        }
    
    def calculate_performance_metrics(self):
        """Calculate current model performance metrics"""
        if len(self.actuals) < 10:
            return None
        
        predictions = np.array(list(self.predictions))
        actuals = np.array(list(self.actuals))
        
        # Regression metrics
        mae = np.mean(np.abs(predictions - actuals))
        mse = np.mean((predictions - actuals) ** 2)
        rmse = np.sqrt(mse)
        
        # R-squared
        ss_res = np.sum((actuals - predictions) ** 2)
        ss_tot = np.sum((actuals - np.mean(actuals)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
        
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
        
        metrics = {
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2': float(r2),
            'mape': float(mape),
            'sample_count': len(actuals),
            'timestamp': datetime.now().isoformat()
        }
        
        self.metrics_history.append(metrics)
        
        return metrics
    
    def get_prediction_latency_stats(self):
        """Calculate prediction latency statistics"""
        # This would be implemented with actual timing data
        # Placeholder implementation
        return {
            'mean_latency_ms': 50.0,
            'p50_latency_ms': 45.0,
            'p95_latency_ms': 80.0,
            'p99_latency_ms': 120.0
        }
    
    def generate_monitoring_report(self):
        """Generate comprehensive monitoring report"""
        report = {
            'model_name': self.model_name,
            'timestamp': datetime.now().isoformat(),
            'window_size': self.window_size,
            'predictions_count': len(self.predictions),
            'actuals_count': len(self.actuals)
        }
        
        # Performance metrics
        performance = self.calculate_performance_metrics()
        if performance:
            report['performance'] = performance
        
        # Data drift
        data_drift = self.detect_data_drift()
        if data_drift:
            report['data_drift'] = data_drift
            report['features_with_drift'] = [
                f for f, d in data_drift.items() if d['drift']
            ]
        
        # Concept drift
        concept_drift = self.detect_concept_drift()
        if concept_drift:
            report['concept_drift'] = concept_drift
        
        # Latency stats
        report['latency'] = self.get_prediction_latency_stats()
        
        # Alerts
        alerts = []
        if data_drift and report.get('features_with_drift'):
            alerts.append({
                'type': 'DATA_DRIFT',
                'severity': 'WARNING',
                'message': f"Data drift detected in {len(report['features_with_drift'])} features"
            })
        
        if concept_drift and concept_drift.get('drift_detected'):
            alerts.append({
                'type': 'CONCEPT_DRIFT',
                'severity': 'CRITICAL',
                'message': f"Performance degradation: {concept_drift['degradation']*100:.2f}%"
            })
        
        report['alerts'] = alerts
        
        return report
    
    def should_retrain(self):
        """Determine if model should be retrained"""
        # Check for concept drift
        concept_drift = self.detect_concept_drift()
        if concept_drift and concept_drift.get('drift_detected'):
            return True, "Concept drift detected"
        
        # Check for significant data drift
        data_drift = self.detect_data_drift()
        if data_drift:
            drifted_features = [f for f, d in data_drift.items() if d['drift']]
            if len(drifted_features) > len(data_drift) * 0.3:  # >30% features drifted
                return True, f"Significant data drift in {len(drifted_features)} features"
        
        # Check performance degradation over time
        if len(self.metrics_history) > 10:
            recent_r2 = np.mean([m['r2'] for m in self.metrics_history[-5:]])
            historical_r2 = np.mean([m['r2'] for m in self.metrics_history[-10:-5]])
            
            if recent_r2 < historical_r2 * 0.9:  # 10% R2 degradation
                return True, "Performance degradation detected"
        
        return False, "Model performing well"

class ModelRegistry:
    """Manage multiple model monitors"""
    
    def __init__(self):
        self.monitors = {}
    
    def register_model(self, model_name, window_size=1000):
        """Register a new model for monitoring"""
        if model_name not in self.monitors:
            self.monitors[model_name] = ModelMonitor(model_name, window_size)
            logger.info(f"Registered model for monitoring: {model_name}")
    
    def get_monitor(self, model_name):
        """Get monitor for a specific model"""
        return self.monitors.get(model_name)
    
    def generate_dashboard_data(self):
        """Generate data for monitoring dashboard"""
        dashboard = {
            'timestamp': datetime.now().isoformat(),
            'models': {}
        }
        
        for model_name, monitor in self.monitors.items():
            report = monitor.generate_monitoring_report()
            dashboard['models'][model_name] = report
        
        return dashboard

# Global registry
model_registry = ModelRegistry()

# Example usage
if __name__ == "__main__":
    # Create monitor
    monitor = ModelMonitor("avm_model")
    
    # Simulate predictions
    for i in range(100):
        features = {
            'area': np.random.uniform(1000, 3000),
            'bedrooms': np.random.randint(1, 5),
            'location_score': np.random.uniform(0, 1)
        }
        prediction = np.random.uniform(200000, 500000)
        actual = prediction + np.random.normal(0, 10000)
        
        monitor.log_prediction(features, prediction, actual)
    
    # Generate report
    report = monitor.generate_monitoring_report()
    print(json.dumps(report, indent=2))
    
    # Check if retraining needed
    should_retrain, reason = monitor.should_retrain()
    print(f"\nShould retrain: {should_retrain}")
    print(f"Reason: {reason}")
