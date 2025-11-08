# Restaurant Management System - Design Guidelines

## Design Approach

**System-Based Approach with Industry Context**
Using Material Design principles adapted for restaurant operations, drawing inspiration from modern POS systems (Square, Toast, Lightspeed). The design balances operational efficiency for staff interfaces with polished, branded customer experiences.

## Core Design Principles

1. **Speed First**: Staff interfaces prioritize rapid interactions over visual flourish
2. **Status Clarity**: Order states, table availability, and payment status must be instantly recognizable
3. **Dual Experience**: Admin dashboards favor function; customer sites favor brand presentation
4. **Touch-Optimized**: Tablet-friendly interactions with generous tap targets (minimum 44px)

## Typography

- **Primary Font**: Inter (Google Fonts) - clean, readable at all sizes
- **Accent Font**: Poppins (Google Fonts) - for customer-facing headings
- **Scale**: 
  - Dashboard headers: text-2xl font-semibold
  - Section titles: text-lg font-medium
  - Body: text-base
  - Labels/metadata: text-sm text-gray-600
  - Large numbers (totals, table numbers): text-4xl font-bold

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Card spacing: space-y-4
- Button padding: px-6 py-3

**Dashboard Layout**:
- Persistent sidebar (w-64) with navigation
- Top bar (h-16) with location selector, notifications, user menu
- Main content area with max-w-7xl container
- Use grid layouts for cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

## Component Library

### Staff Dashboard Components

**Order Cards**:
- Prominent order number and timestamp
- Color-coded status badges (new, preparing, ready, completed)
- Item list with quantities
- Table/customer information
- Action buttons (accept, complete, print) aligned right

**Table Status Grid**:
- Visual grid showing all tables
- Color-coded availability (available, occupied, reserved, cleaning)
- Table number prominent (text-2xl)
- Current party size and server assignment
- Tap to view details/manage

**POS Interface**:
- Split layout: Menu categories sidebar (w-1/4), items grid (w-2/4), order cart (w-1/4)
- Large touchable menu items with images
- Running total always visible
- Quick payment buttons for cash/card/split

**Kitchen Display**:
- Full-screen ticket view
- Horizontal lanes for order stages (new, in-progress, ready)
- Large, scannable item lists
- Timer indicators for order age
- Dismiss/bump buttons prominent

### Customer-Facing Components

**Branded Order Site**:
- Hero section with restaurant image and primary CTA "Order Now" or "View Menu"
- Menu browser with category tabs and item cards
- Item cards: image, name, description, price, "Add to Cart" button
- Sticky cart summary footer on mobile
- Checkout flow with clear steps

**QR Menu Display**:
- Clean, scrollable menu with categories
- High-quality food images for each item
- Dietary indicators (vegan, gluten-free icons)
- Call server button fixed at bottom

### Common Components

**Cards**: 
- Rounded corners (rounded-lg)
- Subtle shadow (shadow-md)
- White background
- Padding p-6

**Buttons**:
- Primary: Solid with brand color, rounded-md, font-medium
- Secondary: Outline style
- Danger: Red for cancellations
- Icon buttons for quick actions (minimum 40px square)

**Form Inputs**:
- Clear labels above fields
- Border on all sides (border-gray-300)
- Rounded corners (rounded-md)
- Padding px-4 py-2.5
- Focus states with ring

**Status Badges**:
- Pill shape (rounded-full px-3 py-1)
- Text-xs font-medium
- Color coded: green (success), yellow (pending), red (urgent), blue (info)

**Data Tables**:
- Striped rows for readability
- Sticky headers on scroll
- Action column aligned right
- Sortable columns with icons

**Navigation**:
- Sidebar with icons and labels
- Active state with background highlight and border-l-4 accent
- Grouped by function (Orders, Menu, Tables, Reports, Settings)

## Customer Site Theme Customization

**Customizable Elements**:
- Logo placement in header and footer
- Primary brand color for buttons, links, accents
- Secondary color for highlights
- Header layout options (centered vs left-aligned)
- Font pairing selection from curated list

**Fixed Best Practices**:
- Maintain accessibility contrast ratios
- Preserve responsive breakpoints
- Keep core UX patterns consistent

## Images

**Dashboard**: Minimal imagery - focus on data and functionality. Use icons from Heroicons for navigation and actions.

**Customer Order Site**:
- Hero: Full-width restaurant interior/signature dish (h-96 on desktop, h-64 mobile)
- Menu Items: Square product photos (aspect-square) in grid
- About Section: Restaurant exterior or team photo
- All images: object-cover with rounded corners

**Image Placement**:
- Hero section: Restaurant ambiance or signature dish
- Menu items: Professional food photography
- Customer testimonials: Optional customer photos
- Staff profiles: Headshots for management pages

## Responsive Behavior

**Breakpoints**:
- Mobile: Single column, stacked navigation
- Tablet (md:): 2-column grids, persistent sidebar for dashboards
- Desktop (lg:): 3-column grids, full multi-panel layouts

**Mobile Priorities**:
- Bottom navigation for customer apps
- Collapsible sidebar for staff apps
- Full-width tables with horizontal scroll
- Sticky action buttons

## Reports & Analytics

- Card-based metrics with large numbers
- Simple bar/line charts using Chart.js
- Date range picker prominent
- Export buttons clear and accessible
- Summary cards before detailed tables