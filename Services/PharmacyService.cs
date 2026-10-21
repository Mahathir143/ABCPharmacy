using System.Text.Json;
using ABCPharmacy.Models;

namespace ABCPharmacy.Services;

public class PharmacyService : IPharmacyService
{
    private readonly string _medicinesFilePath;
    private readonly string _salesFilePath;
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public PharmacyService(IWebHostEnvironment environment)
    {
        var dataDir = Path.Combine(environment.ContentRootPath, "Data");
        if (!Directory.Exists(dataDir))
        {
            Directory.CreateDirectory(dataDir);
        }

        _medicinesFilePath = Path.Combine(dataDir, "medicines.json");
        _salesFilePath = Path.Combine(dataDir, "sales.json");

        InitializeSeedData();
    }

    private void InitializeSeedData()
    {
        if (!File.Exists(_medicinesFilePath) || new FileInfo(_medicinesFilePath).Length == 0)
        {
            var today = DateTime.Today;
            var seedMedicines = new List<Medicine>
            {
                new()
                {
                    Id = "med-001",
                    FullName = "Amoxicillin 500mg Capsules",
                    Brand = "GlaxoSmithKline",
                    Quantity = 45,
                    Price = 12.50m,
                    ExpiryDate = today.AddDays(14), // < 30 days (Red)
                    Notes = "Store below 25°C. Broad-spectrum penicillin antibiotic."
                },
                new()
                {
                    Id = "med-002",
                    FullName = "Ibuprofen 400mg Tablets",
                    Brand = "Advil / Pfizer",
                    Quantity = 60,
                    Price = 8.75m,
                    ExpiryDate = today.AddDays(22), // < 30 days (Red)
                    Notes = "Take with or after food. NSAID pain reliever and anti-inflammatory."
                },
                new()
                {
                    Id = "med-003",
                    FullName = "Azithromycin 250mg",
                    Brand = "Pfizer",
                    Quantity = 4, // < 10 (Yellow) AND < 30 days (Red)
                    Price = 24.00m,
                    ExpiryDate = today.AddDays(9),
                    Notes = "Critical warning: low stock and expiring soon. Macrolide antibiotic."
                },
                new()
                {
                    Id = "med-004",
                    FullName = "Metformin 850mg Tablets",
                    Brand = "Glucophage",
                    Quantity = 6, // < 10 (Yellow)
                    Price = 11.20m,
                    ExpiryDate = today.AddDays(240),
                    Notes = "First-line medication for type 2 diabetes. Keep away from moisture."
                },
                new()
                {
                    Id = "med-005",
                    FullName = "Lisinopril 10mg Tablets",
                    Brand = "Zestril",
                    Quantity = 8, // < 10 (Yellow)
                    Price = 14.30m,
                    ExpiryDate = today.AddDays(310),
                    Notes = "ACE inhibitor prescribed for hypertension and heart conditions."
                },
                new()
                {
                    Id = "med-006",
                    FullName = "Paracetamol 500mg Tablets",
                    Brand = "Panadol",
                    Quantity = 180,
                    Price = 4.50m,
                    ExpiryDate = today.AddDays(420),
                    Notes = "Antipyretic and analgesic. Maximum dosage 4000mg per 24 hours."
                },
                new()
                {
                    Id = "med-007",
                    FullName = "Cetirizine 10mg Film-Coated",
                    Brand = "Zyrtec",
                    Quantity = 95,
                    Price = 16.80m,
                    ExpiryDate = today.AddDays(510),
                    Notes = "Non-sedating antihistamine for allergic rhinitis and urticaria."
                },
                new()
                {
                    Id = "med-008",
                    FullName = "Omeprazole 20mg Delayed-Release",
                    Brand = "Prilosec",
                    Quantity = 110,
                    Price = 19.95m,
                    ExpiryDate = today.AddDays(365),
                    Notes = "Proton pump inhibitor for GERD and peptic ulcer disease."
                }
            };

            var json = JsonSerializer.Serialize(seedMedicines, _jsonOptions);
            File.WriteAllText(_medicinesFilePath, json);
        }

        if (!File.Exists(_salesFilePath) || new FileInfo(_salesFilePath).Length == 0)
        {
            var seedSales = new List<SaleRecord>
            {
                new()
                {
                    Id = "sale-001",
                    MedicineId = "med-006",
                    MedicineName = "Paracetamol 500mg Tablets",
                    Brand = "Panadol",
                    Quantity = 2,
                    UnitPrice = 4.50m,
                    TotalPrice = 9.00m,
                    SaleDate = DateTime.UtcNow.AddHours(-4),
                    CustomerName = "John Doe",
                    Notes = "Walk-in OTC purchase"
                },
                new()
                {
                    Id = "sale-002",
                    MedicineId = "med-007",
                    MedicineName = "Cetirizine 10mg Film-Coated",
                    Brand = "Zyrtec",
                    Quantity = 1,
                    UnitPrice = 16.80m,
                    TotalPrice = 16.80m,
                    SaleDate = DateTime.UtcNow.AddHours(-2),
                    CustomerName = "Alice Smith",
                    Notes = "Prescription refill"
                }
            };

            var json = JsonSerializer.Serialize(seedSales, _jsonOptions);
            File.WriteAllText(_salesFilePath, json);
        }
    }

    private async Task<List<Medicine>> ReadMedicinesInternalAsync()
    {
        if (!File.Exists(_medicinesFilePath)) return new List<Medicine>();
        var json = await File.ReadAllTextAsync(_medicinesFilePath);
        return string.IsNullOrWhiteSpace(json)
            ? new List<Medicine>()
            : JsonSerializer.Deserialize<List<Medicine>>(json, _jsonOptions) ?? new List<Medicine>();
    }

    private async Task WriteMedicinesInternalAsync(List<Medicine> medicines)
    {
        var json = JsonSerializer.Serialize(medicines, _jsonOptions);
        await File.WriteAllTextAsync(_medicinesFilePath, json);
    }

    private async Task<List<SaleRecord>> ReadSalesInternalAsync()
    {
        if (!File.Exists(_salesFilePath)) return new List<SaleRecord>();
        var json = await File.ReadAllTextAsync(_salesFilePath);
        return string.IsNullOrWhiteSpace(json)
            ? new List<SaleRecord>()
            : JsonSerializer.Deserialize<List<SaleRecord>>(json, _jsonOptions) ?? new List<SaleRecord>();
    }

    private async Task WriteSalesInternalAsync(List<SaleRecord> sales)
    {
        var json = JsonSerializer.Serialize(sales, _jsonOptions);
        await File.WriteAllTextAsync(_salesFilePath, json);
    }

    public async Task<List<Medicine>> GetMedicinesAsync(string? search = null)
    {
        await _semaphore.WaitAsync();
        try
        {
            var medicines = await ReadMedicinesInternalAsync();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var query = search.Trim();
                medicines = medicines
                    .Where(m => m.FullName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                                m.Brand.Contains(query, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
            return medicines;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<Medicine?> GetMedicineByIdAsync(string id)
    {
        await _semaphore.WaitAsync();
        try
        {
            var medicines = await ReadMedicinesInternalAsync();
            return medicines.FirstOrDefault(m => m.Id == id);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<Medicine> AddMedicineAsync(Medicine medicine)
    {
        if (string.IsNullOrWhiteSpace(medicine.Id))
        {
            medicine.Id = "med-" + Guid.NewGuid().ToString("N")[..8];
        }

        // Ensure price is rounded to 2 decimal places
        medicine.Price = Math.Round(medicine.Price, 2);

        await _semaphore.WaitAsync();
        try
        {
            var medicines = await ReadMedicinesInternalAsync();
            medicines.Add(medicine);
            await WriteMedicinesInternalAsync(medicines);
            return medicine;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<Medicine?> UpdateMedicineAsync(string id, Medicine medicine)
    {
        await _semaphore.WaitAsync();
        try
        {
            var medicines = await ReadMedicinesInternalAsync();
            var index = medicines.FindIndex(m => m.Id == id);
            if (index == -1) return null;

            medicine.Id = id;
            medicine.Price = Math.Round(medicine.Price, 2);
            medicines[index] = medicine;
            await WriteMedicinesInternalAsync(medicines);
            return medicine;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<bool> DeleteMedicineAsync(string id)
    {
        await _semaphore.WaitAsync();
        try
        {
            var medicines = await ReadMedicinesInternalAsync();
            var countRemoved = medicines.RemoveAll(m => m.Id == id);
            if (countRemoved > 0)
            {
                await WriteMedicinesInternalAsync(medicines);
                return true;
            }
            return false;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<List<SaleRecord>> GetSalesAsync()
    {
        await _semaphore.WaitAsync();
        try
        {
            var sales = await ReadSalesInternalAsync();
            return sales.OrderByDescending(s => s.SaleDate).ToList();
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<SaleRecord> RecordSaleAsync(CreateSaleDto dto)
    {
        await _semaphore.WaitAsync();
        try
        {
            var medicines = await ReadMedicinesInternalAsync();
            var medicine = medicines.FirstOrDefault(m => m.Id == dto.MedicineId)
                ?? throw new KeyNotFoundException($"Medicine with ID '{dto.MedicineId}' was not found.");

            if (dto.Quantity <= 0)
            {
                throw new ArgumentException("Sale quantity must be at least 1.");
            }

            if (medicine.Quantity < dto.Quantity)
            {
                throw new InvalidOperationException($"Insufficient stock for '{medicine.FullName}'. Current stock: {medicine.Quantity}, requested: {dto.Quantity}.");
            }

            // Deduct stock
            medicine.Quantity -= dto.Quantity;
            await WriteMedicinesInternalAsync(medicines);

            // Record sale
            var sales = await ReadSalesInternalAsync();
            var sale = new SaleRecord
            {
                Id = "sale-" + Guid.NewGuid().ToString("N")[..8],
                MedicineId = medicine.Id,
                MedicineName = medicine.FullName,
                Brand = medicine.Brand,
                Quantity = dto.Quantity,
                UnitPrice = Math.Round(medicine.Price, 2),
                TotalPrice = Math.Round(medicine.Price * dto.Quantity, 2),
                SaleDate = DateTime.UtcNow,
                CustomerName = dto.CustomerName,
                Notes = dto.Notes
            };

            sales.Add(sale);
            await WriteSalesInternalAsync(sales);

            return sale;
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
