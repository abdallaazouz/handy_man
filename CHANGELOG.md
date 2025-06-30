# Changelog

All notable changes to the Technician Task Manager project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-06-26

### Security
- **CRITICAL**: Fixed SQL injection vulnerability in database backup functionality (CVE-2025-30208)
- Implemented proper SQL escaping and parameterized queries
- Added column name validation for backup exports
- Upgraded Vite from 5.4.14 to 5.4.15 to patch security vulnerability

### Added
- Comprehensive GitHub repository setup with documentation
- MIT License added for open source distribution
- Environment variables example file (.env.example)
- Enhanced .gitignore file for better project hygiene

## [1.9.0] - 2025-06-25

### Fixed
- Critical PDF export functionality for invoices with proper jsPDF integration
- Invoice table headers now display correctly in German
- Added fallback PDF generation system for reliable downloads

### Removed
- Telegram invoice sending buttons as per user request
- Task Reference column from invoice table for cleaner layout

### Changed
- Restructured invoice table layout for better user experience

## [1.8.0] - 2025-06-24

### Added
- Fully functional backup and restore system with real API endpoints
- Enhanced German translations for backup functionality
- Comprehensive export capabilities (PDF/Excel/CSV) for reports
- PDF generation and Telegram integration for individual invoices
- Export utilities with German language support

### Changed
- Merged Database Management page with Backup & Restore page
- Updated application name to be language-specific across all languages
- Enhanced reports functionality with filtering and data visualization

### Fixed
- PDF text encoding issues with international character sanitization

## [1.7.0] - 2025-06-23

### Added
- Comprehensive bot message translation system
- Dynamic language detection for bot messages (Arabic/German/English)
- Enhanced bot status display with improved visual indicators

### Fixed
- Bot settings conflict by removing duplicate pages
- Bot username display to show actual username instead of "Loading..."

### Changed
- Redesigned bot toggle button to match notification toggle style
- Improved bot status card design with compact layout

### Removed
- Laravel experiment files and unused dependencies
- Cleaned up project structure by removing unnecessary files

## [1.6.0] - 2025-06-18

### Added
- Missing secondary pages: Language Settings, Activity History, Backup & Restore
- Mobile-friendly overlay system for sidebar navigation
- Responsive sidebar navigation for all screen sizes

### Fixed
- Authentication issues preventing data loading
- Mobile navigation and responsive design issues

### Changed
- Enhanced sidebar functionality across different screen sizes

## [1.0.0] - 2025-06-18

### Added
- Initial project setup and architecture
- Multi-language support (Arabic, English, German)
- Telegram bot integration for technician communication
- Task management system with real-time updates
- Invoice generation and tracking
- Technician registration and management
- Admin dashboard with comprehensive controls
- Dark/light theme support
- Audio notifications for real-time alerts
- Database schema with PostgreSQL integration
- RESTful API design with Express.js
- React frontend with TypeScript
- Responsive design with Tailwind CSS

### Features
- Real-time notifications via WebSocket
- PDF export functionality for invoices and reports
- Data visualization with charts and graphs
- Backup and restore functionality
- Multi-format data export (PDF, Excel, CSV)
- RTL layout support for Arabic language
- Progressive Web App capabilities
- Session-based authentication
- Comprehensive error handling and logging

### Technical Implementation
- Drizzle ORM for type-safe database operations
- Zod validation for data integrity
- React Query for efficient state management
- Radix UI components for accessibility
- Custom hooks for reusable logic
- Modular component architecture
- TypeScript throughout the entire stack

---

## Development Guidelines

### Version Numbering
- **Major version** (X.0.0): Breaking changes, major feature additions
- **Minor version** (0.X.0): New features, significant improvements
- **Patch version** (0.0.X): Bug fixes, security patches, minor improvements

### Change Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

### Contribution Notes
When contributing to this project:
1. Update this changelog with your changes
2. Follow the established format and categories
3. Include issue/PR references where applicable
4. Date entries using YYYY-MM-DD format
5. Keep entries concise but descriptive