import json
import os

def update_en(data):
    # 1. Main Verdict - NO EDGE
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        if "diagnosis" in results:
            diag = results["diagnosis"]
            if "noEdge" in diag:
                diag["noEdge"]["label"] = "Your strategy is not reliable."
                diag["noEdge"]["subtitle"] = "You are likely trading without a real edge."
                diag["noEdge"]["explanation"] = "Right now, you are risking capital without statistical proof."
            if "strongEdge" in diag:
                diag["strongEdge"]["label"] = "Your strategy has a statistical edge."
                diag["strongEdge"]["subtitle"] = "Your results are consistent with a real advantage."
                diag["strongEdge"]["explanation"] = "This strategy would likely survive real market conditions."

        if "nextSteps" in results:
            if "noEdge" in results["nextSteps"]:
                results["nextSteps"]["noEdge"] = "Fix this before risking more capital."

        if "stability" in results:
            results["stability"]["title"] = "How stable your strategy really is"
            results["stability"]["microcopy"] = "Can your results survive randomness?"
            # Add a fallback for confidence just in case
            if "confidence" not in results["stability"]:
                results["stability"]["confidence"] = "{val}% Survival Likelihood"
        
        # Insights Cards
        if "narrative" in results:
            if "lowPf" in results["narrative"]:
                # "A Profit Factor below 1.0 means losses outweigh gains..." -> "Your losses are stronger than your gains..."
                results["narrative"]["lowPf"] = "Your losses are stronger than your gains. Review entry timing and stop loss placement before live trading."
        
        # interpretation
        if "interpretation" in results:
            if "noEdge" in results["interpretation"]:
                results["interpretation"]["noEdge"] = [
                    "Your losses are stronger than your gains.",
                    "You are likely losing money over time.",
                    "Your results depend on luck, not skill."
                ]
    
    # CTA Wizard
    if "analyzer" in data and "wizard" in data["analyzer"]:
        wizard = data["analyzer"]["wizard"]
        wizard["viewReport"] = "Unlock full analysis"
        wizard["viewReportSubtitle"] = "See failure scenarios, risk simulations, and real expectancy."
        wizard["diagnosticNoEdge"] = "Your strategy is not reliable. You are likely trading without a real edge."
        wizard["diagnosticEdgeFound"] = "Your strategy has a statistical edge. Your results are consistent with a real advantage."
        
        if "ctaSub" not in wizard:
            wizard["ctaSub"] = "See failure scenarios, risk simulations, and real expectancy."
            
    return data

def update_es(data):
    # Spanish translations mapped to the exact decisive tone
    if "analyzer" in data and "results" in data["analyzer"]:
        results = data["analyzer"]["results"]
        if "diagnosis" in results:
            diag = results["diagnosis"]
            if "noEdge" in diag:
                diag["noEdge"]["label"] = "Tu estrategia no es confiable."
                diag["noEdge"]["subtitle"] = "Probablemente estás operando sin una ventaja real."
                diag["noEdge"]["explanation"] = "Ahora mismo, estás arriesgando capital sin pruebas estadísticas."
            if "strongEdge" in diag:
                diag["strongEdge"]["label"] = "Tu estrategia tiene ventaja estadística."
                diag["strongEdge"]["subtitle"] = "Tus resultados son consistentes con una ventaja real."
                diag["strongEdge"]["explanation"] = "Esta estrategia probablemente sobreviviría en condiciones reales de mercado."

        if "nextSteps" in results:
            if "noEdge" in results["nextSteps"]:
                results["nextSteps"]["noEdge"] = "Soluciona esto antes de arriesgar más capital."

        if "stability" in results:
            results["stability"]["title"] = "Qué tan estable es realmente tu estrategia"
            results["stability"]["microcopy"] = "¿Pueden tus resultados sobrevivir a la aleatoriedad?"
            if "confidence" not in results["stability"]:
                results["stability"]["confidence"] = "{val}% Probabilidad de Supervivencia"

        if "narrative" in results:
            if "lowPf" in results["narrative"]:
                results["narrative"]["lowPf"] = "Tus pérdidas son más fuertes que tus ganancias. Revisa el momento de entrada y la colocación del stop loss antes de operar en vivo."

        if "interpretation" in results:
            if "noEdge" in results["interpretation"]:
                results["interpretation"]["noEdge"] = [
                    "Tus pérdidas son más fuertes que tus ganancias.",
                    "Es probable que pierdas dinero con el tiempo.",
                    "Tus resultados dependen de la suerte, no de la habilidad."
                ]

    if "analyzer" in data and "wizard" in data["analyzer"]:
        wizard = data["analyzer"]["wizard"]
        wizard["viewReport"] = "Desbloquear análisis completo"
        wizard["viewReportSubtitle"] = "Ver escenarios de falla, simulaciones de riesgo y esperanza real."
        wizard["diagnosticNoEdge"] = "Tu estrategia no es confiable. Probablemente estás operando sin una ventaja real."
        wizard["diagnosticEdgeFound"] = "Tu estrategia tiene ventaja estadística. Tus resultados son consistentes con una ventaja real."
        if "ctaSub" not in wizard:
            wizard["ctaSub"] = "Ver escenarios de falla, simulaciones de riesgo y esperanza real."

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
