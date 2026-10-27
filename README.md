# QuickServe POS

A modern, AI-enhanced Point of Sale system for quick-service restaurants. Built with real-world experience from working in food service.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes, MongoDB (Mongoose)
- **Auth**: NextAuth.js (Google OAuth + Credentials)
- **AI**: OpenAI API (Manager Chat, auto-reports)
- **Real-time**: Socket.io (Kitchen Display)
- **Payments**: Stripe Integration
- **Deployment**: Vercel + MongoDB Atlas

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your MongoDB URI, NextAuth secret, etc.

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Main POS screens
│   │   ├── orders/        # Order management
│   │   ├── kitchen/       # Kitchen display
│   │   ├── menu/          # Menu management
│   │   ├── reports/       # Sales reports
│   │   └── ai-chat/       # AI Manager Chat
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth
│   │   ├── orders/        # Order CRUD
│   │   ├── menu/          # Menu CRUD
│   │   ├── reports/       # Report generation
│   │   └── ai/            # OpenAI integration
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── pos/               # POS-specific components
│   │   ├── MenuGrid.tsx
│   │   ├── OrderSidebar.tsx
│   │   ├── CategoryTabs.tsx
│   │   └── OrderItem.tsx
│   ├── kitchen/           # Kitchen display components
│   ├── ui/                # ShadCN UI components
│   └── shared/            # Shared components
├── lib/
│   ├── db.ts              # MongoDB connection
│   ├── models/            # Mongoose models
│   │   ├── MenuItem.ts
│   │   ├── Order.ts
│   │   ├── User.ts
│   │   └── Category.ts
│   ├── utils.ts           # Utility functions
│   └── openai.ts          # OpenAI client
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## Features Roadmap

- [x] Project setup & structure
- [ ] POS order screen with menu grid
- [ ] Order management (create, edit, complete)
- [ ] Authentication (NextAuth)
- [ ] Menu management (CRUD)
- [ ] Kitchen display (real-time)
- [ ] AI Manager Chat
- [ ] Sales reports & analytics
- [ ] Security dashboard
- [ ] Stripe payments

## Author

**Wahaj Rashid** — [Portfolio](https://wahajrashid.com) | [LinkedIn](https://linkedin.com/in/wahajrashid) | [GitHub](https://github.com/wahajrashid)
