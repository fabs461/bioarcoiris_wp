-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS bio_arcoiris;
USE bio_arcoiris;

-- Tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2b$10$1oJydkRO57sWuJmtLFGDf.8o8lA.UmpqzKblg3ZbJUrkrDeP6XXye');

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    size VARCHAR(5) NOT NULL,
    color VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    stock INT DEFAULT 0,
    image_url VARCHAR(255),
    category VARCHAR(50) DEFAULT 'accesorios',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);