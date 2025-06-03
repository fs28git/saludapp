// Estado de la aplicación
let usuarioActual = null;
let token = localStorage.getItem('saludapp_token');

// Elementos del DOM
const getElement = (id) => document.getElementById(id) || console.error(`Elemento ${id} no encontrado`);

const elements = {
  loginBtn: getElement('login-btn'),
  registerBtn: getElement('register-btn'),
  userProfile: getElement('user-profile'),
  username: getElement('username'),
  logoutBtn: getElement('logout-btn'),
  authForms: getElement('auth-forms'),
  loginForm: getElement('login-form'),
  registerForm: getElement('register-form'),
  submitLogin: getElement('submit-login'),
  submitRegister: getElement('submit-register'),
  showRegister: getElement('show-register'),
  showLogin: getElement('show-login'),
  recipeSuggestion: getElement('recipe-suggestion'),
  dailyTip: getElement('daily-tip')
};

// Funciones de utilidad
const mostrarMensaje = (mensaje, tipo = 'info') => {
  const mensajeDiv = document.createElement('div');
  mensajeDiv.className = `mensaje ${tipo}`;
  mensajeDiv.textContent = mensaje;
  mensajeDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 15px 20px;
    border-radius: 5px; color: white; font-weight: bold; z-index: 1000;
    background-color: ${tipo === 'error' ? '#e74c3c' : tipo === 'success' ? '#27ae60' : '#3498db'};
    box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 300px;
  `;
  document.body.appendChild(mensajeDiv);
  setTimeout(() => mensajeDiv.remove(), 4000);
};

// Autenticación
async function verificarToken() {
  try {
    const response = await fetch('/api/usuarios/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Token inválido');
    
    const data = await response.json();
    usuarioActual = data.usuario;
    mostrarUsuarioLogueado();
    return true;
  } catch (error) {
    console.error('Error verificando token:', error);
    cerrarSesion();
    return false;
  }
}

function mostrarUsuarioLogueado() {
  if (elements.loginBtn) elements.loginBtn.style.display = 'none';
  if (elements.registerBtn) elements.registerBtn.style.display = 'none';
  if (elements.userProfile) elements.userProfile.style.display = 'block';
  if (elements.username) elements.username.textContent = `Hola, ${usuarioActual.nombre}`;
  ocultarFormularios();
}

function mostrarUsuarioNoLogueado() {
  if (elements.loginBtn) elements.loginBtn.style.display = 'block';
  if (elements.registerBtn) elements.registerBtn.style.display = 'block';
  if (elements.userProfile) elements.userProfile.style.display = 'none';
}

function ocultarFormularios() {
  if (elements.authForms) elements.authForms.style.display = 'none';
}

function limpiarFormularios() {
  const campos = [
    'login-email', 'login-password', 
    'register-name', 'register-email', 'register-password', 'register-goal'
  ];
  
  campos.forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.value = '';
  });
  
  document.querySelectorAll('input[name="restriction"]').forEach(cb => {
    cb.checked = false;
  });
}

function mostrarSugerenciaDelDia() {
  const sugerencias = [
    "Prueba una ensalada de quinoa con aguacate y garbanzos",
    "Batido verde detox con espinaca y piña",
    "Tacos veganos de lentejas y aguacate",
    "Bowl de yogur griego con frutos rojos y semillas",
    "Sopa de lentejas con zanahoria y cúrcuma"
  ];
  
  if (elements.recipeSuggestion) {
    const aleatoria = sugerencias[Math.floor(Math.random() * sugerencias.length)];
    elements.recipeSuggestion.textContent = `Sugerencia del día: ${aleatoria}`;
  }
}

// Navegación
function inicializarNavegacion() {
  const links = document.querySelectorAll("nav a[href^='#']");
  const sections = document.querySelectorAll("main section");

  function mostrarSeccion(id) {
    sections.forEach(section => {
      if (section.id === 'auth-forms') return;
      section.style.display = section.id === id ? "block" : "none";
    });
    
    cargarContenidoSeccion(id);
  }

  links.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const seccionId = link.getAttribute("href").substring(1);
      
      if (requiereAutenticacion(seccionId)) {
        if (!usuarioActual) {
          mostrarMensaje('Debes iniciar sesión para acceder a esta sección', 'error');
          return;
        }
      }
      
      mostrarSeccion(seccionId);
      history.pushState(null, "", `#${seccionId}`);
    });
  });

  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    mostrarSeccion(hash);
  } else {
    mostrarSeccion("inicio");
  }

  window.mostrarSeccion = mostrarSeccion;
}

function requiereAutenticacion(seccionId) {
  const seccionesProtegidas = ['planificador', 'comunidad', 'nutricionistas'];
  return seccionesProtegidas.includes(seccionId);
}

// Carga de contenido
async function cargarContenidoSeccion(seccionId) {
  switch (seccionId) {
    case 'recetas':
      await cargarRecetas();
      break;
    case 'planificador':
      await cargarPlanificador();
      break;
    case 'comunidad':
      await cargarComunidad();
      break;
    case 'nutricionistas':
      await cargarNutricionistas();
      break;
  }
}

// Sección de recetas
// Reemplaza todas las funciones de carga con validación de arrays
async function cargarRecetas() {
  const seccionRecetas = document.getElementById('recetas');
  if (!seccionRecetas) return;
  
  seccionRecetas.innerHTML = `
    <h2>Recetas Saludables</h2>
    <div class="loading">Cargando recetas...</div>
  `;

  try {
    const response = await fetch('/api/recetas');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    // SOLUCIÓN: Validar que sea un array
    const recetas = Array.isArray(data) ? data : (data.recetas || []);

    seccionRecetas.innerHTML = `
      <h2>Recetas Saludables</h2>
      <div class="filtros">
        <input type="text" id="buscar-receta" placeholder="Buscar recetas...">
        <select id="filtro-tiempo">
          <option value="">Todos los tiempos</option>
          <option value="5">Menos de 5 min</option>
          <option value="15">Menos de 15 min</option>
          <option value="30">Menos de 30 min</option>
        </select>
      </div>
      <div class="recetas-grid">
        ${recetas.length > 0 ? recetas.map(receta => `
          <div class="receta-card">
            <div class="receta-imagen" style="background-image: url('${receta.imagen || 'img/receta-default.jpg'}')"></div>
            <div class="receta-info">
              <h3>${receta.nombre || 'Receta sin nombre'}</h3>
              <p>${receta.descripcion || 'Descripción no disponible'}</p>
              <div class="receta-meta">
                <span>⏱️ ${receta.tiempoPreparacion || '--'} min</span>
                <span>🍽️ ${receta.dificultad || 'Media'}</span>
              </div>
              <button onclick="verRecetaCompleta('${receta._id}')">Ver Receta</button>
            </div>
          </div>
        `).join('') : '<p>No hay recetas disponibles</p>'}
      </div>
    `;

    // Solo agregar eventos si existen los elementos
    const buscarInput = document.getElementById('buscar-receta');
    const filtroSelect = document.getElementById('filtro-tiempo');
    if (buscarInput) buscarInput.addEventListener('input', filtrarRecetas);
    if (filtroSelect) filtroSelect.addEventListener('change', filtrarRecetas);
    
  } catch (error) {
    seccionRecetas.innerHTML = `<p class="error">Error al cargar recetas: ${error.message}</p>`;
    console.error('Error:', error);
  }
}

function filtrarRecetas() {
  const busqueda = document.getElementById('buscar-receta').value.toLowerCase();
  const tiempoMax = document.getElementById('filtro-tiempo').value;
  const cards = document.querySelectorAll('.receta-card');

  cards.forEach(card => {
    const nombre = card.querySelector('h3').textContent.toLowerCase();
    const tiempo = parseInt(card.querySelector('.receta-meta span').textContent) || 0;
    const coincideBusqueda = nombre.includes(busqueda);
    const coincideTiempo = !tiempoMax || tiempo <= parseInt(tiempoMax);

    card.style.display = (coincideBusqueda && coincideTiempo) ? 'block' : 'none';
  });
}

// Sección de planificador de comidas
let planActual = {};
let recetasDisponibles = [];

// Función principal para cargar el planificador
async function cargarPlanificador() {
  const seccionPlanificador = document.getElementById('planificador');
  if (!seccionPlanificador) return;
  
  // Verificar usuario antes de hacer la petición
  if (!usuarioActual || !usuarioActual._id) {
    seccionPlanificador.innerHTML = `<p class="error">Debes iniciar sesión para ver el planificador</p>`;
    return;
  }
  
  seccionPlanificador.innerHTML = `
    <h2>Planificador de Comidas</h2>
    <div class="loading">Cargando planificador...</div>
  `;

  try {
    // Cargar plan del usuario y recetas disponibles
    const [planResponse, recetasResponse] = await Promise.all([
      fetch(`/api/planificador/${usuarioActual._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/recetas', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    if (!planResponse.ok) {
      throw new Error(`HTTP ${planResponse.status}`);
    }
    
    const planData = await planResponse.json();
    planActual = planData.plan || planData || {};
    
    if (recetasResponse.ok) {
      const recetasData = await recetasResponse.json();
      recetasDisponibles = recetasData.recetas || recetasData || [];
    }

    mostrarPlanificador();
    
  } catch (error) {
    seccionPlanificador.innerHTML = `<p class="error">Error al cargar planificador: ${error.message}</p>`;
    console.error('Error:', error);
  }
}

// Mostrar la interfaz del planificador
function mostrarPlanificador() {
  const seccionPlanificador = document.getElementById('planificador');
  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const tiposComida = ['desayuno', 'almuerzo', 'cena'];
  
  let html = `
    <h2>Planificador de Comidas</h2>
    <div class="planificador-header">
      <button onclick="exportarPlan()" class="btn-secundario">Exportar Plan</button>
      <button onclick="generarListaCompras()" class="btn-secundario">Lista de Compras</button>
      <button onclick="guardarPlan()" class="btn-primario">Guardar Cambios</button>
    </div>
    <div class="planificador-grid">
  `;
  
  // Crear encabezados
  html += '<div class="dia-header"></div>';
  tiposComida.forEach(tipo => {
    html += `<div class="comida-header">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</div>`;
  });
  
  // Crear filas para cada día
  diasSemana.forEach(dia => {
    html += `<div class="dia-label">${dia.charAt(0).toUpperCase() + dia.slice(1)}</div>`;
    
    tiposComida.forEach(tipo => {
      const comidaActual = planActual[dia] && planActual[dia][tipo];
      const nombreComida = comidaActual ? comidaActual.nombre : 'Sin asignar';
      
      html += `
        <div class="casilla-comida" onclick="seleccionarComida('${dia}', '${tipo}')">
          <div class="nombre-comida">${nombreComida}</div>
          ${comidaActual ? `<div class="tiempo-prep">${comidaActual.tiempoPreparacion || '30'} min</div>` : ''}
          <div class="btn-cambiar">Cambiar</div>
        </div>
      `;
    });
  });
  
  html += '</div>';
  seccionPlanificador.innerHTML = html;
}

// Función para seleccionar comida
window.seleccionarComida = (dia, tipoComida) => {
  console.log(`Seleccionando ${tipoComida} para ${dia}`);
  mostrarModalSeleccionComida(dia, tipoComida);
};

// Modal para seleccionar comida
function mostrarModalSeleccionComida(dia, tipoComida) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.onclick = (e) => {
    if (e.target === modal) cerrarModal();
  };
  
  let html = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Seleccionar ${tipoComida} para ${dia}</h3>
        <button onclick="cerrarModal()" class="btn-cerrar">×</button>
      </div>
      <div class="modal-body">
        <div class="busqueda-recetas">
          <input type="text" id="buscar-receta" placeholder="Buscar recetas..." 
                 onkeyup="filtrarRecetas(this.value)">
        </div>
        <div class="lista-recetas" id="lista-recetas">
  `;
  
  recetasDisponibles.forEach(receta => {
    html += `
      <div class="receta-item" onclick="asignarComida('${dia}', '${tipoComida}', ${JSON.stringify(receta).replace(/"/g, '&quot;')})">
        <div class="receta-nombre">${receta.nombre}</div>
        <div class="receta-info">
          <span class="tiempo">${receta.tiempoPreparacion || 30} min</span>
          <span class="calorias">${receta.calorias || 'N/A'} cal</span>
        </div>
      </div>
    `;
  });
  
  html += `
        </div>
        <div class="modal-actions">
          <button onclick="quitarComida('${dia}', '${tipoComida}')" class="btn-eliminar">
            Quitar comida
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.innerHTML = html;
  document.body.appendChild(modal);
  
  // Focus en el campo de búsqueda
  setTimeout(() => {
    const buscarInput = document.getElementById('buscar-receta');
    if (buscarInput) buscarInput.focus();
  }, 100);
}

// Filtrar recetas en el modal
window.filtrarRecetas = (termino) => {
  const listaRecetas = document.getElementById('lista-recetas');
  if (!listaRecetas) return;
  
  const recetasFiltradas = recetasDisponibles.filter(receta =>
    receta.nombre.toLowerCase().includes(termino.toLowerCase()) ||
    (receta.ingredientes && receta.ingredientes.some(ing => 
      ing.toLowerCase().includes(termino.toLowerCase())
    ))
  );
  
  let html = '';
  recetasFiltradas.forEach(receta => {
    html += `
      <div class="receta-item" onclick="asignarComida('${arguments[1] || 'lunes'}', '${arguments[2] || 'desayuno'}', ${JSON.stringify(receta).replace(/"/g, '&quot;')})">
        <div class="receta-nombre">${receta.nombre}</div>
        <div class="receta-info">
          <span class="tiempo">${receta.tiempoPreparacion || 30} min</span>
          <span class="calorias">${receta.calorias || 'N/A'} cal</span>
        </div>
      </div>
    `;
  });
  
  listaRecetas.innerHTML = html || '<p>No se encontraron recetas</p>';
};

// Asignar comida al plan
window.asignarComida = (dia, tipoComida, receta) => {
  if (!planActual[dia]) {
    planActual[dia] = {};
  }
  
  planActual[dia][tipoComida] = {
    _id: receta._id,
    nombre: receta.nombre,
    tiempoPreparacion: receta.tiempoPreparacion,
    calorias: receta.calorias,
    ingredientes: receta.ingredientes
  };
  
  cerrarModal();
  mostrarPlanificador();
  mostrarMensaje(`${receta.nombre} asignado a ${tipoComida} del ${dia}`, 'success');
};

// Quitar comida del plan
window.quitarComida = (dia, tipoComida) => {
  if (planActual[dia] && planActual[dia][tipoComida]) {
    delete planActual[dia][tipoComida];
    cerrarModal();
    mostrarPlanificador();
    mostrarMensaje(`Comida eliminada del ${tipoComida} del ${dia}`, 'info');
  }
};

// Cerrar modal
window.cerrarModal = () => {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
};

// Guardar plan en el servidor
window.guardarPlan = async () => {
  if (!usuarioActual) {
    mostrarMensaje('Debes iniciar sesión para guardar el plan', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/planificador/${usuarioActual._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan: planActual })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    mostrarMensaje('Plan guardado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error al guardar plan:', error);
    mostrarMensaje('Error al guardar el plan', 'error');
  }
};

// Exportar plan
window.exportarPlan = () => {
  if (!usuarioActual) {
    mostrarMensaje('Debes iniciar sesión para exportar el plan', 'error');
    return;
  }
  
  try {
    let contenido = 'PLAN DE COMIDAS SEMANAL\n';
    contenido += '=' * 30 + '\n\n';
    
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const tiposComida = ['desayuno', 'almuerzo', 'cena'];
    
    diasSemana.forEach(dia => {
      contenido += `${dia.toUpperCase()}\n`;
      contenido += '-'.repeat(dia.length) + '\n';
      
      tiposComida.forEach(tipo => {
        const comida = planActual[dia] && planActual[dia][tipo];
        contenido += `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: `;
        contenido += comida ? comida.nombre : 'Sin asignar';
        if (comida && comida.tiempoPreparacion) {
          contenido += ` (${comida.tiempoPreparacion} min)`;
        }
        contenido += '\n';
      });
      
      contenido += '\n';
    });
    
    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-comidas-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarMensaje('Plan exportado exitosamente', 'success');
    
  } catch (error) {
    console.error('Error al exportar plan:', error);
    mostrarMensaje('Error al exportar el plan', 'error');
  }
};

// Generar lista de compras
window.generarListaCompras = () => {
  if (!usuarioActual) {
    mostrarMensaje('Debes iniciar sesión para generar la lista', 'error');
    return;
  }
  
  const ingredientes = new Map();
  
  // Recopilar todos los ingredientes del plan
  Object.values(planActual).forEach(dia => {
    Object.values(dia).forEach(comida => {
      if (comida && comida.ingredientes) {
        comida.ingredientes.forEach(ingrediente => {
          const nombre = typeof ingrediente === 'string' ? ingrediente : ingrediente.nombre;
          const cantidad = typeof ingrediente === 'object' ? ingrediente.cantidad : 1;
          
          if (ingredientes.has(nombre)) {
            ingredientes.set(nombre, ingredientes.get(nombre) + cantidad);
          } else {
            ingredientes.set(nombre, cantidad);
          }
        });
      }
    });
  });
  
  // Mostrar lista de compras
  mostrarModalListaCompras(ingredientes);
};

// Modal para mostrar lista de compras
function mostrarModalListaCompras(ingredientes) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.onclick = (e) => {
    if (e.target === modal) cerrarModal();
  };
  
  let html = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Lista de Compras</h3>
        <button onclick="cerrarModal()" class="btn-cerrar">×</button>
      </div>
      <div class="modal-body">
        <div class="lista-compras">
  `;
  
  if (ingredientes.size === 0) {
    html += '<p>No hay ingredientes en el plan actual</p>';
  } else {
    Array.from(ingredientes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([ingrediente, cantidad]) => {
        html += `
          <div class="ingrediente-item">
            <input type="checkbox" id="ing-${ingrediente.replace(/\s+/g, '-')}">
            <label for="ing-${ingrediente.replace(/\s+/g, '-')}">
              ${ingrediente} ${cantidad > 1 ? `(x${cantidad})` : ''}
            </label>
          </div>
        `;
      });
  }
  
  html += `
        </div>
        <div class="modal-actions">
          <button onclick="exportarListaCompras()" class="btn-secundario">
            Exportar Lista
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

// Exportar lista de compras
window.exportarListaCompras = () => {
  const ingredientes = new Map();
  
  // Recopilar ingredientes nuevamente
  Object.values(planActual).forEach(dia => {
    Object.values(dia).forEach(comida => {
      if (comida && comida.ingredientes) {
        comida.ingredientes.forEach(ingrediente => {
          const nombre = typeof ingrediente === 'string' ? ingrediente : ingrediente.nombre;
          const cantidad = typeof ingrediente === 'object' ? ingrediente.cantidad : 1;
          
          if (ingredientes.has(nombre)) {
            ingredientes.set(nombre, ingredientes.get(nombre) + cantidad);
          } else {
            ingredientes.set(nombre, cantidad);
          }
        });
      }
    });
  });
  
  let contenido = 'LISTA DE COMPRAS\n';
  contenido += '=' * 16 + '\n\n';
  
  Array.from(ingredientes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([ingrediente, cantidad]) => {
      contenido += `☐ ${ingrediente}`;
      if (cantidad > 1) {
        contenido += ` (x${cantidad})`;
      }
      contenido += '\n';
    });
  
  // Crear y descargar archivo
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lista-compras-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  mostrarMensaje('Lista de compras exportada', 'success');
};

// Inicializar planificador cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Solo cargar si estamos en la sección del planificador
  if (window.location.hash === '#planificador' || 
      document.getElementById('planificador')) {
    cargarPlanificador();
  }
});

// Función faltante: likePost
window.likePost = async (postId) => {
  if (!usuarioActual) {
    mostrarMensaje('Debes iniciar sesión para dar like', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/comunidad/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      mostrarMensaje('Like agregado', 'success');
      await cargarComunidad();
    }
  } catch (error) {
    mostrarMensaje('Error al dar like', 'error');
  }
};

// Función faltante: mostrarComentarios
window.mostrarComentarios = (postId) => {
  console.log(`Mostrando comentarios del post ${postId}`);
  mostrarMensaje('Función de comentarios en desarrollo', 'info');
};

// Función faltante: agregarAFavoritos
window.agregarAFavoritos = async (recetaId) => {
  if (!usuarioActual) {
    mostrarMensaje('Debes iniciar sesión para guardar favoritos', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/usuarios/favoritos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ recetaId })
    });
    
    if (response.ok) {
      mostrarMensaje('Receta guardada en favoritos', 'success');
    }
  } catch (error) {
    mostrarMensaje('Error al guardar en favoritos', 'error');
  }
};

// Función faltante: agregarAPlanificador
window.agregarAPlanificador = (recetaId) => {
  if (!usuarioActual) {
    mostrarMensaje('Debes iniciar sesión para usar el planificador', 'error');
    return;
  }
  
  console.log(`Agregando receta ${recetaId} al planificador`);
  mostrarMensaje('Función en desarrollo: agregar al planificador', 'info');
};

// Sección de comunidad 
async function cargarComunidad() {
  const seccionComunidad = document.getElementById('comunidad');
  if (!seccionComunidad) return;
  
  seccionComunidad.innerHTML = `
    <h2>Comunidad SaludApp</h2>
    <div class="loading">Cargando comunidad...</div>
  `;

  try {
    const response = await fetch('/api/comunidad');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    //  Acceder a data.data en lugar de buscar data.posts
    const posts = data.data || [];

    seccionComunidad.innerHTML = `
      <h2>Comunidad</h2>
      ${usuarioActual ? `
        <div class="nuevo-post">
          <textarea id="nuevo-post-contenido" placeholder="¿Qué quieres compartir con la comunidad?"></textarea>
          <button onclick="publicarPost()">Publicar</button>
        </div>
      ` : ''}
      <div class="posts">
        ${posts.length > 0 ? posts.map(post => `
          <div class="post">
            <div class="post-header">
              <div class="avatar">${(post.autor || 'Usuario').charAt(0).toUpperCase()}</div>
              <div>
                <h4>${post.autor || 'Usuario anónimo'}</h4>
                <small>${new Date(post.fecha).toLocaleDateString()}</small>
              </div>
            </div>
            <p class="contenido">${post.contenido || ''}</p>
            <div class="post-acciones">
              <button onclick="likePost('${post.id}')">👍 ${post.likes || 0}</button>
              <button onclick="mostrarComentarios('${post.id}')">💬 ${post.comentarios || 0}</button>
            </div>
          </div>
        `).join('') : '<p>No hay publicaciones disponibles</p>'}
      </div>
    `;
 } catch (error) {
    seccionComunidad.innerHTML = `
      <p class="error">Error al cargar comunidad: ${error.message}</p>
    `;
    console.error('Error en cargarComunidad:', error);
  }
}

// Sección de nutricionistas 
async function cargarNutricionistas() {
  const seccionNutricionistas = document.getElementById('nutricionistas');
  if (!seccionNutricionistas) return;
  
  seccionNutricionistas.innerHTML = `
    <h2>Nutricionistas</h2>
    <div class="loading">Cargando nutricionistas...</div>
  `;

  try {
    const response = await fetch('/api/nutricionistas');
    // ✅ LÍNEAS CORREGIDAS: Obtener el resultado completo y extraer el array
    const result = await response.json();
    const nutricionistas = result.data || [];

    seccionNutricionistas.innerHTML = `
      <h2>Nutricionistas Certificados</h2>
      <div class="nutricionistas-grid">
        ${nutricionistas.map(nutri => `
          <div class="nutricionista-card">
            <div class="nutricionista-imagen" style="background-image: url('${nutri.foto || 'img/nutri-default.jpg'}')"></div>
            <div class="nutricionista-info">
              <h3>${nutri.nombre}</h3>
              <p class="especialidad">${nutri.especialidad}</p>
              <p class="experiencia">${nutri.experiencia}</p>
              <div class="valoracion">${'⭐'.repeat(Math.floor(nutri.rating) || 5)}</div>
              <p class="ubicacion">📍 ${nutri.ubicacion}</p>
              <p class="reviews">${nutri.reviews} reseñas</p>
              <button onclick="agendarCita('${nutri.id}')">Agendar Cita</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    seccionNutricionistas.innerHTML = `<p class="error">Error al cargar nutricionistas</p>`;
    console.error('Error:', error);
  }
}
// Funciones de autenticación
async function manejarRegistro(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const contraseña = document.getElementById('register-password').value;
  const objetivo = document.getElementById('register-goal').value;
  
  const restriccionesCheckboxes = document.querySelectorAll('input[name="restriction"]:checked');
  const restricciones = Array.from(restriccionesCheckboxes).map(cb => cb.value);

  if (!nombre || !email || !contraseña || !objetivo) {
    mostrarMensaje('Por favor completa todos los campos obligatorios', 'error');
    return;
  }

  try {
    const response = await fetch('/api/usuarios/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, contraseña, objetivo, restricciones })
    });

    const data = await response.json();

    if (data.exito) {
      mostrarMensaje('¡Registro exitoso! Ahora inicia sesión', 'success');
      limpiarFormularios();
      mostrarSeccion('inicio');
    } else {
      mostrarMensaje(data.mensaje || 'Error en el registro', 'error');
    }
  } catch (error) {
    mostrarMensaje('Error de conexión', 'error');
  }
}

async function manejarLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const contraseña = document.getElementById('login-password').value;

  if (!email || !contraseña) {
    mostrarMensaje('Por favor ingresa email y contraseña', 'error');
    return;
  }

  try {
    const response = await fetch('/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contraseña })
    });

    const data = await response.json();

    if (data.exito) {
      token = data.token;
      usuarioActual = data.usuario;
      localStorage.setItem('saludapp_token', token);
      
      mostrarMensaje(`¡Bienvenido, ${usuarioActual.nombre}!`, 'success');
      mostrarUsuarioLogueado();
      limpiarFormularios();
      mostrarSeccion('inicio');
    } else {
      mostrarMensaje(data.mensaje || 'Credenciales inválidas', 'error');
    }
  } catch (error) {
    mostrarMensaje('Error de conexión', 'error');
  }
}

function cerrarSesion() {
  token = null;
  usuarioActual = null;
  localStorage.removeItem('saludapp_token');
  mostrarUsuarioNoLogueado();
  mostrarMensaje('Sesión cerrada exitosamente', 'info');
  mostrarSeccion('inicio');
}

// Funciones globales
window.verRecetaCompleta = async (id) => {
  try {
    const response = await fetch(`/api/recetas/${id}`);
    const receta = await response.json();
    
    const modal = document.createElement('div');
    modal.className = 'modal-receta';
    modal.innerHTML = `
      <div class="modal-contenido">
        <span class="cerrar" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2>${receta.nombre}</h2>
        <div class="receta-detalle">
          <div class="receta-imagen" style="background-image: url('${receta.imagen || 'img/receta-default.jpg'}')"></div>
          <div class="receta-info">
            <p><strong>Tiempo:</strong> ${receta.tiempoPreparacion} minutos</p>
            <p><strong>Dificultad:</strong> ${receta.dificultad}</p>
            <p><strong>Porciones:</strong> ${receta.porciones}</p>
          </div>
        </div>
        <div class="receta-ingredientes">
          <h3>Ingredientes</h3>
          <ul>
            ${receta.ingredientes.map(ing => `<li>${ing}</li>`).join('')}
          </ul>
        </div>
        <div class="receta-preparacion">
          <h3>Preparación</h3>
          <ol>
            ${receta.preparacion.map(paso => `<li>${paso}</li>`).join('')}
          </ol>
        </div>
        ${usuarioActual ? `
          <button onclick="agregarAFavoritos('${receta._id}')">❤️ Guardar en favoritos</button>
          <button onclick="agregarAPlanificador('${receta._id}')">📅 Agregar a planificador</button>
        ` : ''}
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    mostrarMensaje('Error al cargar receta', 'error');
  }
};

window.publicarPost = async () => {
  const contenido = document.getElementById('nuevo-post-contenido')?.value.trim();
  if (!contenido) return mostrarMensaje('El contenido no puede estar vacío', 'error');

  try {
    const response = await fetch('/api/comunidad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ contenido })
    });

    if (response.ok) {
      mostrarMensaje('Publicación exitosa', 'success');
      document.getElementById('nuevo-post-contenido').value = '';
      await cargarComunidad();
    }
  } catch (error) {
    mostrarMensaje('Error al publicar', 'error');
  }
};

window.generarPlanSemanal = async () => {
  if (!usuarioActual) return;
  
  try {
    const response = await fetch(`/api/planificador/generar/${usuarioActual._id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      mostrarMensaje('Plan generado exitosamente', 'success');
      await cargarPlanificador();
    }
  } catch (error) {
    mostrarMensaje('Error al generar plan', 'error');
  }
};

window.agendarCita = async (nutricionistaId) => {
  if (!usuarioActual) return mostrarMensaje('Debes iniciar sesión para agendar citas', 'error');
  
  try {
    const response = await fetch(`/api/citas/agendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nutricionistaId, usuarioId: usuarioActual._id })
    });

    if (response.ok) {
      mostrarMensaje('Cita agendada exitosamente', 'success');
    }
  } catch (error) {
    mostrarMensaje('Error al agendar cita', 'error');
  }
};

// Inicialización de eventos
function inicializarEventos() {
  // Autenticación
  if (elements.submitLogin) {
    elements.submitLogin.addEventListener('click', manejarLogin);
  }
  
  if (elements.submitRegister) {
    elements.submitRegister.addEventListener('click', manejarRegistro);
  }
  
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', cerrarSesion);
  }

  // Navegación de formularios
  if (elements.registerBtn) {
    elements.registerBtn.addEventListener('click', () => {
      if (elements.authForms) elements.authForms.style.display = 'block';
      if (elements.loginForm) elements.loginForm.style.display = 'none';
      if (elements.registerForm) elements.registerForm.style.display = 'block';
    });
  }

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', () => {
      if (elements.authForms) elements.authForms.style.display = 'block';
      if (elements.loginForm) elements.loginForm.style.display = 'block';
      if (elements.registerForm) elements.registerForm.style.display = 'none';
    });
  }

  if (elements.showRegister) {
    elements.showRegister.addEventListener('click', () => {
      if (elements.loginForm) elements.loginForm.style.display = 'none';
      if (elements.registerForm) elements.registerForm.style.display = 'block';
    });
  }

  if (elements.showLogin) {
    elements.showLogin.addEventListener('click', () => {
      if (elements.registerForm) elements.registerForm.style.display = 'none';
      if (elements.loginForm) elements.loginForm.style.display = 'block';
    });
  }
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Iniciando SaludApp...');
  
  try {
    if (token) {
      console.log('🔍 Verificando token...');
      await verificarToken();
    }
    
    inicializarNavegacion();
    inicializarEventos();
    mostrarSugerenciaDelDia();
    
    console.log('✅ App cargada correctamente');
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
  }
});