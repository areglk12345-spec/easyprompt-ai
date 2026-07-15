import os
import re

frontend_dir = r'c:\Users\aregl\Downloads\easyprompt-ai-project\frontend\src'

# Rename ChatSidebar.tsx to GlobalSidebar.tsx
old_sidebar = os.path.join(frontend_dir, 'components', 'ChatSidebar.tsx')
new_sidebar = os.path.join(frontend_dir, 'components', 'GlobalSidebar.tsx')

if os.path.exists(old_sidebar):
    os.rename(old_sidebar, new_sidebar)
    print("Renamed ChatSidebar to GlobalSidebar")

# Also update ChatSidebar usage in chat/page.tsx
chat_page_path = os.path.join(frontend_dir, 'app', 'chat', 'page.tsx')
with open(chat_page_path, 'r', encoding='utf-8') as f:
    chat_content = f.read()
chat_content = chat_content.replace("ChatSidebar", "GlobalSidebar")
with open(chat_page_path, 'w', encoding='utf-8') as f:
    f.write(chat_content)


pages_to_update = {
    'page.tsx': {'title': 'Dashboard', 'subtitle': 'หน้าหลักควบคุมการใช้งาน'},
    'history/page.tsx': {'title': 'ประวัติการแชท', 'subtitle': 'ดูประวัติการแชทและการใช้งานทั้งหมด'},
    'doctor/page.tsx': {'title': 'Prompt Doctor', 'subtitle': 'วินิจฉัยและปรับปรุง Prompt ของคุณให้สมบูรณ์'},
    'templates/page.tsx': {'title': 'Templates Library', 'subtitle': 'คลังเทมเพลต Prompt พร้อมใช้งาน'},
    'settings/page.tsx': {'title': 'การตั้งค่าระบบ', 'subtitle': 'จัดการข้อมูลส่วนตัวและการแสดงผล'},
    'knowledge/page.tsx': {'title': 'Knowledge Base', 'subtitle': 'อัปโหลดเอกสารเพื่อให้ AI เรียนรู้'},
    'marketplace/page.tsx': {'title': 'Marketplace', 'subtitle': 'ตลาดซื้อขาย Prompt และ Template'}
}

header_pattern = re.compile(r'<header.*?</header>', re.DOTALL)

for page_rel, info in pages_to_update.items():
    page_path = os.path.join(frontend_dir, 'app', page_rel.replace('/', os.sep))
    if not os.path.exists(page_path):
        continue

    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    if "import Sidebar" in content:
        content = content.replace("import Sidebar from '../components/Sidebar';", "import GlobalSidebar from '../components/GlobalSidebar';\nimport GlobalHeader from '../components/GlobalHeader';")
        content = content.replace("import Sidebar from '../../components/Sidebar';", "import GlobalSidebar from '../../components/GlobalSidebar';\nimport GlobalHeader from '../../components/GlobalHeader';")

    # 2. Sidebar component
    content = content.replace('<Sidebar ', '<GlobalSidebar ')

    # 3. Header component
    new_header = f'<GlobalHeader title="{info["title"]}" subtitle="{info["subtitle"]}" />'
    content = header_pattern.sub(new_header, content)

    # 4. Background color fix
    content = content.replace('bg-white dark:bg-slate-900 overflow-x-hidden relative transition-colors duration-300"', 'bg-[#f5f6fb] dark:bg-slate-900 overflow-x-hidden relative transition-colors duration-300"')
    content = content.replace('bg-white dark:bg-slate-900 overflow-y-auto relative transition-colors duration-300"', 'bg-[#f5f6fb] dark:bg-slate-900 overflow-y-auto relative transition-colors duration-300"')

    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated all pages!")
