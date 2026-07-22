
## 📋 Rules & Guidelines
1. **Design**: Maintain a clean, modern, and premium aesthetic (vibrant colors, smooth micro-animations, glassmorphism if applicable). Do not use generic styling.
2. **TypeScript**: Enforce strict typing. Avoid `any` where possible.
3. **Mocks**: 
   - **Auth**: Use a mocked login system initially (Admin vs Tenant).
   - **Payments**: PromptPay QR generation and slip verification should simulate API calls with mock delays and success messages.
   - **Line**: Logging to the console or displaying a toast notification in place of sending a real Line message.
4. **Project Structure**: Follow Next.js App Router conventions (e.g., `app/`, `components/`, `lib/`, `prisma/`).
5. **Code Style**: Use functional components, hooks, and clean separation of concerns.

