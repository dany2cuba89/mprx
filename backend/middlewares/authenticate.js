const jwt = require("jsonwebtoken");

// Middleware para autenticar usuarios
function authenticate(rolesPermitidos = []) {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1]; // Obtener el token del header Authorization

        if (!token) {
            return res.status(401).json({ error: "Acceso no autorizado. Token no proporcionado." });
        }

        try {
            // Verificar y decodificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Si hay roles específicos, validar el rol del usuario
            if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(decoded.role)) {
                return res.status(403).json({ error: "Acceso denegado. Rol no autorizado." });
            }

            // Agregar los datos del usuario al objeto `req` para uso en rutas posteriores
            req.user = decoded;

            next(); // Continuar con la siguiente función
        } catch (error) {
            return res.status(401).json({ error: "Token inválido o expirado." });
        }
    };
}

module.exports = authenticate;
