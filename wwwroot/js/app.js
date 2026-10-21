// ABC Pharmacy - Single Page Application built with React 18
const { useState, useEffect, useMemo } = React;

function App() {
  const [activeTab, setActiveTab] = useState('medicines'); // 'medicines' | 'sales'
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals Visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Selected Items for Modals
  const [selectedMedicineForNotes, setSelectedMedicineForNotes] = useState(null);
  const [selectedMedicineForEdit, setSelectedMedicineForEdit] = useState(null);

  // Form State: Add Medicine
  const [addForm, setAddForm] = useState({
    fullName: '',
    brand: '',
    expiryDate: '',
    quantity: 50,
    price: 15.00,
    notes: ''
  });

  // Form State: Record Sale
  const [saleForm, setSaleForm] = useState({
    medicineId: '',
    quantity: 1,
    customerName: '',
    notes: ''
  });

  // Toast Notification
  const [toast, setToast] = useState({ show: false, title: '', message: '', type: 'success' });

  const showToast = (title, message, type = 'success') => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Helper: Days until expiry
  const getDaysUntilExpiry = (dateStr) => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Requirement: Red background if expiry date < 30 days
  const isExpiringSoon = (medicine) => {
    return getDaysUntilExpiry(medicine.expiryDate) < 30;
  };

  // Requirement: Yellow background if quantity in stock < 10
  const isLowStock = (medicine) => {
    return medicine.quantity < 10;
  };

  // Row CSS class resolver
  const getRowClass = (medicine) => {
    const expiring = isExpiringSoon(medicine);
    const lowStock = isLowStock(medicine);

    if (expiring && lowStock) return 'row-critical-both';
    if (expiring) return 'row-expiring-soon';
    if (lowStock) return 'row-low-stock';
    return 'row-normal';
  };

  // Formatters
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '$' + num.toFixed(2);
  };

  // API Calls
  const fetchMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const res = await fetch('/api/medicines');
      if (!res.ok) throw new Error('Failed to load medicines');
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      showToast('Error', err.message || 'Failed to fetch medicines', 'danger');
    } finally {
      setLoadingMedicines(false);
    }
  };

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const res = await fetch('/api/sales');
      if (!res.ok) throw new Error('Failed to load sales records');
      const data = await res.json();
      setSales(data);
    } catch (err) {
      showToast('Error', err.message || 'Failed to fetch sales', 'danger');
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchSales();

    // Set default add form expiry 6 months in future
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setAddForm(prev => ({ ...prev, expiryDate: d.toISOString().split('T')[0] }));
  }, []);

  // Filtered & Sorted Medicines using useMemo
  const filteredMedicines = useMemo(() => {
    let list = [...medicines];

    // Search query on Full Name or Brand
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        m.fullName.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'expiring') {
      list = list.filter(m => isExpiringSoon(m));
    } else if (statusFilter === 'lowstock') {
      list = list.filter(m => isLowStock(m));
    } else if (statusFilter === 'both') {
      list = list.filter(m => isExpiringSoon(m) && isLowStock(m));
    } else if (statusFilter === 'normal') {
      list = list.filter(m => !isExpiringSoon(m) && !isLowStock(m));
    }

    // Sorting
    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.fullName.toLowerCase();
        valB = b.fullName.toLowerCase();
      } else if (sortBy === 'brand') {
        valA = a.brand.toLowerCase();
        valB = b.brand.toLowerCase();
      } else if (sortBy === 'expiry') {
        valA = new Date(a.expiryDate).getTime();
        valB = new Date(b.expiryDate).getTime();
      } else if (sortBy === 'quantity') {
        valA = a.quantity;
        valB = b.quantity;
      } else if (sortBy === 'price') {
        valA = a.price;
        valB = b.price;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [medicines, searchQuery, statusFilter, sortBy, sortOrder]);

  // Derived Metrics using useMemo
  const expiringSoonCount = useMemo(() => medicines.filter(m => isExpiringSoon(m)).length, [medicines]);
  const lowStockCount = useMemo(() => medicines.filter(m => isLowStock(m)).length, [medicines]);
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0).toFixed(2);
  }, [sales]);

  // Selected medicine in Sale modal
  const selectedSaleMedicine = useMemo(() => {
    if (!saleForm.medicineId) return null;
    return medicines.find(m => m.id === saleForm.medicineId) || null;
  }, [medicines, saleForm.medicineId]);

  const saleTotalPrice = useMemo(() => {
    if (!selectedSaleMedicine || !saleForm.quantity) return '0.00';
    return (selectedSaleMedicine.price * saleForm.quantity).toFixed(2);
  }, [selectedSaleMedicine, saleForm.quantity]);

  // Handlers: Add Medicine
  const handleOpenAddModal = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setAddForm({
      fullName: '',
      brand: '',
      expiryDate: d.toISOString().split('T')[0],
      quantity: 50,
      price: 15.00,
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.fullName.trim() || !addForm.brand.trim() || !addForm.expiryDate) {
      showToast('Validation Error', 'Please complete all required fields.', 'danger');
      return;
    }

    try {
      const payload = {
        fullName: addForm.fullName.trim(),
        brand: addForm.brand.trim(),
        expiryDate: new Date(addForm.expiryDate).toISOString(),
        quantity: parseInt(addForm.quantity, 10),
        price: parseFloat(addForm.price),
        notes: addForm.notes?.trim() || ''
      };

      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to add medicine');
      }

      const added = await res.json();
      setMedicines(prev => [added, ...prev]);
      setShowAddModal(false);
      showToast('Success', `"${added.fullName}" added to inventory successfully!`, 'success');
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  };

  // Handlers: Quick Sell
  const handleOpenSellModal = (medicine = null) => {
    if (medicine) {
      if (medicine.quantity <= 0) {
        showToast('Out of Stock', `"${medicine.fullName}" has zero stock available.`, 'warning');
        return;
      }
      setSaleForm({
        medicineId: medicine.id,
        quantity: 1,
        customerName: '',
        notes: ''
      });
    } else {
      const firstInStock = medicines.find(m => m.quantity > 0);
      setSaleForm({
        medicineId: firstInStock ? firstInStock.id : '',
        quantity: 1,
        customerName: '',
        notes: ''
      });
    }
    setShowSellModal(true);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!saleForm.medicineId) {
      showToast('Validation Error', 'Please select a medicine.', 'danger');
      return;
    }

    const med = selectedSaleMedicine;
    if (!med) {
      showToast('Error', 'Selected medicine not found.', 'danger');
      return;
    }

    const qty = parseInt(saleForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Validation Error', 'Quantity must be at least 1.', 'danger');
      return;
    }

    if (qty > med.quantity) {
      showToast('Insufficient Stock', `Cannot sell ${qty} units. Only ${med.quantity} available in stock.`, 'danger');
      return;
    }

    try {
      const payload = {
        medicineId: saleForm.medicineId,
        quantity: qty,
        customerName: saleForm.customerName?.trim() || '',
        notes: saleForm.notes?.trim() || ''
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to record sale');
      }

      const saleRecord = await res.json();

      // Update local medicine stock immediately
      setMedicines(prev => prev.map(m => m.id === med.id ? { ...m, quantity: m.quantity - qty } : m));
      // Prepend to sales records
      setSales(prev => [saleRecord, ...prev]);

      setShowSellModal(false);
      showToast('Sale Completed', `Sold ${qty}x ${med.fullName} for ${formatCurrency(saleRecord.totalPrice)}!`, 'success');
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  };

  // Handlers: Edit Medicine
  const handleOpenEditModal = (medicine) => {
    const expDate = medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '';
    setSelectedMedicineForEdit({
      id: medicine.id,
      fullName: medicine.fullName,
      brand: medicine.brand,
      expiryDate: expDate,
      quantity: medicine.quantity,
      price: medicine.price,
      notes: medicine.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: selectedMedicineForEdit.id,
        fullName: selectedMedicineForEdit.fullName.trim(),
        brand: selectedMedicineForEdit.brand.trim(),
        expiryDate: new Date(selectedMedicineForEdit.expiryDate).toISOString(),
        quantity: parseInt(selectedMedicineForEdit.quantity, 10),
        price: parseFloat(selectedMedicineForEdit.price),
        notes: selectedMedicineForEdit.notes?.trim() || ''
      };

      const res = await fetch(`/api/medicines/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update medicine');
      }

      const updated = await res.json();
      setMedicines(prev => prev.map(m => m.id === updated.id ? updated : m));
      setShowEditModal(false);
      showToast('Updated', `"${updated.fullName}" updated successfully!`, 'success');
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  };

  // Handlers: Delete Medicine
  const handleDeleteMedicine = async (medicine) => {
    if (!confirm(`Are you sure you want to delete "${medicine.fullName}" from inventory?`)) return;

    try {
      const res = await fetch(`/api/medicines/${medicine.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete medicine');
      }
      setMedicines(prev => prev.filter(m => m.id !== medicine.id));
      showToast('Deleted', `"${medicine.fullName}" was removed from inventory.`, 'info');
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  };

  // Sort toggle handler
  const handleSortToggle = (col) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark navbar-pharmacy py-3">
        <div className="container-fluid px-4">
          <a className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4" href="#">
            <i className="bi bi-capsule-pill text-white fs-3"></i>
            <span>ABC Pharmacy</span>
            <span className="brand-badge ms-1">React + .NET Web API</span>
          </a>

          <ul className="nav nav-pills nav-pills-pharmacy ms-auto me-3 bg-white bg-opacity-10 p-1 rounded-3">
            <li className="nav-item">
              <button
                className={`nav-link text-white ${activeTab === 'medicines' ? 'active' : ''}`}
                onClick={() => setActiveTab('medicines')}>
                <i className="bi bi-grid-3x3-gap-fill me-1"></i> Medicine Inventory
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link text-white ${activeTab === 'sales' ? 'active' : ''}`}
                onClick={() => { setActiveTab('sales'); fetchSales(); }}>
                <i className="bi bi-receipt me-1"></i> Sales Records
                {sales.length > 0 && <span className="badge bg-light text-dark ms-1">{sales.length}</span>}
              </button>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-warning fw-semibold shadow-sm d-flex align-items-center gap-1" onClick={() => handleOpenSellModal()}>
              <i className="bi bi-cart-plus-fill"></i> Record Sale
            </button>
            <button className="btn btn-light text-success fw-semibold shadow-sm d-flex align-items-center gap-1" onClick={handleOpenAddModal}>
              <i className="bi bi-plus-circle-fill"></i> Add Medicine
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container-fluid px-4 py-4">

        {/* Quick Stats Summary Bar */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card stat-card p-3 bg-white">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-info bg-opacity-10 text-info me-3">
                  <i className="bi bi-box-seam-fill"></i>
                </div>
                <div>
                  <div className="text-muted small fw-medium">Total Medicines</div>
                  <div className="fs-4 fw-bold text-dark">{medicines.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card stat-card p-3 bg-white border-start border-danger border-4">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-danger bg-opacity-10 text-danger me-3">
                  <i className="bi bi-calendar-x-fill"></i>
                </div>
                <div>
                  <div className="text-danger small fw-semibold">Expiring &lt; 30 Days</div>
                  <div className="fs-4 fw-bold text-danger">{expiringSoonCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card stat-card p-3 bg-white border-start border-warning border-4">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-warning bg-opacity-10 text-warning me-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div>
                  <div className="text-warning-emphasis small fw-semibold">Low Stock (&lt; 10 Units)</div>
                  <div className="fs-4 fw-bold text-warning-emphasis">{lowStockCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card stat-card p-3 bg-white">
              <div className="d-flex align-items-center">
                <div className="stat-icon bg-success bg-opacity-10 text-success me-3">
                  <i className="bi bi-currency-dollar"></i>
                </div>
                <div>
                  <div className="text-muted small fw-medium">Total Sales Revenue</div>
                  <div className="fs-4 fw-bold text-success">${totalRevenue}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: MEDICINES INVENTORY */}
        {activeTab === 'medicines' && (
          <div>
            {/* Toolbar */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3">
                <div className="row g-3 align-items-center">
                  {/* Search Query on Name & Brand */}
                  <div className="col-12 col-md-5">
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search medicine by name or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button className="btn btn-outline-secondary border-start-0" type="button" onClick={() => setSearchQuery('')}>
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter by Status */}
                  <div className="col-12 col-md-3">
                    <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">Filter: All Statuses</option>
                      <option value="expiring">🟥 Expiring Soon (&lt; 30 Days)</option>
                      <option value="lowstock">🟨 Low Stock (&lt; 10 Units)</option>
                      <option value="both">🟧 Expiring Soon &amp; Low Stock</option>
                      <option value="normal">🟩 In Stock &amp; Valid</option>
                    </select>
                  </div>

                  {/* Sort Controls */}
                  <div className="col-12 col-md-4 d-flex justify-content-md-end gap-2">
                    <div className="dropdown">
                      <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i className="bi bi-arrow-down-up me-1"></i> Sort: {sortBy.toUpperCase()} ({sortOrder})
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleSortToggle('name'); }}>Medicine Name</a></li>
                        <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleSortToggle('expiry'); }}>Expiry Date</a></li>
                        <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleSortToggle('quantity'); }}>Stock Quantity</a></li>
                        <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleSortToggle('price'); }}>Price</a></li>
                      </ul>
                    </div>
                    <button className="btn btn-outline-primary" onClick={fetchMedicines} title="Reload list">
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>

                {/* Color Legend (Mandatory Requirement) */}
                <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
                  <span className="text-muted small fw-semibold me-2">Color Indicators:</span>
                  <span className="legend-badge legend-red">
                    <i className="bi bi-circle-fill text-danger fs-6"></i> Red: Expiry date &lt; 30 days
                  </span>
                  <span className="legend-badge legend-yellow">
                    <i className="bi bi-circle-fill text-warning fs-6"></i> Yellow: Stock quantity &lt; 10
                  </span>
                  <span className="legend-badge legend-dual">
                    <i className="bi bi-circle-fill text-danger-emphasis fs-6"></i> Both: &lt; 30 days &amp; &lt; 10 units
                  </span>
                  <span className="legend-badge legend-normal">
                    <i className="bi bi-circle-fill text-secondary fs-6"></i> Standard: &ge; 30 days &amp; &ge; 10 units
                  </span>
                  <span className="text-muted small ms-auto fst-italic">
                    *Notes attribute excluded from grid columns per specification; click view icon to inspect.
                  </span>
                </div>
              </div>
            </div>

            {/* Medicine Grid */}
            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="table-responsive">
                <table className="table table-pharmacy align-middle">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '40px' }}>#</th>
                      <th scope="col" onClick={() => handleSortToggle('name')} role="button">
                        Full Name <i className="bi bi-arrow-down-up small ms-1 text-muted"></i>
                      </th>
                      <th scope="col" onClick={() => handleSortToggle('brand')} role="button">
                        Brand <i className="bi bi-arrow-down-up small ms-1 text-muted"></i>
                      </th>
                      <th scope="col" onClick={() => handleSortToggle('expiry')} role="button">
                        Expiry Date <i className="bi bi-arrow-down-up small ms-1 text-muted"></i>
                      </th>
                      <th scope="col" className="text-center" onClick={() => handleSortToggle('quantity')} role="button">
                        Quantity <i className="bi bi-arrow-down-up small ms-1 text-muted"></i>
                      </th>
                      <th scope="col" className="text-end" onClick={() => handleSortToggle('price')} role="button">
                        Price ($) <i className="bi bi-arrow-down-up small ms-1 text-muted"></i>
                      </th>
                      <th scope="col" className="text-center">Status / Alerts</th>
                      <th scope="col" className="text-end" style={{ width: '220px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMedicines ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status"></div>
                          <div className="text-muted mt-2">Loading medicine inventory...</div>
                        </td>
                      </tr>
                    ) : filteredMedicines.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <i className="bi bi-capsule fs-1 text-muted"></i>
                          <h5 className="mt-2 text-dark">No medicines found</h5>
                          <p className="text-muted mb-3">Try adjusting your search query or filter.</p>
                          <button className="btn btn-sm btn-primary" onClick={handleOpenAddModal}>
                            <i className="bi bi-plus-circle me-1"></i> Add First Medicine
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredMedicines.map((med, idx) => {
                        const daysRemaining = getDaysUntilExpiry(med.expiryDate);
                        const expiring = isExpiringSoon(med);
                        const lowStock = isLowStock(med);

                        return (
                          <tr key={med.id} className={getRowClass(med)}>
                            <td className="text-muted small">{idx + 1}</td>
                            <td>
                              <div className="fw-bold text-dark">{med.fullName}</div>
                              {med.notes && (
                                <small className="text-muted">
                                  <i className="bi bi-file-text me-1"></i>Has notes
                                </small>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                                {med.brand}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{formatDate(med.expiryDate)}</div>
                              <small className={expiring ? 'text-danger fw-bold' : 'text-muted'}>
                                <i className="bi bi-clock-history me-1"></i>
                                {daysRemaining < 0
                                  ? `Expired ${Math.abs(daysRemaining)} days ago!`
                                  : daysRemaining === 0
                                    ? 'Expires Today!'
                                    : `${daysRemaining} days remaining`}
                              </small>
                            </td>
                            <td className="text-center">
                              <span className={`badge fs-6 px-3 py-1 ${lowStock ? 'bg-warning text-dark' : 'bg-light text-dark border'}`}>
                                {med.quantity}
                              </span>
                              {lowStock && <div className="small text-danger fw-bold mt-1">Low Stock!</div>}
                            </td>
                            <td className="text-end">
                              <span className="price-tag text-dark fw-bold fs-6">
                                {formatCurrency(med.price)}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex flex-column gap-1 align-items-center">
                                {expiring && (
                                  <span className="badge bg-danger">
                                    <i className="bi bi-exclamation-octagon-fill me-1"></i> &lt; 30d Expiry
                                  </span>
                                )}
                                {lowStock && (
                                  <span className="badge bg-warning text-dark">
                                    <i className="bi bi-exclamation-triangle-fill me-1"></i> &lt; 10 In Stock
                                  </span>
                                )}
                                {!expiring && !lowStock && (
                                  <span className="badge bg-success bg-opacity-75">
                                    <i className="bi bi-check-circle-fill me-1"></i> In Stock &amp; Valid
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-sell"
                                  onClick={() => handleOpenSellModal(med)}
                                  title="Record Sale for this Medicine"
                                  disabled={med.quantity <= 0}>
                                  <i className="bi bi-cart-check-fill me-1"></i> Sell
                                </button>
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => { setSelectedMedicineForNotes(med); setShowNotesModal(true); }}
                                  title="View Full Details & Notes">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => handleOpenEditModal(med)}
                                  title="Edit Medicine">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteMedicine(med)}
                                  title="Delete Medicine">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card-footer bg-light d-flex justify-content-between align-items-center py-2 px-3 small text-muted">
                <span>Showing {filteredMedicines.length} of {medicines.length} medicines</span>
                <span>ABC Pharmacy &bull; React 18 SPA</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALES RECORDS */}
        {activeTab === 'sales' && (
          <div>
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <h5 className="mb-1 text-dark fw-bold">
                    <i className="bi bi-receipt-cutoff text-primary me-2"></i>Sales Transaction History
                  </h5>
                  <div className="text-muted small">
                    Every sale automatically decrements inventory and persists to server records in JSON.
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-warning fw-semibold shadow-sm" onClick={() => handleOpenSellModal()}>
                    <i className="bi bi-cart-plus-fill me-1"></i> New Sale
                  </button>
                  <button className="btn btn-outline-secondary" onClick={fetchSales} title="Refresh Sales">
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Sale ID</th>
                      <th>Date &amp; Time</th>
                      <th>Medicine Name</th>
                      <th>Brand</th>
                      <th className="text-center">Quantity Sold</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Total Amount</th>
                      <th>Customer / Reference</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSales ? (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status"></div>
                          <div className="text-muted mt-2">Loading sales history...</div>
                        </td>
                      </tr>
                    ) : sales.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <i className="bi bi-cart-x fs-1 text-muted"></i>
                          <h5 className="mt-2 text-dark">No sales recorded yet</h5>
                          <p className="text-muted mb-3">Record your first sale to keep track of transactions.</p>
                          <button className="btn btn-sm btn-primary" onClick={() => handleOpenSellModal()}>
                            <i className="bi bi-cart-plus me-1"></i> Record a Sale
                          </button>
                        </td>
                      </tr>
                    ) : (
                      sales.map(sale => (
                        <tr key={sale.id}>
                          <td>
                            <span className="badge bg-light text-dark font-monospace border">
                              #{sale.id}
                            </span>
                          </td>
                          <td className="text-muted small">{formatDateTime(sale.saleDate)}</td>
                          <td>
                            <strong className="text-dark">{sale.medicineName}</strong>
                          </td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                              {sale.brand}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary px-3 py-1 fs-6">
                              {sale.quantity}
                            </span>
                          </td>
                          <td className="text-end font-monospace">{formatCurrency(sale.unitPrice)}</td>
                          <td className="text-end fw-bold text-success font-monospace fs-6">
                            {formatCurrency(sale.totalPrice)}
                          </td>
                          <td>
                            {sale.customerName ? (
                              <span className="badge bg-light text-dark border">
                                <i className="bi bi-person me-1"></i>{sale.customerName}
                              </span>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>
                          <td className="small text-muted">{sale.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card-footer bg-light d-flex justify-content-between align-items-center py-2 px-3 small text-muted">
                <span>Total {sales.length} sales transactions</span>
                <span className="fw-bold text-success">Cumulative Revenue: ${totalRevenue}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD MEDICINE */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header modal-header-pharmacy">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-plus-circle me-2"></i>Add Medicine to Inventory
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold">
                        Full Name of the Medicine <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Amoxicillin 500mg Capsules"
                        value={addForm.fullName}
                        onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">
                        Brand <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. GlaxoSmithKline"
                        value={addForm.brand}
                        onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">
                        Expiry Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={addForm.expiryDate}
                        onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                        required
                      />
                      <div className="form-text small">Highlight trigger: &lt; 30 days turns Red.</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">
                        Quantity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={addForm.quantity}
                        onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                        required
                      />
                      <div className="form-text small">Highlight trigger: &lt; 10 units turns Yellow.</div>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">
                        Price ($) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          value={addForm.price}
                          onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-text small">Two decimal places.</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Notes</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Storage conditions, precautions, batch instructions..."
                        value={addForm.notes}
                        onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                      ></textarea>
                      <div className="form-text small">
                        *Notes are stored and viewable via details modal (excluded from main grid columns per specification).
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success fw-semibold">
                    <i className="bi bi-check-lg me-1"></i> Save Medicine
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD SALE */}
      {showSellModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-cart-check-fill me-2"></i>Record Medicine Sale
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSellModal(false)}></button>
              </div>
              <form onSubmit={handleSaleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Select Medicine <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={saleForm.medicineId}
                      onChange={(e) => setSaleForm({ ...saleForm, medicineId: e.target.value })}
                      required>
                      <option value="" disabled>-- Choose a medicine --</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id} disabled={m.quantity <= 0}>
                          {m.fullName} ({m.brand}) - Stock: {m.quantity} | {formatCurrency(m.price)}
                          {m.quantity <= 0 ? ' [OUT OF STOCK]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSaleMedicine && (
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted small">Brand:</span>
                        <span className="fw-semibold">{selectedSaleMedicine.brand}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted small">Available Stock:</span>
                        <span className={`badge ${selectedSaleMedicine.quantity < 10 ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {selectedSaleMedicine.quantity} units in stock
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Unit Price:</span>
                        <span className="fw-bold font-monospace text-primary">
                          {formatCurrency(selectedSaleMedicine.price)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Quantity to Sell <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max={selectedSaleMedicine ? selectedSaleMedicine.quantity : 9999}
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                      required
                    />
                    {selectedSaleMedicine && Number(saleForm.quantity) > selectedSaleMedicine.quantity && (
                      <div className="form-text text-danger fw-semibold">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i> Cannot sell more than available quantity ({selectedSaleMedicine.quantity}).
                      </div>
                    )}
                  </div>

                  <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25 p-3 mb-3 text-center">
                    <div className="text-muted small fw-medium">Total Bill Amount</div>
                    <div className="fs-3 fw-bold text-primary font-monospace">${saleTotalPrice}</div>
                    <div className="text-muted small">
                      {saleForm.quantity || 0} &times; {formatCurrency(selectedSaleMedicine ? selectedSaleMedicine.price : 0)}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Customer Name / Prescription ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe / RX-9842"
                      value={saleForm.customerName}
                      onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Sale Notes / Remarks (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. OTC purchase, discounted, cash payment"
                      value={saleForm.notes}
                      onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSellModal(false)}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4"
                    disabled={!selectedSaleMedicine || Number(saleForm.quantity) > selectedSaleMedicine.quantity || Number(saleForm.quantity) <= 0}>
                    <i className="bi bi-check-circle-fill me-1"></i> Confirm &amp; Complete Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW NOTES */}
      {showNotesModal && selectedMedicineForNotes && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-info-circle me-2"></i>Medicine Details &amp; Notes
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowNotesModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <h4 className="fw-bold text-dark mb-1">{selectedMedicineForNotes.fullName}</h4>
                <div className="badge bg-secondary mb-3">{selectedMedicineForNotes.brand}</div>

                <div className="row g-2 mb-4 bg-light p-3 rounded-3">
                  <div className="col-6">
                    <div className="text-muted small">Expiry Date:</div>
                    <div className="fw-semibold">{formatDate(selectedMedicineForNotes.expiryDate)}</div>
                    <div className={isExpiringSoon(selectedMedicineForNotes) ? 'text-danger fw-bold small' : 'text-muted small'}>
                      {getDaysUntilExpiry(selectedMedicineForNotes.expiryDate)} days remaining
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">In-Stock Quantity:</div>
                    <div className="fw-semibold">{selectedMedicineForNotes.quantity} units</div>
                    <div className={isLowStock(selectedMedicineForNotes) ? 'text-warning-emphasis fw-bold small' : 'text-success small'}>
                      {isLowStock(selectedMedicineForNotes) ? 'Low Stock Warning' : 'Normal Stock'}
                    </div>
                  </div>
                  <div className="col-12 mt-2 pt-2 border-top">
                    <div className="text-muted small">Price per unit:</div>
                    <div className="fw-bold text-primary font-monospace fs-5">
                      {formatCurrency(selectedMedicineForNotes.price)}
                    </div>
                  </div>
                </div>

                <div className="card border-info border-opacity-25 bg-info bg-opacity-10 p-3">
                  <div className="fw-bold text-info-emphasis mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-file-text-fill"></i> Notes &amp; Storage Instructions:
                  </div>
                  <p className="mb-0 text-dark">
                    {selectedMedicineForNotes.notes || 'No special notes entered for this medicine.'}
                  </p>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNotesModal(false)}>Close</button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    const med = selectedMedicineForNotes;
                    setShowNotesModal(false);
                    handleOpenSellModal(med);
                  }}>
                  <i className="bi bi-cart-plus me-1"></i> Sell This Medicine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MEDICINE */}
      {showEditModal && selectedMedicineForEdit && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-secondary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>Edit Medicine Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label fw-semibold">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedMedicineForEdit.fullName}
                        onChange={(e) => setSelectedMedicineForEdit({ ...selectedMedicineForEdit, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Brand</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedMedicineForEdit.brand}
                        onChange={(e) => setSelectedMedicineForEdit({ ...selectedMedicineForEdit, brand: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Expiry Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={selectedMedicineForEdit.expiryDate}
                        onChange={(e) => setSelectedMedicineForEdit({ ...selectedMedicineForEdit, expiryDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={selectedMedicineForEdit.quantity}
                        onChange={(e) => setSelectedMedicineForEdit({ ...selectedMedicineForEdit, quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold">Price ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        min="0.01"
                        value={selectedMedicineForEdit.price}
                        onChange={(e) => setSelectedMedicineForEdit({ ...selectedMedicineForEdit, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Notes</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={selectedMedicineForEdit.notes}
                        onChange={(e) => setSelectedMedicineForEdit({ ...selectedMedicineForEdit, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-semibold">Update Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast show align-items-center text-white border-0 shadow-lg ${toast.type === 'success' ? 'bg-success' : toast.type === 'danger' ? 'bg-danger' : 'bg-primary'}`}>
            <div className="d-flex">
              <div className="toast-body">
                <div className="fw-bold">{toast.title}</div>
                <div>{toast.message}</div>
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast(prev => ({ ...prev, show: false }))}></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount React 18 Application Root
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
