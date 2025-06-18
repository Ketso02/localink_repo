CREATE DATABASE lendit;
USE lendit;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(100),
  email VARCHAR(100),
  role ENUM('customer', 'admin') DEFAULT 'customer'
);

CREATE TABLE items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100),
  color VARCHAR(50),
  description TEXT,
  price DECIMAL(10,2),
  available BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
