from .document_reader import DocumentReader
from .requirement_processor import extract_requirements
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

def extract_data_from_doc(query:str, document: str) -> str:
    """extract the data from the documents the user specifies they needs """
    reader = DocumentReader()

    text = reader.read_document(document) 
    prompt = extract_requirements(query=query)

    extractor_prompt = f"""
you are responsible for extracting the requirements the user will say they want to extract from the text : {text}
the requirements you will extract are specified by the prompt: {prompt}
the output needs to be in a structured JSON data

IMPORTANT: Return ONLY valid JSON without any explanation or additional text. The response should start with {{ and end with }}.
"""

    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": extractor_prompt}]
    )

    content = response.choices[0].message.content
    
    # Clean the response to extract only JSON
    if content:
        content = content.strip()
        # Find the first { and last } to extract JSON
        start = content.find('{')
        end = content.rfind('}')
        if start != -1 and end != -1:
            content = content[start:end+1]
    
    return content

