# CommunityGuard PWA

A high-performance Progressive Web App built with Next.js 14 (App Router), Tailwind CSS, Framer Motion, and Supabase for authentication and database.

## Features

- **Mobile-First Design**: Optimized for mobile devices with responsive layouts
- **Dark Mode**: Dark theme by default for better user experience
- **Glassmorphic UI**: Modern glass-effect design with backdrop blur
- **PWA Support**: Installable as a native app on supported devices
- **Supabase Auth**: Secure authentication with email/password
- **Framer Motion**: Smooth animations and transitions
- **Howler.js**: Sound effects for enhanced UX
- **Lucide Icons**: Beautiful, consistent icon set

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Sound**: Howler.js
- **Backend**: Supabase (Auth + Database)
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd communityguard-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings.

4. Set up Supabase database:
Run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor to create the required tables and policies.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Building for Production

```bash
npm run build
npm start
```

## PWA Installation

The app is configured as a PWA. On supported browsers:
- Chrome/Edge: Click the install icon in the address bar
- Safari: Click "Share" then "Add to Home Screen"

## Project Structure

```
communityguard-pwa/
├── app/
│   ├── auth/
│   │   └── login/          # Authentication pages
│   ├── globals.css         # Global styles with glassmorphism
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Home page with animations
├── lib/
│   ├── sounds.ts           # Howler sound effects
│   └── supabase.ts         # Supabase client configuration
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service worker (auto-generated)
├── supabase/
│   └── schema.sql         # Database schema
├── types/
│   └── next-pwa.d.ts      # TypeScript declarations
└── tailwind.config.js     # Tailwind configuration
```

## Customization

### Colors
Modify CSS variables in `app/globals.css`:
```css
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

### Glassmorphism
Adjust glass effects in the same file:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Database Schema

The app uses three main tables:
- `profiles`: User profile information
- `meals`: Meal tracking with nutritional data
- `nutrition_goals`: Daily nutrition targets

See `supabase/schema.sql` for the complete schema with RLS policies.

## Sound Effects

Add your sound files to `public/sounds/`:
- click.mp3
- success.mp3
- error.mp3
- notification.mp3

## License

MIT
