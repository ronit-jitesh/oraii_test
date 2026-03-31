import xml.etree.ElementTree as ET
import sys

def extract_text_from_xml(xml_path):
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        # Define the namespaces used in Word documents
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text_elements = []
        for text in root.findall('.//w:t', namespaces):
            if text.text:
                text_elements.append(text.text)
        
        return ' '.join(text_elements)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    path = r'c:\Users\omana\Downloads\RAY\clinical-copilot\temp_docx_content\word\document.xml'
    content = extract_text_from_xml(path)
    with open('extracted_changes.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Extracted text saved to extracted_changes.txt")
