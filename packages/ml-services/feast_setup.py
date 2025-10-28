"""
Feast Feature Store Setup
Defines feature definitions and configures online/offline stores
"""

from feast import Entity, Feature, FeatureView, FileSource, ValueType
from feast.repo_config import RepoConfig
from datetime import timedelta
import os

# Feature Store Configuration
FEAST_REPO_PATH = os.getenv('FEAST_REPO_PATH', '/app/feast')
ONLINE_STORE_TYPE = os.getenv('FEAST_ONLINE_STORE', 'redis')
OFFLINE_STORE_TYPE = os.getenv('FEAST_OFFLINE_STORE', 'file')

# Entity Definitions
property_entity = Entity(
    name="property_id",
    value_type=ValueType.STRING,
    description="Property unique identifier"
)

spv_entity = Entity(
    name="spv_id",
    value_type=ValueType.STRING,
    description="SPV unique identifier"
)

user_entity = Entity(
    name="user_id",
    value_type=ValueType.STRING,
    description="User unique identifier"
)

# Feature Definitions

# Property Features
property_features_source = FileSource(
    path=f"{FEAST_REPO_PATH}/data/property_features.parquet",
    event_timestamp_column="timestamp",
)

property_features = FeatureView(
    name="property_features",
    entities=["property_id"],
    ttl=timedelta(days=1),
    features=[
        Feature(name="area_sqft", dtype=ValueType.FLOAT),
        Feature(name="bedrooms", dtype=ValueType.INT64),
        Feature(name="bathrooms", dtype=ValueType.INT64),
        Feature(name="year_built", dtype=ValueType.INT64),
        Feature(name="property_type", dtype=ValueType.STRING),
        Feature(name="location_lat", dtype=ValueType.FLOAT),
        Feature(name="location_lon", dtype=ValueType.FLOAT),
        Feature(name="monthly_rent", dtype=ValueType.FLOAT),
        Feature(name="occupancy_rate", dtype=ValueType.FLOAT),
        Feature(name="market_avg_price", dtype=ValueType.FLOAT),
    ],
    online=True,
    source=property_features_source,
    tags={"team": "ml", "category": "property"}
)

# SPV Features
spv_features_source = FileSource(
    path=f"{FEAST_REPO_PATH}/data/spv_features.parquet",
    event_timestamp_column="timestamp",
)

spv_features = FeatureView(
    name="spv_features",
    entities=["spv_id"],
    ttl=timedelta(days=1),
    features=[
        Feature(name="total_value", dtype=ValueType.FLOAT),
        Feature(name="property_count", dtype=ValueType.INT64),
        Feature(name="avg_occupancy", dtype=ValueType.FLOAT),
        Feature(name="total_rent_income", dtype=ValueType.FLOAT),
        Feature(name="debt_service_coverage", dtype=ValueType.FLOAT),
        Feature(name="loan_to_value", dtype=ValueType.FLOAT),
        Feature(name="rent_delinquency_rate", dtype=ValueType.FLOAT),
        Feature(name="maintenance_cost_ratio", dtype=ValueType.FLOAT),
        Feature(name="market_volatility", dtype=ValueType.FLOAT),
    ],
    online=True,
    source=spv_features_source,
    tags={"team": "ml", "category": "spv"}
)

# Market Features
market_features_source = FileSource(
    path=f"{FEAST_REPO_PATH}/data/market_features.parquet",
    event_timestamp_column="timestamp",
)

market_features = FeatureView(
    name="market_features",
    entities=["property_id"],
    ttl=timedelta(hours=6),
    features=[
        Feature(name="market_price_index", dtype=ValueType.FLOAT),
        Feature(name="market_growth_rate", dtype=ValueType.FLOAT),
        Feature(name="comparable_sales_avg", dtype=ValueType.FLOAT),
        Feature(name="days_on_market_avg", dtype=ValueType.FLOAT),
        Feature(name="rental_yield_avg", dtype=ValueType.FLOAT),
    ],
    online=True,
    source=market_features_source,
    tags={"team": "ml", "category": "market"}
)

# User Investment Features
user_features_source = FileSource(
    path=f"{FEAST_REPO_PATH}/data/user_features.parquet",
    event_timestamp_column="timestamp",
)

user_features = FeatureView(
    name="user_features",
    entities=["user_id"],
    ttl=timedelta(days=7),
    features=[
        Feature(name="total_invested", dtype=ValueType.FLOAT),
        Feature(name="portfolio_count", dtype=ValueType.INT64),
        Feature(name="avg_holding_period_days", dtype=ValueType.INT64),
        Feature(name="total_returns", dtype=ValueType.FLOAT),
        Feature(name="risk_tolerance", dtype=ValueType.STRING),
    ],
    online=True,
    source=user_features_source,
    tags={"team": "ml", "category": "user"}
)

def create_feature_repo_config():
    """Create Feast repository configuration"""
    config = {
        "project": "rwa_defi_platform",
        "registry": f"{FEAST_REPO_PATH}/registry.db",
        "provider": "local",
        "online_store": {
            "type": ONLINE_STORE_TYPE,
            "connection_string": os.getenv('REDIS_URL', 'localhost:6379'),
        },
        "offline_store": {
            "type": OFFLINE_STORE_TYPE,
            "path": f"{FEAST_REPO_PATH}/data"
        }
    }
    return config

def materialize_features(feature_store, start_date, end_date):
    """Materialize features to online store"""
    try:
        feature_store.materialize(start_date, end_date)
        print(f"Features materialized from {start_date} to {end_date}")
    except Exception as e:
        print(f"Error materializing features: {e}")

def get_online_features(feature_store, entity_rows, features):
    """Retrieve features from online store"""
    try:
        feature_vector = feature_store.get_online_features(
            features=features,
            entity_rows=entity_rows
        ).to_dict()
        return feature_vector
    except Exception as e:
        print(f"Error getting online features: {e}")
        return None

def get_historical_features(feature_store, entity_df, features):
    """Retrieve historical features for training"""
    try:
        training_df = feature_store.get_historical_features(
            entity_df=entity_df,
            features=features
        ).to_df()
        return training_df
    except Exception as e:
        print(f"Error getting historical features: {e}")
        return None

# Example usage
if __name__ == "__main__":
    print("Feast Feature Store Configuration")
    print(f"Repo Path: {FEAST_REPO_PATH}")
    print(f"Online Store: {ONLINE_STORE_TYPE}")
    print(f"Offline Store: {OFFLINE_STORE_TYPE}")
    
    print("\nDefined Entities:")
    print(f"- {property_entity.name}")
    print(f"- {spv_entity.name}")
    print(f"- {user_entity.name}")
    
    print("\nDefined Feature Views:")
    print(f"- {property_features.name} ({len(property_features.features)} features)")
    print(f"- {spv_features.name} ({len(spv_features.features)} features)")
    print(f"- {market_features.name} ({len(market_features.features)} features)")
    print(f"- {user_features.name} ({len(user_features.features)} features)")
