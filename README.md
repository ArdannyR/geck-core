# Geck Core Backend

## Descripción General
Geck Core es un módulo backend destinado a gestionar datos, simulando la estructura, el entorno y el comportamiento de un sistema operativo de una computadora normal. Además de proveer una base sólida para la gestión de sistemas de archivos virtuales y espacios de trabajo, el sistema está diseñado para gestionar mensajería móvil y comunicaciones en tiempo real.

El servidor principal ("Geck-core") actúa como el núcleo orquestador de múltiples servicios, delegando responsabilidades lógicas en módulos independientes que van desde la gestión de identidades hasta la ejecución de código.

## Arquitectura y Ecosistema
El sistema está construido bajo una arquitectura modular, separando los dominios clave de la aplicación:

* **Entorno y Workspaces:** Simula la experiencia de un escritorio o entorno de trabajo, permitiendo la creación y administración de *workspaces* (`/api/workspaces`) y tableros de control (`/api/dashboard`).
* **Sistema de Archivos (Items):** Emula la gestión de archivos y directorios locales (`/api/items`). Se apoya en el manejo de archivos temporales de forma nativa en el servidor y delega el almacenamiento en la nube a través de Cloudinary.
* **Mensajería y Comunicaciones:** Soporte robusto para chat y mensajería en tiempo real (`/api/chat`), impulsado por Socket.io.
* **Ejecución y Procesos:** Capacidad para procesar y ejecutar código remoto (`/api/execute`), complementado con la ejecución de tareas programadas en segundo plano (cron jobs).
* **Integración de Inteligencia Artificial:** Módulo dedicado a la comunicación y servicios gestionados por IA (`/api/ai`).
* **Seguridad y Usuarios:** Gestión completa del ciclo de vida de los usuarios (`/api/users`), con autenticación protegida (`/api/auth`) mediante JSON Web Tokens (JWT) y encriptación de contraseñas con bcrypt.

## Stack Tecnológico Principal
* **Core:** Node.js con el framework Express.
* **Base de Datos:** MongoDB (modelado a través de Mongoose).
* **Tiempo Real:** Socket.io.
* **Almacenamiento Multimedia:** Cloudinary.
* **Notificaciones:** Envío de correos mediante Nodemailer.
* **Testing:** Entorno de pruebas configurado con Jest y Supertest.

## Documentación y Guías de Uso
Para entender a profundidad la integración de esta API, los flujos de datos y la documentación correspondiente al Anexo III, por favor consulta nuestra guía principal:

* **Guía en YouTube:** [Ver video guia de Backend](https://youtu.be/Szdz4m-vujY?si=Kou8Fh_GKLwUXtFx)
* **Documentación de API en Postman:** [Ver colección de Endpoints](https://documenter.getpostman.com/view/49837760/2sBXwsKpBh)

---
**Configuración Inicial:** Asegúrate de configurar correctamente tu archivo `.env` en la raíz del proyecto para conectar los servicios de Cloudinary (API Key, Secret, Cloud Name), la base de datos y los secretos de JWT antes de levantar el servidor.