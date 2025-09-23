# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a finance tracking system for 皓揚財務追蹤系統 (Haoyang Finance Tracking System) - a logistics and freight finance management application. The system manages waybills, invoices, companies, drivers, and payment tracking for freight companies.

## Architecture

### Full-Stack Structure
- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: .NET Core 8 Web API + PostgreSQL
- **Database**: PostgreSQL with UUID primary keys

### Core Modules

#### 1. Waybill Management (託運單管理)
- Location: `hao-yang-finance-app/src/features/Waybill/`
- CRUD operations for waybills
- Status management: PENDING → INVOICED | NO_INVOICE_NEEDED | PENDING_PAYMENT
- Components: WaybillPage, WaybillForm, WaybillGrid

#### 2. Invoice Management (發票管理)
- Location: `hao-yang-finance-app/src/features/Finance/`
- Invoice creation, payment tracking, voiding
- Status flow: issued → paid → void
- Components: FinancePage, InvoiceDialog, InvoicedTable, UninvoicedTable

#### 3. Master Data (基礎資料)
- Location: `hao-yang-finance-app/src/features/Settings/`
- Company and driver management
- Components: SettingPage, CompanyForm, Driver

## Common Development Commands

### Frontend (hao-yang-finance-app)
```bash
# Development
cd hao-yang-finance-app
yarn dev

# Build
yarn build

# Linting
yarn lint
yarn lint:fix

# Preview built app
yarn preview
```

### Backend (hao-yang-finance-api)
```bash
# Development
cd hao-yang-finance-api
dotnet run

# Build
dotnet build

# Restore packages
dotnet restore
```

## Frontend Architecture

### Tech Stack
- React 18 with functional components + hooks
- TypeScript with strict mode
- Vite for build tooling
- Material-UI for UI components
- TanStack Query for server state management
- Recoil for client state management
- AG Grid for data tables with virtual scrolling
- React Hook Form for form management
- Axios for API calls
- SCSS/SASS for styling

### Key Libraries
- `@tanstack/react-query` - Server state management
- `@mui/material` - UI components
- `ag-grid-react` - Data tables
- `react-router-dom` - Routing
- `recoil` - State management
- `ramda` - Functional programming utilities
- `react-hook-form` - Form handling
- `date-fns` - Date manipulation

### File Structure
```
src/
├── components/          # Shared components
├── features/           # Feature-based modules
│   ├── Waybill/       # Waybill management
│   ├── Finance/       # Invoice management
│   └── Settings/      # Master data
├── hooks/             # Custom hooks
├── stores/            # Recoil atoms
├── types/             # TypeScript types
└── utils/             # Utility functions
```

### Component Patterns
- Use functional components with TypeScript interfaces
- Extract react-query hooks to `/hooks` directory
- Use Recoil for global state management
- Implement proper error boundaries
- Use React.memo() for performance optimization

## Backend Architecture

### Tech Stack
- .NET Core 8 Web API
- ASP.NET Core with controller-based routing
- Entity Framework Core (implied from project structure)
- Swagger/OpenAPI documentation
- PostgreSQL database

### Development Rules
- Use PascalCase for classes and methods
- Use camelCase for local variables
- Follow RESTful API design principles
- Use attribute routing in controllers
- Implement proper error handling and logging
- Use async/await for I/O operations

## Database Design

### Core Tables
- `waybill` - Waybill records with status tracking
- `invoice` - Invoice records with payment tracking
- `loading_location` - Loading/delivery locations for waybills
- `extra_expense` - Extra expenses for waybills
- `invoice_extra_expense` - Junction table for invoice-extra expense relationships
- `company` - Company master data
- `driver` - Driver master data

### Status Management
- Waybill Status: PENDING → INVOICED → NO_INVOICE_NEEDED
- Invoice Status: issued → paid → void
- All status changes must be atomic operations

## API Endpoints

### Waybill Management
- `GET /waybills` - List waybills
- `POST /waybills` - Create waybill
- `PUT /waybills/{id}` - Update waybill
- `DELETE /waybills/{id}` - Delete waybill
- `PUT /waybills/{id}/no-invoice` - Mark as no invoice needed
- `PUT /waybills/{id}/pending-payment` - Mark as pending payment (待收款)
- `PUT /waybills/{id}/update-notes` - Update notes for pending payment waybills
- `PUT /waybills/{id}/restore` - Restore to pending

### Invoice Management
- `GET /invoices` - List invoices with filtering
- `POST /invoices` - Create invoice
- `PUT /invoices/{id}` - Update invoice
- `DELETE /invoices/{id}` - Delete invoice
- `POST /invoices/{id}/void` - Void invoice
- `POST /invoices/{id}/mark-paid` - Mark as paid

### Master Data
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /drivers` - List drivers
- `POST /drivers` - Create driver

## Business Rules

### Invoice Calculation
1. Subtotal = sum of all waybill amounts + selected extra expenses
2. Tax calculation:
   - If "extra expenses include tax" is checked: tax = (waybill amounts + selected extra expenses) × tax rate
   - If not checked: tax = waybill amounts × tax rate
3. Total = subtotal + tax

### Data Integrity
- Only PENDING waybills can be selected for invoicing
- Invoice numbers must be unique
- When invoice is created/deleted/voided, waybill status changes atomically
- PENDING_PAYMENT waybills can only have notes edited, not full waybill data
- All operations require proper validation and error handling

## Development Guidelines

### Frontend
- Use ESLint + Prettier for code formatting
- Follow Conventional Commits for git messages
- Use TypeScript strict mode
- Implement proper error boundaries
- Use AG Grid for data tables (supports virtual scrolling)
- Extract API calls to dedicated query hooks

### Backend
- Follow .NET conventions and best practices
- Use dependency injection
- Implement proper validation and error handling
- Use async/await for database operations
- Provide comprehensive Swagger documentation

## Testing

### Frontend
- Use Jest + React Testing Library (when implemented)
- Test components, hooks, and utilities
- Integration tests for user flows

### Backend
- Use xUnit for unit tests (when implemented)
- Test controllers, services, and business logic
- Integration tests for API endpoints

## Key Changes (Recent Updates)

### Waybill Status Management
- Changed from `isInvoiceIssued: boolean` to `status: WaybillStatus`
- Status values: `'PENDING' | 'INVOICED' | 'NO_INVOICE_NEEDED' | 'PENDING_PAYMENT'`
- Added complete status management utilities
- Automatic status synchronization with invoice operations
- `PENDING_PAYMENT` status for tracking outstanding payments without invoicing

### PENDING_PAYMENT Feature (待收款功能)
**Added in December 2024**
- New waybill status for tracking unpaid invoices without formal invoice generation
- Business scenario: Customer owes money but no official invoice is needed
- Features:
  - Mark PENDING waybills as PENDING_PAYMENT
  - Edit notes/comments for payment tracking
  - Restore to PENDING status when needed
  - Visual indication with red error color in UI
- Status transitions: PENDING → PENDING_PAYMENT → PENDING (restore)
- API endpoints: `/pending-payment`, `/update-notes`, `/restore`

### Unified Naming Convention
- Use `company` instead of `customer` throughout the system
- TypeScript interfaces updated: `companyId`, `companyName`
- Database tables use consistent `company` naming

## Notes

- The system uses UUID for all primary keys
- No foreign key constraints in database - business logic handles relationships
- Virtual scrolling used for large datasets instead of pagination
- All user-facing text is in Traditional Chinese
- Invoice numbers are manually entered and must be unique
- Waybill numbers can be duplicated (no uniqueness constraint)
- Status transitions are controlled by business rules and database triggers