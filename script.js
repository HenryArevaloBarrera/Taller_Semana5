// Configuración de la API (cambia esto por tu URL de Vercel)
const API_BASE = 'https://taller-semana5.vercel.app/';

// ============ FUNCIONES DE CONEXIÓN ============
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en API:', error);
        showAlert('Error de conexión con el servidor', 'error');
        return null;
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    setTimeout(() => alertDiv.remove(), 3000);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============ DASHBOARD ============
async function loadDashboard() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon cafes">🫘</div>
                    <span class="stat-title">Total Cafés</span>
                </div>
                <div class="stat-value">${stats.cafes || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon clientes">👥</div>
                    <span class="stat-title">Clientes</span>
                </div>
                <div class="stat-value">${stats.clientes || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon pedidos">📦</div>
                    <span class="stat-title">Pedidos</span>
                </div>
                <div class="stat-value">${stats.pedidos || 0}</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon resenas">⭐</div>
                    <span class="stat-title">Puntuación</span>
                </div>
                <div class="stat-value">${(stats.puntuacion || 0).toFixed(1)}</div>
            </div>
        `;
    } catch (error) {
        statsContainer.innerHTML = '<div class="alert alert-error">Error al cargar estadísticas</div>';
    }
}

async function loadRecentPedidos() {
    const container = document.getElementById('recentPedidos');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE}/pedidos`);
        const pedidos = await response.json();
        const recent = pedidos.slice(0, 5);
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Café</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(p => `
                        <tr>
                            <td>${p.cliente_nombre || 'Cliente ' + p.cliente_id}</td>
                            <td>${p.cafe_nombre || 'Café ' + p.cafe_id}</td>
                            <td>${p.cantidad}</td>
                            <td><span class="status-badge status-${p.estado}">${p.estado}</span></td>
                            <td>${formatDate(p.fecha_pedido)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar pedidos</div>';
    }
}

// ============ CAFÉS ============
async function loadCafes() {
    const container = document.getElementById('cafesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Cargando cafés...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/cafes`);
        const cafes = await response.json();
        
        container.innerHTML = cafes.map(cafe => `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon cafes">🫘</div>
                    <span class="stat-title">${cafe.nombre}</span>
                </div>
                <div class="stat-value">$${cafe.precio.toFixed(2)}</div>
                <div style="margin-top: 12px;">
                    <p style="color: #666;">🌍 ${cafe.origen}</p>
                    <p style="color: #666;">🔥 Intensidad: ${cafe.intensidad}/10</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar cafés</div>';
    }
}

function openNewCafeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>➕ Nuevo Café</h2>
            <form id="cafeForm">
                <div class="form-group">
                    <label>Nombre del café *</label>
                    <input type="text" id="nombre" required placeholder="Ej: Colombia Supremo">
                </div>
                <div class="form-group">
                    <label>Origen</label>
                    <input type="text" id="origen" placeholder="Ej: Colombia">
                </div>
                <div class="form-group">
                    <label>Precio ($) *</label>
                    <input type="number" step="0.01" id="precio" required placeholder="12.50">
                </div>
                <div class="form-group">
                    <label>Intensidad (1-10)</label>
                    <input type="number" min="1" max="10" id="intensidad" value="5">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    <button type="submit" class="btn">Guardar Café</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('cafeForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('nombre').value,
            origen: document.getElementById('origen').value || 'Desconocido',
            precio: parseFloat(document.getElementById('precio').value),
            intensidad: parseInt(document.getElementById('intensidad').value)
        };
        
        try {
            const response = await fetch(`${API_BASE}/cafes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                modal.remove();
                showAlert('✅ Café creado exitosamente');
                loadCafes();
            }
        } catch (error) {
            showAlert('Error al crear café', 'error');
        }
    };
}

// ============ CLIENTES ============
async function loadClientes() {
    const container = document.getElementById('clientesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Cargando clientes...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/clientes`);
        const clientes = await response.json();
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Fecha Registro</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientes.map(c => `
                        <tr>
                            <td>#${c.id}</td>
                            <td>${c.nombre}</td>
                            <td>${c.email || '—'}</td>
                            <td>${c.telefono || '—'}</td>
                            <td>${formatDate(c.fecha_registro)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar clientes</div>';
    }
}

function openNewClienteModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>➕ Nuevo Cliente</h2>
            <form id="clienteForm">
                <div class="form-group">
                    <label>Nombre completo *</label>
                    <input type="text" id="nombre" required placeholder="Ej: Ana García">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" placeholder="ana@email.com">
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" id="telefono" placeholder="555-0101">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    <button type="submit" class="btn">Guardar Cliente</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('clienteForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value || null,
            telefono: document.getElementById('telefono').value || null
        };
        
        try {
            const response = await fetch(`${API_BASE}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                modal.remove();
                showAlert('✅ Cliente registrado exitosamente');
                loadClientes();
            }
        } catch (error) {
            showAlert('Error al registrar cliente', 'error');
        }
    };
}

// ============ PEDIDOS ============
async function loadPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Cargando pedidos...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/pedidos`);
        const pedidos = await response.json();
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Café</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(p => `
                        <tr>
                            <td>#${p.id}</td>
                            <td>${p.cliente_nombre || 'Cliente ' + p.cliente_id}</td>
                            <td>${p.cafe_nombre || 'Café ' + p.cafe_id}</td>
                            <td>${p.cantidad}</td>
                            <td><span class="status-badge status-${p.estado}">${p.estado}</span></td>
                            <td>${formatDate(p.fecha_pedido)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar pedidos</div>';
    }
}

function openNewPedidoModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>➕ Nuevo Pedido</h2>
            <form id="pedidoForm">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select id="cliente_id" required>
                        <option value="">Seleccionar cliente</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Café *</label>
                    <select id="cafe_id" required>
                        <option value="">Seleccionar café</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Cantidad</label>
                    <input type="number" id="cantidad" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select id="estado">
                        <option value="pendiente">Pendiente</option>
                        <option value="preparando">Preparando</option>
                        <option value="listo">Listo</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    <button type="submit" class="btn">Crear Pedido</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cargar opciones
    loadSelectOptions();
    
    document.getElementById('pedidoForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            cliente_id: parseInt(document.getElementById('cliente_id').value),
            cafe_id: parseInt(document.getElementById('cafe_id').value),
            cantidad: parseInt(document.getElementById('cantidad').value),
            estado: document.getElementById('estado').value
        };
        
        try {
            const response = await fetch(`${API_BASE}/pedidos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                modal.remove();
                showAlert('✅ Pedido creado exitosamente');
                if (window.location.pathname.includes('pedidos')) {
                    loadPedidos();
                }
            }
        } catch (error) {
            showAlert('Error al crear pedido', 'error');
        }
    };
}

async function loadSelectOptions() {
    try {
        // Cargar clientes
        const clientesRes = await fetch(`${API_BASE}/clientes`);
        const clientes = await clientesRes.json();
        const clienteSelect = document.getElementById('cliente_id');
        clienteSelect.innerHTML += clientes.map(c => 
            `<option value="${c.id}">${c.nombre}</option>`
        ).join('');
        
        // Cargar cafés
        const cafesRes = await fetch(`${API_BASE}/cafes`);
        const cafes = await cafesRes.json();
        const cafeSelect = document.getElementById('cafe_id');
        cafeSelect.innerHTML += cafes.map(c => 
            `<option value="${c.id}">${c.nombre} - $${c.precio}</option>`
        ).join('');
    } catch (error) {
        console.error('Error cargando opciones:', error);
    }
}
