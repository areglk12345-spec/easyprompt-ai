/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        // เผื่อกรณีที่คุณไม่ได้ใช้โฟลเดอร์ src
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#7c3aed", // Mascot Purple/Violet
                    dark: "#6d28d9",
                },
                roseAccent: "#f43f5e",
                purpleAccent: "#8b5cf6",
                cyanAccent: "#06b6d4",
                outline: "#767586",
                "surface-variant": "#f4f6ff",
                "surface-bright": "#ffffff",
                "on-tertiary-fixed-variant": "#6900b3",
                "surface-dim": "#f0f2f9",
                "surface-container-high": "#f8f9ff",
                "on-tertiary": "#ffffff",
                "surface": "#ffffff",
                "inverse-surface": "#283044",
                "on-secondary-fixed-variant": "#8c0053",
                "on-tertiary-container": "#fffbff",
                "outline-variant": "#e1e4ef",
                "primary-container": "#f0f1ff",
                "on-secondary-container": "#600037",
                "on-secondary": "#ffffff",
                "on-primary-fixed-variant": "#2f2ebe",
                "on-primary-fixed": "#07006c",
                "surface-container-low": "#fafbff",
                "surface-container": "#f2f4ff",
                "inverse-primary": "#c0c1ff",
                "tertiary-fixed": "#f0dbff",
                "on-background": "#131b2e",
                "background": "#ffffff",
                "on-primary": "#ffffff",
                "tertiary": "#8127cf",
                "on-error-container": "#93000a",
                "surface-container-lowest": "#ffffff",
                "secondary": "#b4136d",
                "tertiary-container": "#9c48ea",
                "on-primary-container": "#4648d4",
                "inverse-on-surface": "#eef0ff",
                "tertiary-fixed-dim": "#ddb7ff",
                "on-surface": "#131b2e",
                "on-error": "#ffffff",
                "surface-container-highest": "#f0f3ff",
                "on-tertiary-fixed": "#2c0051",
                "on-secondary-fixed": "#3e0022",
                "error-container": "#ffdad6",
                "secondary-fixed": "#ffd9e4",
                "surface-tint": "#494bd6",
                "secondary-fixed-dim": "#ffb0cd",
                "on-surface-variant": "#646676",
                "secondary-container": "#fd56a7",
                "primary-fixed-dim": "#c0c1ff",
                "primary-fixed": "#e1e0ff",
                "error": "#ba1a1a"
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
                    '50%': { opacity: '0.9', transform: 'scale(1.03)' },
                },
                gradient: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                }
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
                'gradient': 'gradient 15s ease infinite',
            },
            boxShadow: {
                'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 10px -4px rgba(0, 0, 0, 0.04)',
                'premium-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 4px 10px -4px rgba(0, 0, 0, 0.3)',
                'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8), inset 0 0 8px 0 rgba(255, 255, 255, 0.2)',
                'inner-glow-dark': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset 0 0 8px 0 rgba(255, 255, 255, 0.02)',
                'ai-glow': '0 0 20px -5px rgba(99, 102, 241, 0.4), 0 0 10px -2px rgba(99, 102, 241, 0.2)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}