# Somali POS & Dukaan Monorepo 🚀

Welcome to your unified Integrated Management System (IMS) and Mobile App repository. This project is structured as a monorepo for easier deployment and version control.

## 📁 Repository Structure

- **/backend**: Laravel PHP API. This is the heart of your system, handling the database, business logic, and mobile app integration.
- **/frontend**: React + Vite Manager Panel. The web interface for admins and cashiers to manage sales, products, and settings.
- **/mobile**: Flutter Dukaan App. The customer-facing mobile application.

## 🚀 Deployment Overview

### Backend & Frontend (Render.com)

The system is hosted on Render.com. The backend handles API requests while the frontend serves the manager panel.

- **Backend**: Configured via `render.yaml`. Automatically handles dependency installation, database migrations, and storage linking.
- **Frontend**: Configured for static hosting on Render.

### Mobile App (GitHub Actions)

Every push to this repository triggers an automated build. You can find your ready-to-install Android APK under the **Actions** tab.

## 🛠️ Configuration

Refer to the documentation in each folder for specific installation and configuration steps:

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Mobile README](./mobile/README.md)

---

_Created with love for the Somali Business Community._
