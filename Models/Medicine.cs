using System.ComponentModel.DataAnnotations;

namespace ABCPharmacy.Models;

public class Medicine
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [Required(ErrorMessage = "Full Name of the medicine is required")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Medicine name must be between 2 and 150 characters")]
    public string FullName { get; set; } = string.Empty;

    public string? Notes { get; set; } = string.Empty;

    [Required(ErrorMessage = "Expiry Date is required")]
    public DateTime ExpiryDate { get; set; }

    [Range(0, 1000000, ErrorMessage = "Quantity must be between 0 and 1,000,000")]
    public int Quantity { get; set; }

    [Range(0.01, 1000000.00, ErrorMessage = "Price must be greater than 0")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Brand is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Brand must be between 1 and 100 characters")]
    public string Brand { get; set; } = string.Empty;
}
