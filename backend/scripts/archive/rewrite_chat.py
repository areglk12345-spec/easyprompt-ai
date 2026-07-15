import re
import os

filepath = r'c:\Users\aregl\Downloads\easyprompt-ai-project\frontend\src\app\chat\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Sidebar import
content = content.replace("import Sidebar from '../../components/Sidebar';", "import ChatSidebar from '../../components/ChatSidebar';\nimport { Sparkles, Zap, LayoutGrid, Paperclip, Mic, ArrowUp } from 'lucide-react';")

# Replace Sidebar component usage
content = content.replace('<Sidebar activePage="chat" onNewChat={startNewChat} />', '<ChatSidebar activePage="chat" onNewChat={startNewChat} />')

# Replace the Header
header_pattern = re.compile(r'<header className="sticky top-0 z-30 flex justify-between items-center pl-16 pr-4 md:px-12 w-full h-20 bg-white/80.*?</header>', re.DOTALL)

new_header = """<header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-10 w-full h-20 bg-[#f5f6fb] dark:bg-slate-900 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    พร้อมพ์ตี้ · ผู้ช่วยเขียน Prompt
                                </h1>
                                <span className="text-xs text-slate-500 font-medium">เล่าไอเดียมาแบบบ้าน ๆ เดี๋ยวเปลี่ยนให้เป็น Prompt มือโปรเอง</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Document Selector */}
                            {documents.length > 0 && (
                                <div className="flex items-center gap-2 mr-2">
                                    <span className="material-symbols-outlined text-slate-400 text-sm">folder_special</span>
                                    <select
                                        value={selectedDocument || ''}
                                        onChange={(e) => setSelectedDocument(e.target.value ? Number(e.target.value) : null)}
                                        className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-primary text-slate-600 dark:text-slate-300 max-w-[150px] truncate"
                                    >
                                        <option value="">-- ไม่แนบเอกสาร --</option>
                                        {documents.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.filename}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
                                <LayoutGrid size={16} /> ประกอบเอง
                            </button>
                            <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#fef6e5] dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold border border-[#f9e1b2] dark:border-amber-700/50 shadow-sm">
                                <Zap size={16} className="fill-amber-500 text-amber-500" /> {user?.credits ?? 0} เครดิต
                            </div>
                            <UserMenu />
                        </div>
                    </header>"""

content = header_pattern.sub(new_header, content)

# Change bg color of main chat area
content = content.replace('bg-white dark:bg-slate-900 overflow-hidden h-screen relative transition-colors duration-300"', 'bg-[#f5f6fb] dark:bg-slate-900 overflow-hidden h-screen relative transition-colors duration-300"')
content = content.replace('bg-slate-50/30 dark:bg-slate-900/50"', 'bg-transparent"')

# Rewrite Footer/Input Bar
footer_pattern = re.compile(r'<footer className="p-4 md:p-6 bg-gradient-to-t.*?</form>\s*</footer>', re.DOTALL)

new_footer = """<footer className="p-4 md:p-6 bg-gradient-to-t from-[#f5f6fb] via-[#f5f6fb]/90 to-transparent dark:from-[#020617] dark:via-[#020617]/90 shrink-0 sticky bottom-0 z-20 pointer-events-none">
                        <div className="max-w-3xl mx-auto mb-3 flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs md:text-sm mr-1">โทน:</span>
                                {[
                                    { key: 'เป็นกันเอง', label: '😊 เป็นกันเอง' },
                                    { key: 'ดูแพง', label: '💎 ดูแพง' },
                                    { key: 'ทางการ', label: '💼 ทางการ' },
                                    { key: 'สั้น', label: '⚡ สั้น' },
                                    { key: 'ใส่อิโมจิ', label: '😉 ใส่อิโมจิ' }
                                ].map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedTone(key)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                            selectedTone === key
                                                ? 'bg-indigo-500 border-indigo-500 text-white shadow-md hover:bg-indigo-600'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Model Selector */}
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 text-slate-600 dark:text-slate-300 font-bold text-xs"
                            >
                                <option value="gemini-3.1-flash-lite">⚡ Gemini Flash Lite</option>
                                <option value="gemini-3.1-pro">🧠 Gemini Pro</option>
                            </select>
                        </div>

                        {/* Attached Files Preview */}
                        {attachedFiles.length > 0 && (
                            <div className="max-w-3xl mx-auto mb-2 flex flex-wrap gap-2 pointer-events-auto">
                                {attachedFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{f.name}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-rose-500 hover:text-rose-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-md pointer-events-auto transition-all focus-within:ring-2 focus-within:ring-indigo-500/30">
                            
                            <input 
                                type="file" 
                                accept=".txt,.pdf" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleQuickUpload}
                            />
                            <input 
                                type="file" 
                                multiple
                                className="hidden" 
                                ref={attachFileInputRef} 
                                onChange={handleAttachFile}
                            />

                            <button
                                type="button"
                                onClick={() => attachFileInputRef.current?.click()}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Paperclip size={18} />
                            </button>

                            <input
                                id="chat-input"
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isLoading}
                                placeholder={isListening ? t('chat.placeholder_listening') : "เล่าไอเดียของคุณที่นี่..."}
                                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 disabled:opacity-50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 py-3 text-sm md:text-base"
                            />

                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isListening ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <Mic size={18} />
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading || !inputText.trim()}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ArrowUp size={20} strokeWidth={3} />
                            </button>
                        </form>
                    </footer>"""

content = footer_pattern.sub(new_footer, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated chat/page.tsx")
