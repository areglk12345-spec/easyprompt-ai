$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$oldData = "C:\xampp\mysql\data_corrupted_$dateStr"
Write-Host "Renaming C:\xampp\mysql\data to $oldData..."
Rename-Item -Path "C:\xampp\mysql\data" -NewName $oldData -ErrorAction Stop

Write-Host "Copying C:\xampp\mysql\backup to C:\xampp\mysql\data..."
Copy-Item -Path "C:\xampp\mysql\backup" -Destination "C:\xampp\mysql\data" -Recurse -ErrorAction Stop

$customDbs = @("club_db", "easyprompt_db", "line@0020oa@0020prompt@0020library", "lineoa_ncsa", "prompt_bot_db", "prompt_library")

foreach ($db in $customDbs) {
    if (Test-Path "$oldData\$db") {
        Write-Host "Restoring database folder: $db..."
        Copy-Item -Path "$oldData\$db" -Destination "C:\xampp\mysql\data\$db" -Recurse -ErrorAction Stop
    }
}

Write-Host "Restoring ibdata1..."
Copy-Item -Path "$oldData\ibdata1" -Destination "C:\xampp\mysql\data\ibdata1" -Force -ErrorAction Stop

Write-Host "Done! Please try starting MySQL from XAMPP Control Panel."
