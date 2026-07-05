// =========================================================================
// 1. SHARED CORE CODE (Runs on both Index & Checkout pages)
// =========================================================================
let cart = JSON.parse(localStorage.getItem('myCart')) || [];

// Updates the Cart(X) count indicator in the navbar
function updateNavCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.innerText = totalItems;
    }
}

// Automatically update nav counter on load
document.addEventListener("DOMContentLoaded", updateNavCartCount);


// =========================================================================
// 2. PRODUCT SHOP PAGE LOGIC (index.html)
// =========================================================================
document.querySelectorAll('.add-to-cart-btn').forEach((button, index) => {
    button.addEventListener('click', (event) => {
        const productCard = event.target.closest('.product-card');
        
        const productName = productCard.querySelector('h3').innerText;
        const priceText = productCard.querySelector('.price').innerText;
        // Clean "BND$5.00" to float number 5.00
        const productPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
        
        // Find checked flavor inside THIS card specifically
        const selectedFlavorInput = productCard.querySelector('input[type="radio"]:checked');
        const selectedFlavor = selectedFlavorInput ? selectedFlavorInput.value : 'Default';

        // Check if item combination already exists in cart
        const existingItem = cart.find(item => item.name === productName && item.flavor === selectedFlavor);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name: productName,
                flavor: selectedFlavor,
                price: productPrice,
                quantity: 1
            });
        }

        // Save back to local storage and update header UI
        localStorage.setItem('myCart', JSON.stringify(cart));
        updateNavCartCount();
        
        alert(`Added ${productName} (${selectedFlavor}) to your cart!`);
    });
});


// =========================================================================
// 3. CHECKOUT PAGE LOGIC (checkout.html)
// =========================================================================
// This helper function safely finds which fee is selected and returns it as a number
function calculateFulfillmentFee() {
    if (document.getElementById('delivery-bruneimuara') && document.getElementById('delivery-bruneimuara').checked) return 5.00;
    if (document.getElementById('delivery-tutong') && document.getElementById('delivery-tutong').checked) return 6.00;
    if (document.getElementById('delivery-temburong') && document.getElementById('delivery-temburong').checked) return 7.00;
    if (document.getElementById('delivery-belait') && document.getElementById('delivery-belait').checked) return 8.00;
    return 0.00; // Defaults to Pickup (0.00)
}
function renderCheckout() {
    const itemListContainer = document.getElementById('cart-items-list');
    const subtotalElement = document.getElementById('subtotal-val');
    const feeElement = document.getElementById('fee-val');
    const totalElement = document.getElementById('total-val');

    // If we're not on the checkout page, stop executing checkout updates safely
    if (!itemListContainer) return;

    itemListContainer.innerHTML = '';

    if (cart.length === 0) {
        itemListContainer.innerHTML = '<div class="cart-item"><span>No products selected.</span></div>';
        if(subtotalElement) subtotalElement.innerText = "BND$0.00";
        if(feeElement) feeElement.innerText = "BND$0.00";
        if(totalElement) totalElement.innerText = "BND$0.00";
        return;
    }

    let subtotal = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        // Flex styles ensure proper alignment for layout formatting
        itemRow.style.display = 'flex';
        itemRow.style.justifyContent = 'space-between';
        itemRow.style.alignItems = 'center';
        itemRow.style.marginBottom = '10px';

        itemRow.innerHTML = `
            <div>
                <span>${item.name} (${item.flavor})</span>
                <div style="margin-top: 4px;">
                    <button onclick="changeQuantity(${index}, -1)" style="padding: 2px 8px; cursor:pointer;">-</button>
                    <span style="margin: 0 8px; font-weight: bold;">${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)" style="padding: 2px 8px; cursor:pointer;">+</button>
                </div>
            </div>
            <strong>BND$${itemTotal.toFixed(2)}</strong>
        `;
        itemListContainer.appendChild(itemRow);
    });

   const fulfillmentFee = calculateFulfillmentFee();
    const grandTotal = subtotal + fulfillmentFee;

    if(subtotalElement) subtotalElement.innerText = `BND$${subtotal.toFixed(2)}`;
    if(feeElement) feeElement.innerText = `BND$${fulfillmentFee.toFixed(2)}`;
    if(totalElement) totalElement.innerText = `BND$${grandTotal.toFixed(2)}`;
}

// Handler for dynamically incrementing/decrementing item structures
window.changeQuantity = function(index, change) {
    cart[index].quantity += change;
    
    // Remove completely if quantity drops to 0
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('myCart', JSON.stringify(cart));
    updateNavCartCount();
    renderCheckout();
};

// 4. Final Order Placement Action
window.submitOrder = function() {
    if (cart.length === 0) {
        alert("Your cart is empty! Please add products first.");
        return;
    }
    
   // Load existing orders, or create an empty log if none exist
    let orders = JSON.parse(localStorage.getItem('myOrders')) || [];
    
    // Calculate the subtotal from the cart items
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const fulfillmentFee = calculateFulfillmentFee();
    
    // Create the final custom order object
    const finalOrder = {
        id: "ORD-" + Date.now().toString().slice(-6),
        date: new Date().toLocaleDateString(),
        items: [...cart],
        subtotal: subtotal,
        fee: fulfillmentFee,
        total: subtotal + fulfillmentFee,
        status: "Unpaid" // Defaulting to pending status
    };
    
    // Push our new order into the global orders list
    orders.push(finalOrder);
    localStorage.setItem('myOrders', JSON.stringify(orders));
    
    alert('Order Confirmed! Redirecting you to Sales Orders...');
    
    // Clear out active temporary shopping cart
    localStorage.removeItem('myCart');
    
    // Automatically take the user over to see their logged orders list
    window.location.href = "salesorder.html";
};

// Render checkout values when elements hit initialization
document.addEventListener("DOMContentLoaded", renderCheckout);