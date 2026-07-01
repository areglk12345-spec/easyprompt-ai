import os
import subprocess
import datetime

dump_dir = f"C:\\xampp\\mysql\\sqldumps_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
os.makedirs(dump_dir, exist_ok=True)

dbs = {
    "club_db": "club_db.sql",
    "easyprompt_db": "easyprompt_db.sql",
    "line oa prompt library": "line_oa_prompt_library.sql",
    "lineoa_ncsa": "lineoa_ncsa.sql",
    "prompt_bot_db": "prompt_bot_db.sql",
    "prompt_library": "prompt_library.sql"
}

for db, filename in dbs.items():
    print(f"Dumping {db}...")
    out_path = os.path.join(dump_dir, filename)
    with open(out_path, "wb") as f:
        # Run mysqldump. Stderr will naturally print to console if any errors occur.
        result = subprocess.run(["C:\\xampp\\mysql\\bin\\mysqldump.exe", "-u", "root", db], stdout=f)
        if result.returncode != 0:
            print(f"Warning: mysqldump returned code {result.returncode} for {db}")

print(f"Done dumping to {dump_dir}")
