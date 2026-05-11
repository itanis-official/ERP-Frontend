# ERPFrontend - HR + CRM Integrated

## Overview
Unified frontend with module selector for CRM and HR modules.

## Quick Start
```bash
cd ERPFrontend
npm install
npm run dev
```

**URLs (port 5174 if 5173 busy):**
- Home/Selector: http://localhost:5174/
- CRM:
  - Dashboard: http://localhost:5174/crm/
  - Companies: http://localhost:5174/crm/companies
  - Pipeline: http://localhost:5174/crm/pipeline
  - Login: http://localhost:5174/crm/login
- HR:
  - Dashboard: http://localhost:5174/hr/
  - Personnel: http://localhost:5174/hr/personnel
  - Login: http://localhost:5174/hr/login

## Structure
```
src/
├── App.tsx (main router)
├── components/ModuleSelector.tsx
├── modules/
│   ├── crm/ (full CRM app)
│   └── hr/ (full HR app)
└── styles/
```

## Backend
Connect to ModuleCRM/ModuleRH APIs (Swagger data in their READMEs).

Integration complete!

