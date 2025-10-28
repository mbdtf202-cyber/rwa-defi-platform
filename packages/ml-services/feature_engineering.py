"""
Feature Engineering Pipeline
Extracts and computes features for ML models
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Feature engineering for RWA properties"""
    
    def __init__(self):
        self.feature_cache = {}
    
    def extract_property_features(self, property_data: Dict) -> Dict:
        """Extract basic property features"""
        features = {}
        
        # Basic features
        features['area'] = property_data.get('area', 0)
        features['bedrooms'] = property_data.get('bedrooms', 0)
        features['bathrooms'] = property_data.get('bathrooms', 0)
        features['year_built'] = property_data.get('year_built', 2000)
        features['property_age'] = datetime.now().year - features['year_built']
        
        # Location features
        location = property_data.get('location', {})
        features['latitude'] = location.get('lat', 0)
        features['longitude'] = location.get('lon', 0)
        
        # Financial features
        features['purchase_price'] = property_data.get('purchase_price', 0)
        features['monthly_rent'] = property_data.get('monthly_rent', 0)
        features['annual_rent'] = features['monthly_rent'] * 12
        
        # Derived features
        if features['purchase_price'] > 0:
            features['rent_yield'] = (features['annual_rent'] / features['purchase_price']) * 100
            features['price_per_sqft'] = features['purchase_price'] / max(features['area'], 1)
        else:
            features['rent_yield'] = 0
            features['price_per_sqft'] = 0
        
        # Property type encoding
        property_type = property_data.get('type', 'RESIDENTIAL')
        features['is_commercial'] = 1 if property_type == 'COMMERCIAL' else 0
        features['is_residential'] = 1 if property_type == 'RESIDENTIAL' else 0
        features['is_mixed'] = 1 if property_type == 'MIXED' else 0
        
        return features
    
    def compute_time_series_features(self, historical_data: List[Dict]) -> Dict:
        """Compute time series features from historical data"""
        if not historical_data:
            return {}
        
        df = pd.DataFrame(historical_data)
        features = {}
        
        # Rent trends
        if 'rent' in df.columns:
            features['rent_mean'] = df['rent'].mean()
            features['rent_std'] = df['rent'].std()
            features['rent_trend'] = self._calculate_trend(df['rent'].values)
            features['rent_volatility'] = df['rent'].std() / df['rent'].mean() if df['rent'].mean() > 0 else 0
        
        # Occupancy trends
        if 'occupancy_rate' in df.columns:
            features['occupancy_mean'] = df['occupancy_rate'].mean()
            features['occupancy_std'] = df['occupancy_rate'].std()
            features['occupancy_trend'] = self._calculate_trend(df['occupancy_rate'].values)
        
        # Maintenance costs
        if 'maintenance_cost' in df.columns:
            features['maintenance_mean'] = df['maintenance_cost'].mean()
            features['maintenance_std'] = df['maintenance_cost'].std()
            features['maintenance_trend'] = self._calculate_trend(df['maintenance_cost'].values)
        
        return features
    
    def compute_market_features(self, market_data: Dict) -> Dict:
        """Compute market-related features"""
        features = {}
        
        # Market indicators
        features['market_avg_price'] = market_data.get('avg_price', 0)
        features['market_price_growth'] = market_data.get('price_growth', 0)
        features['market_rent_growth'] = market_data.get('rent_growth', 0)
        features['market_vacancy_rate'] = market_data.get('vacancy_rate', 0)
        
        # Economic indicators
        features['interest_rate'] = market_data.get('interest_rate', 0)
        features['inflation_rate'] = market_data.get('inflation_rate', 0)
        features['unemployment_rate'] = market_data.get('unemployment_rate', 0)
        
        # Location-specific
        features['neighborhood_score'] = market_data.get('neighborhood_score', 50)
        features['school_rating'] = market_data.get('school_rating', 5)
        features['crime_rate'] = market_data.get('crime_rate', 0)
        
        return features
    
    def compute_risk_features(self, property_data: Dict, financial_data: Dict) -> Dict:
        """Compute risk-related features"""
        features = {}
        
        # Delinquency risk
        features['rent_delinquency_rate'] = financial_data.get('delinquency_rate', 0)
        features['payment_delays'] = financial_data.get('payment_delays', 0)
        
        # Financial health
        features['debt_service_coverage'] = financial_data.get('dscr', 1.5)
        features['loan_to_value'] = financial_data.get('ltv', 0.7)
        features['cash_reserves'] = financial_data.get('cash_reserves', 0)
        
        # Operational risk
        features['maintenance_backlog'] = financial_data.get('maintenance_backlog', 0)
        features['tenant_turnover_rate'] = financial_data.get('turnover_rate', 0)
        features['avg_tenant_duration'] = financial_data.get('avg_tenant_duration', 12)
        
        # Market risk
        features['market_volatility'] = financial_data.get('market_volatility', 0.15)
        features['liquidity_score'] = financial_data.get('liquidity_score', 50)
        
        return features
    
    def compute_derived_features(self, all_features: Dict) -> Dict:
        """Compute derived features from existing features"""
        derived = {}
        
        # Profitability metrics
        if 'annual_rent' in all_features and 'purchase_price' in all_features:
            if all_features['purchase_price'] > 0:
                derived['cap_rate'] = (all_features['annual_rent'] / all_features['purchase_price']) * 100
        
        # Efficiency metrics
        if 'maintenance_mean' in all_features and 'annual_rent' in all_features:
            if all_features['annual_rent'] > 0:
                derived['maintenance_ratio'] = all_features['maintenance_mean'] / all_features['annual_rent']
        
        # Risk-adjusted returns
        if 'rent_yield' in all_features and 'market_volatility' in all_features:
            if all_features['market_volatility'] > 0:
                derived['sharpe_ratio'] = all_features['rent_yield'] / all_features['market_volatility']
        
        # Location score
        if 'neighborhood_score' in all_features and 'school_rating' in all_features:
            derived['location_score'] = (
                all_features['neighborhood_score'] * 0.6 +
                all_features['school_rating'] * 10 * 0.4
            )
        
        return derived
    
    def create_feature_vector(
        self,
        property_data: Dict,
        historical_data: Optional[List[Dict]] = None,
        market_data: Optional[Dict] = None,
        financial_data: Optional[Dict] = None
    ) -> Dict:
        """Create complete feature vector for a property"""
        
        # Extract all feature groups
        features = {}
        
        # Basic property features
        features.update(self.extract_property_features(property_data))
        
        # Time series features
        if historical_data:
            features.update(self.compute_time_series_features(historical_data))
        
        # Market features
        if market_data:
            features.update(self.compute_market_features(market_data))
        
        # Risk features
        if financial_data:
            features.update(self.compute_risk_features(property_data, financial_data))
        
        # Derived features
        features.update(self.compute_derived_features(features))
        
        return features
    
    def _calculate_trend(self, values: np.ndarray) -> float:
        """Calculate linear trend of time series"""
        if len(values) < 2:
            return 0.0
        
        x = np.arange(len(values))
        coefficients = np.polyfit(x, values, 1)
        return float(coefficients[0])
    
    def normalize_features(self, features: Dict) -> Dict:
        """Normalize features to [0, 1] range"""
        normalized = {}
        
        # Define normalization ranges
        ranges = {
            'area': (0, 10000),
            'bedrooms': (0, 10),
            'bathrooms': (0, 10),
            'property_age': (0, 100),
            'rent_yield': (0, 20),
            'occupancy_mean': (0, 1),
            'debt_service_coverage': (0, 3),
            'loan_to_value': (0, 1),
        }
        
        for key, value in features.items():
            if key in ranges:
                min_val, max_val = ranges[key]
                normalized[key] = (value - min_val) / (max_val - min_val)
                normalized[key] = max(0, min(1, normalized[key]))  # Clip to [0, 1]
            else:
                normalized[key] = value
        
        return normalized
    
    def get_feature_importance(self, model, feature_names: List[str]) -> Dict:
        """Get feature importance from trained model"""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return dict(zip(feature_names, importances))
        return {}


# Example usage
if __name__ == "__main__":
    engineer = FeatureEngineer()
    
    # Sample property data
    property_data = {
        'area': 2000,
        'bedrooms': 3,
        'bathrooms': 2,
        'year_built': 2010,
        'location': {'lat': 40.7128, 'lon': -74.0060},
        'purchase_price': 500000,
        'monthly_rent': 3000,
        'type': 'RESIDENTIAL'
    }
    
    # Sample historical data
    historical_data = [
        {'rent': 2800, 'occupancy_rate': 0.95, 'maintenance_cost': 500},
        {'rent': 2900, 'occupancy_rate': 0.92, 'maintenance_cost': 600},
        {'rent': 3000, 'occupancy_rate': 0.98, 'maintenance_cost': 550},
    ]
    
    # Sample market data
    market_data = {
        'avg_price': 450000,
        'price_growth': 0.05,
        'rent_growth': 0.03,
        'vacancy_rate': 0.05,
        'interest_rate': 0.04,
        'neighborhood_score': 75,
        'school_rating': 8,
    }
    
    # Sample financial data
    financial_data = {
        'delinquency_rate': 0.02,
        'dscr': 1.8,
        'ltv': 0.65,
        'market_volatility': 0.12,
    }
    
    # Create feature vector
    features = engineer.create_feature_vector(
        property_data,
        historical_data,
        market_data,
        financial_data
    )
    
    print("Extracted Features:")
    for key, value in sorted(features.items()):
        print(f"  {key}: {value:.4f}" if isinstance(value, float) else f"  {key}: {value}")
