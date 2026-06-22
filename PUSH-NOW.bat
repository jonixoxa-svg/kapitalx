@echo off
title KapitalX - Push tani
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo  Po push-oj me token-in e ri ne GitHub...
echo ============================================================
echo.

git add -A
git commit -m "Add: project extra works (change orders)" 2>nul
git push

if errorlevel 1 (
    color 0C
    echo GABIM. Provo perseri.
    pause
    exit /b 1
)

color 0A
echo.
echo ============================================================
echo  SUKSES! Render po ribindon. Prit 5-10 min.
echo  Pas rebuild, hap projektin -^> tab Punet Shtese
echo ============================================================
pause
