-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS tesis_db;
USE tesis_db;

-- Tabla de Roles (admin, docente, alumno)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Preguntas e Historial (Relacionado al Alumno)
CREATE TABLE IF NOT EXISTS preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_id INT NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    fuentes TEXT NOT NULL, -- Guardado como texto (JSON stringificado o lista delimitada)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sembrar los roles por defecto
INSERT INTO roles (id, nombre) VALUES 
(1, 'admin'),
(2, 'docente'),
(3, 'alumno')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Sembrar usuarios de prueba con contraseñas seguras cifradas con bcrypt
-- admin123 -> $2b$10$Kw0cg2AvH5xykEv.1IJbQO34.fqUlL9yBpy1eNrC.DAPkPhd2OXHm
-- docente123 -> $2b$10$SrsIZAZbfypvITric8RH9uWgbPBWVcpt0qOcspFbJeq97IhZaH8g2
-- alumno123 -> $2b$10$qiF6RqdLL76WrF.aHtQqRerLGnnRkECirPpRoF2g7xhE3Koq378GK
INSERT INTO usuarios (id, nombre, email, password_hash, role_id) VALUES
(1, 'Administrador', 'admin@tesis.com', '$2b$10$Kw0cg2AvH5xykEv.1IJbQO34.fqUlL9yBpy1eNrC.DAPkPhd2OXHm', 1),
(2, 'Docente de Prueba', 'docente@tesis.com', '$2b$10$SrsIZAZbfypvITric8RH9uWgbPBWVcpt0qOcspFbJeq97IhZaH8g2', 2),
(3, 'Alumno de Prueba', 'alumno@tesis.com', '$2b$10$qiF6RqdLL76WrF.aHtQqRerLGnnRkECirPpRoF2g7xhE3Koq378GK', 3)
ON DUPLICATE KEY UPDATE email=VALUES(email), password_hash=VALUES(password_hash), nombre=VALUES(nombre), role_id=VALUES(role_id);
