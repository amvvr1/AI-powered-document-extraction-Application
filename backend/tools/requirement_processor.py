from dotenv import load_dotenv
from openai import OpenAI
import os
load_dotenv()

client = OpenAI()

def extract_requirements(query: str) -> str:
    prompt = f"""
    convert the user request into a detailed and structured data extraction prompt:
 {query}  
    
    Create a prompt that instructs an AI to extract structured JSON data.
    Include field names, output format, and handling instructions.
"""
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content