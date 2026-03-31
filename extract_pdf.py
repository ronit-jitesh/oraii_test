from PyPDF2 import PdfReader

reader = PdfReader(r'c:\Users\omana\Downloads\RAY\clinical-copilot\Clinical Intelligence Operating System_ India-First Mental Health SaaS Strategic Analysis.pdf')
print(f'Total pages: {len(reader.pages)}')

with open(r'c:\Users\omana\Downloads\RAY\clinical-copilot\strategic_analysis_text.txt', 'w', encoding='utf-8') as f:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        f.write(f'\n===== PAGE {i+1} =====\n')
        f.write(text)
        f.write('\n')

print('Done! Text saved to strategic_analysis_text.txt')
