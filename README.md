# Powerball AI - Backup Completo
## Fecha: 2026-01-16

Este repositorio contiene el backup completo y organizado del proyecto **Powerball AI** con todas sus secciones y componentes.

---

## Estructura del Proyecto

```
powerball_ai_backup_2026-01-16/
|
|-- section1_core/           # Core Backend (FastAPI)
|-- section2_api/            # API Modules
|-- section3_ui/             # Frontend React UI
|-- section4_database/       # SQLite Databases
|-- section5_positional/     # Positional Frequency Analysis
|-- section6_ai_robot/       # AI Robot Coach System
|-- section7_data/           # Historical Data & Scrapers
|-- section8_docs/           # Documentation
|-- section9_presentations/  # Investor Presentations
|-- archives/                # Original ZIP backups
|-- powerball_app_working/   # Proyecto funcional listo para ejecutar
|-- powerball_robot_v45/     # Robot Coach v45 standalone
```

## Proyecto Funcional (powerball_app_working/)

Proyecto completo listo para ejecutar con:
- **Frontend:** React + Vite + TailwindCSS (puerto 5179)
- **Backend:** FastAPI + SQLAlchemy (puerto 8000)
- **Robot Coach:** Interfaz completa en /robot
- **Base de datos:** SQLite con datos historicos

### Como ejecutar:
```bash
# Backend
cd powerball_app_working/backend
source venv/Scripts/activate
uvicorn app.main:app --reload --port 8000

# Frontend
cd powerball_app_working/frontend
npm run dev
```

---

## Descripcion de Secciones

### Section 1: Core Backend (`section1_core/`)
Contiene el nucleo del backend en FastAPI/Python.

| Archivo/Carpeta | Descripcion |
|-----------------|-------------|
| `app/` | Aplicacion principal FastAPI |
| `app/main.py` | Punto de entrada principal (~163K lineas) |
| `app/database.py` | Configuracion de base de datos |
| `app/models.py` | Modelos SQLAlchemy |
| `alembic/` | Migraciones de base de datos |
| `requirements.txt` | Dependencias Python |
| `main_backup_*.py` | Versiones anteriores del main |
| `MASTER_CONTRACT.md` | Contrato maestro del proyecto |

### Section 2: API Modules (`section2_api/`)
Modulos especializados de la API.

| Modulo | Descripcion |
|--------|-------------|
| `src/ai_assistants/` | Sistema de asistentes IA (engine, consensus, rescore) |
| `src/security/` | Rate limiting y middleware de seguridad |
| `src/telemetry/` | Telemetria y monitoreo |
| `src/jobs/` | Sistema de trabajos en background |
| `src/backtest/` | Backtesting de estrategias |
| `src/share/` | Compartir packs/estrategias |
| `src/optimize/` | Optimizacion de parametros |
| `src/export/` | Exportacion de datos |
| `docs/` | Documentacion de API (OpenAPI, contratos) |
| `scripts/` | Scripts de importacion de datos |
| `data/powerball.db` | Base de datos de la API |

### Section 3: Frontend UI (`section3_ui/`)
Interfaz de usuario en React/Vite.

| Carpeta | Descripcion |
|---------|-------------|
| `src/components/` | Componentes React (Tables, Panels, Cards) |
| `src/pages/` | Paginas principales (Dashboard, History, Settings) |
| `src/hooks/` | Custom hooks (useAsync, useDashboardData, etc.) |
| `src/lib/` | Librerias utilitarias (API, filters, suggestions) |
| `src/context/` | React Context (FilterResultsContext) |
| `src/layouts/` | Layouts de la aplicacion |
| `src/ai/` | Modulos de IA del cliente |
| `src/pwa/` | Progressive Web App (Service Worker) |
| `public/` | Assets estaticos |

**Componentes Principales:**
- `Table1.jsx` - Tabla principal de analisis (~71K lineas)
- `TopControlsPanel.jsx` - Panel de controles superior
- `SidebarFilters.jsx` - Filtros laterales
- `DecomposePanel.jsx` - Panel de descomposicion
- `PowerballRobotCoach.tsx` - Robot Coach IA (~32K lineas)
- `AnalyticsDashboard.tsx` - Dashboard de analiticas

### Section 4: Database (`section4_database/`)
Bases de datos SQLite del proyecto.

| Archivo | Descripcion | Tamano |
|---------|-------------|--------|
| `powerball.db` | DB principal | ~3.3 MB |
| `powerball_api.db` | DB de la API | ~4.4 MB |
| `database.db` | DB de desarrollo | - |

### Section 5: Positional Analysis (`section5_positional/`)
Modulo de analisis de frecuencia posicional.

| Archivo | Descripcion |
|---------|-------------|
| `components/Section5PositionalFrequencyPanel.jsx` | Panel principal de frecuencia |
| `components/Section5PositionCard.jsx` | Tarjetas por posicion |
| `hooks/useSection5SortController.js` | Controlador de ordenamiento |
| `lib/section5PositionalFrequency.js` | Logica de calculo |

### Section 6: AI Robot Coach (`section6_ai_robot/`)
Sistema completo de Robot Coach con IA.

**API Modules (`api_modules/ai_assistants/`):**
| Archivo | Descripcion |
|---------|-------------|
| `engine.py` | Motor principal de IA |
| `data_access.py` | Acceso a datos para IA |
| `consensus.py` | Sistema de consenso |
| `rescore.py` | Re-puntuacion de predicciones |
| `router.py` | Endpoints de la API |

**UI Modules (`ui_modules/ai/`):**
| Archivo | Descripcion |
|---------|-------------|
| `robotProIntents.ts` | Intents del robot (~12K) |
| `leagueVoiceIntents.ts` | Intents de voz de liga |
| `coachRules.ts` | Reglas del coach |
| `tournament.ts` | Sistema de torneos |
| `compareABC.ts` | Comparacion A/B/C |
| `exportPro.ts` | Exportacion profesional |
| `mentorPack.ts` | Pack de mentor |
| `presets.ts` | Presets predefinidos |
| `qualityAlerts.ts` | Alertas de calidad |
| `telemetryClient.ts` | Cliente de telemetria |
| `offlineFallback.ts` | Fallback offline |
| `profileMemory.ts` | Memoria de perfil |
| `goalParser.ts` | Parser de objetivos |
| `pdfExportClient.ts` | Exportacion a PDF |

### Section 7: Historical Data (`section7_data/`)
Datos historicos y herramientas de scraping.

**Datos CSV/Excel:**
| Archivo | Descripcion |
|---------|-------------|
| `powerball_merged_sorted.csv` | Datos completos ordenados |
| `powerball_draw_order_1992_to_date_MERGED.csv` | Orden de sorteo 1992-presente |
| `powerball_draw_order_pawnpower.csv/xlsx` | Datos de PawnPower |
| `powerball_drawn_order_1992_1997.csv/xlsx` | Datos 1992-1997 |
| `historicals/` | Archivos historicos de CloudResolve |

**Scrapers (`scrapers/`):**
| Script | Descripcion |
|--------|-------------|
| `powerball_drawn_order_1992_1997.py` | Scraper principal |
| `powerball_drawn_order_1992_1997_fixed.py` | Version corregida |
| `powerball_drawn_order_1992_1997_lottoamerica.py` | Scraper LottoAmerica |
| `powerball_manager.py` | Gestor de datos |

### Section 8: Documentation (`section8_docs/`)
Documentacion tecnica del proyecto.

| Archivo | Descripcion |
|---------|-------------|
| `api_contract.md` | Contrato completo de la API |
| `data-model.md` | Modelo de datos |
| `MASTER_CONTRACT.md` | Contrato maestro |
| `contracts/` | Contratos adicionales |
| `preflight/` | Checklist de pre-vuelo |

### Section 9: Presentations (`section9_presentations/`)
Presentaciones para inversores.

| Archivo | Descripcion |
|---------|-------------|
| `Powerball_Analytics_Investor_Deck.pptx` | Deck de inversores v1 |
| `Powerball_Analytics_Investor_Deck_v2.pptx` | Deck de inversores v2 |

### Archives (`archives/`)
Archivos ZIP originales para referencia.

| Archivo | Descripcion |
|---------|-------------|
| `powerball_ai_full_section5.zip` | Backup completo con Section 5 |
| `powerball_ai_robot_upgrades_v45.zip` | Upgrades del Robot v45 |
| `powerball_ai_section5_fixed_v2.zip` | Section 5 corregido v2 |
| `powerball_ai_section5_fixed_v3.zip` | Section 5 corregido v3 |
| `powerball_ai-main.zip` | Repo principal original |

---

## Tecnologias Utilizadas

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web
- **SQLAlchemy** - ORM
- **Alembic** - Migraciones
- **SQLite** - Base de datos

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **TypeScript** - Para componentes IA

### AI/ML
- Sistema de asistentes IA
- Motor de consenso
- Robot Coach interactivo

---

## Como Ejecutar

### Backend
```bash
cd section1_core
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd section3_ui
npm install
npm run dev
```

---

## Notas

- Este backup fue creado el **2026-01-16**
- Incluye todas las versiones y secciones del proyecto
- Los datos historicos cubren desde **1992 hasta la fecha**
- El sistema de IA Robot Coach es la version **v45**

---

## Autor

Proyecto Powerball AI - Backup generado automaticamente con Claude Code

