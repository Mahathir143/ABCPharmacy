using ABCPharmacy.Models;

namespace ABCPharmacy.Services;

public interface IPharmacyService
{
    Task<List<Medicine>> GetMedicinesAsync(string? search = null);
    Task<Medicine?> GetMedicineByIdAsync(string id);
    Task<Medicine> AddMedicineAsync(Medicine medicine);
    Task<Medicine?> UpdateMedicineAsync(string id, Medicine medicine);
    Task<bool> DeleteMedicineAsync(string id);
    Task<List<SaleRecord>> GetSalesAsync();
    Task<SaleRecord> RecordSaleAsync(CreateSaleDto dto);
}
