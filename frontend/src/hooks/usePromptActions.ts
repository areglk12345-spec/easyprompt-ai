import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function usePromptActions() {
    const { authFetch, user } = useAuth();

    const logActivity = async (action: string, promptType: string, category: string = 'ทั่วไป', score?: number) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            await authFetch(`${API_URL}/api/logs/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, prompt_type: promptType, category, score }),
            });
        } catch (e) {
            console.error("Failed to log activity:", e);
        }
    };

    const simplifyText = async (text: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/accessibility/simplify-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error('Simplification failed');
            return await response.json();
        } catch (e) {
            console.error("Failed to simplify text:", e);
            return null;
        }
    };

    const copyToClipboard = (text: string, source: string = 'chat') => {
        navigator.clipboard.writeText(text);
        toast.success("คัดลอก Prompt แล้ว!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
        logActivity('copy_prompt', source);
    };

    const downloadAsTxt = (text: string, title: string = "ezprompt") => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/\s+/g, "_")}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success("ดาวน์โหลดไฟล์ .txt แล้ว", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
    };

    const downloadAsMarkdown = (text: string, title: string = "ezprompt") => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/\s+/g, "_")}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success("ดาวน์โหลดไฟล์ .md แล้ว", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
    };

    const saveToTemplate = async (promptText: string, defaultTitle: string = "Prompt แบบฟอร์มของฉัน", source: string = 'chat') => {
        const title = window.prompt("ตั้งชื่อ Template นี้:", defaultTitle);
        if (!title) return;
        const category = window.prompt("ระบุหมวดหมู่:", "ทั่วไป");

        let orgName = 'ทั่วไป';
        if (user && user.organization && user.organization !== 'ทั่วไป') {
            const shareWithOrg = window.confirm(`ต้องการแชร์ Template นี้ให้ทุกคนในองค์กร [${user.organization}] เห็นร่วมกันหรือไม่?`);
            if (shareWithOrg) {
                orgName = user.organization;
            }
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: title, 
                    prompt_text: promptText, 
                    category: category || "ทั่วไป",
                    organization: orgName
                }),
            });

            if (!response.ok) throw new Error('Failed to save template');

            toast.success("บันทึก Template สำเร็จแล้ว!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
            logActivity('save_template', source, category || 'ทั่วไป');
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error("เกิดข้อผิดพลาด ไม่สามารถบันทึกได้", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
        }
    };



    const exportToPlatform = (platform: 'chatgpt' | 'claude' | 'copilot' | 'gemini', promptText: string, source: string = 'chat') => {
        logActivity(`export_${platform}`, source);
        try {
            navigator.clipboard.writeText(promptText);
        } catch (e) {
            console.error("Clipboard copy error:", e);
        }
        
        const platformNames: Record<string, string> = {
            chatgpt: 'ChatGPT',
            claude: 'Claude AI',
            copilot: 'Microsoft Copilot',
            gemini: 'Google Gemini'
        };

        toast.success(`คัดลอก Prompt แล้ว! กำลังนำคุณไปยัง ${platformNames[platform] || platform}`, {
            style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });

        let url = '';
        if (platform === 'chatgpt') url = `https://chatgpt.com/?q=${encodeURIComponent(promptText)}`;
        else if (platform === 'claude') url = `https://claude.ai/new?q=${encodeURIComponent(promptText)}`;
        else if (platform === 'copilot') url = `https://copilot.microsoft.com/?q=${encodeURIComponent(promptText)}`;
        else if (platform === 'gemini') url = `https://gemini.google.com/app?q=${encodeURIComponent(promptText)}`;
        window.open(url, '_blank');
    };

    const analyzeTextAccessibility = async (text: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await authFetch(`${API_URL}/api/accessibility/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error('Analysis failed');
            return await response.json();
        } catch (e) {
            console.error("Failed to analyze text accessibility:", e);
            return null;
        }
    };

    return {
        logActivity,
        simplifyText,
        analyzeTextAccessibility,
        copyToClipboard,
        downloadAsTxt,
        downloadAsMarkdown,
        saveToTemplate,
        exportToPlatform
    };
}
