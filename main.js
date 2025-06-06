const recordBtn = document.getElementById("recordBtn");
const resultText = document.getElementById("resultText");
const confirmSection = document.getElementById("confirmSection");
const montoEl = document.getElementById("monto");
const categoriaEl = document.getElementById("categoria");
const fechaEl = document.getElementById("fecha");
const guardarBtn = document.getElementById("guardarBtn");
const listaGastos = document.getElementById("listaGastos");
const whatsappBtn = document.getElementById("whatsappBtn");

// Configuración de la API y WhatsApp
const API_URL = 'https://tu-api.com/gastos'; // Cambia esto por tu URL real
const WHATSAPP_NUMBER = '341234567890'; // Cambia esto por tu número real

// Inicializar variables
let gastoTemp = {};
let gastos = [];
let recognition = null;

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

// Función para solicitar permisos del micrófono
function solicitarPermisosMicrofono() {
    return new Promise((resolve, reject) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject(new Error('getUserMedia no está disponible en este navegador'));
            return;
        }
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                resolve(true);
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Inicializar reconocimiento de voz
async function inicializarReconocimiento() {
    try {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('El reconocimiento de voz no está disponible en este navegador');
        }
        try {
            await solicitarPermisosMicrofono();
        } catch (error) {
            throw new Error('No se concedieron los permisos del micrófono: ' + error.message);
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            recordBtn.classList.add('recording');
            resultText.textContent = 'Escuchando...';
            resultText.style.color = '#4CAF50';
        };

        recognition.onend = () => {
            recordBtn.classList.remove('recording');
            if (resultText.textContent === 'Escuchando...') {
                resultText.textContent = 'No se detectó voz. Intenta de nuevo.';
                resultText.style.color = '#f44336';
            }
        };

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            resultText.textContent = text;
            resultText.style.color = '#000000';
            parseGasto(text);
        };

        recognition.onerror = (event) => {
            let mensajeError = 'Error al reconocer la voz. ';
            switch(event.error) {
                case 'no-speech':
                    mensajeError += 'No se detectó voz.'; break;
                case 'aborted':
                    mensajeError += 'El reconocimiento fue abortado.'; break;
                case 'audio-capture':
                    mensajeError += 'No se pudo acceder al micrófono.'; break;
                case 'network':
                    mensajeError += 'Error de red.'; break;
                case 'not-allowed':
                    mensajeError += 'No se permitió el acceso al micrófono.'; break;
                case 'service-not-allowed':
                    mensajeError += 'El servicio de reconocimiento no está permitido.'; break;
                default:
                    mensajeError += 'Error desconocido.';
            }
            resultText.textContent = mensajeError;
            resultText.style.color = '#f44336';
            recordBtn.classList.remove('recording');
        };

        return recognition;
    } catch (error) {
        resultText.textContent = 'Error al inicializar el reconocimiento de voz: ' + error.message;
        resultText.style.color = '#f44336';
        return null;
    }
}

// Función para parsear el texto del gasto
function parseGasto(texto) {
    texto = texto.toLowerCase();
    const patrones = [
        /(\d+(?:[.,]\d+)?)\s*(?:euros?|€|euro|eur|pesos|dólares?|usd|\$)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        /(\w+(?:\s+\w+)*)\s+(\d+(?:[.,]\d+)?)\s*(?:euros?|€|euro|eur|pesos|dólares?|usd|\$)/i,
        /(?:gasto|gasté|gastado|gastando|gastar|gastos|gastamos|gastaron|gastaste|gastó)\s*(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:he|acabo de|voy a|vamos a|han|has|ha)\s+(?:gastar|gastado|gastando|gasté|gastó|gastaste|gastaron|gastamos)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:para|en|de|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        /(\w+(?:\s+\w+)*)\s+(?:por|a|de|en|del|de la|de las|de los|en la|en el|en las|en los)\s*(\d+(?:[.,]\d+)?)\s*(?:euros?|€|euro|eur|pesos|dólares?|usd|\$)/i,
        /(\w+(?:\s+\w+)*)\s+(\d+(?:[.,]\d+)?)/i,
        /(\d+(?:[.,]\d+)?)\s+(\w+(?:\s+\w+)*)/i,
        /(?:pago|pagado|pagando|pagar|pagué|pagó|pagaste|pagaron|pagamos)\s*(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:compré|comprado|comprando|comprar|compró|compramos|compraron|compraste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:invertí|invertido|invirtiendo|invertir|invirtió|invertimos|invirtieron|invertiste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:desembolsé|desembolsado|desembolsando|desembolsar|desembolsó|desembolsamos|desembolsaron|desembolsaste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:he|acabo de|voy a|vamos a|han|has|ha)\s+(?:pagar|pagado|pagando|pagué|pagó|pagaste|pagaron|pagamos)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:he|acabo de|voy a|vamos a|han|has|ha)\s+(?:comprar|comprado|comprando|compré|compró|compramos|compraron|compraste)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:he|acabo de|voy a|vamos a|han|has|ha)\s+(?:invertir|invertido|invirtiendo|invertí|invirtió|invertimos|invirtieron|invertiste)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(?:he|acabo de|voy a|vamos a|han|has|ha)\s+(?:desembolsar|desembolsado|desembolsando|desembolsé|desembolsó|desembolsamos|desembolsaron|desembolsaste)?\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(?:la|el|las|los|un|una|unos|unas)\s+(\w+(?:\s+\w+)*)/i,
        /(\w+(?:\s+\w+)*)\s+(?:por|a|de|en|del|de la|de las|de los|en la|en el|en las|en los)\s+(?:la|el|las|los|un|una|unos|unas)\s+(?:cantidad|monto|valor|precio|importe|suma|total)\s+(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)?\s*(\d+(?:[.,]\d+)?)/i,
        /(\d+(?:[.,]\d+)?)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(?:concepto|conceptos|motivo|motivos|razón|razones)\s+(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)?\s+(\w+(?:\s+\w+)*)/i,
    ];

    let match = null;
    let monto = null;
    let categoria = null;

    for (const patron of patrones) {
        match = texto.match(patron);
        if (match) {
            monto = match[1];
            categoria = match[2];
            break;
        }
    }

    if (match) {
        const montoStr = monto.replace(',', '.');
        const montoNum = parseFloat(montoStr);
        const fecha = new Date().toLocaleDateString();

        categoria = categoria.split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(' ');

        gastoTemp = { monto: montoNum, categoria, fecha };
        montoEl.textContent = `${montoNum} €`;
        categoriaEl.textContent = categoria;
        fechaEl.textContent = fecha;
        confirmSection.classList.remove("hidden");
        guardarBtn.style.display = 'inline-block';
        whatsappBtn.style.display = 'inline-block';
        resultText.textContent = `Gasto reconocido: ${montoNum}€ en ${categoria}`;
    } else {
        resultText.textContent = "No se pudo entender el gasto. Intenta decir algo como:\n" +
                                "- '50 euros en comida'\n" +
                                "- '25,50 euros en transporte'\n" +
                                "- '100€ de ropa'\n" +
                                "- '75 para ocio'\n" +
                                "- 'comida 50 euros'\n" +
                                "- 'gasto de 30 en cine'\n" +
                                "- 'he gastado 20 en gasolina'\n" +
                                "- 'pago de 15 en parking'\n" +
                                "- 'compré 40 en supermercado'\n" +
                                "- 'invertí 200 en tecnología'\n" +
                                "- 'desembolsé 60 en restaurante'\n" +
                                "- '50 comida'\n" +
                                "- 'comida 50'\n" +
                                "- 'he pagado 35 en la gasolinera'\n" +
                                "- 'compré 25 en el supermercado'\n" +
                                "- 'invertí 150 en la tecnología'\n" +
                                "- 'desembolsé 45 en el restaurante'\n" +
                                "- 'gasto de 30 en concepto de cine'\n" +
                                "- 'pago de 20 por la cantidad de comida'\n" +
                                "- 'he hecho un gasto de 40 en ropa'\n" +
                                "- 'vamos a gastar 60 en ocio'";
    }
}

// Event Listeners
if (recordBtn) {
    let recognition = null;
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            recognition = await inicializarReconocimiento();
            if (!recognition) {
                recordBtn.disabled = true;
                resultText.textContent = 'No se pudo inicializar el reconocimiento de voz.';
            }
        } catch (error) {
            recordBtn.disabled = true;
            resultText.textContent = 'Error: ' + error.message;
        }
        cargarGastos();
        mostrarGastos();
    });

    recordBtn.addEventListener("click", async () => {
        try {
            if (!recognition) {
                recognition = await inicializarReconocimiento();
                if (!recognition) throw new Error('No se pudo inicializar el reconocimiento de voz');
            }
            recognition.start();
        } catch (error) {
            resultText.textContent = 'Error al iniciar la grabación: ' + error.message;
        }
    });
}

if (guardarBtn) {
    guardarBtn.addEventListener("click", () => {
        guardarNuevoGasto();
    });
}

if (whatsappBtn) {
    whatsappBtn.addEventListener("click", () => {
        if (gastoTemp.monto && gastoTemp.categoria && gastoTemp.fecha) {
            enviarPorWhatsApp(gastoTemp);
        } else {
            alert("No hay un gasto válido para enviar por WhatsApp.");
        }
    });
}

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
        mensaje += '\nEnviado desde GastosPorVoz by Gerardo López';
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
                       `Enviado desde GastosPorVoz by Gerardo López`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
        const ventanaWhatsApp = window.open(url, '_blank');
        if (!ventanaWhatsApp) {
            alert('No se pudo abrir WhatsApp. Por favor, verifica que WhatsApp esté instalado en tu dispositivo.');
        }
    } catch (error) {
        alert('Error al enviar el gasto por WhatsApp. Por favor, intenta de nuevo.');
    }
}

// Función para guardar un nuevo gasto
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
        const gasto = {
            monto: monto,
            categoria: categoria,
            fecha: new Date().toLocaleDateString()
        };
        montoEl.textContent = `${monto} €`;
        categoriaEl.textContent = categoria;
        fechaEl.textContent = gasto.fecha;
        confirmSection.classList.remove("hidden");
        montoManual.value = '';
        categoriaManual.value = '';
        gastoTemp = gasto;
        resultText.textContent = `Gasto ingresado: ${monto}€ en ${categoria}`;
        resultText.style.color = '#4CAF50';
    });
}
