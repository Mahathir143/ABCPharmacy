using Microsoft.AspNetCore.Mvc;
using ABCPharmacy.Models;
using ABCPharmacy.Services;

namespace ABCPharmacy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly IPharmacyService _pharmacyService;
    private readonly ILogger<SalesController> _logger;

    public SalesController(IPharmacyService pharmacyService, ILogger<SalesController> logger)
    {
        _pharmacyService = pharmacyService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all sales records ordered by date descending
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SaleRecord>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SaleRecord>>> GetAll()
    {
        var sales = await _pharmacyService.GetSalesAsync();
        return Ok(sales);
    }

    /// <summary>
    /// Records a new sale transaction and updates inventory stock
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SaleRecord), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleRecord>> CreateSale([FromBody] CreateSaleDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var sale = await _pharmacyService.RecordSaleAsync(dto);
            return StatusCode(StatusCodes.Status201Created, sale);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing sale");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while processing the sale." });
        }
    }
}
