import json
import os

def update_en(data):
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        # Ensure narrative.none is decisive
        if "narrative" in results and "none" in results["narrative"]:
            results["narrative"]["none"] = "You are likely trading without a real edge. Right now, you are risking capital without statistical proof."
            
        # Ensure diagnostic has the exact phrase
        if "diagnosis" in results and "noEdge" in results["diagnosis"]:
            results["diagnosis"]["noEdge"]["label"] = "Your strategy is not reliable."
            results["diagnosis"]["noEdge"]["subtitle"] = "You are likely trading without a real edge."
            results["diagnosis"]["noEdge"]["explanation"] = "Right now, you are risking capital without statistical proof."

        if "diagnosis" in results and "strongEdge" in results["diagnosis"]:
            results["diagnosis"]["strongEdge"]["label"] = "Your strategy has a statistical edge."
            results["diagnosis"]["strongEdge"]["subtitle"] = "Your results are consistent with a real advantage."
            results["diagnosis"]["strongEdge"]["explanation"] = "This strategy would likely survive real market conditions."

        if "nextSteps" in results and "noEdge" in results["nextSteps"]:
            results["nextSteps"]["noEdge"] = "Fix this before risking more capital."

        if "interpretation" in results and "insufficientSample" in results["interpretation"]:
            # Ensure consequence for insufficient data
            results["interpretation"]["insufficientSample"] = [
                "You need more trades before any verdict is valid.",
                "Your current metrics are unreliable.",
                "Do not risk real capital until you have proof."
            ]

    # Clean any "Current data does not demonstrate..." in report diagnosis
    if "analyzer" in data and "report" in data["analyzer"]:
        report = data["analyzer"]["report"]
        if "diagnosis" in report:
            if "noDesc" in report["diagnosis"]:
                report["diagnosis"]["noDesc"] = "Your strategy is not reliable. You are likely trading without a real edge. Right now, you are risking capital without statistical proof."

    return data

def update_es(data):
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        if "narrative" in results and "none" in results["narrative"]:
            results["narrative"]["none"] = "Probablemente estás operando sin una ventaja real. Ahora mismo, estás arriesgando capital sin pruebas estadísticas."

        if "diagnosis" in results and "noEdge" in results["diagnosis"]:
            results["diagnosis"]["noEdge"]["label"] = "Tu estrategia no es confiable."
            results["diagnosis"]["noEdge"]["subtitle"] = "Probablemente estás operando sin una ventaja real."
            results["diagnosis"]["noEdge"]["explanation"] = "Ahora mismo, estás arriesgando capital sin pruebas estadísticas."

        if "diagnosis" in results and "strongEdge" in results["diagnosis"]:
            results["diagnosis"]["strongEdge"]["label"] = "Tu estrategia tiene ventaja estadística."
            results["diagnosis"]["strongEdge"]["subtitle"] = "Tus resultados son consistentes con una ventaja real."
            results["diagnosis"]["strongEdge"]["explanation"] = "Esta estrategia probablemente sobreviviría en condiciones reales de mercado."

        if "nextSteps" in results and "noEdge" in results["nextSteps"]:
            results["nextSteps"]["noEdge"] = "Soluciona esto antes de arriesgar más capital."

        if "interpretation" in results and "insufficientSample" in results["interpretation"]:
            results["interpretation"]["insufficientSample"] = [
                "Necesitas más operaciones para un veredicto válido.",
                "Tus métricas actuales no son confiables.",
                "No arriesgues capital real hasta que tengas pruebas."
            ]

    if "analyzer" in data and "report" in data["analyzer"]:
        report = data["analyzer"]["report"]
        if "diagnosis" in report:
            if "noDesc" in report["diagnosis"]:
                report["diagnosis"]["noDesc"] = "Tu estrategia no es confiable. Probablemente estás operando sin una ventaja real. Ahora mismo, estás arriesgando capital sin pruebas estadísticas."

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
