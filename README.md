# HERITAGE Motors Editorial Blog

A creative Next.js project showcasing pixel-perfect text flow around a motorcycle silhouette using the Pretext library. This demonstrates print-magazine-style layouts on the web, with text wrapping dynamically around shapes—something CSS fundamentally cannot do.

## 🎮 Live Demo

**[View the Multi-Commit Demo →](https://josip-ledic.github.io/heritage-demo/)**

Experience all 11 commits of this project's development! Each version includes a floating debug panel for easy navigation between commits.

## �️ Project Overview

This is an editorial blog for the fictional premium motorcycle brand "HERITAGE Motors". The key feature is an ~800-word article where text flows around a motorcycle silhouette, creating an immersive, magazine-quality reading experience.

### Design Specifications

- **Brand**: HERITAGE Motors
- **Color Palette**:
  - Navy Blue: `#1e3a5f` (background)
  - Tan Leather: `#c19a6b` (accents/motorcycle)
  - Off-White: `#faf9f6` (text)
- **Typography**: Crimson Text (serif) for editorial feel
- **Layout**: Desktop-optimized (≥1024px) with mobile fallback

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI Library**: shadcn/ui
- **Text Layout**: [@chenglou/pretext](https://github.com/chenglou/pretext)
- **Styling**: Tailwind CSS
- **Typography**: Crimson Text (Google Fonts)
- **Language**: TypeScript

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with font configuration
│   ├── page.tsx            # Main article page
│   └── globals.css         # Global styles and theme
├── components/
│   ├── article-layout.tsx  # Main article component with Pretext logic
│   └── motorcycle-silhouette.tsx  # SVG motorcycle component
├── lib/
│   ├── article-data.ts     # Article content and metadata
│   └── text-flow.ts        # Pretext utilities and shape functions
└── IMPLEMENTATION_PROMPT.md # Detailed technical specification
```

## 🎨 How It Works

### Pretext Text Flow

The project uses Pretext's advanced text layout capabilities:

1. **Text Preparation**: Article text is prepared once with `prepareWithSegments()`
2. **Dynamic Line Widths**: Each line's width is calculated based on the motorcycle's shape
3. **Line-by-Line Layout**: `layoutNextLineRange()` processes text with varying widths
4. **Rendering**: Each line is rendered as a separate element with precise positioning

### Motorcycle Shape Definition

The `getLineWidth()` function in `lib/text-flow.ts` defines the motorcycle silhouette as a series of width constraints:

- Lines above the motorcycle: full width
- Lines beside the motorcycle: reduced width based on the silhouette profile
- Lines below the motorcycle: full width

This creates the illusion of text flowing naturally around the motorcycle.

## 📱 Responsive Behavior

- **Desktop (≥1024px)**: Full Pretext text flow with motorcycle silhouette
- **Mobile/Tablet (<1024px)**: Simplified layout with standard text flow

## 🎯 Key Features

- ✅ Pixel-perfect text flow around custom shapes
- ✅ Smooth fade-in animation for motorcycle
- ✅ Responsive design with mobile fallback
- ✅ Premium editorial typography
- ✅ Performance-optimized with memoization
- ✅ Debounced resize handling

## 🔧 Development

### Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm run typecheck   # Run TypeScript type checking

# Multi-commit demo deployment
npm run build:all   # Build all 11 commits for GitHub Pages
npm run deploy      # Deploy to GitHub Pages
npm run serve:dist  # Test the built demo locally
```

### Customization

#### Changing the Article

Edit `lib/article-data.ts` to modify the article content, title, author, etc.

#### Adjusting the Motorcycle Shape

Modify the `getLineWidth()` function in `lib/text-flow.ts` to change how text flows around the silhouette.

#### Updating Colors

Edit the CSS variables in `app/globals.css`:

```css
--heritage-navy: #1e3a5f;
--heritage-tan: #c19a6b;
--heritage-cream: #faf9f6;
```

## 📚 Learn More

- [Pretext Documentation](https://github.com/chenglou/pretext)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 🎓 Technical Highlights

This project demonstrates:

- **Advanced Text Layout**: Using Pretext to achieve layouts impossible with CSS
- **Client-Side Rendering**: Dynamic text calculation in the browser
- **Performance Optimization**: Memoization and debouncing for smooth UX
- **Responsive Design**: Graceful degradation for mobile devices
- **TypeScript**: Full type safety throughout the codebase
- **Multi-Commit Deployment**: Automated GitHub Pages deployment with commit navigation

## 🚢 Deployment

This project includes a unique multi-commit deployment system that showcases all 11 commits as separate static builds on GitHub Pages.

### Quick Deploy

```bash
# Build all commits and deploy
npm run build:all
npm run deploy
```

### Features

- 🎯 **Debug Navigation Panel**: Floating panel on each commit for easy navigation
- 📊 **Commit Timeline**: Beautiful landing page showing all commits
- 🔄 **Automated CI/CD**: GitHub Actions workflow for automatic deployment
- 🎨 **Themed UI**: Matches HERITAGE Motors brand colors

### Documentation

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## � License

MIT

## 🙏 Acknowledgments

- [Pretext](https://github.com/chenglou/pretext) by Cheng Lou for making this possible
- Inspired by print magazine layouts and editorial design

---

**HERITAGE Motors** - *Crafted with precision. Ridden with passion.*
