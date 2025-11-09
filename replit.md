# Restaurant Management System

## Overview

A comprehensive multi-location restaurant management platform built with React, Express, and PostgreSQL. The system provides point-of-sale (POS) functionality, kitchen display systems, table management, online ordering, reservations, and analytics dashboards. It supports multiple restaurant locations with centralized management and location-specific operations.

The application features dual interfaces: staff-facing dashboards optimized for operational efficiency and customer-facing menus designed for brand presentation and online ordering.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and dev server
- TanStack Query (React Query) for server state management
- Wouter for client-side routing
- Zustand with persistence for client-side state (location selection)

**UI Framework:**
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design system
- Material Design principles adapted for restaurant operations
- Touch-optimized interfaces (44px minimum tap targets) for tablet usage

**Design System:**
- Custom color palette with HSL variables for theme support
- Light and dark mode support via class-based theming
- Typography: Inter (primary), Poppins (customer-facing headings)
- Spacing primitives using Tailwind units (2, 4, 6, 8, 12, 16)
- Elevation system with hover and active states for cards and buttons

**Component Organization:**
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/`
- Shadcn UI primitives in `client/src/components/ui/`
- Component examples for development in `client/src/components/examples/`

**Key Features:**
- Real-time order updates with automatic refetching (5-10 second intervals)
- Location-based filtering throughout the application
- Responsive layouts with mobile, tablet, and desktop breakpoints
- Persistent sidebar navigation with location selector

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js
- TypeScript with ES modules
- Drizzle ORM for database operations
- Neon serverless PostgreSQL driver

**Storage Strategy:**
The system implements a dual-storage approach for flexibility:

1. **PostgreSQL Database** (primary, optional):
   - Configured via `DATABASE_URL` environment variable
   - Drizzle ORM with full schema definitions
   - Supports complex queries and relationships

2. **JSON File Storage** (fallback):
   - File-based storage in `data/restaurant-data.json`
   - Enables development without database setup
   - Implements the same interface as database storage

**Storage Abstraction:**
- `IStorage` interface defines all data operations
- Implementation chosen at runtime based on `DATABASE_URL` presence
- Allows seamless switching between storage backends

**API Design:**
- RESTful endpoints under `/api/` prefix
- Zod schema validation for request bodies
- Consistent error handling and HTTP status codes
- Request logging with timing information

**Route Structure:**
- `/api/locations` - Location management
- `/api/menu-items`, `/api/menu-categories` - Menu management
- `/api/orders` - Order processing and tracking
- `/api/tables`, `/api/areas` - Table and seating management
- `/api/reservations` - Reservation system
- `/api/staff` - Staff management
- `/api/customers` - Customer database
- `/api/payments` - Payment processing
- `/api/analytics/sales` - Sales analytics

### Data Storage Solutions

**PostgreSQL Schema:**
- **Enums:** Order status, table status, reservation status, staff roles, payment status/methods
- **Core Tables:**
  - `locations` - Restaurant locations
  - `menu_categories` - Menu organization
  - `menu_items` - Food and beverage items with pricing
  - `areas` - Dining zones within locations
  - `tables` - Table inventory with capacity and status
  - `orders` - Order records with status tracking
  - `order_items` - Line items for orders
  - `staff` - Employee records with role-based access
  - `customers` - Customer profiles and contact info
  - `reservations` - Table reservations with party size
  - `payments` - Payment transactions
  - `restaurant_settings` - Configuration per location

**Relationships:**
- Foreign keys enforce referential integrity
- Join queries for complex data retrieval (orders with items, tables with details)
- Cascading operations where appropriate

**Data Seeding:**
- Sample data generator in `server/seed.ts`
- JSON seed data in `data/restaurant-data.json`
- Supports both database and file-based storage initialization

### Authentication and Authorization

**Current State:**
- No authentication implemented
- Role-based data structure exists (`staff_role` enum)
- Prepared for future session-based authentication with `connect-pg-simple`

**Future Implementation:**
- Session-based authentication with Express sessions
- Role-based access control (admin, manager, server, chef, host)
- Location-based permissions for multi-tenant access

### External Dependencies

**Payment Processing:**
- Stripe integration via `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Prepared for payment flow implementation
- Webhook support for asynchronous payment events (rawBody middleware in place)

**Database:**
- Neon serverless PostgreSQL for production
- WebSocket support via `ws` package for Neon connection
- Drizzle Kit for schema migrations

**Form Handling:**
- React Hook Form with Zod resolvers for validation
- Consistent form patterns across the application

**Charts and Visualization:**
- Recharts for sales analytics and reporting
- Responsive charts with custom theming

**Date Handling:**
- date-fns for formatting and relative time calculations
- Consistent date display across components

**Development Tools:**
- Replit-specific plugins for runtime error handling and dev experience
- Vite HMR for fast development iteration
- TypeScript strict mode for type safety

**Asset Management:**
- Static assets served from `/assets` directory
- Image generation/storage (referenced via `@assets` alias)
- Support for external CDN (ImageKit referenced in sample data)