"""
Data Pipeline for ML Feature Engineering
Collects data from blockchain, APIs, and databases
"""

import asyncio
import aiohttp
import pandas as pd
import numpy as np
from web3 import Web3
from datetime import datetime, timedelta
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:3000/api/v1')
BLOCKCHAIN_RPC_URL = os.getenv('BLOCKCHAIN_RPC_URL', 'http://localhost:8545')
DATA_OUTPUT_PATH = os.getenv('DATA_OUTPUT_PATH', '/app/feast/data')

class DataPipeline:
    """Main data pipeline for feature engineering"""
    
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC_URL))
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    # ========== Blockchain Data Collection ==========
    
    async def collect_blockchain_events(self, contract_address, from_block, to_block):
        """Collect events from smart contracts"""
        try:
            # Get contract events
            events = []
            
            # Example: Token Transfer events
            transfer_filter = {
                'fromBlock': from_block,
                'toBlock': to_block,
                'address': contract_address
            }
            
            logs = self.web3.eth.get_logs(transfer_filter)
            
            for log in logs:
                event_data = {
                    'block_number': log['blockNumber'],
                    'transaction_hash': log['transactionHash'].hex(),
                    'address': log['address'],
                    'topics': [t.hex() for t in log['topics']],
                    'data': log['data'].hex(),
                    'timestamp': self._get_block_timestamp(log['blockNumber'])
                }
                events.append(event_data)
            
            logger.info(f"Collected {len(events)} blockchain events")
            return events
        
        except Exception as e:
            logger.error(f"Error collecting blockchain events: {e}")
            return []
    
    def _get_block_timestamp(self, block_number):
        """Get timestamp for a block"""
        try:
            block = self.web3.eth.get_block(block_number)
            return datetime.fromtimestamp(block['timestamp'])
        except:
            return datetime.now()
    
    # ========== Backend API Data Collection ==========
    
    async def collect_spv_data(self):
        """Collect SPV data from backend API"""
        try:
            async with self.session.get(f"{BACKEND_API_URL}/spvs") as response:
                if response.status == 200:
                    spvs = await response.json()
                    logger.info(f"Collected {len(spvs)} SPVs")
                    return spvs
                else:
                    logger.error(f"Failed to fetch SPVs: {response.status}")
                    return []
        except Exception as e:
            logger.error(f"Error collecting SPV data: {e}")
            return []
    
    async def collect_property_data(self, spv_id):
        """Collect property data for an SPV"""
        try:
            async with self.session.get(f"{BACKEND_API_URL}/spvs/{spv_id}/properties") as response:
                if response.status == 200:
                    properties = await response.json()
                    return properties
                else:
                    return []
        except Exception as e:
            logger.error(f"Error collecting property data: {e}")
            return []
    
    async def collect_transaction_data(self, user_id=None):
        """Collect transaction history"""
        try:
            url = f"{BACKEND_API_URL}/transactions"
            if user_id:
                url += f"?userId={user_id}"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    transactions = await response.json()
                    logger.info(f"Collected {len(transactions)} transactions")
                    return transactions
                else:
                    return []
        except Exception as e:
            logger.error(f"Error collecting transaction data: {e}")
            return []
    
    # ========== External API Data Collection ==========
    
    async def collect_market_data(self, location):
        """Collect market data from external APIs"""
        try:
            # Placeholder for real estate market API
            # In production, integrate with Zillow, Redfin, etc.
            market_data = {
                'location': location,
                'avg_price_per_sqft': np.random.uniform(200, 500),
                'market_growth_rate': np.random.uniform(-0.05, 0.15),
                'days_on_market_avg': np.random.randint(30, 90),
                'rental_yield_avg': np.random.uniform(0.04, 0.08),
                'timestamp': datetime.now()
            }
            
            return market_data
        except Exception as e:
            logger.error(f"Error collecting market data: {e}")
            return None
    
    # ========== Feature Engineering ==========
    
    def engineer_property_features(self, property_data):
        """Extract and engineer property features"""
        features = {
            'property_id': property_data.get('id'),
            'area_sqft': property_data.get('area', 0),
            'bedrooms': property_data.get('bedrooms', 0),
            'bathrooms': property_data.get('bathrooms', 0),
            'year_built': property_data.get('yearBuilt', 2000),
            'property_type': property_data.get('type', 'RESIDENTIAL'),
            'location_lat': property_data.get('location', {}).get('lat', 0),
            'location_lon': property_data.get('location', {}).get('lon', 0),
            'monthly_rent': property_data.get('monthlyRent', 0),
            'occupancy_rate': property_data.get('occupancyRate', 0.85),
            'market_avg_price': property_data.get('marketAvgPrice', 1000),
            'timestamp': datetime.now()
        }
        
        # Derived features
        features['annual_rent'] = features['monthly_rent'] * 12
        features['price_per_sqft'] = features['market_avg_price']
        features['age'] = datetime.now().year - features['year_built']
        features['rental_yield'] = (features['annual_rent'] / 
                                   (features['area_sqft'] * features['price_per_sqft']))
        
        return features
    
    def engineer_spv_features(self, spv_data, properties):
        """Extract and engineer SPV features"""
        features = {
            'spv_id': spv_data.get('id'),
            'total_value': spv_data.get('totalValue', 0),
            'property_count': len(properties),
            'timestamp': datetime.now()
        }
        
        if properties:
            # Aggregate property features
            features['avg_occupancy'] = np.mean([p.get('occupancyRate', 0.85) for p in properties])
            features['total_rent_income'] = sum([p.get('monthlyRent', 0) * 12 for p in properties])
            features['avg_property_age'] = np.mean([
                datetime.now().year - p.get('yearBuilt', 2000) for p in properties
            ])
        else:
            features['avg_occupancy'] = 0.85
            features['total_rent_income'] = 0
            features['avg_property_age'] = 10
        
        # Risk metrics
        features['debt_service_coverage'] = 1.5  # Placeholder
        features['loan_to_value'] = 0.65  # Placeholder
        features['rent_delinquency_rate'] = 0.05  # Placeholder
        features['maintenance_cost_ratio'] = 0.10  # Placeholder
        features['market_volatility'] = 0.15  # Placeholder
        
        return features
    
    def engineer_user_features(self, user_data, transactions):
        """Extract and engineer user features"""
        features = {
            'user_id': user_data.get('id'),
            'timestamp': datetime.now()
        }
        
        if transactions:
            # Calculate investment metrics
            investments = [t for t in transactions if t.get('type') == 'MINT']
            redemptions = [t for t in transactions if t.get('type') == 'BURN']
            
            features['total_invested'] = sum([t.get('amount', 0) for t in investments])
            features['total_redeemed'] = sum([t.get('amount', 0) for t in redemptions])
            features['portfolio_count'] = len(set([t.get('tokenAddress') for t in investments]))
            
            # Calculate holding period
            if investments:
                first_investment = min([t.get('createdAt') for t in investments])
                features['avg_holding_period_days'] = (
                    datetime.now() - datetime.fromisoformat(first_investment)
                ).days
            else:
                features['avg_holding_period_days'] = 0
            
            # Calculate returns (simplified)
            features['total_returns'] = features['total_redeemed'] - features['total_invested']
        else:
            features['total_invested'] = 0
            features['total_redeemed'] = 0
            features['portfolio_count'] = 0
            features['avg_holding_period_days'] = 0
            features['total_returns'] = 0
        
        features['risk_tolerance'] = 'MEDIUM'  # Placeholder
        
        return features
    
    # ========== Data Quality ==========
    
    def validate_data_quality(self, df, feature_type):
        """Validate data quality and detect anomalies"""
        issues = []
        
        # Check for missing values
        missing = df.isnull().sum()
        if missing.any():
            issues.append(f"Missing values detected: {missing[missing > 0].to_dict()}")
        
        # Check for outliers (using IQR method)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = df[(df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)]
            if len(outliers) > 0:
                issues.append(f"Outliers detected in {col}: {len(outliers)} rows")
        
        # Check for duplicates
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            issues.append(f"Duplicate rows detected: {duplicates}")
        
        if issues:
            logger.warning(f"Data quality issues in {feature_type}: {issues}")
        else:
            logger.info(f"Data quality check passed for {feature_type}")
        
        return issues
    
    # ========== Pipeline Execution ==========
    
    async def run_pipeline(self):
        """Execute the complete data pipeline"""
        logger.info("Starting data pipeline...")
        
        # Collect SPV data
        spvs = await self.collect_spv_data()
        
        # Process each SPV
        property_features_list = []
        spv_features_list = []
        
        for spv in spvs:
            spv_id = spv.get('id')
            
            # Collect properties for this SPV
            properties = await self.collect_property_data(spv_id)
            
            # Engineer property features
            for prop in properties:
                prop_features = self.engineer_property_features(prop)
                property_features_list.append(prop_features)
            
            # Engineer SPV features
            spv_features = self.engineer_spv_features(spv, properties)
            spv_features_list.append(spv_features)
        
        # Convert to DataFrames
        property_df = pd.DataFrame(property_features_list)
        spv_df = pd.DataFrame(spv_features_list)
        
        # Validate data quality
        self.validate_data_quality(property_df, 'property_features')
        self.validate_data_quality(spv_df, 'spv_features')
        
        # Save to parquet files
        os.makedirs(DATA_OUTPUT_PATH, exist_ok=True)
        property_df.to_parquet(f"{DATA_OUTPUT_PATH}/property_features.parquet")
        spv_df.to_parquet(f"{DATA_OUTPUT_PATH}/spv_features.parquet")
        
        logger.info(f"Pipeline complete. Processed {len(property_df)} properties and {len(spv_df)} SPVs")
        
        return {
            'property_features': len(property_df),
            'spv_features': len(spv_df),
            'timestamp': datetime.now().isoformat()
        }

async def main():
    """Main entry point"""
    async with DataPipeline() as pipeline:
        result = await pipeline.run_pipeline()
        print(f"Pipeline execution result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
