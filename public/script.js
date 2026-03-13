document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    fetchProducts();
    setupFilters();
    setupCartControls();
});

let allProducts = [];
let cart = [];

// --- THEME LOGIC ---
function setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('luminaTheme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('luminaTheme', targetTheme);
        updateThemeIcon(targetTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
}


// Função que bate no Servidor (SQLite) para pegar os produtos reais
async function fetchProducts() {
    try {
        const response = await fetch('/api/produtos');
        allProducts = await response.json();
        renderProducts(allProducts);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        document.getElementById('menu-grid').innerHTML = '<p style="text-align:center; color: red;">Ops! Erro ao carregar o cardápio do banco de dados. O servidor Node está rodando?</p>';
    }
}

// Renderiza os produtos na Interface com animações
function renderProducts(products) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    if(products.length === 0) {
        grid.innerHTML = '<p style="text-align:center;">Nenhum produto encontrado.</p>';
        return;
    }

    products.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        // Atribui delay variável baseado no index para efeito em cascata
        card.style.animationDelay = `${index * 0.15}s`;
        
        // Formatar para Moeda Real (R$)
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco);

        card.innerHTML = `
            <div class="menu-header">
                <h3 class="menu-name">${product.nome}</h3>
                <span class="menu-price">${precoFormatado}</span>
            </div>
            <p class="menu-desc">${product.descricao}</p>
            <span class="menu-category">${product.categoria}</span>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Adicionar</button>
        `;
        grid.appendChild(card);
    });
}

// Configura o sistema de filtros do cardápio interactivo
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe active de todos os botões
            filterBtns.forEach(b => b.classList.remove('active'));
            // Adiciona no botão que o usuario acabou de clicar
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            // Lógica para filtrar do Array guardado do DB
            if (filterValue === 'all') {
                renderProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p => p.categoria === filterValue);
                renderProducts(filtered);
            }
        });
    });
}

// --- CART LOGIC ---
function setupCartControls() {
    const cartBtn = document.getElementById('cart-btn');
    const closeCart = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const checkoutBtn = document.getElementById('checkout-btn');

    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('open');
    });

    closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
    });

    checkoutBtn.addEventListener('click', processCheckout);
}

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if(product) {
        cart.push(product);
        updateCartUI();
        // Feedback visual
        const cartBtn = document.getElementById('cart-btn');
        cartBtn.style.transform = 'scale(1.1)';
        setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Atualizar interface do carrinho
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    cartCount.textContent = cart.length;

    if(cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
        cartTotalPrice.textContent = 'R$ 0,00';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    cartItems.innerHTML = '';
    
    let total = 0;

    cart.forEach((item, index) => {
        total += item.preco;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        
        const precoF = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco);

        itemEl.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.nome}</h4>
                <p class="cart-item-price">${precoF}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})">X</button>
        `;
        cartItems.appendChild(itemEl);
    });

    cartTotalPrice.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
}

// Finalizar Compra - Abre Modal em vez de finalizar direto
function processCheckout() {
    const paymentMethod = document.getElementById('payment-select').value;
    const modal = document.getElementById('payment-modal');
    const container = document.getElementById('payment-details-container');

    let html = '';

    if (paymentMethod === 'pix') {
        html = `
            <h2>Pagamento PIX</h2>
            <p>Escaneie o QR Code abaixo pelo aplicativo do seu banco para pagar.</p>
            <div class="pix-qr">
                MOCK QR CODE
            </div>
            <p><strong>Valor:</strong> ${document.getElementById('cart-total-price').textContent}</p>
            <button class="verify-btn" onclick="verifyPayment('pix')">Já paguei / Verificar</button>
        `;
    } else if (paymentMethod === 'credit') {
        html = `
            <h2>Cartão de Crédito</h2>
            <p>Insira os dados do seu cartão para o pagamento.</p>
            <div class="input-group">
                <label>Número do Cartão</label>
                <input type="text" id="cc-number" class="card-input" placeholder="0000 0000 0000 0000" maxlength="19">
            </div>
            <div style="display: flex; gap: 10px;">
                <div class="input-group" style="flex: 1;">
                    <label>Validade</label>
                    <input type="text" id="cc-expiry" class="card-input" placeholder="MM/AA" maxlength="5">
                </div>
                <div class="input-group" style="flex: 1;">
                    <label>CVV</label>
                    <input type="text" id="cc-cvv" class="card-input" placeholder="123" maxlength="4">
                </div>
            </div>
            <p style="margin-top: 15px;"><strong>Valor a pagar:</strong> ${document.getElementById('cart-total-price').textContent}</p>
            <button class="verify-btn" onclick="verifyPayment('credit')">Pagar Agora</button>
        `;
    }

    container.innerHTML = html;
    modal.classList.add('open');

    // Mapear fechamento do modal
    document.getElementById('close-payment-modal').onclick = () => {
        modal.classList.remove('open');
    };
}

// Verificação de Pagamento no Backend
async function verifyPayment(method) {
    const submitBtn = document.querySelector('.verify-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processando...';
    submitBtn.disabled = true;

    const payload = {
        method: method,
        items: cart,
        details: {}
    };

    if (method === 'credit') {
        payload.details.cardNumber = document.getElementById('cc-number').value.replace(/\s+/g, '');
        payload.details.expiry = document.getElementById('cc-expiry').value;
        payload.details.cvv = document.getElementById('cc-cvv').value;

        if(!payload.details.cardNumber || !payload.details.expiry || !payload.details.cvv) {
            alert('Por favor, preencha todos os campos do cartão.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        // Validação Luhn
        if (!validateLuhn(payload.details.cardNumber)) {
            alert('O número do cartão é inválido! Por favor verifique a digitação.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
    }

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if(response.ok) {
            alert('✅ ' + result.message);
            cart = [];
            updateCartUI();
            document.getElementById('payment-modal').classList.remove('open');
            document.getElementById('cart-sidebar').classList.remove('open');
        } else {
            throw new Error(result.error || 'Falha no pagamento');
        }
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ALGORITMO DE LUHN (Verificação de dígitos verificadores reais ISO/IEC 7812)
function validateLuhn(cardNumber) {
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) return false;
    
    let sum = 0;
    let isEven = false;
    
    // Varre o número de trás pra frente
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}
