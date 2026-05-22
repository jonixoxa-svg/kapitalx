@echo off
chcp 65001 >nul
title KapitalX - Perditeso schema dhe hape
color 0E
cd /d "%~dp0"

echo.
echo ============================================================
echo   Po aplikoj ndryshimet e reja te databazes
echo   (tabela: Attendance, Equipment, Payments, Fazat, Settings)
echo ============================================================
echo.

echo  --- prisma generate ---
call npx prisma generate
if errorlevel 1 (
    color 0C
    echo  GABIM gjate prisma generate
    pause
    exit /b 1
)

echo.
echo  --- prisma db push ---
call npx prisma db push
if errorlevel 1 (
    color 0C
    echo  GABIM gjate prisma db push
    echo  Sigurohu qe serveri i meparshem dev eshte i mbyllur dhe provo perseri.
    pause
    exit /b 1
)

color 0A
echo.
echo  Schema u perditesua. Po nis serverin...
echo.
echo  Adresa:  http://localhost:3000  (ose 3001 nese 3000 eshte i ze)
echo  Faqet e reja: Evidenca, Pajisjet, dhe tabet 'Pagesat' + 'Fazat' brenda projekteve
echo.

start "" /B cmd /c "timeout /t 10 >nul && start http://localhost:3000"

npm run dev
pause
