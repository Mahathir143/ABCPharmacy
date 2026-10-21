# ABC Pharmacy - Medicine & Sales Management System

Single Page Application (SPA) built for **Client ABC Pharmacy** using **ASP.NET Core Web API** and **React 18** / **Bootstrap 5** to track medicines, inventory stock levels, and maintain sales transaction records with server-side JSON persistence.

---

## 📋 Features & Compliance with Requirements

### 1. Medicine Attributes
Each medicine record contains:
- **Full Name of the medicine** (`FullName` - text)
- **Notes** (`Notes` - text)
- **Expiry Date** (`ExpiryDate` - Date)
- **Quantity** (`Quantity` - number)
- **Price** (`Price` - number with 2 places decimal e.g. `$12.50`)
- **Brand** (`Brand` - text)

### 2. Functional Requirements
- **Display List of Medicines in a Grid**:
  - The results show medicine attributes in a clean grid (**except Notes**, per requirement).
  - Notes can be viewed via the **"View Notes"** (`eye`) button in the actions column.
- **Color Indications**:
  - 🟥 **Red Background (`.row-expiring-soon`)**: Medicines with expiry date **less than 30 days** (or expired).
  - 🟨 **Yellow Background (`.row-low-stock`)**: Medicines with stock quantity **less than 10 units**.
  - 🟧 **Dual Alert (`.row-critical-both`)**: Medicines that satisfy **both** alerts (&lt; 30 days expiry and &lt; 10 units stock).
  - 🟩 **Standard Row (`.row-normal`)**: Medicines in stock (&ge; 10) with valid expiry (&ge; 30 days).
  - A visual **Color Legend** is displayed directly above the grid for clarity.
- **Search Capability**:
  - Instant live search input to query on medicine name and brand using React `useMemo`.
  - Status filter dropdown: All, Expiring Soon (&lt; 30d), Low Stock (&lt; 10), Both, In Stock.
  - Column sorting: Name, Expiry Date, Quantity, Price.
- **Add Medicine Details**:
  - Modal form to add a new medicine with client and server-side validation.
- **Maintain Sales Records Mechanism**:
  - **Quick Sell / New Sale**:
    - Choose medicine (or click **"Sell"** directly on any row).
    - View live in-stock quantity and unit price.
    - Input quantity to sell (with validation: cannot sell more than available stock).
    - Dynamic live calculation of total amount (`Quantity * Unit Price`).
    - Submitting automatically **decrements inventory stock** in `medicines.json` and creates a transaction record in `sales.json`.
    - If stock drops below 10, the medicine row immediately turns yellow in real time!
  - **Sales Records Tab**:
    - Complete sales history showing: Sale ID, Date & Time, Medicine Name, Brand, Quantity Sold, Unit Price, Total Price, Customer/Reference, Notes.
    - KPI cards showing Total Medicines, Expiring Soon, Low Stock, and Total Sales Revenue.

### 3. Technical Requirements
- **Backend API**: ASP.NET Core 8 Web API (`Controllers/MedicinesController.cs`, `Controllers/SalesController.cs`).
- **Frontend SPA**: React 18 Single Page Application (`useState`, `useEffect`, `useMemo`) with Bootstrap 5 in `wwwroot/`.
- **Data Storage**: Stored in JSON files on the server side:
  - `Data/medicines.json`
  - `Data/sales.json`
  - Thread-safe repository service (`Services/PharmacyService.cs`) using `SemaphoreSlim` to guarantee concurrency safety.

---

## 🚀 How to Run the Application

### Method 1: Standard Run
Open your terminal in the project directory:
```bash
cd "C:\Users\ayesh\Desktop\Mahathir\Projects\ABCPharmacy"
dotnet run
```

### Method 2: From Any Directory
```bash
dotnet run --project "C:\Users\ayesh\Desktop\Mahathir\Projects\ABCPharmacy"
```

### Accessing the Application
Once the server starts (listening on `http://localhost:5160`):
1. **Single Page Application UI**: Open [http://localhost:5160](http://localhost:5160) in your web browser.
2. **Swagger API Explorer**: Open [http://localhost:5160/swagger](http://localhost:5160/swagger) to inspect or test all API endpoints directly.

---

## 📁 Project Structure

```
ABCPharmacy/
├── Controllers/
│   ├── MedicinesController.cs   # GET, POST, PUT, DELETE for medicines
│   └── SalesController.cs       # GET, POST for recording & querying sales
├── Data/
│   ├── medicines.json           # Server-side JSON storage for medicines
│   └── sales.json               # Server-side JSON storage for sales records
├── Models/
│   ├── Medicine.cs              # Medicine entity with required attributes & validations
│   └── SaleRecord.cs            # Sale transaction model & CreateSaleDto
├── Services/
│   ├── IPharmacyService.cs      # Service interface
│   └── PharmacyService.cs       # Thread-safe JSON persistence & business logic
├── Properties/
│   └── launchSettings.json      # Kestrel and IIS launch profiles
├── wwwroot/
│   ├── css/
│   │   ├── app.css              # Custom styling & color indication definitions
│   │   ├── bootstrap.min.css    # Bootstrap 5
│   │   └── bootstrap-icons.min.css # Bootstrap Icons
│   ├── js/
│   │   ├── app.js               # React 18 SPA component logic (Hooks, memoization, modals)
│   │   ├── react.production.min.js     # React 18 Core
│   │   ├── react-dom.production.min.js # ReactDOM 18
│   │   ├── babel.min.js         # In-browser JSX transformer
│   │   └── bootstrap.bundle.min.js
│   └── index.html               # Main SPA entry point
├── ABCPharmacy.csproj
└── Program.cs                   # Web API configuration & static files mapping
```
