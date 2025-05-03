# GastosPorVoz

Aplicación web para registrar gastos mediante reconocimiento de voz.

## Características

- Registro de gastos mediante voz
- Envío de gastos por WhatsApp
- Almacenamiento local de gastos
- Interfaz intuitiva y responsive

## Requisitos

- Navegador web moderno (Chrome o Edge recomendados)
- Conexión a internet
- Micrófono habilitado
- WhatsApp Web (para la función de envío)

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tito-lopez/Control-de-gastos-por-voz.git
cd gastovoz
```

2. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
API_URL=https://tu-api-real.com/gastos
WHATSAPP_NUMBER=tu-numero-real
```

3. Abre el archivo `index.html` en tu navegador o sirve los archivos usando un servidor local.

## Uso

1. Haz clic en el botón del micrófono para comenzar a grabar
2. Di el gasto en el siguiente formato: "X euros en categoría"
   Ejemplo: "50 euros en comida"
3. Confirma el gasto y elige si deseas guardarlo o enviarlo por WhatsApp

## Estructura del Proyecto

```
gastovoz/
├── index.html
├── estilos.css
├── main.js
├── imagenes/
│   └── favicon.png
├── .env
├── .gitignore
└── README.md
```

## Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Gerardo López - gerardolopezartime@gmail.com

Link del Proyecto: [https://github.com/tito-lopez/Control-de-gastos-por-voz]