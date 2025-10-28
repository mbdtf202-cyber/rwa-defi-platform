# ML Services

Machine Learning services for RWA DeFi Platform.

## Features

- **Automated Valuation Model (AVM)**: Property valuation using ML
- **Risk Scoring**: Credit risk assessment
- **Predictive Maintenance**: Property maintenance predictions

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

## API Documentation

Visit http://localhost:8000/docs for interactive API documentation.

## Endpoints

- `POST /avm/predict` - Get property valuation
- `POST /risk/score` - Calculate risk score
- `POST /maintenance/predict` - Predict maintenance needs
- `POST /models/train` - Train models
- `GET /health` - Health check
