# Restoration Script for So'Mali POS System

$PROJECT_ROOT = "C:\Users\Abdulrahman\Desktop\IMS\somali-pos-system"
$MYSQL_EXE = "C:\xampp\mysql\bin\mysql.exe"
$DB_NAME = "ims_db"
$DB_USER = "root"
$DB_PASS = ""

Write-Host "=== So'Mali POS System Restoration ===" -ForegroundColor Yellow

# Select Backup File
$BACKUP_FILE = Read-Host "Please enter the full path of the .zip backup file"
if (!(Test-Path $BACKUP_FILE)) {
    Write-Error "File not found: $BACKUP_FILE"
    exit
}

$EXTRACT_DIR = "$PROJECT_ROOT\temp_restore"
if (!(Test-Path $EXTRACT_DIR)) { New-Item -ItemType Directory -Path $EXTRACT_DIR }

Write-Host "Extracting backup..." -ForegroundColor Cyan
Expand-Archive -Path $BACKUP_FILE -DestinationPath $EXTRACT_DIR -Force

# 1. Restore Database
Write-Host "Restoring database..." -ForegroundColor Cyan
$SQL_FILE = "$EXTRACT_DIR\database.sql"
if (Test-Path $SQL_FILE) {
    & $MYSQL_EXE --user=$DB_USER --password=$DB_PASS $DB_NAME < $SQL_FILE
    Write-Host "Database restored successfully." -ForegroundColor Green
} else {
    Write-Warning "database.sql not found in backup."
}

# 2. Restore Source Code
Write-Host "Restoring source code..." -ForegroundColor Cyan
# We use Robocopy to sync files back without deleting existing .env or other local-only configs if present
if (Test-Path "$EXTRACT_DIR\backend") {
    robocopy "$EXTRACT_DIR\backend" "$PROJECT_ROOT\backend" /E /NFL /NDL /NJH /NJS /nc /ns /np
}
if (Test-Path "$EXTRACT_DIR\frontend") {
    robocopy "$EXTRACT_DIR\frontend" "$PROJECT_ROOT\frontend" /E /NFL /NDL /NJH /NJS /nc /ns /np
}

# Cleanup
Remove-Item -Path $EXTRACT_DIR -Recurse -Force

Write-Host "Restoration completed. Note: You may need to run 'composer install' and 'npm install' if vendor/node_modules were missing." -ForegroundColor Green
