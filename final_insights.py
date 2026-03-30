import json
import os

def update_en(data):
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        if "insights" in results:
            insights = results["insights"]
            if "edgeQuality" in insights:
                if "none" in insights["edgeQuality"]:
                    insights["edgeQuality"]["none"] = "You are likely trading without a real edge."
                if "tipNone" in insights["edgeQuality"]:
                    if "Fix this before risking more capital" not in insights["edgeQuality"]["tipNone"]:
                        insights["edgeQuality"]["tipNone"] = "Fix this before risking more capital. Review your last 20 losing trades to identify repeated entry errors."
            if "riskProfile" in insights:
                if "high" in insights["riskProfile"]:
                    insights["riskProfile"]["high"] = "Critical Drawdown Warning."
                if "tipHigh" in insights["riskProfile"] and "drain your account" not in insights["riskProfile"]["tipHigh"]:
                    insights["riskProfile"]["tipHigh"] = "Reduce your position sizes by 50% immediately. High drawdowns will drain your account over time."
    return data

def update_es(data):
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        if "insights" in results:
            insights = results["insights"]
            if "edgeQuality" in insights:
                if "none" in insights["edgeQuality"]:
                    insights["edgeQuality"]["none"] = "Probablemente estás operando sin una ventaja real."
                if "tipNone" in insights["edgeQuality"]:
                    if "Soluciona esto antes de arriesgar más capital" not in insights["edgeQuality"]["tipNone"]:
                        insights["edgeQuality"]["tipNone"] = "Soluciona esto antes de arriesgar más capital. Revisa tus últimas 20 operaciones perdedoras."
            if "riskProfile" in insights:
                if "high" in insights["riskProfile"]:
                    insights["riskProfile"]["high"] = "Advertencia Crítica de Drawdown."
                if "tipHigh" in insights["riskProfile"] and "drenarán tu cuenta" not in insights["riskProfile"]["tipHigh"]:
                    insights["riskProfile"]["tipHigh"] = "Reduce tus tamaños de posición en un 50% inmediatamente. Los altos drawdowns drenarán tu cuenta con el tiempo."
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
