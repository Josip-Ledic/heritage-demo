# Technical Implementation Prompt: HERITAGE Motors Editorial Blog with Pretext Text Flow

## Project Overview
Create an editorial blog page for the fictional premium motorcycle brand "HERITAGE Motors" using Next.js 15+ (App Router) with shadcn/ui. The key feature is text flowing pixel-perfectly around a motorcycle silhouette using the Pretext library, mimicking print magazine layouts.

## Design Specifications

### Brand Identity
- **Brand Name:** HERITAGE Motors
- **Color Palette:**
  - Navy Blue: `#1e3a5f` (primary/background)
  - Tan Leather: `#c19a6b` (accents)
  - Off-White: `#faf9f6` (text)

### Typography
- **Body Text:** Crimson Text (serif) - editorial feel
- **Headings:** Crimson Text (serif) - same family for cohesion
- **Font Sizes:** Use responsive typography (clamp or Tailwind responsive classes)

### Layout & Behavior
- **Target:** Desktop-only experience (≥1024px)
- **Mobile:** Simplified fallback without text flow
- **Motorcycle Position:** Right side of the page, facing right
- **Text Flow:** Text wraps around the left side of the motorcycle silhouette
- **Spacing:** Comfortable breathing room around the silhouette (not too tight)
- **Animation:** Entrance fade-in animation for the motorcycle on page load
- **Scroll Effects:** None - static layout after initial animation

### Article Content
- **Title:** "Legacy of Innovation"
- **Length:** ~800 words
- **Theme:** Heritage, craftsmanship, and innovation in motorcycle design
- **Tone:** Premium, editorial, sophisticated

## Technical Requirements

### 1. Dependencies to Install
```bash
npm install @chenglou/pretext
```

### 2. Pretext API Usage

Based on the official documentation, use **Use-case 2 APIs** for manual line layout:

```typescript
import { 
  prepareWithSegments, 
  layoutWithLines, 
  walkLineRanges,
  materializeLineRange,
  type PreparedTextWithSegments,
  type LayoutCursor
} from '@chenglou/pretext'
```

**Key API Functions:**

1. **`prepareWithSegments(text, font, options?)`**
   - Prepares text with font information
   - Returns `PreparedTextWithSegments`
   - Options: `{ whiteSpace: 'pre-wrap' }` for textarea-like text

2. **`layoutWithLines(prepared, maxWidth, lineHeight)`**
   - Returns array of lines at fixed width
   - Each line has: `{ text, width, start, end }`

3. **`walkLineRanges(prepared, maxWidth, callback)`**
   - Iterates through lines with varying widths
   - Callback receives `(prepared, range) => void`
   - Use when width changes per line (text flowing around shape)

4. **`materializeLineRange(prepared, range)`**
   - Converts a range back to full line with text
   - Returns `LayoutLine` with text content

5. **`measureLineStats(prepared, maxWidth)`**
   - Returns `{ lineCount, maxLineWidth }`
   - Useful for calculating total height

### 3. Implementation Strategy

#### A. Motorcycle Silhouette Shape Definition
Create a function that returns the available text width for each line based on the motorcycle's shape:

```typescript
// Example structure - adjust based on actual silhouette
function getLineWidth(lineIndex: number, baseWidth: number): number {
  // Define the motorcycle silhouette as a series of width constraints
  // Lines 0-10: full width (above motorcycle)
  // Lines 11-30: reduced width (beside motorcycle body)
  // Lines 31+: full width (below motorcycle)
  
  // Return the available width for text on the LEFT side of the motorcycle
}
```

#### B. Text Layout Process
1. Prepare the article text with `prepareWithSegments()`
2. Use `walkLineRanges()` to iterate through lines
3. For each line, calculate available width using the silhouette function
4. Use `materializeLineRange()` to get the actual line content
5. Render each line as a separate element with appropriate positioning

#### C. Component Structure
```
app/
  page.tsx                    # Main article page
components/
  article-layout.tsx          # Client component with Pretext logic
  motorcycle-silhouette.tsx   # SVG or image component
  article-content.tsx         # Static article text content
lib/
  text-flow.ts               # Pretext utilities and shape functions
  article-data.ts            # Article content and metadata
```

### 4. Motorcycle Silhouette

**Requirements:**
- Use SVG for crisp rendering at any size
- Position: Absolute or fixed positioning on the right side
- Size: Approximately 40-50% of viewport width
- Style: Silhouette (solid color, no details) in tan leather color (#c19a6b)
- Animation: Fade-in on mount (CSS or Framer Motion)

**Implementation Options:**
1. Find a free motorcycle silhouette SVG online
2. Create a simplified SVG path manually
3. Use a placeholder rectangle initially, refine later

### 5. Responsive Behavior

**Desktop (≥1024px):**
- Full Pretext text flow implementation
- Motorcycle visible and text wraps around it

**Mobile/Tablet (<1024px):**
- Disable Pretext text flow
- Show motorcycle as a full-width image above or below text
- Standard text layout (no wrapping)

### 6. Performance Considerations

- Pretext calculations should happen client-side (use `'use client'`)
- Consider memoizing the text layout calculation
- Only recalculate on window resize (with debounce)
- Initial calculation can happen on mount

### 7. Styling Guidelines

**Container:**
- Max-width: 1400px
- Centered layout
- Padding: Comfortable margins (e.g., 4rem)

**Typography:**
- Line height: 1.8-2.0 for readability
- Font size: 18-20px for body text
- Paragraph spacing: 1.5em

**Colors:**
- Background: Navy blue (#1e3a5f)
- Text: Off-white (#faf9f6)
- Accents: Tan leather (#c19a6b)

### 8. Article Content Structure

```typescript
interface Article {
  title: string
  subtitle?: string
  author?: string
  date?: string
  content: string // Full article text as single string
}
```

**Sample Article Outline:**
- Introduction: Heritage and legacy (2-3 paragraphs)
- Section 1: Craftsmanship philosophy (2-3 paragraphs)
- Section 2: Innovation and tradition balance (2-3 paragraphs)
- Conclusion: Future vision (1-2 paragraphs)

### 9. Implementation Steps

1. **Setup:**
   - Install Pretext: `npm install @chenglou/pretext`
   - Add Crimson Text font (Google Fonts or next/font)
   - Configure Tailwind colors in theme

2. **Create Article Data:**
   - Write the ~800 word article content
   - Store in `lib/article-data.ts`

3. **Build Motorcycle Component:**
   - Create SVG silhouette component
   - Add fade-in animation
   - Position absolutely on the right side

4. **Implement Text Flow Logic:**
   - Create shape function defining motorcycle outline
   - Use `prepareWithSegments()` to prepare text
   - Use `walkLineRanges()` with dynamic widths
   - Render lines with proper positioning

5. **Style and Polish:**
   - Apply color scheme
   - Add typography styles
   - Ensure proper spacing and alignment
   - Test responsive breakpoints

6. **Testing:**
   - Verify text flows correctly around silhouette
   - Check animation timing
   - Test on different screen sizes
   - Validate typography readability

### 10. Code Quality Requirements

- TypeScript strict mode enabled
- Proper type definitions for Pretext types
- Clean component separation
- Comments explaining Pretext logic
- Error handling for edge cases
- Accessible markup (semantic HTML)

### 11. MVP Scope

**In Scope:**
- Single article page with text flow
- Motorcycle silhouette with fade-in
- Desktop-optimized layout
- Basic responsive fallback
- Clean, readable typography

**Out of Scope (Future Enhancements):**
- Multiple articles/blog listing
- CMS integration
- Advanced animations
- Interactive elements
- Mobile-optimized text flow
- Dark/light mode toggle

### 12. Success Criteria

- [ ] Text flows smoothly around motorcycle silhouette
- [ ] Layout matches print magazine aesthetic
- [ ] Typography is readable and elegant
- [ ] Motorcycle animation is subtle and professional
- [ ] Responsive fallback works on mobile
- [ ] Code is clean and well-documented
- [ ] No layout shifts or jank during render

### 13. Reference Resources

- **Pretext Documentation:** https://github.com/chenglou/pretext
- **Pretext Demo:** Check `/demos/dynamic-layout` in the repo for text flow examples
- **Next.js App Router:** https://nextjs.org/docs/app
- **Crimson Text Font:** https://fonts.google.com/specimen/Crimson+Text

### 14. Technical Notes

**Important Pretext Concepts:**
- `prepare()` does one-time work: normalizes whitespace, segments text, measures segments
- `layout()` is the cheap hot path after preparation
- Do NOT rerun `prepare()` on resize - only rerun `layout()`
- `PreparedText` is an opaque handle - use provided functions to work with it
- Line ranges use `LayoutCursor` type with `segmentIndex` and `graphemeIndex`

**Font Loading:**
- Ensure Crimson Text is loaded before running Pretext calculations
- Use `next/font/google` for optimal font loading
- Consider using `font-display: swap` for better UX

**Canvas Context:**
- Pretext uses canvas for text measurement
- Create a canvas context once and reuse it
- Font string format: `"18px 'Crimson Text'"`

## Expected Deliverables

1. Fully functional Next.js page with text flow
2. Clean, typed TypeScript code
3. Responsive layout with mobile fallback
4. Smooth entrance animation
5. ~800 word article about motorcycle heritage
6. README with setup instructions

## Getting Started Command

```bash
# After receiving this prompt, start with:
npm install @chenglou/pretext
```

Then proceed with implementation following the steps outlined above.
