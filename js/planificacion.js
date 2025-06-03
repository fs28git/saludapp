document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    // Cargar planificación del usuario
    const response = await fetch('/api/planificacion', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const { planificacion } = await response.json();
    const contenedor = document.getElementById('planificacion-container');

    if (!planificacion.recetas || planificacion.recetas.length === 0) {
      contenedor.innerHTML = '<p>Aún no has agregado recetas a tu planificación.</p>';
      return;
    }

    // Mostrar recetas planificadas por día
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    diasSemana.forEach(dia => {
      const recetasDia = planificacion.recetas.filter(r => r.diaSemana === dia);
      if (recetasDia.length > 0) {
        contenedor.innerHTML += `
          <div class="dia-card">
            <h3>${dia}</h3>
            ${recetasDia.map(receta => `
              <div class="receta-planificada">
                <p><strong>${receta.recetaId.nombre}</strong></p>
                <p>${receta.recetaId.objetivo || 'Sin objetivo'}</p>
              </div>
            `).join('')}
          </div>
        `;
      }
    });

  } catch (error) {
    console.error('Error:', error);
    contenedor.innerHTML = `
      <p class="error">Error al cargar la planificación. Intenta nuevamente.</p>
    `;
  }
});