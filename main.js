const resultText = document.getElementById("resultText");
const confirmSection = document.getElementById("confirmSection");
const montoEl = document.getElementById("monto");
const categoriaEl = document.getElementById("categoria");
const fechaEl = document.getElementById("fecha");
const guardarBtn = document.getElementById("guardarBtn");
const listaGastos = document.getElementById("listaGastos");
const whatsappBtn = document.getElementById("whatsappBtn");

// Inicializar variables
let gastoTemp = {};
let gastos = [];

// Elementos del formulario manual
const manualForm = document.getElementById('manualForm');
const montoManual = document.getElementById('montoManual');
const categoriaManual = document.getElementById('categoriaManual');

// Cargar gastos del localStorage
function cargarGastos() {
    try {
        const gastosGuardados = localStorage.getItem('gastos');
        if (gastosGuardados) {
            gastos = JSON.parse(gastosGuardados);
        }
    } catch (error) {
        gastos = [];
    }
}

// Guardar gastos en localStorage
function guardarGastosEnStorage() {
    try {
        localStorage.setItem('gastos', JSON.stringify(gastos));
    } catch (error) {}
}

// Mostrar gastos en la lista
function mostrarGastos() {
    if (!listaGastos) return;

    listaGastos.innerHTML = '';
    
    // Mostrar total
    const total = gastos.reduce((sum, gasto) => {
        const monto = parseFloat(gasto.monto) || 0;
        return sum + monto;
    }, 0);
    
    const totalElement = document.createElement('div');
    totalElement.className = 'total-gastos';
    totalElement.innerHTML = `<strong>Total: ${total.toFixed(2)} €</strong>`;
    listaGastos.appendChild(totalElement);

    // Agregar botón de WhatsApp si hay gastos
    if (gastos.length > 0) {
        const whatsappResumenBtn = document.createElement('button');
        whatsappResumenBtn.className = 'whatsapp-resumen-btn';
        whatsappResumenBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar resumen por WhatsApp';
        whatsappResumenBtn.onclick = () => enviarResumenPorWhatsApp();
        listaGastos.appendChild(whatsappResumenBtn);
    }
    
    // Mostrar cada gasto
    gastos.forEach((gasto, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="gasto-item">
                <span class="fecha">${gasto.fecha || 'Sin fecha'}</span>
                <span class="categoria">${gasto.categoria || 'Sin categoría'}</span>
                <span class="monto">${(gasto.monto || 0).toFixed(2)} €</span>
                <button class="eliminar-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listaGastos.appendChild(li);
    });

    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.eliminar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.closest('.eliminar-btn').dataset.index;
            eliminarGasto(index);
        });
    });
}

// Función para eliminar un gasto
function eliminarGasto(index) {
    try {
        gastos.splice(index, 1);
        guardarGastosEnStorage();
        mostrarGastos();
    } catch (error) {
        alert('Error al eliminar el gasto');
    }
}

// Función para parsear el texto del gasto
function parseGastoManual(monto, categoria) {
    const fecha = new Date().toLocaleDateString();
    gastoTemp = { monto, categoria, fecha };
    montoEl.textContent = `${monto} €`;
    categoriaEl.textContent = categoria;
    fechaEl.textContent = fecha;
    confirmSection.classList.remove("hidden");
    guardarBtn.style.display = 'inline-block';
    whatsappBtn.style.display = 'inline-block';
    resultText.textContent = `Gasto ingresado: ${monto}€ en ${categoria}`;
    resultText.style.color = '#4CAF50';
}

// Guardar nuevo gasto (confirmación)
function guardarNuevoGasto() {
    if (!gastoTemp.monto || !gastoTemp.categoria || !gastoTemp.fecha) {
        alert('Datos de gasto incompletos');
        return;
    }
    try {
        const nuevoGasto = {
            monto: parseFloat(gastoTemp.monto),
            categoria: gastoTemp.categoria,
            fecha: gastoTemp.fecha
        };
        gastos.push(nuevoGasto);
        guardarGastosEnStorage();
        mostrarGastos();
        gastoTemp = {};
        confirmSection.classList.add("hidden");
        resultText.textContent = "Gasto guardado correctamente ✅";
    } catch (error) {
        alert('Error al guardar el gasto');
    }
}

// Función para enviar resumen de gastos por WhatsApp
function enviarResumenPorWhatsApp() {
    try {
        if (!gastos || gastos.length === 0) {
            alert('No hay gastos para enviar');
            return;
        }
        let mensaje = '📊 Resumen de Gastos:\n\n';
        const gastosPorCategoria = {};
        gastos.forEach(gasto => {
            if (!gastosPorCategoria[gasto.categoria]) {
                gastosPorCategoria[gasto.categoria] = 0;
            }
            gastosPorCategoria[gasto.categoria] += parseFloat(gasto.monto);
        });
        Object.entries(gastosPorCategoria).forEach(([categoria, total]) => {
            mensaje += `📌 ${categoria}: ${total.toFixed(2)}€\n`;
        });
        const totalGeneral = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
        mensaje += `\n💰 Total General: ${totalGeneral.toFixed(2)}€\n\n`;
        mensaje += '📋 Detalle de gastos:\n';
        gastos.forEach((gasto, index) => {
            mensaje += `${index + 1}. ${gasto.fecha} - ${gasto.categoria}: ${gasto.monto}€\n`;
        });
        mensaje += '\nEnviado desde Control de Gastos by Gerardo López';
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
        const ventanaWhatsApp = window.open(url, '_blank');
        if (!ventanaWhatsApp) {
            alert('No se pudo abrir WhatsApp. Por favor, verifica que WhatsApp esté instalado en tu dispositivo.');
        }
    } catch (error) {
        alert('Error al enviar el resumen por WhatsApp. Por favor, intenta de nuevo.');
    }
}

// Función para enviar un gasto individual por WhatsApp
function enviarPorWhatsApp(gasto) {
    try {
        if (!gasto || !gasto.monto || !gasto.categoria || !gasto.fecha) {
            alert('No hay un gasto válido para enviar');
            return;
        }
        const mensaje = `💰 Nuevo Gasto Registrado:\n\n` +
                       `📅 Fecha: ${gasto.fecha}\n` +
                       `📋 Categoría: ${gasto.categoria}\n` +
                       `💶 Monto: ${gasto.monto}€\n\n` +
                       `Enviado desde Gastos by Gerardo López`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
        const ventanaWhatsApp = window.open(url, '_blank');
        if (!ventanaWhatsApp) {
            alert('No se pudo abrir WhatsApp. Por favor, verifica que WhatsApp esté instalado en tu dispositivo.');
        }
    } catch (error) {
        alert('Error al enviar el gasto por WhatsApp. Por favor, intenta de nuevo.');
    }
}

// Event listener para el formulario manual
if (manualForm) {
    manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = parseFloat(montoManual.value);
        const categoria = categoriaManual.value.trim();
        if (isNaN(monto) || monto <= 0) {
            resultText.textContent = 'Por favor, ingresa un monto válido';
            resultText.style.color = '#f44336';
            return;
        }
        if (!categoria) {
            resultText.textContent = 'Por favor, ingresa una categoría';
            resultText.style.color = '#f44336';
            return;
        }
        parseGastoManual(monto, categoria);
        manualForm.reset();
    });
}

// Event listener para guardar gasto confirmado
if (guardarBtn) {
    guardarBtn.addEventListener("click", () => {
        guardarNuevoGasto();
    });
}

// Event listener para enviar gasto por WhatsApp
if (whatsappBtn) {
    whatsappBtn.addEventListener("click", () => {
        if (gastoTemp.monto && gastoTemp.categoria && gastoTemp.fecha) {
            enviarPorWhatsApp(gastoTemp);
        } else {
            alert("No hay un gasto válido para enviar por WhatsApp.");
        }
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarGastos();
    mostrarGastos();
});
