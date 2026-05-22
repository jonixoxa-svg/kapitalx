# KapitalX

Aplikacion modern web për menaxhimin e projekteve të kompanive që merren me **konstruksione metalike** dhe **sisteme solare**.

![Tech](https://img.shields.io/badge/Next.js-15-black) ![Tech](https://img.shields.io/badge/Prisma-5-blue) ![Tech](https://img.shields.io/badge/PostgreSQL-16-blue)

## Veçoritë

- **Dashboard** — statistika, grafika mujore, projektet e fundit
- **Menaxhim Projektesh** — krijim, editim, fshirje, progres, filtrim & kërkim
- **Shpenzime Projekti** — 7 kategori, llogaritje automatike e kostos totale
- **Shpenzime të Përgjithshme** — qira, rrymë, paga administrative etj.
- **Menaxhim Punëtorësh** — caktim në projekte, ditë pune, pagesa automatike
- **Përmbledhje Financiare** — fitim bruto/neto, grafika, eksport PDF & Excel
- **Autentikim** — login/register me sistem rolesh (Admin / Manager / Viewer)
- **Ekstra** — ngarkim dokumentesh/fotosh, pamje kalendarike, log aktiviteti, dark mode

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · NextAuth v5 · Recharts · jsPDF · ExcelJS

## Instalimi

### 1. Kërkesat
- Node.js 18+
- PostgreSQL (lokal ose cloud — p.sh. Neon, Supabase)

### 2. Instalo paketat
```bash
npm install
```

### 3. Konfiguro mjedisin
Kopjo `.env.example` në `.env` dhe vendos lidhjen e databazës:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kapitalx"
AUTH_SECRET="ndrysho-kete-vlere-ne-prodhim"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Përgatit databazën
```bash
npm run db:generate    # gjenero Prisma Client
npm run db:push        # krijo tabelat
npm run db:seed        # mbush me të dhëna demo
```

### 5. Nis aplikacionin
```bash
npm run dev
```
Hap [http://localhost:3000](http://localhost:3000)

## Kredencialet Demo

| Roli    | Email                  | Fjalëkalimi  |
|---------|------------------------|--------------|
| Admin   | admin@kapitalx.com     | admin123     |
| Manager | manager@kapitalx.com   | manager123   |

## Struktura

```
kapitalx/
├── app/
│   ├── (auth)/          # login, register
│   ├── (dashboard)/     # dashboard, projects, expenses, workers, financial, calendar
│   └── api/             # API routes (REST)
├── components/
│   ├── layout/          # Sidebar, Header
│   ├── dashboard/       # grafika, stat cards, kalendar
│   ├── projects/        # forma & detaje projektesh
│   ├── workers/         # menaxhim punëtorësh
│   └── financial/       # përmbledhje financiare
├── lib/                 # prisma, auth, utils, export
├── prisma/              # schema.prisma, seed.ts
└── types/               # TypeScript types
```

## Rolet

- **Admin** — qasje e plotë, mund të fshijë çdo gjë
- **Manager** — krijon/editon projekte, shpenzime, punëtorë
- **Viewer** — vetëm shikim (read-only)

## Skriptet

| Komanda            | Përshkrimi                  |
|--------------------|-----------------------------|
| `npm run dev`      | Server zhvillimi            |
| `npm run build`    | Build për prodhim           |
| `npm run start`    | Server prodhimi             |
| `npm run db:push`  | Sinkronizo schema           |
| `npm run db:seed`  | Mbush të dhëna demo         |
| `npm run db:studio`| Hap Prisma Studio           |
