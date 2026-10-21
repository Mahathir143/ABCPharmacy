using Microsoft.AspNetCore.Mvc;
using ABCPharmacy.Models;
using ABCPharmacy.Services;

namespace ABCPharmacy.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MedicinesController : ControllerBase
{
    private readonly IPharmacyService _pharmacyService;
    private readonly ILogger<MedicinesController> _logger;

    public MedicinesController(IPharmacyService pharmacyService, ILogger<MedicinesController> logger)
    {
        _pharmacyService = pharmacyService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all medicines, optionally filtered by name or brand
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Medicine>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Medicine>>> GetAll([FromQuery] string? search)
    {
        var medicines = await _pharmacyService.GetMedicinesAsync(search);
        return Ok(medicines);
    }

    /// <summary>
    /// Gets a single medicine by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Medicine), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Medicine>> GetById(string id)
    {
        var medicine = await _pharmacyService.GetMedicineByIdAsync(id);
        if (medicine == null)
        {
            return NotFound(new { message = $"Medicine with ID '{id}' was not found." });
        }
        return Ok(medicine);
    }

    /// <summary>
    /// Adds a new medicine
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Medicine), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Medicine>> Create([FromBody] Medicine medicine)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _pharmacyService.AddMedicineAsync(medicine);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Updates an existing medicine
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Medicine), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Medicine>> Update(string id, [FromBody] Medicine medicine)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _pharmacyService.UpdateMedicineAsync(id, medicine);
        if (updated == null)
        {
            return NotFound(new { message = $"Medicine with ID '{id}' was not found." });
        }
        return Ok(updated);
    }

    /// <summary>
    /// Deletes a medicine
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var success = await _pharmacyService.DeleteMedicineAsync(id);
        if (!success)
        {
            return NotFound(new { message = $"Medicine with ID '{id}' was not found." });
        }
        return NoContent();
    }
}
