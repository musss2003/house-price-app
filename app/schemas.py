# app/schemas.py
from pydantic import BaseModel
from typing import List, Optional  # <- Add Optional here

class HouseFeatures(BaseModel):
    numerical: List[float]  # now includes true_price as 12th
    ocean_proximity: str

