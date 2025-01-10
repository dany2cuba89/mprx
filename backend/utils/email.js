const nodemailer = require("nodemailer");

// Configurar el cliente SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Enviar un correo electrónico.
 * @param {Object} opciones
 * @param {string} opciones.to - Dirección de correo del destinatario.
 * @param {string} opciones.subject - Asunto del correo.
 * @param {string} opciones.text - Texto plano del correo.
 * @param {string} [opciones.html] - Contenido HTML del correo (opcional).
 */
async function enviarCorreo(opciones) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: opciones.to,
            subject: opciones.subject,
            text: opciones.text,
            html: opciones.html || null, // Si no hay HTML, solo usa el texto plano
        });

        console.log("Correo enviado: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error al enviar correo:", error.message);
        throw new Error("No se pudo enviar el correo electrónico.");
    }
}

module.exports = { enviarCorreo };
