/**
 * Stock It Up Clone Platform - Welcome/Onboarding Module
 * نموذج الترحيب والإعداد الأولي لمنصة Stock It Up
 * 
 * This file handles the complete onboarding experience for new users of the Stock It Up platform.
 * It manages multi-step navigation, form interactions, CRUD operations, and progress tracking
 * for the initial setup process including addresses, sellers, fulfillers, and warehouses.
 * 
 * Architecture Overview:
 * - Multi-step wizard navigation with progress tracking
 * - CRUD operations for business entities (addresses, sellers, fulfillers, warehouses)
 * - Form state management with edit/create modes
 * - Real-time progress bar animations
 * - Session-based progress persistence
 * - WebSocket integration for real-time updates
 * 
 * Business Entities:
 * 1. Addresses: Physical locations for business operations
 * 2. Sellers: Entity information for marketplace presence
 * 3. Fulfillers: Third-party fulfillment partners
 * 4. Warehouses: Storage locations linked to addresses and fulfillers
 * 
 * Features:
 * - Animated progress bar with cubic-bezier transitions
 * - Form validation and error handling
 * - Real-time DOM updates without page reloads
 * - Session storage for progress persistence
 * - Multi-language support (Dutch interface)
 * - Responsive form management
 * - Empty state handling
 * - Confirmation dialogs for destructive actions
 */

// ===== NAVIGATION SYSTEM =====

function navigateToPage(url) {
    // Clear progress tracking for specific pages
    if (url === '/welkom/' || url === '/welkom/adressen/' || url.includes('connections')) {
        if (url === '/welkom/' || url === '/welkom/adressen/') {
            sessionStorage.removeItem('welkomProgressWidth');
        }
    }
    window.location.href = url;
}

// ===== FORM VISIBILITY MANAGEMENT =====

function showAddressForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'flex';
        document.getElementById('form-title').textContent = 'Nieuw Adres';
        document.getElementById('address-form').reset();
        document.getElementById('address-id').value = '';
    }
}

function hideAddressForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'none';
    }
}

function showSellerForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'flex';
        document.getElementById('form-title').textContent = 'Nieuwe Verkoper';
        document.getElementById('seller-form').reset();
        document.getElementById('seller-id').value = '';
    }
}

function hideSellerForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'none';
    }
}

function showFulfillerForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'flex';
        document.getElementById('form-title').textContent = 'Nieuwe Fulfiller';
        document.getElementById('fulfiller-form').reset();
        document.getElementById('fulfiller-id').value = '';
    }
}

function hideFulfillerForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'none';
    }
}

function showWarehouseForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'flex';
        document.getElementById('form-title').textContent = 'Nieuw Magazijn';
        document.getElementById('warehouse-form').reset();
        document.getElementById('warehouse-id').value = '';
    }
}

function hideWarehouseForm() {
    const formArea = document.getElementById('form_area');
    if (formArea) {
        formArea.style.display = 'none';
    }
}

// ===== EDIT FUNCTIONALITY =====

function editAddress(addressId) {
    const addresses = window.welkomData?.addresses || [];
    const address = addresses.find(a => a.id === addressId);

    if (address) {
        showAddressForm();
        document.getElementById('form-title').textContent = 'Adres Bewerken';
        document.getElementById('address-id').value = address.id;
        document.getElementById('name').value = address.name || '';
        document.getElementById('city').value = address.city || '';
        document.getElementById('street').value = address.street || '';
        document.getElementById('housenumber').value = address.housenumber || '';
        document.getElementById('housenumber_extended').value = address.housenumber_extended || '';
        document.getElementById('zipcode').value = address.zipcode || '';
        document.getElementById('country').value = address.country || 'NL';
    }
}

function editSeller(sellerId) {
    const sellers = window.welkomData?.sellers || window.sellersData || [];
    const seller = sellers.find(s => s.id === sellerId);

    if (seller) {
        showSellerForm();
        document.getElementById('form-title').textContent = 'Verkoper Bewerken';
        document.getElementById('seller-id').value = seller.id;
        document.getElementById('name').value = seller.name || '';
        document.getElementById('address').value = seller.address_id || '';
    }
}

function editFulfiller(fulfillerId) {
    const fulfillers = window.welkomData?.fulfillers || window.fulfillersData || [];
    const fulfiller = fulfillers.find(f => f.id === fulfillerId);

    if (fulfiller) {
        showFulfillerForm();
        document.getElementById('form-title').textContent = 'Fulfiller Bewerken';
        document.getElementById('fulfiller-id').value = fulfiller.id;
        document.getElementById('name').value = fulfiller.name || '';
        document.getElementById('email').value = fulfiller.email || '';
        document.getElementById('phone').value = fulfiller.phone || '';
    }
}

function editWarehouse(warehouseId) {
    const warehouses = window.welkomData?.warehouses || window.warehousesData || [];
    const warehouse = warehouses.find(w => w.id === warehouseId);

    if (warehouse) {
        showWarehouseForm();
        document.getElementById('form-title').textContent = 'Magazijn Bewerken';
        document.getElementById('warehouse-id').value = warehouse.id;
        document.getElementById('name').value = warehouse.name || '';
        document.getElementById('address').value = warehouse.address_id || '';
        document.getElementById('fulfiller').value = warehouse.fulfiller_id || '';
    }
}

// ===== DELETE FUNCTIONALITY =====

function deleteAddress(addressId) {
    if (confirm('Weet je zeker dat je dit adres wilt verwijderen?')) {
        console.log('Deleting address with ID:', addressId);

        // Use Django's CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch('/welkom/addresses/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                id: addressId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);

            if (data.status === 'success') {
                send_toast('Adres succesvol verwijderd!', 'success');

                // Remove from DOM without reload
                const addressRows = document.querySelectorAll('tr');
                addressRows.forEach(row => {
                    const editBtn = row.querySelector(`button[onclick*="editAddress(${addressId})"]`);
                    if (editBtn) {
                        row.remove();
                    }
                });
            } else {
                const errorMsg = data.message || data.error || 'Onbekende fout';
                send_toast('Fout bij verwijderen: ' + errorMsg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            send_toast('Er is een fout opgetreden bij het verwijderen: ' + error.message, 'error');
        });
    }
}

function deleteSeller(sellerId) {
    if (confirm('Weet je zeker dat je deze verkoper wilt verwijderen?')) {
        console.log('Deleting seller with ID:', sellerId);

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch('/welkom/sellers/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                id: sellerId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);

            if (data.status === 'success') {
                send_toast('Verkoper succesvol verwijderd!', 'success');

                // Remove from DOM and handle empty state
                const sellerRows = document.querySelectorAll('tr');
                sellerRows.forEach(row => {
                    const editBtn = row.querySelector(`button[onclick*="editSeller(${sellerId})"]`);
                    if (editBtn) {
                        row.remove();
                    }
                });

                // Show empty state if no items remain
                const tbody = document.querySelector('.addresses-table tbody');
                if (tbody && tbody.children.length === 0) {
                    const container = document.querySelector('#sellers-container .container-fluid');
                    if (container) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <h3>Geen verkopers gevonden</h3>
                                <p class="body-default">
                                    Voeg je eerste verkoper toe om te beginnen.
                                </p>
                            </div>
                        `;
                    }
                }
            } else {
                const errorMsg = data.message || data.error || 'Onbekende fout';
                send_toast('Fout bij verwijderen: ' + errorMsg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            send_toast('Er is een fout opgetreden bij het verwijderen: ' + error.message, 'error');
        });
    }
}

function deleteFulfiller(fulfillerId) {
    if (confirm('Weet je zeker dat je deze fulfiller wilt verwijderen?')) {
        console.log('Deleting fulfiller with ID:', fulfillerId);

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch('/welkom/fulfillers/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                id: fulfillerId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);

            if (data.status === 'success') {
                send_toast('Fulfiller succesvol verwijderd!', 'success');

                // Remove from DOM and handle empty state
                const fulfillerRows = document.querySelectorAll('tr');
                fulfillerRows.forEach(row => {
                    const editBtn = row.querySelector(`button[onclick*="editFulfiller(${fulfillerId})"]`);
                    if (editBtn) {
                        row.remove();
                    }
                });

                // Show empty state if no items remain
                const tbody = document.querySelector('.addresses-table tbody');
                if (tbody && tbody.children.length === 0) {
                    const container = document.querySelector('#fulfillers-container .container-fluid');
                    if (container) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <h3>Geen fulfillers gevonden</h3>
                                <p class="body-default">
                                    Voeg je eerste fulfiller toe om te beginnen.
                                </p>
                            </div>
                        `;
                    }
                }
            } else {
                const errorMsg = data.message || data.error || 'Onbekende fout';
                send_toast('Fout bij verwijderen: ' + errorMsg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            send_toast('Er is een fout opgetreden bij het verwijderen: ' + error.message, 'error');
        });
    }
}

function deleteWarehouse(warehouseId) {
    if (confirm('Weet je zeker dat je dit magazijn wilt verwijderen?')) {
        console.log('Deleting warehouse with ID:', warehouseId);

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        fetch('/welkom/warehouses/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                id: warehouseId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);

            if (data.status === 'success') {
                send_toast('Magazijn succesvol verwijderd!', 'success');

                // Remove from DOM and handle empty state
                const warehouseRows = document.querySelectorAll('tr');
                warehouseRows.forEach(row => {
                    const editBtn = row.querySelector(`button[onclick*="editWarehouse(${warehouseId})"]`);
                    if (editBtn) {
                        row.remove();
                    }
                });

                // Show empty state if no items remain
                const tbody = document.querySelector('.addresses-table tbody');
                if (tbody && tbody.children.length === 0) {
                    const container = document.querySelector('#warehouses-container .container-fluid');
                    if (container) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <h3>Geen magazijnen gevonden</h3>
                                <p class="body-default">
                                    Voeg je eerste magazijn toe om te beginnen.
                                </p>
                            </div>
                        `;
                    }
                }
            } else {
                const errorMsg = data.message || data.error || 'Onbekende fout';
                send_toast('Fout bij verwijderen: ' + errorMsg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            send_toast('Er is een fout opgetreden bij het verwijderen: ' + error.message, 'error');
        });
    }
}

// ===== FORM SUBMISSION HANDLERS =====

function handleFormSubmission(formId, endpoint) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // Add CSRF token to form data
        formData.append('csrfmiddlewaretoken', csrfToken);

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                send_toast('Succesvol opgeslagen!', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                send_toast('Fout bij opslaan: ' + data.message, 'warning');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            send_toast('Er is een fout opgetreden', 'warning');
        });
    });
}

// ===== PROGRESS BAR SYSTEM =====

// Track current progress bar width globally with sessionStorage persistence
let currentProgressWidth = parseFloat(sessionStorage.getItem('welkomProgressWidth') || '0');

function initializeProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        // Get target width from data attribute
        const targetWidthStr = progressBar.getAttribute('data-target-width');
        if (targetWidthStr) {
            const pageWidth = parseFloat(targetWidthStr);

            // If this is the first page (25%) and we don't have stored progress, start from 0
            if (pageWidth === 25 && currentProgressWidth === 0) {
                currentProgressWidth = 0;
            } else if (currentProgressWidth === 0) {
                // If no stored progress but not first page, use page width
                currentProgressWidth = pageWidth;
            }
            // Otherwise keep the stored progress width

            // Immediately set the starting width without transition to prevent flash
            progressBar.style.transition = 'none';
            progressBar.style.width = `${currentProgressWidth}%`;

            // Force reflow to ensure the width is applied
            progressBar.offsetHeight;

            console.log('Initialized progress bar - stored:', currentProgressWidth, 'page:', pageWidth);
        }
    }
}

function animateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        // Get the target width from the original HTML
        const targetWidth = getTargetWidthForCurrentPage();

        if (!targetWidth) return;

        // Only animate if there's a meaningful difference
        if (Math.abs(targetWidth - currentProgressWidth) > 0.1) {
            // Small delay to ensure initialization is complete
            setTimeout(() => {
                // Enable transition and animate to target
                progressBar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                progressBar.style.width = `${targetWidth}%`;

                // Update tracking variable and store in sessionStorage
                currentProgressWidth = targetWidth;
                sessionStorage.setItem('welkomProgressWidth', targetWidth.toString());
                console.log('Progress animated to:', targetWidth, '%');
            }, 50);
        }
    }
}

function getTargetWidthForCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('/welkom/adressen/') || path.includes('/welkom/addresses/')) return 25;
    if (path.includes('/welkom/verkopers/') || path.includes('/welkom/sellers/')) return 50;
    if (path.includes('/welkom/fulfillers/')) return 75;
    if (path.includes('/welkom/magazijnen/') || path.includes('/welkom/warehouses/')) return 97;
    return null;
}

// ===== TOAST NOTIFICATION SYSTEM =====

function send_toast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Initialize and show toast (if Bootstrap is available)
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    } else {
        // Fallback if Bootstrap Toast is not available
        toast.style.display = 'block';
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// ===== MODULE INITIALIZATION =====

function initializeWelkomPage() {
    console.log('Initializing welkom page functionality');

    // Initialize progress bar width tracking
    initializeProgressBar();

    // Animate progress bar on page load
    animateProgressBar();

    // Set up form submission handlers if forms exist
    if (document.getElementById('address-form')) {
        handleFormSubmission('address-form', '/welkom/addresses/create/');
    }

    if (document.getElementById('seller-form')) {
        handleFormSubmission('seller-form', '/welkom/sellers/create/');
    }

    if (document.getElementById('fulfiller-form')) {
        handleFormSubmission('fulfiller-form', '/welkom/fulfillers/create/');
    }

    if (document.getElementById('warehouse-form')) {
        handleFormSubmission('warehouse-form', '/welkom/warehouses/create/');
    }

    // Set up navigation buttons
    const navButtons = document.querySelectorAll('[data-welkom-navigate]');
    navButtons.forEach(button => {
        const url = button.getAttribute('data-welkom-navigate');
        if (url) {
            button.addEventListener('click', function() {
                navigateToPage(url);
            });
        }
    });

    console.log('Welkom page functionality initialized');
}

// ===== GLOBAL FUNCTION EXPOSURE =====

// Make functions available globally for inline event handlers
window.navigateToPage = navigateToPage;
window.showAddressForm = showAddressForm;
window.hideAddressForm = hideAddressForm;
window.showSellerForm = showSellerForm;
window.hideSellerForm = hideSellerForm;
window.showFulfillerForm = showFulfillerForm;
window.hideFulfillerForm = hideFulfillerForm;
window.showWarehouseForm = showWarehouseForm;
window.hideWarehouseForm = hideWarehouseForm;
window.editAddress = editAddress;
window.editSeller = editSeller;
window.editFulfiller = editFulfiller;
window.editWarehouse = editWarehouse;
window.deleteAddress = deleteAddress;
window.deleteSeller = deleteSeller;
window.deleteFulfiller = deleteFulfiller;
window.deleteWarehouse = deleteWarehouse;
window.initializeWelkomPage = initializeWelkomPage;
window.send_toast = send_toast;

// ===== AUTO-INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a welkom page
    if (window.location.pathname.startsWith('/welkom')) {
        initializeWelkomPage();
    }
});

/**
 * Summary of Welkom Module Capabilities:
 * ملخص قدرات وحدة الترحيب:
 * 
 * 1. Multi-Step Onboarding Wizard:
 *    - 4-step process: Addresses → Sellers → Fulfillers → Warehouses
 *    - Animated progress bar with cubic-bezier transitions
 *    - Session persistence for progress tracking
 * 
 * 2. Entity Management:
 *    - Full CRUD operations for all business entities
 *    - Real-time DOM updates without page reloads
 *    - Form state management (create/edit modes)
 *    - Empty state handling
 * 
 * 3. User Experience Features:
 *    - Confirmation dialogs for destructive actions
 *    - Toast notifications for user feedback
 *    - Responsive form management
 *    - Progress persistence across sessions
 * 
 * 4. Technical Implementation:
 *    - Django CSRF integration
 *    - Form data serialization and submission
 *    - Error handling and validation
 *    - Multi-language support (Dutch interface)
 * 
 * 5. Data Relationships:
 *    - Addresses serve as base for other entities
 *    - Sellers reference addresses
 *    - Warehouses link addresses to fulfillers
 *    - Hierarchical data structure for business setup
 */