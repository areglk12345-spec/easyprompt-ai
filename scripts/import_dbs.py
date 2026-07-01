import os
import subprocess

dump_dir = "C:\\xampp\\mysql\\sqldumps_20260619_103414"

dbs = {
    "club_db": "club_db.sql",
    "easyprompt_db": "easyprompt_db.sql",
    "line oa prompt library": "line_oa_prompt_library.sql",
    "lineoa_ncsa": "lineoa_ncsa.sql",
    "prompt_bot_db": "prompt_bot_db.sql",
    "prompt_library": "prompt_library.sql"
}

for db, filename in dbs.items():
    print(f"Importing {db}...")
    
    # 1. Create database
    subprocess.run(["C:\\xampp\\mysql\\bin\\mysql.exe", "-u", "root", "-e", f"CREATE DATABASE IF NOT EXISTS `{db}`;"])
    
    # 2. Import data
    sql_file = os.path.join(dump_dir, filename)
    with open(sql_file, "rb") as f:
        result = subprocess.run(["C:\\xampp\\mysql\\bin\\mysql.exe", "-u", "root", db], stdin=f)
        if result.returncode != 0:
            print(f"Warning: import returned code {result.returncode} for {db}")

print("Import finished successfully!")
