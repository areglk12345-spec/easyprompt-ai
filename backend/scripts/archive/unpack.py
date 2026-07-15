import json
import base64
import gzip
import os

html_file = r'c:\Users\aregl\Downloads\easyprompt-ai-project\ออกแบบหน้าแชท Iconic\export\EasyPrompt Chat v2.html'
out_dir = r'c:\Users\aregl\Downloads\easyprompt-ai-project\backend\unpacked'

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract manifest
import re
manifest_match = re.search(r'<script type="__bundler/manifest">(.*?)</script>', content, re.DOTALL)
if manifest_match:
    manifest = json.loads(manifest_match.group(1).strip())
    
    # Extract template
    template_match = re.search(r'<script type="__bundler/template">(.*?)</script>', content, re.DOTALL)
    template = json.loads(template_match.group(1).strip())
    
    for uuid, entry in manifest.items():
        data = base64.b64decode(entry['data'])
        if entry.get('compressed'):
            data = gzip.decompress(data)
        
        # We can write the data to a file for reference
        ext = 'txt'
        if entry['mime'] == 'text/css': ext = 'css'
        elif entry['mime'] == 'text/javascript': ext = 'js'
        elif 'image' in entry['mime']: ext = entry['mime'].split('/')[-1]
        
        # Replace the uuid in the template with a relative path
        filename = f"{uuid}.{ext}"
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'wb') as out_f:
            out_f.write(data)
            
        template = template.replace(uuid, filename)

    with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(template)
    
    print("Successfully unpacked to", out_dir)
else:
    print("Could not find manifest")
