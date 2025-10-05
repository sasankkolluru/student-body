# College Student Portal

A comprehensive student portal for managing college activities, events, achievements, and more.

## Features

- **User Authentication**: Login/Register with different roles (Admin/Student)
- **Student Bodies**: Information about various student councils and clubs
- **Events**: View and manage college events
- **Gallery**: Photo gallery for college events and activities
- **News & Scores**: Latest news and live sports scores
- **Achievements**: Track and showcase student achievements
- **Voting**: Participate in college elections and polls
- **Ideas**: Share and discuss ideas with the community

## Tech Stack

- React with TypeScript
- Vite
- Tailwind CSS
- Firebase (Authentication, Firestore, Storage)
- React Router
- Framer Motion (Animations)
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account (for production deployment)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd project
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/         # React contexts
├── data/             # Mock data and constants
├── lib/              # Utility functions and configurations
├── pages/            # Page components
│   ├── admin/        # Admin pages
│   ├── student/      # Student pages
│   └── ...           # Other pages
└── types/            # TypeScript type definitions
```

## Deployment

### Firebase Hosting

1. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase
   ```bash
   firebase login
   ```

3. Initialize Firebase project
   ```bash
   firebase init
   ```
   - Select Hosting
   - Choose your Firebase project
   - Set `dist` as public directory
   - Configure as single-page app: Yes
   - Set up automatic builds: No

4. Build the app
   ```bash
   npm run build
   ```

5. Deploy to Firebase
   ```bash
   firebase deploy
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Framer Motion](https://www.framer.com/motion/)
