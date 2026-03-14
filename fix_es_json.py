import os

path = r'c:\Users\Admin\Desktop\Proyectos\NodoQuant\messages\es.json'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the last occurrence of the pattern that ends the legal section properly
# We look for the "privacy" section ending, then "legal" ending, then "analyzer" ending, then root ending.
# Based on my reconstruction, it should end with:
#             }
#         }
#     }
# }

# Actually, I'll just find the first occurrence of "vacidad" or the duplicate "equityTitle" and cut before that.
cut_marker = '}vacidad"'
if cut_marker in content:
    content = content.split(cut_marker)[0] + '}' # Close the privacy object

# Now let's see where we are. 
# It should end with the privacy object closed. 
# We need to close legal, analyzer, and root.
if not content.strip().endswith('}'):
    content = content.strip() + '}'

# Ensure exactly 4 closing braces at the end with proper indentation
lines = content.splitlines()
# Remove any trailing incomplete braces or garbage
while lines and not lines[-1].strip().startswith('"') and not lines[-1].strip().startswith('}'):
    lines.pop()

# Reconstruct the end properly
found_privacy_end = False
for i in range(len(lines)-1, 0, -1):
    if '"sec5": "5. Tus Derechos"' in lines[i]:
        # We found the last valid line of privacy
        lines = lines[:i+1]
        lines.append('            }')
        lines.append('        }')
        lines.append('    }')
        lines.append('}')
        found_privacy_end = True
        break

if found_privacy_end:
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print("Fixed es.json successfully")
else:
    print("Could not find expected end pattern in es.json")
