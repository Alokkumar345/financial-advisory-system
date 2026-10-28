"""
FinAdvisor XAI — One-click ML Pipeline Runner
Usage: python ml/train.py
"""

import sys
import os

# Add ml folder to python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from train_models import train_and_evaluate_pipeline

if __name__ == "__main__":
    train_and_evaluate_pipeline()
