"""
MLflow Setup and Configuration
Initializes MLflow tracking server and model registry
"""

import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import os
from pathlib import Path

# MLflow Configuration
MLFLOW_TRACKING_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000')
EXPERIMENT_NAME = 'rwa-defi-models'
MODEL_REGISTRY_NAME = 'rwa-models'

def setup_mlflow():
    """Initialize MLflow tracking and experiments"""
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    
    # Create experiment if it doesn't exist
    try:
        experiment_id = mlflow.create_experiment(
            EXPERIMENT_NAME,
            tags={
                "project": "rwa-defi-platform",
                "team": "ml-team",
                "version": "1.0.0"
            }
        )
        print(f"Created experiment: {EXPERIMENT_NAME} (ID: {experiment_id})")
    except Exception as e:
        experiment = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
        experiment_id = experiment.experiment_id
        print(f"Using existing experiment: {EXPERIMENT_NAME} (ID: {experiment_id})")
    
    mlflow.set_experiment(EXPERIMENT_NAME)
    return experiment_id

def register_model(model, model_name, run_id=None):
    """Register a trained model to MLflow Model Registry"""
    try:
        # Register model
        model_uri = f"runs:/{run_id}/model" if run_id else "model"
        registered_model = mlflow.register_model(
            model_uri=model_uri,
            name=model_name
        )
        
        print(f"Model registered: {model_name} (Version: {registered_model.version})")
        return registered_model
    except Exception as e:
        print(f"Error registering model: {e}")
        return None

def transition_model_stage(model_name, version, stage):
    """Transition model to a different stage (Staging, Production, Archived)"""
    client = MlflowClient()
    
    try:
        client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage=stage
        )
        print(f"Model {model_name} v{version} transitioned to {stage}")
    except Exception as e:
        print(f"Error transitioning model: {e}")

def log_model_metrics(metrics, params=None, artifacts=None):
    """Log model metrics, parameters, and artifacts to MLflow"""
    with mlflow.start_run() as run:
        # Log parameters
        if params:
            mlflow.log_params(params)
        
        # Log metrics
        if metrics:
            mlflow.log_metrics(metrics)
        
        # Log artifacts
        if artifacts:
            for artifact_name, artifact_path in artifacts.items():
                mlflow.log_artifact(artifact_path, artifact_name)
        
        return run.info.run_id

def load_production_model(model_name):
    """Load the production version of a model"""
    try:
        model_uri = f"models:/{model_name}/Production"
        model = mlflow.sklearn.load_model(model_uri)
        print(f"Loaded production model: {model_name}")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        # Fallback to latest version
        try:
            model_uri = f"models:/{model_name}/latest"
            model = mlflow.sklearn.load_model(model_uri)
            print(f"Loaded latest model: {model_name}")
            return model
        except:
            return None

def get_model_info(model_name, version=None):
    """Get information about a registered model"""
    client = MlflowClient()
    
    try:
        if version:
            model_version = client.get_model_version(model_name, version)
            return {
                "name": model_version.name,
                "version": model_version.version,
                "stage": model_version.current_stage,
                "run_id": model_version.run_id,
                "status": model_version.status
            }
        else:
            model = client.get_registered_model(model_name)
            return {
                "name": model.name,
                "latest_versions": [
                    {
                        "version": v.version,
                        "stage": v.current_stage
                    }
                    for v in model.latest_versions
                ]
            }
    except Exception as e:
        print(f"Error getting model info: {e}")
        return None

def compare_models(model_name, version1, version2, metric='accuracy'):
    """Compare two model versions based on a metric"""
    client = MlflowClient()
    
    try:
        # Get run IDs for both versions
        v1 = client.get_model_version(model_name, version1)
        v2 = client.get_model_version(model_name, version2)
        
        # Get metrics
        run1 = client.get_run(v1.run_id)
        run2 = client.get_run(v2.run_id)
        
        metric1 = run1.data.metrics.get(metric, 0)
        metric2 = run2.data.metrics.get(metric, 0)
        
        return {
            "version1": {
                "version": version1,
                "metric": metric1
            },
            "version2": {
                "version": version2,
                "metric": metric2
            },
            "better": version1 if metric1 > metric2 else version2
        }
    except Exception as e:
        print(f"Error comparing models: {e}")
        return None

if __name__ == "__main__":
    # Setup MLflow
    experiment_id = setup_mlflow()
    print(f"MLflow setup complete. Experiment ID: {experiment_id}")
    print(f"Tracking URI: {MLFLOW_TRACKING_URI}")
    print(f"Experiment Name: {EXPERIMENT_NAME}")
