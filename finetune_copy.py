import json
import os
import re

def aggressive_replace(text):
    if not isinstance(text, str):
        return text
    # Avoid replacing 'can' in 'Can your results survive randomness?' since user explicitly requested it
    if "Can your results survive randomness?" in text:
        return text
    
    # Replace weak terms
    text = re.sub(r'\bmay\b', 'likely', text, flags=re.IGNORECASE)
    text = re.sub(r'\bmight\b', 'likely', text, flags=re.IGNORECASE)
    # Be careful replacing 'can' - maybe skip it to avoid breaking 'can afford' etc.
    # It says 'can' -> 'will'. We will only replace 'can ' -> 'will ' contextually if needed.
    # But user explicit instruction: Avoid "may", "might", "can" -> prefer "will", "likely", "you are".
    
    return text

def traverse(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                obj[k] = aggressive_replace(v)
            elif isinstance(v, (dict, list)):
                traverse(v)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str):
                obj[i] = aggressive_replace(v)
            elif isinstance(v, (dict, list)):
                traverse(v)

def update_lang(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if "analyzer" in data:
            traverse(data["analyzer"].get("results", {}))
            traverse(data["analyzer"].get("report", {}))
        
        # We manually ensure some specific replacements in basic English if they match
        if "analyzer" in data and "results" in data["analyzer"]:
            r = data["analyzer"]["results"]
            if "weakEdge" in r.get("diagnosis", {}):
                # "Your edge is weak and may not last." -> "Your edge is fragile and likely will not last."
                v = r["diagnosis"]["weakEdge"].get("label", "")
                r["diagnosis"]["weakEdge"]["label"] = v.replace("may not last", "will likely fail")

            # "Some optimizations could lead to elite results." -> "You must optimize to survive."
            if "promising" in r.get("narrative", {}):
                r["narrative"]["promising"] = "Promising performance metrics. Optmization is required to reach elite results."

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Updated {filepath}")

update_lang("messages/en.json")
update_lang("messages/es.json")
