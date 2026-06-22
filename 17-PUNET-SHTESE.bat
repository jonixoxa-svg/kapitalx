@echo off
title KapitalX - Punet Shtese
color 0B
cd /d "%~dp0"

echo.
echo ============================================================
echo   PUSH: Punet Shtese ne projekte
echo   - Tab i ri Punet Shtese ne cdo projekt
echo   - Vlera shtohet ne kontrate kur aprovohet
echo   - Pagesat llogariten me vleren e re
echo ============================================================
echo.

git add -A
git commit -m "Add: project extra works (change orders)"
if errorlevel 1 echo Nuk ka ndryshime per commit

echo.
echo Po push-oj ne GitHub...
git push 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ============================================================
    echo  GABIM ne push. GitHub PAT mund te jete revokuar.
    echo.
    echo  Per te krijuar nje PAT te ri:
    echo   1. Hap: https://github.com/settings/tokens/new
    echo   2. Note: KapitalX deploy
    echo   3. Expiration: 90 days
    echo   4. Zgjedh fushen: repo (te plote)
    echo   5. Klik Generate token
    echo   6. KOPJO token-in qe del ^(filloj me ghp_^)
    echo.
    echo  Pastaj kthehu ketu dhe ngjit token-in me poshte:
    echo ============================================================
    echo.
    set /p NEW_TOKEN="Ngjit PAT-in e ri ketu dhe shtyp Enter: "

    if "%NEW_TOKEN%"=="" (
        echo  Token bosh - anulim
        pause
        exit /b 1
    )

    echo.
    echo Po perditesoj remote URL-in...
    git remote set-url origin https://jonixoxa-svg:%NEW_TOKEN%@github.com/jonixoxa-svg/kapitalx.git

    echo Po push-oj prap...
    git push
    if errorlevel 1 (
        color 0C
        echo GABIM perseri. Kontrollo token-in.
        pause
        exit /b 1
    )
)

color 0A
echo.
echo ============================================================
echo  SUKSES! Render po ribindon. Prit 5-10 min.
echo  Pas rebuild, hap projektin -^> tab Punet Shtese
echo ============================================================
pause
