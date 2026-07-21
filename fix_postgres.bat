@echo off
echo ============================================
echo  STUDLYF HR - PostgreSQL Password Reset
echo ============================================
echo.

echo [1/4] Stopping PostgreSQL service...
net stop postgresql-x64-17
timeout /t 3 /nobreak >nul

echo [2/4] Starting PostgreSQL service (with trust auth)...
net start postgresql-x64-17
timeout /t 3 /nobreak >nul

echo [3/4] Resetting postgres password to 'postgres'...
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -h localhost -p 5432 -c "ALTER USER postgres WITH PASSWORD 'postgres';"

echo [4/4] Restoring scram-sha-256 authentication...
powershell -Command "(Get-Content 'C:\Program Files\PostgreSQL\17\data\pg_hba.conf') -replace 'trust','scram-sha-256' | Set-Content 'C:\Program Files\PostgreSQL\17\data\pg_hba.conf'"

echo Restarting PostgreSQL with secure auth...
net stop postgresql-x64-17
timeout /t 3 /nobreak >nul
net start postgresql-x64-17
timeout /t 3 /nobreak >nul

echo.
echo [5/5] Creating studlyf_hr database if it doesn't exist...
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -h localhost -p 5432 -c "SELECT 1 FROM pg_database WHERE datname='studlyf_hr';" | findstr /C:"1 row" >nul
if errorlevel 1 (
    "C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -h localhost -p 5432 -c "CREATE DATABASE studlyf_hr;"
    echo Database 'studlyf_hr' created!
) else (
    echo Database 'studlyf_hr' already exists.
)

echo.
echo ============================================
echo  SUCCESS! Password reset to 'postgres'
echo  You can now close this window.
echo ============================================
pause
