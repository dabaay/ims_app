# So'Mali POS System - Backup & Restore Guide

This guide explains how to maintain safety for your system through automated backups and easy restoration.

## 1. How it Works

The backup system captures:

- **Database**: All your sales, customers, products, and accounting data.
- **Source Code**: The entire application (Backend & Frontend) so you can restore to any computer.

Backups are rotated based on time:

- **Daily**: Taken every day.
- **Weekly**: Taken every Sunday.
- **Monthly**: Taken on the 1st of every month.

## 2. Setting Up Automatic Backups (Daily)

To make the backups happen automatically every day on Windows:

1. Open **Task Scheduler** (Search for it in the Start Menu).
2. Click **Create Basic Task**.
3. Name it `POS_Backup`.
4. Trigger: Choose **Daily** and set a time (e.g., 11:00 PM).
5. Action: **Start a Program**.
6. Program/Script: `powershell.exe`
7. Add arguments: `-ExecutionPolicy Bypass -File "C:\Users\Abdulrahman\Desktop\IMS\somali-pos-system\scripts\backup.ps1"`
8. Finish.

## 3. How to Download Backups

You can now download backups directly from the system via the API or find them manually in:
`C:\Users\Abdulrahman\Desktop\IMS\somali-pos-system\backups`

## 4. How to Restore the System

If the system is deleted or you want to move it to a new place:

1. Open **PowerShell** as Administrator.
2. Navigate to the scripts folder:
   `cd C:\Users\Abdulrahman\Desktop\IMS\somali-pos-system\scripts`
3. Run the restore script:
   `.\restore.ps1`
4. Follow the prompt to paste the path to your `.zip` backup file.
5. The script will automatically re-extract all files and re-import the database.

> [!IMPORTANT]
> Always keep a copy of your backups on an external USB drive or Cloud storage (like Google Drive) to ensure they are safe if the computer itself fails.
