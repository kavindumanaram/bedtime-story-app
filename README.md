# HushTales - Bedtime Storytelling App

A modern, minimal React + TypeScript web application for bedtime storytelling. Built with Vite, TailwindCSS, and React Router.

## Features

- 📚 Story Library with 10+ bedtime stories
- 🎵 Audio Player with customizable voices and speeds
- 📊 Dashboard with listening analytics
- 💳 Subscription & Billing management
- ⚙️ Customizable Settings
- 👤 Parent & Children Profiles
- 🌙 Night Mode support
- 📱 Fully responsive mobile design

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd bedtime-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Project Structure

```
bedtime-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AudioControls.tsx
│   │   ├── Badge.tsx
│   │   ├── BarChartCard.tsx
│   │   ├── Card.tsx
│   │   ├── LineChartCard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── StoryTable.tsx
│   │   └── Topbar.tsx
│   ├── data/                # Mock data
│   │   └── mock.ts
│   ├── pages/               # Page components
│   │   ├── Billing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Library.tsx
│   │   ├── Player.tsx
│   │   ├── Profile.tsx
│   │   └── Settings.tsx
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Pages

- **/dashboard** - Overview with KPIs and charts
- **/library** - Browse all stories and downloaded stories
- **/player/:id** - Story player with audio controls
- **/billing** - Subscription and payment management
- **/settings** - App preferences and configuration
- **/profile** - Parent profile and children management

## Features Showcase

### Dashboard
- KPI cards showing listening statistics
- Welcome card with app introduction
- Featured "Calm Mode" card
- Bar chart for listening sessions
- Line chart for sleep calm scores

### Story Library
- Table view with story details
- Cover thumbnails
- Age range, duration, and category filters
- Status badges (NEW, POPULAR, DOWNLOADED)
- Quick play buttons

### Story Player
- Large story cover display
- Scrollable story text
- Audio controls (play/pause, progress bar)
- Speed selector (0.8x - 1.5x)
- Voice selector dropdown
- Night mode toggle
- Customization prompt buttons

### Billing
- Payment card display
- Basic vs Premium plan comparison
- Invoice history with downloads
- Billing address management

### Settings
- Notification preferences
- Playback settings
- Appearance customization
- Download quality options
- Privacy controls

### Profile
- Parent information display
- Children profiles management
- Account statistics
- Account actions (password, export, delete)

## Customization

### Colors
Edit `tailwind.config.js` to change the primary colors:
```js
colors: {
  primary: {
    DEFAULT: '#10b981',  // Green
    dark: '#059669',
  }
}
```

### Stories
Add or modify stories in `src/data/mock.ts`

### Routes
Add new routes in `src/App.tsx` and create corresponding page components

## Mobile Responsive

The app is fully responsive with:
- Collapsible sidebar (hamburger menu on mobile)
- Stacked card layouts on smaller screens
- Touch-friendly buttons and controls
- Optimized typography and spacing

## License

This project is for demonstration purposes.
