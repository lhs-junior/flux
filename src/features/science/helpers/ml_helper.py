#!/usr/bin/env python3
"""
Machine learning helper using scikit-learn
Supports training, prediction, evaluation, and model management
"""

import sys
import json
import pickle
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from sklearn.cluster import KMeans
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, silhouette_score
)
import warnings

warnings.filterwarnings('ignore')


class ModelManager:
    """Manages ML models and their metadata"""

    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.metadata = {}

    def save_model(self, model_id: str, model: Any, scaler: Optional[Any] = None,
                   encoder: Optional[Any] = None, metadata: Optional[Dict] = None) -> None:
        """Save a model with its preprocessing components"""
        self.models[model_id] = model
        if scaler:
            self.scalers[model_id] = scaler
        if encoder:
            self.encoders[model_id] = encoder
        if metadata:
            self.metadata[model_id] = metadata

    def get_model(self, model_id: str) -> Optional[Any]:
        """Get a saved model"""
        return self.models.get(model_id)

    def get_scaler(self, model_id: str) -> Optional[Any]:
        """Get a saved scaler"""
        return self.scalers.get(model_id)

    def get_encoder(self, model_id: str) -> Optional[Any]:
        """Get a saved encoder"""
        return self.encoders.get(model_id)

    def get_metadata(self, model_id: str) -> Optional[Dict]:
        """Get model metadata"""
        return self.metadata.get(model_id)


# Global model manager instance
model_manager = ModelManager()


def create_model(algorithm: str, task_type: str, params: Optional[Dict] = None) -> Any:
    """Create a model instance based on algorithm and task type"""
    params = params or {}

    if algorithm == 'linear_regression':
        return LinearRegression(**params)
    elif algorithm == 'logistic_regression':
        return LogisticRegression(**params)
    elif algorithm == 'random_forest':
        if task_type == 'classification':
            return RandomForestClassifier(**params)
        else:
            return RandomForestRegressor(**params)
    elif algorithm == 'xgboost':
        # Check if xgboost is available
        try:
            from xgboost import XGBClassifier, XGBRegressor
            if task_type == 'classification':
                return XGBClassifier(**params)
            else:
                return XGBRegressor(**params)
        except ImportError:
            raise ImportError('XGBoost not installed. Install with: pip install xgboost')
    elif algorithm == 'svm':
        if task_type == 'classification':
            return SVC(**params)
        else:
            return SVR(**params)
    elif algorithm == 'kmeans':
        return KMeans(**params)
    else:
        raise ValueError(f'Unknown algorithm: {algorithm}')


def train(data: Dict[str, Any]) -> Dict[str, Any]:
    """Train a machine learning model"""
    try:
        X = np.array(data['X'])
        y = np.array(data['y'])
        algorithm = data['algorithm']
        task_type = data.get('task_type', 'regression')
        model_id = data.get('model_id', 'default_model')
        test_size = data.get('test_size', 0.2)
        params = data.get('params', {})
        scale = data.get('scale', False)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        # Scale features if requested
        scaler = None
        if scale:
            scaler = StandardScaler()
            X_train = scaler.fit_transform(X_train)
            X_test = scaler.transform(X_test)

        # Encode labels for classification
        encoder = None
        if task_type == 'classification':
            encoder = LabelEncoder()
            y_train = encoder.fit_transform(y_train)
            y_test = encoder.transform(y_test)

        # Create and train model
        model = create_model(algorithm, task_type, params)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)

        # Calculate metrics
        if task_type == 'regression':
            metrics = {
                'mse': float(mean_squared_error(y_test, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'mae': float(mean_absolute_error(y_test, y_pred)),
                'r2': float(r2_score(y_test, y_pred))
            }
        elif task_type == 'classification':
            metrics = {
                'accuracy': float(accuracy_score(y_test, y_pred)),
                'precision': float(precision_score(y_test, y_pred, average='weighted')),
                'recall': float(recall_score(y_test, y_pred, average='weighted')),
                'f1': float(f1_score(y_test, y_pred, average='weighted'))
            }
        else:  # clustering
            metrics = {
                'inertia': float(model.inertia_),
                'silhouette': float(silhouette_score(X_test, y_pred))
            }

        # Get feature importance if available
        feature_importance = None
        if hasattr(model, 'feature_importances_'):
            feature_importance = model.feature_importances_.tolist()
        elif hasattr(model, 'coef_'):
            feature_importance = model.coef_.tolist()

        # Save model
        metadata = {
            'algorithm': algorithm,
            'task_type': task_type,
            'n_features': X.shape[1],
            'n_samples': X.shape[0],
            'test_size': test_size,
            'params': params
        }
        model_manager.save_model(model_id, model, scaler, encoder, metadata)

        return {
            'success': True,
            'model_id': model_id,
            'algorithm': algorithm,
            'task_type': task_type,
            'metrics': metrics,
            'feature_importance': feature_importance,
            'n_train': len(X_train),
            'n_test': len(X_test)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def predict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Make predictions using a trained model"""
    try:
        X = np.array(data['X'])
        model_id = data['model_id']

        # Get model and preprocessing components
        model = model_manager.get_model(model_id)
        if model is None:
            return {'success': False, 'error': f'Model not found: {model_id}'}

        scaler = model_manager.get_scaler(model_id)
        encoder = model_manager.get_encoder(model_id)

        # Apply preprocessing
        if scaler:
            X = scaler.transform(X)

        # Make predictions
        predictions = model.predict(X)

        # Decode predictions if encoder exists
        if encoder:
            predictions = encoder.inverse_transform(predictions.astype(int))

        # Get prediction probabilities if available
        probabilities = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X).tolist()

        return {
            'success': True,
            'predictions': predictions.tolist(),
            'probabilities': probabilities,
            'n_predictions': len(predictions)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def evaluate(data: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate a trained model on test data"""
    try:
        X = np.array(data['X'])
        y = np.array(data['y'])
        model_id = data['model_id']

        # Get model and metadata
        model = model_manager.get_model(model_id)
        if model is None:
            return {'success': False, 'error': f'Model not found: {model_id}'}

        metadata = model_manager.get_metadata(model_id)
        scaler = model_manager.get_scaler(model_id)
        encoder = model_manager.get_encoder(model_id)
        task_type = metadata.get('task_type', 'regression')

        # Apply preprocessing
        if scaler:
            X = scaler.transform(X)
        if encoder:
            y = encoder.transform(y)

        # Make predictions
        y_pred = model.predict(X)

        # Calculate metrics
        if task_type == 'regression':
            metrics = {
                'mse': float(mean_squared_error(y, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y, y_pred))),
                'mae': float(mean_absolute_error(y, y_pred)),
                'r2': float(r2_score(y, y_pred))
            }
        elif task_type == 'classification':
            metrics = {
                'accuracy': float(accuracy_score(y, y_pred)),
                'precision': float(precision_score(y, y_pred, average='weighted')),
                'recall': float(recall_score(y, y_pred, average='weighted')),
                'f1': float(f1_score(y, y_pred, average='weighted')),
                'confusion_matrix': confusion_matrix(y, y_pred).tolist()
            }
        else:  # clustering
            metrics = {
                'inertia': float(model.inertia_),
                'silhouette': float(silhouette_score(X, y_pred))
            }

        return {
            'success': True,
            'metrics': metrics,
            'n_samples': len(X)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def tune(data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform hyperparameter tuning using GridSearchCV"""
    try:
        X = np.array(data['X'])
        y = np.array(data['y'])
        algorithm = data['algorithm']
        task_type = data.get('task_type', 'regression')
        param_grid = data['param_grid']
        cv = data.get('cv', 5)
        scale = data.get('scale', False)

        # Scale features if requested
        if scale:
            scaler = StandardScaler()
            X = scaler.fit_transform(X)

        # Encode labels for classification
        if task_type == 'classification':
            encoder = LabelEncoder()
            y = encoder.fit_transform(y)

        # Create base model
        model = create_model(algorithm, task_type)

        # Perform grid search
        grid_search = GridSearchCV(model, param_grid, cv=cv, n_jobs=-1)
        grid_search.fit(X, y)

        return {
            'success': True,
            'best_params': grid_search.best_params_,
            'best_score': float(grid_search.best_score_),
            'cv_results': {
                'mean_scores': grid_search.cv_results_['mean_test_score'].tolist(),
                'std_scores': grid_search.cv_results_['std_test_score'].tolist()
            }
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def explain(data: Dict[str, Any]) -> Dict[str, Any]:
    """Explain model predictions and feature importance"""
    try:
        model_id = data['model_id']

        # Get model and metadata
        model = model_manager.get_model(model_id)
        if model is None:
            return {'success': False, 'error': f'Model not found: {model_id}'}

        metadata = model_manager.get_metadata(model_id)

        # Get feature importance
        feature_importance = None
        if hasattr(model, 'feature_importances_'):
            feature_importance = model.feature_importances_.tolist()
        elif hasattr(model, 'coef_'):
            coef = model.coef_
            if len(coef.shape) > 1:
                # Multi-class: average absolute coefficients
                feature_importance = np.mean(np.abs(coef), axis=0).tolist()
            else:
                feature_importance = np.abs(coef).tolist()

        # Get model parameters
        model_params = model.get_params()

        return {
            'success': True,
            'model_id': model_id,
            'algorithm': metadata.get('algorithm'),
            'task_type': metadata.get('task_type'),
            'feature_importance': feature_importance,
            'model_params': {k: str(v) for k, v in model_params.items()},
            'metadata': metadata
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def save_model_to_file(data: Dict[str, Any]) -> Dict[str, Any]:
    """Save a model to a pickle file"""
    try:
        model_id = data['model_id']
        filepath = data['filepath']

        model = model_manager.get_model(model_id)
        if model is None:
            return {'success': False, 'error': f'Model not found: {model_id}'}

        scaler = model_manager.get_scaler(model_id)
        encoder = model_manager.get_encoder(model_id)
        metadata = model_manager.get_metadata(model_id)

        # Save everything as a dictionary
        save_data = {
            'model': model,
            'scaler': scaler,
            'encoder': encoder,
            'metadata': metadata
        }

        with open(filepath, 'wb') as f:
            pickle.dump(save_data, f)

        return {
            'success': True,
            'filepath': filepath,
            'model_id': model_id
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def load_model_from_file(data: Dict[str, Any]) -> Dict[str, Any]:
    """Load a model from a pickle file"""
    try:
        filepath = data['filepath']
        model_id = data.get('model_id', 'loaded_model')

        with open(filepath, 'rb') as f:
            save_data = pickle.load(f)

        model = save_data['model']
        scaler = save_data.get('scaler')
        encoder = save_data.get('encoder')
        metadata = save_data.get('metadata', {})

        # Save to model manager
        model_manager.save_model(model_id, model, scaler, encoder, metadata)

        return {
            'success': True,
            'model_id': model_id,
            'filepath': filepath,
            'metadata': metadata
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}


def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        action = input_data.get('action')
        data = input_data.get('data', {})

        # Route to appropriate action
        if action == 'train':
            result = train(data)
        elif action == 'predict':
            result = predict(data)
        elif action == 'evaluate':
            result = evaluate(data)
        elif action == 'tune':
            result = tune(data)
        elif action == 'explain':
            result = explain(data)
        elif action == 'save':
            result = save_model_to_file(data)
        elif action == 'load':
            result = load_model_from_file(data)
        else:
            result = {
                'success': False,
                'error': f'Unknown action: {action}'
            }

        # Output result as JSON
        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
