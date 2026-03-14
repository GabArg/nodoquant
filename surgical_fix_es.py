import os

path = r'c:\Users\Admin\Desktop\Proyectos\NodoQuant\messages\es.json'

with open(path, 'rb') as f:
    data = f.read()

# Look for the last valid marker in bytes to avoid encoding issues
marker = b'"sec5": "5. Tus Derechos"'
if marker in data:
    # Find the last occurrence
    pos = data.rfind(marker)
    # Cut everything after the line containing this marker
    # We want to keep the next line which is the closing brace for the section
    # Let's find the next '\n' then next '}'
    line_end = data.find(b'\n', pos)
    if line_end == -1: line_end = len(data)
    
    # Actually, let's just cut at pos + length of marker
    # and then manually add the closing braces.
    
    new_content = data[:pos + len(marker)]
    new_content += b'\n            }\n        }\n    }\n}'
    
    with open(path, 'wb') as f:
        f.write(new_content)
    print("Surgically fixed es.json")
else:
    print("Could not find marker in es.json")
