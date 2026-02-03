# Skolappar 📚

Platform for school apps - democratizing learning applications. Built by vibe-coding parents who love helping their kids learn!

## Features

- **App Discovery**: Find educational apps for learning
- **Parent-Friendly**: Created by parents for parents
- **Quality Content**: Curated educational applications
- **Community**: Connect with other parents and educators
- **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for self-hosting)

### Installation

```bash
npm install
```

### Run Locally

```bash
# Set your Supabase credentials in .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

npm run dev
```

### Self-Hosted Setup

If you want to self-host this application, you'll need:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Set Environment Variables**
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Database Migrations**
   ```bash
   # Navigate to your project directory
   cd /path/to/skolappar

   # Run all migrations
   npx supabase db push
   ```

   Or manually run migrations:
   ```bash
   npx supabase db reset
   ```

4. **Run the Application**
   ```bash
   npm run dev
   ```

### Build for Production

```bash
npm run build
```

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Supabase** - Backend & Auth
- **shadcn/ui** - Components
- **Tailwind CSS** - Styling

## License

MIT
