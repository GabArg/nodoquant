import json
import os

path = r'c:\Users\Admin\Desktop\Proyectos\NodoQuant\messages\es.json'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# We identify the last known good part. 
# The 'strategies' section seemed okay up to early 1000s.
# Let's find where 'strategies' ends.

# To be safe, let's find the start of 'strategies' and rebuild from there if needed, 
# or just find a safe cutoff.
cutoff_key = '"strategies": {'
cutoff_pos = content.find(cutoff_key)

if cutoff_pos == -1:
    print("Could not find strategies key")
    exit(1)

# Let's keep the content up to the start of 'strategies' and append the rest.
# But wait, I have the full content of 'strategies' from previous reads.
# Line 966 to 1022 was strategies.
# Line 1023 was leaderboard.

# I'll try to find the last valid closure of 'analyzer'.
analyzer_start = content.find('"analyzer": {')
# Within analyzer, wizard starts at 545. wizard ends at 587. gate starts at 588. 
# report starts at 610. report ends at 668. upload starts at 669. upload ends at 687.
# results starts at 688. results ends at 756. insights starts at 757. insights ends at 806.
# diagnostics starts at 808. diagnostics ends at 837. fullReport starts at 838. fullReport ends at 964.
# strategies starts at 966.

# I'll cut at fullReport end.
cutoff_marker = '"strategies": {'
cutoff_pos = content.find(cutoff_marker)

if cutoff_pos == -1:
    # If not found, try something earlier
    cutoff_marker = '"fullReport": {'
    cutoff_pos = content.find(cutoff_marker)

if cutoff_pos == -1:
    print("Could not find cutoff marker")
    exit(1)

# Keep everything before the marker
new_content = content[:cutoff_pos]

# Append the remaining sections correctly
tail = r'''"strategies": {
            "metadata": {
                "title": "Biblioteca Pública de Estrategias — NodoQuant",
                "description": "Descubrí estrategias de trading de alto rendimiento. Explorá resultados backtesteados de Forex, Cripto y Acciones y Futuros de nuestra comunidad."
            },
            "hero": {
                "title": "Biblioteca de",
                "titleAccent": "Estrategias",
                "subtitle": "Explorá ventajas ganadoras verificadas por el algoritmo de NodoQuant. Datos reales, estadísticas reales, consistencia real."
            },
            "filters": {
                "marketLabel": "Mercado",
                "sortLabel": "Ordenar por:",
                "recent": "Más Recientes",
                "top": "Mejor Puntaje",
                "all": "Todos"
            },
            "empty": {
                "title": "No se encontraron estrategias",
                "desc": "No pudimos encontrar estrategias públicas que coincidan con tus filtros. ¡Sé el primero en publicar una!",
                "cta": "Analizá mi estrategia →"
            },
            "card": {
                "publishedAt": "Publicado {date}",
                "viewAnalysis": "Ver Análisis",
                "score": "Puntaje",
                "trades": "Operaciones",
                "winRate": "Win Rate",
                "profitFactor": "Profit Factor"
            },
            "profile": {
                "backLink": "Explorar Estrategias",
                "verifiedLabel": "Análisis Verificado",
                "defaultDescription": "Un análisis cuantitativo de estrategia enfocado en la ventaja estadística y métricas de robustez.",
                "shareX": "Compartir en X",
                "copyLink": "Copiar Enlace",
                "copiedAlert": "¡Enlace copiado al portapapeles!",
                "scoreSub": "Ventaja cuantitativa verificada por NodoQuant",
                "performanceTitle": "01 TRAYECTORIA DE RENDIMIENTO (R ACUMULADO)",
                "certificateTitle": "Certificado Oficial",
                "certificateDesc": "Descargá la tarjeta de puntuación certificada en alta resolución. Optimizada para compartir en redes y portfolios profesionales.",
                "certificateBtn": "Ver Certificado Oficial",
                "ctaTitle": "Probá tu propia estrategia",
                "ctaDesc": "¿Tenés una ventaja estadística real? Obtené tu informe cuantitativo en segundos.",
                "ctaBtn": "Analizar Gratis",
                "metadataTitle": "Contexto de Metadatos",
                "tradesAnalyzed": "Trades Analizados",
                "fingerprint": "Huella Digital del Análisis",
                "shareText": "Mi estrategia de trading obtuvo un puntaje de {score}/100 en NodoQuant.\n\nWin Rate: {wr}%\nProfit Factor: {pf}\nTrades analizados: {count}\n\nAnalizá tu propia estrategia:\n",
                "metrics": {
                    "accuracy": "Precisión",
                    "yield": "Calidad del Rendimiento",
                    "edge": "Ventaja de Mercado",
                    "risk": "Exposición al Riesgo"
                }
            }
        },
        "leaderboard": {
            "metadata": {
                "title": "Ranking Global de Estrategias — NodoQuant",
                "description": "Las estrategias de trading más consistentes del mundo, clasificadas por el algoritmo de NodoQuant. Compará el rendimiento de Forex, Cripto y Acciones."
            },
            "hero": {
                "badge": "Ranking Global",
                "title": "Ranking de",
                "titleAccent": "Estrategias",
                "subtitle": "Compará las ventajas de trading más robustas del mundo. Clasificadas por el puntaje de consistencia propietario de NodoQuant."
            },
            "table": {
                "rank": "Rango",
                "name": "Nombre de Estrategia",
                "score": "Puntaje",
                "winRate": "Win Rate",
                "pf": "PF",
                "trades": "Operaciones",
                "action": "Ver Perfil"
            },
            "tiers": {
                "elite": "Élite",
                "strong": "Ventaja Sólida",
                "moderate": "Ventaja Moderada",
                "weak": "Ventaja Débil"
            },
            "empty": "No se encontraron estrategias para este mercado.",
            "note": "Nota: Los rankings se recalculan cada 24 horas basándose en el Puntaje de Estrategia, el Retorno Ajustado por Riesgo y la Robustez Estadística. Solo las estrategias con historial verificado son elegibles para el Ranking Global."
        },
        "auth": {
            "login": {
                "title": "Iniciá sesión",
                "subtitle": "Bienvenido de nuevo a NodoQuant.",
                "emailLabel": "Email",
                "emailPlaceholder": "tu@email.com",
                "passwordLabel": "Contraseña",
                "passwordPlaceholder": "••••••••",
                "submit": "Ingresar a mi cuenta",
                "loading": "Ingresando...",
                "noAccount": "¿No tenés una cuenta?",
                "signupLink": "Registrate aquí"
            },
            "signup": {
                "title": "Creá tu cuenta",
                "subtitle": "Empezá a validar tus estrategias hoy.",
                "emailLabel": "Email",
                "emailPlaceholder": "tu@email.com",
                "passwordLabel": "Contraseña",
                "passwordPlaceholder": "Mín. 6 caracteres",
                "submit": "Crear mi cuenta gratuita",
                "loading": "Creando cuenta...",
                "haveAccount": "¿Ya tenés una cuenta?",
                "loginLink": "Ingresá aquí",
                "success": "¡Cuenta creada! Redirigiendo..."
            }
        },
        "layout": {
            "metadata": {
                "title": "NodoQuant — Descubrí tu ventaja en el trading",
                "description": "Subí tu historial de trading y descubrí si tu estrategia tiene una verdadera ventaja estadística. Análisis cuantitativo para traders serios.",
                "keywords": "backtesting, análisis de estrategias de trading, trading cuantitativo, análisis de operaciones, ventaja estadística, laboratorio cuantitativo"
            }
        },
        "charts": {
            "equityTitle": "Curva de Equidad",
            "equityLabel": "Profit Acumulado",
            "noData": "No hay datos de equidad disponibles",
            "trades": "Trades",
            "tradeNum": "Operación #{num}"
        },
        "legal": {
            "terms": {
                "title": "Términos de Servicio",
                "lastUpdated": "Última actualización: Marzo 2024",
                "sec1": "1. Aceptación de los Términos",
                "sec2": "2. Descripción del Servicio",
                "sec3": "3. Sin Asesoramiento Financiero",
                "sec4": "4. Exactitud del Usuario",
                "sec5": "5. Limitación de Responsabilidad"
            },
            "privacy": {
                "title": "Política de Privacidad",
                "lastUpdated": "Última actualización: Marzo 2024",
                "sec1": "1. Información que Recopilamos",
                "sec2": "2. Uso de Datos de Trading",
                "sec3": "3. Seguridad de Datos",
                "sec4": "4. Cookies",
                "sec5": "5. Tus Derechos"
            }
        }
    }
}'''

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content + tail)

# Verify validity
try:
    with open(path, 'r', encoding='utf-8') as f:
        json.load(f)
    print("es.json is now valid JSON")
except Exception as e:
    print(f"Error: es.json is still invalid: {e}")
