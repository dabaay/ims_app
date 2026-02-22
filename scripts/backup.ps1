param(
    [string]$type = "manual"
)

# Backup Script for So'Mali POS System

$PROJECT_ROOT = "C:\Users\Abdulrahman\Desktop\IMS\somali-pos-system"
$MOBILE_APP_ROOT = "C:\Users\Abdulrahman\Desktop\Dukaan App\dukaan_app"
$BACKUP_DIR = "$PROJECT_ROOT\backups"
$DATE = Get-Date -Format "yyyy-MM-dd_HHmm"
$MYSQL_PATH = "C:\xampp\mysql\bin\mysqldump.exe"
$DB_NAME = "ims_db"
$DB_USER = "root"
$DB_PASS = ""

# Valid types: manual, daily, weekly, monthly
if ($type -notin @("manual", "daily", "weekly", "monthly")) {
    $type = "manual"
}

$TARGET_DIR = "$BACKUP_DIR\$type"
if (!(Test-Path $TARGET_DIR)) { New-Item -ItemType Directory -Path $TARGET_DIR }

$TEMP_BACKUP = "$BACKUP_DIR\temp_backup_$DATE"
New-Item -ItemType Directory -Path $TEMP_BACKUP

# 1. Database Dump
Write-Host "Creating database backup..." -ForegroundColor Cyan
& $MYSQL_PATH --user=$DB_USER --password=$DB_PASS $DB_NAME --result-file="$TEMP_BACKUP\database.sql"

# 2. Source Code (excluding heavy folders)
Write-Host "Preparing source code backup..." -ForegroundColor Cyan
$excludeList = "*.git*", "*node_modules*", "*vendor*", "*storage/logs*", "*storage/framework/views*", "*backups*"

# Copy files using Robocopy (fast and handles exclusions well)
robocopy "$PROJECT_ROOT\backend" "$TEMP_BACKUP\backend" /E /XD .git node_modules vendor storage\logs storage\framework\views /XF .env /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "$PROJECT_ROOT\frontend" "$TEMP_BACKUP\frontend" /E /XD .git node_modules /NFL /NDL /NJH /NJS /nc /ns /np

# Include Mobile App
if (Test-Path "$MOBILE_APP_ROOT") {
    Write-Host "Including mobile app source..." -ForegroundColor Cyan
    robocopy "$MOBILE_APP_ROOT" "$TEMP_BACKUP\mobile_app" /E /XD .git .dart_tool build .idea windows\flutter\ephemeral /NFL /NDL /NJH /NJS /nc /ns /np
}

# 3. Create Zip
Write-Host "Zipping backup..." -ForegroundColor Cyan
$ZIP_PATH = "$TARGET_DIR\backup_$DATE.zip"

if (Test-Path "$TEMP_BACKUP") {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory("$TEMP_BACKUP", "$ZIP_PATH")
        Write-Host "Backup completed successfully: $ZIP_PATH" -ForegroundColor Green
    } catch {
        Write-Error "Failed to create ZIP: $_"
    }
} else {
    Write-Error "Temp backup directory not found: $TEMP_BACKUP"
}

# 4. Cleanup Temp
Remove-Item -Path $TEMP_BACKUP -Recurse -Force
