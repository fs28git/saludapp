document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html'; // Redirige si no hay token
    return;
  }

  try {
    // Cargar recetas filtradas para el usuario
    const response = await fetch('/api/recetas', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Error al cargar recetas');

    const recetas = await response.json();
    const contenedor = document.getElementById('recetas-container');

    if (recetas.length === 0) {
      contenedor.innerHTML = '<p>No hay recetas disponibles con tus filtros actuales.</p>';
      return;
    }

    // Mostrar recetas
    recetas.forEach(receta => {
      const card = `
        <div class="receta-card">
          <h3>${receta.nombre}</h3>
          <p><strong>Objetivo:</strong> ${receta.objetivo || 'General'}</p>
          <p><strong>Ingredientes:</strong> ${receta.ingredientes.join(', ')}</p>
          <button onclick="agregarAPlanificacion('${receta._id}')">Agregar a mi plan</button>
        </div>
      `;
      contenedor.innerHTML += card;
    });

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('recetas-container').innerHTML = `
      <p class="error">Error al cargar recetas. Intenta nuevamente.</p>
    `;
  }
});

// Función para agregar recetas a la planificación
async function agregarAPlanificacion(recetaId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/planificacion', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recetaId }),
    });

    if (response.ok) {
      alert('Receta agregada a tu planificación correctamente!');
    } else {
      throw new Error('Error al agregar receta');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al agregar receta. Intenta nuevamente.');
  }
}