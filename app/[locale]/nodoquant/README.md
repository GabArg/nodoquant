# NodoQuant — Página de servicios

Landing page profesional para el servicio de automatización de estrategias de trading y
backtesting cuantitativo para MetaTrader 5.

---

## Estructura de la página

| Sección              | Componente                          | Anchor     |
|----------------------|-------------------------------------|------------|
| Hero                 | `components/nodoquant/Hero.tsx`     | `#hero`    |
| Servicios            | `components/nodoquant/Services.tsx` | `#servicios` |
| ¿Se puede automatizar? | `StrategyProgrammable.tsx`        | —          |
| Proceso              | `components/nodoquant/Timeline.tsx` | `#proceso` |
| Precios              | `components/nodoquant/Pricing.tsx`  | `#precios` |
| Entregables          | `components/nodoquant/Deliverables.tsx` | `#entregables` |
| Bots (Próximamente)  | `components/nodoquant/BotsSoon.tsx` | `#bots`    |
| FAQ                  | `components/nodoquant/FAQ.tsx`      | `#faq`     |
| Formulario           | `components/nodoquant/LeadForm.tsx` | `#contacto` |
| Footer               | `components/nodoquant/FooterNote.tsx` | —        |

---

## Configuración de variables de entorno

Ver `.env.local.example` en la raíz del proyecto.

Crear `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Sin Supabase**: Los leads se guardan en `leads-dev.json` (raíz del proyecto).

---

## Cómo probar el formulario

### Modo fallback (sin Supabase)

1. No configurar `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
2. Iniciar el servidor: `npm run dev`
3. Ir a `http://localhost:3000/nodoquant#contacto`
4. Completar y enviar el formulario
5. Verificar `leads-dev.json` en la raíz del proyecto

### Modo Supabase

1. Crear tabla ejecutando `supabase/migrations/create_nodoquant_leads.sql`
2. Configurar las 3 env vars en `.env.local`
3. Reiniciar el servidor: `npm run dev`
4. Enviar el formulario y verificar en Supabase Table Editor → `nodoquant_leads`

---

## Rutas

- Landing page: `/nodoquant`
- API endpoint: `POST /api/nodoquant/lead`

---

## Desarrollo

```bash
npm install
npm run dev
# http://localhost:3000/nodoquant
```

## Build

```bash
npm run build
npm start
```
