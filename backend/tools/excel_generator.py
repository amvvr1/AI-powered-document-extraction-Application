# Add this to tools/excel_generator.py
import pandas as pd
import json
from typing import Union, Dict, List

def json_to_excel(json_data: Union[str, Dict, List[Dict]], filename: str = "output.xlsx") -> str:
    if isinstance(json_data, str):
        json_data = json.loads(json_data)
    
    if isinstance(json_data, dict):
        json_data = [json_data]
    
    df = pd.DataFrame(json_data)
    df.to_excel(filename, index=False)
    
    return filename