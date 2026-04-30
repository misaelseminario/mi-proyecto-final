// Función para cargar datos desde la API (json-server via nginx proxy)
// Patrón exacto de la Práctica 5: fetch('/api/endpoint')
async function cargar(endpoint, elementoId) {
  const lista = document.getElementById(elementoId);
  try {
    const res = await fetch(`/api/${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const datos = await res.json();
    lista.innerHTML = datos.map(item =>
      `<li>
        ${item.nombre}
        ${item.precio !== undefined ? `<span class="precio">$${item.precio}</span>` : ''}
        ${item.cat !== undefined ? `<span class="cat-nombre"> · ${item.cat}</span>` : ''}
      </li>`
    ).join('');
  } catch (e) {
    lista.innerHTML = `<li class="error">Error al conectar con la API: ${e.message}</li>`;
  }
}

// Botón hero
document.getElementById('btn').addEventListener('click', () => {
  alert('✅ TechStack — Pipeline DevOps funcionando!');
});

// Cargar productos y categorías desde la API al iniciar
cargar('productos', 'productos');
cargar('categorias', 'categorias');

console.log('🚀 TechStack cargado');
