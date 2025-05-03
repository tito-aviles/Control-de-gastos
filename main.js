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
        console.log('Gastos cargados del localStorage:', gastosGuardados);
        if (gastosGuardados) {
            gastos = JSON.parse(gastosGuardados);
            console.log('Gastos parseados:', gastos);
        }
    } catch (error) {
        console.error('Error al cargar gastos:', error);
        gastos = [];
    }
}

// Guardar gastos en localStorage
function guardarGastosEnStorage() {
    try {
        console.log('Guardando gastos en localStorage:', gastos);
        localStorage.setItem('gastos', JSON.stringify(gastos));
        console.log('Gastos guardados correctamente');
    } catch (error) {
        console.error('Error al guardar gastos:', error);
    }
}

// Mostrar gastos en la lista
function mostrarGastos() {
    console.log('Mostrando gastos:', gastos);
    if (!listaGastos) {
        console.error('Elemento listaGastos no encontrado');
        return;
    }

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
        console.error('Error al eliminar gasto:', error);
        alert('Error al eliminar el gasto');
    }
}

// Función para solicitar permisos del micrófono
function solicitarPermisosMicrofono() {
    return new Promise((resolve, reject) => {
        console.log('Solicitando permisos del micrófono...');
        
        // Verificar si el navegador soporta getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject(new Error('getUserMedia no está disponible en este navegador'));
            return;
        }

        // Solicitar permisos
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Permisos del micrófono concedidos');
                // Detener el stream después de obtener permisos
                stream.getTracks().forEach(track => track.stop());
                resolve(true);
            })
            .catch(error => {
                console.error('Error al solicitar permisos del micrófono:', error);
                reject(error);
            });
    });
}

// Inicializar reconocimiento de voz
async function inicializarReconocimiento() {
    try {
        console.log('Iniciando reconocimiento de voz...');
        
        // Verificar si el navegador soporta reconocimiento de voz
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('El reconocimiento de voz no está disponible en este navegador');
        }

        // Solicitar permisos del micrófono
        try {
            await solicitarPermisosMicrofono();
        } catch (error) {
            console.error('Error en permisos:', error);
            throw new Error('No se concedieron los permisos del micrófono: ' + error.message);
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Configurar el reconocimiento
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        // Eventos del reconocimiento
        recognition.onstart = () => {
            console.log('Reconocimiento iniciado');
            recordBtn.classList.add('recording');
            resultText.textContent = 'Escuchando...';
            resultText.style.color = '#4CAF50';
        };

        recognition.onend = () => {
            console.log('Reconocimiento finalizado');
            recordBtn.classList.remove('recording');
            if (resultText.textContent === 'Escuchando...') {
                resultText.textContent = 'No se detectó voz. Intenta de nuevo.';
                resultText.style.color = '#f44336';
            }
        };

        recognition.onresult = (event) => {
            console.log('Resultado del reconocimiento:', event);
            const text = event.results[0][0].transcript;
            console.log('Texto reconocido:', text);
            resultText.textContent = text;
            resultText.style.color = '#000000';
            parseGasto(text);
        };

        recognition.onerror = (event) => {
            console.error('Error en el reconocimiento:', event);
            let mensajeError = 'Error al reconocer la voz. ';
            
            switch(event.error) {
                case 'no-speech':
                    mensajeError += 'No se detectó voz.';
                    break;
                case 'aborted':
                    mensajeError += 'El reconocimiento fue abortado.';
                    break;
                case 'audio-capture':
                    mensajeError += 'No se pudo acceder al micrófono.';
                    break;
                case 'network':
                    mensajeError += 'Error de red.';
                    break;
                case 'not-allowed':
                    mensajeError += 'No se permitió el acceso al micrófono.';
                    break;
                case 'service-not-allowed':
                    mensajeError += 'El servicio de reconocimiento no está permitido.';
                    break;
                default:
                    mensajeError += 'Error desconocido.';
            }
            
            resultText.textContent = mensajeError;
            resultText.style.color = '#f44336';
            recordBtn.classList.remove('recording');
        };

        return recognition;
    } catch (error) {
        console.error('Error al inicializar el reconocimiento:', error);
        resultText.textContent = 'Error al inicializar el reconocimiento de voz: ' + error.message;
        resultText.style.color = '#f44336';
        return null;
    }
}

// Función para parsear el texto del gasto
function parseGasto(texto) {
    console.log('Parseando texto:', texto);
    
    // Convertir el texto a minúsculas para mejor comparación
    texto = texto.toLowerCase();
    
    // Expresiones regulares mejoradas para reconocer más formatos
    const patrones = [
        // Patrón 1: "X euros en categoría" (variaciones básicas)
        /(\d+(?:[.,]\d+)?)\s*(?:euros?|€|euro|euros|eur|pesos|dólares?|dolares?|usd|\$)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 2: "X en categoría" (variaciones básicas)
        /(\d+(?:[.,]\d+)?)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 3: "categoría X euros" (variaciones básicas)
        /(\w+(?:\s+\w+)*)\s+(\d+(?:[.,]\d+)?)\s*(?:euros?|€|euro|euros|eur|pesos|dólares?|dolares?|usd|\$)/i,
        
        // Patrón 4: "gasto de X en categoría" (variaciones de gasto)
        /(?:gasto|gasté|gastado|gastando|gastar|gastos|gastamos|gastaron|gastaste|gastó)\s*(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 5: "he gastado X en categoría" (variaciones de tiempo)
        /(?:he|he\s+hecho|acabo\s+de|voy\s+a|voy\s+a\s+hacer|vamos\s+a|vamos\s+a\s+hacer|han|han\s+hecho|has|has\s+hecho|ha|ha\s+hecho)\s+(?:gastar|gastado|gastando|gasté|gastó|gastaste|gastaron|gastamos)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 6: "X para categoría" (variaciones de propósito)
        /(\d+(?:[.,]\d+)?)\s*(?:para|en|de|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 7: "categoría por X euros" (variaciones de precio)
        /(\w+(?:\s+\w+)*)\s+(?:por|a|de|en|del|de la|de las|de los|en la|en el|en las|en los)\s*(\d+(?:[.,]\d+)?)\s*(?:euros?|€|euro|euros|eur|pesos|dólares?|dolares?|usd|\$)/i,
        
        // Patrón 8: "categoría X" (formato simple)
        /(\w+(?:\s+\w+)*)\s+(\d+(?:[.,]\d+)?)/i,
        
        // Patrón 9: "X categoría" (formato simple inverso)
        /(\d+(?:[.,]\d+)?)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 10: "pago de X en categoría" (variaciones de pago)
        /(?:pago|pagado|pagando|pagar|pagué|pagó|pagaste|pagaron|pagamos)\s*(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 11: "compré X en categoría" (variaciones de compra)
        /(?:compré|comprado|comprando|comprar|compró|compramos|compraron|compraste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 12: "invertí X en categoría" (variaciones de inversión)
        /(?:invertí|invertido|invirtiendo|invertir|invirtió|invertimos|invirtieron|invertiste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 13: "desembolsé X en categoría" (variaciones de desembolso)
        /(?:desembolsé|desembolsado|desembolsando|desembolsar|desembolsó|desembolsamos|desembolsaron|desembolsaste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 14: "he pagado X en categoría" (variaciones de pago con tiempo)
        /(?:he|he\s+hecho|acabo\s+de|voy\s+a|voy\s+a\s+hacer|vamos\s+a|vamos\s+a\s+hacer|han|han\s+hecho|has|has\s+hecho|ha|ha\s+hecho)\s+(?:pagar|pagado|pagando|pagué|pagó|pagaste|pagaron|pagamos)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 15: "he comprado X en categoría" (variaciones de compra con tiempo)
        /(?:he|he\s+hecho|acabo\s+de|voy\s+a|voy\s+a\s+hacer|vamos\s+a|vamos\s+a\s+hacer|han|han\s+hecho|has|has\s+hecho|ha|ha\s+hecho)\s+(?:comprar|comprado|comprando|compré|compró|compramos|compraron|compraste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 16: "he invertido X en categoría" (variaciones de inversión con tiempo)
        /(?:he|he\s+hecho|acabo\s+de|voy\s+a|voy\s+a\s+hacer|vamos\s+a|vamos\s+a\s+hacer|han|han\s+hecho|has|has\s+hecho|ha|ha\s+hecho)\s+(?:invertir|invertido|invirtiendo|invertí|invirtió|invertimos|invirtieron|invertiste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 17: "he desembolsado X en categoría" (variaciones de desembolso con tiempo)
        /(?:he|he\s+hecho|acabo\s+de|voy\s+a|voy\s+a\s+hacer|vamos\s+a|vamos\s+a\s+hacer|han|han\s+hecho|has|has\s+hecho|ha|ha\s+hecho)\s+(?:desembolsar|desembolsado|desembolsando|desembolsé|desembolsó|desembolsamos|desembolsaron|desembolsaste)\s*(\d+(?:[.,]\d+)?)\s*(?:en|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 18: "X en la categoría" (variaciones con artículos)
        /(\d+(?:[.,]\d+)?)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(?:la|el|las|los|un|una|unos|unas)\s+(\w+(?:\s+\w+)*)/i,
        
        // Patrón 19: "categoría por la cantidad de X" (variaciones con cantidad)
        /(\w+(?:\s+\w+)*)\s+(?:por|a|de|en|del|de la|de las|de los|en la|en el|en las|en los)\s+(?:la|el|las|los|un|una|unos|unas)\s+(?:cantidad|monto|valor|precio|importe|suma|total)\s+(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)\s*(\d+(?:[.,]\d+)?)/i,
        
        // Patrón 20: "X en concepto de categoría" (variaciones con concepto)
        /(\d+(?:[.,]\d+)?)\s*(?:en|de|para|por|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(?:concepto|conceptos|motivo|motivos|razón|razones)\s+(?:de|por|en|a|del|de la|de las|de los|en la|en el|en las|en los)\s+(\w+(?:\s+\w+)*)/i
    ];

    let match = null;
    let monto = null;
    let categoria = null;

    // Probar cada patrón hasta encontrar una coincidencia
    for (const patron of patrones) {
        match = texto.match(patron);
        if (match) {
            // Determinar si el monto está en la primera o segunda posición
            if (patron.toString().includes('\\d')) {
                monto = match[1];
                categoria = match[2];
            } else {
                monto = match[2];
                categoria = match[1];
            }
            break;
        }
    }

    if (match) {
        // Convertir el monto a número, reemplazando coma por punto si es necesario
        const montoStr = monto.replace(',', '.');
        const montoNum = parseFloat(montoStr);
        const fecha = new Date().toLocaleDateString();

        // Normalizar la categoría (primera letra en mayúscula de cada palabra)
        categoria = categoria.split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(' ');

        gastoTemp = { monto: montoNum, categoria, fecha };
        console.log('Gasto temporal creado:', gastoTemp);
        
        montoEl.textContent = `${montoNum} €`;
        categoriaEl.textContent = categoria;
        fechaEl.textContent = fecha;
        confirmSection.classList.remove("hidden");
        
        // Asegurar que los botones sean visibles
        guardarBtn.style.display = 'inline-block';
        whatsappBtn.style.display = 'inline-block';
        
        // Mostrar mensaje de confirmación
        resultText.textContent = `Gasto reconocido: ${montoNum}€ en ${categoria}`;
        console.log('Sección de confirmación mostrada');
    } else {
        console.log('No se pudo entender el gasto');
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
    
    // Inicializar el reconocimiento al cargar la página
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Inicializando aplicación...');
        try {
            recognition = await inicializarReconocimiento();
            if (!recognition) {
                recordBtn.disabled = true;
                resultText.textContent = 'No se pudo inicializar el reconocimiento de voz.';
            }
        } catch (error) {
            console.error('Error en la inicialización:', error);
            recordBtn.disabled = true;
            resultText.textContent = 'Error: ' + error.message;
        }
        cargarGastos();
        mostrarGastos();
    });

    recordBtn.addEventListener("click", async () => {
        try {
            if (!recognition) {
                console.log('Inicializando reconocimiento...');
                recognition = await inicializarReconocimiento();
                if (!recognition) {
                    throw new Error('No se pudo inicializar el reconocimiento de voz');
                }
            }
            console.log('Iniciando grabación...');
            recognition.start();
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            resultText.textContent = 'Error al iniciar la grabación: ' + error.message;
        }
    });
}

if (guardarBtn) {
    guardarBtn.addEventListener("click", () => {
        console.log('Botón guardar clickeado');
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

// Función para enviar el resumen por WhatsApp
function enviarResumenPorWhatsApp() {
    try {
        console.log('Enviando resumen por WhatsApp');
        
        if (!gastos || gastos.length === 0) {
            alert('No hay gastos para enviar');
            return;
        }

        // Crear mensaje con todos los gastos
        let mensaje = '📊 Resumen de Gastos:\n\n';
        
        // Agrupar gastos por categoría
        const gastosPorCategoria = {};
        gastos.forEach(gasto => {
            if (!gastosPorCategoria[gasto.categoria]) {
                gastosPorCategoria[gasto.categoria] = 0;
            }
            gastosPorCategoria[gasto.categoria] += parseFloat(gasto.monto);
        });

        // Agregar gastos agrupados por categoría
        Object.entries(gastosPorCategoria).forEach(([categoria, total]) => {
            mensaje += `📌 ${categoria}: ${total.toFixed(2)}€\n`;
        });
        
        // Agregar total
        const totalGeneral = gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
        mensaje += `\n💰 Total General: ${totalGeneral.toFixed(2)}€\n\n`;
        
        // Agregar lista detallada de gastos
        mensaje += '📋 Detalle de gastos:\n';
        gastos.forEach((gasto, index) => {
            mensaje += `${index + 1}. ${gasto.fecha} - ${gasto.categoria}: ${gasto.monto}€\n`;
        });
        
        mensaje += '\nEnviado desde GastosPorVoz by Gerardo López';
        
        // Crear URL de WhatsApp para compartir con cualquier contacto
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
        
        console.log('Mensaje a enviar:', mensaje);
        console.log('URL de WhatsApp:', url);
        
        // Abrir WhatsApp en una nueva ventana
        const ventanaWhatsApp = window.open(url, '_blank');
        if (!ventanaWhatsApp) {
            alert('No se pudo abrir WhatsApp. Por favor, verifica que WhatsApp esté instalado en tu dispositivo.');
        }
    } catch (error) {
        console.error('Error al enviar resumen por WhatsApp:', error);
        alert('Error al enviar el resumen por WhatsApp. Por favor, intenta de nuevo.');
    }
}

// Función para enviar un gasto individual por WhatsApp
function enviarPorWhatsApp(gasto) {
    try {
        console.log('Enviando gasto por WhatsApp:', gasto);
        
        if (!gasto || !gasto.monto || !gasto.categoria || !gasto.fecha) {
            alert('No hay un gasto válido para enviar');
            return;
        }

        const mensaje = `💰 Nuevo Gasto Registrado:\n\n` +
                       `📅 Fecha: ${gasto.fecha}\n` +
                       `📋 Categoría: ${gasto.categoria}\n` +
                       `💶 Monto: ${gasto.monto}€\n\n` +
                       `Enviado desde GastosPorVoz by Gerardo López`;
        
        // Crear URL de WhatsApp para compartir con cualquier contacto
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
        
        console.log('Mensaje a enviar:', mensaje);
        console.log('URL de WhatsApp:', url);
        
        // Abrir WhatsApp en una nueva ventana
        const ventanaWhatsApp = window.open(url, '_blank');
        if (!ventanaWhatsApp) {
            alert('No se pudo abrir WhatsApp. Por favor, verifica que WhatsApp esté instalado en tu dispositivo.');
        }
    } catch (error) {
        console.error('Error al enviar por WhatsApp:', error);
        alert('Error al enviar el gasto por WhatsApp. Por favor, intenta de nuevo.');
    }
}

// Función para guardar un nuevo gasto
function guardarNuevoGasto() {
    console.log('Guardando nuevo gasto:', gastoTemp);
    
    if (!gastoTemp.monto || !gastoTemp.categoria || !gastoTemp.fecha) {
        console.error('Datos de gasto incompletos:', gastoTemp);
        alert('Datos de gasto incompletos');
        return;
    }

    try {
        // Agregar el nuevo gasto
        const nuevoGasto = {
            monto: parseFloat(gastoTemp.monto),
            categoria: gastoTemp.categoria,
            fecha: gastoTemp.fecha
        };
        
        console.log('Nuevo gasto a guardar:', nuevoGasto);
        gastos.push(nuevoGasto);
        console.log('Gastos después de agregar:', gastos);
        
        // Guardar en localStorage
        guardarGastosEnStorage();
        
        // Actualizar la visualización
        mostrarGastos();
        
        // Limpiar y ocultar
        gastoTemp = {};
        confirmSection.classList.add("hidden");
        resultText.textContent = "Gasto guardado correctamente ✅";
        
        console.log('Gasto guardado exitosamente');
    } catch (error) {
        console.error('Error al guardar el gasto:', error);
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
        
        // Crear el objeto de gasto
        const gasto = {
            monto: monto,
            categoria: categoria,
            fecha: new Date().toLocaleDateString()
        };
        
        // Mostrar la sección de confirmación
        montoEl.textContent = `${monto} €`;
        categoriaEl.textContent = categoria;
        fechaEl.textContent = gasto.fecha;
        confirmSection.classList.remove("hidden");
        
        // Limpiar el formulario
        montoManual.value = '';
        categoriaManual.value = '';
        
        // Actualizar el gasto temporal
        gastoTemp = gasto;
        
        resultText.textContent = `Gasto ingresado: ${monto}€ en ${categoria}`;
        resultText.style.color = '#4CAF50';
    });
}