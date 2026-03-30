import json
import os

def update_en(data):
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        # STABILITY SECTION
        if "stability" in results:
            if "Most strategies fail here." not in results["stability"].get("microcopy", ""):
                results["stability"]["microcopy"] = "Can your results survive randomness? Most strategies fail here."
        
        # INSIGHTS
        if "narrative" in results:
            if "lowPf" in results["narrative"]:
                val = results["narrative"]["lowPf"]
                if "drain your account" not in val:
                    results["narrative"]["lowPf"] = "Your losses are stronger than your gains — this will drain your account over time. Review entry timing and stop loss placement before live trading."
        
        if "interpretation" in results:
            if "noEdge" in results["interpretation"]:
                arr = results["interpretation"]["noEdge"]
                if "drain your account" not in arr[0]:
                    arr[0] = "Your losses are stronger than your gains — this will drain your account over time."
                    results["interpretation"]["noEdge"] = arr
                    
    if "analyzer" in data and "wizard" in data["analyzer"]:
        wizard = data["analyzer"]["wizard"]
        if "Know the truth" not in wizard.get("viewReportSubtitle", ""):
            wizard["viewReportSubtitle"] = "See failure scenarios, risk simulations, and real expectancy. Know the truth before it costs you real money."
            
    return data

def update_es(data):
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        if "stability" in results:
            if "La mayoría de las estrategias fallan aquí." not in results["stability"].get("microcopy", ""):
                results["stability"]["microcopy"] = "¿Pueden tus resultados sobrevivir a la aleatoriedad? La mayoría de las estrategias fallan aquí."
        
        if "narrative" in results:
            if "lowPf" in results["narrative"]:
                val = results["narrative"]["lowPf"]
                if "drenarán tu cuenta" not in val:
                    results["narrative"]["lowPf"] = "Tus pérdidas son más fuertes que tus ganancias — esto drenará tu cuenta con el tiempo. Revisa el momento de entrada y la colocación del stop loss antes de operar en vivo."
                    
        if "interpretation" in results:
            if "noEdge" in results["interpretation"]:
                arr = results["interpretation"]["noEdge"]
                if "drenarán tu cuenta" not in arr[0]:
                    arr[0] = "Tus pérdidas son más fuertes que tus ganancias — esto drenará tu cuenta con el tiempo."
                    results["interpretation"]["noEdge"] = arr

    if "analyzer" in data and "wizard" in data["analyzer"]:
        wizard = data["analyzer"]["wizard"]
        if "Conoce la verdad" not in wizard.get("viewReportSubtitle", ""):
            wizard["viewReportSubtitle"] = "Ver escenarios de falla, simulaciones de riesgo y esperanza real. Conoce la verdad antes de que te cueste dinero real."

    return data

for lang, func in [("en", update_en), ("es", update_es)]:
    filepath = f"messages/{lang}.json"
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        data = func(data)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Updated {filepath}")
