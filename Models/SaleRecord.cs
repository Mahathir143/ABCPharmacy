using System.ComponentModel.DataAnnotations;

namespace ABCPharmacy.Models;

public class SaleRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [Required]
    public string MedicineId { get; set; } = string.Empty;

    [Required]
    public string MedicineName { get; set; } = string.Empty;

    public string Brand { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }

    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    public string? CustomerName { get; set; }

    public string? Notes { get; set; }
}

public class CreateSaleDto
{
    [Required(ErrorMessage = "Medicine ID is required")]
    public string MedicineId { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Sale quantity must be at least 1")]
    public int Quantity { get; set; }

    public string? CustomerName { get; set; }

    public string? Notes { get; set; }
}
