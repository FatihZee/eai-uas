-- Create all databases
CREATE DATABASE IF NOT EXISTS eai_user_service;
CREATE DATABASE IF NOT EXISTS eai_menu_service;
CREATE DATABASE IF NOT EXISTS eai_order_service;
CREATE DATABASE IF NOT EXISTS eai_review_service;
CREATE DATABASE IF NOT EXISTS eai_payment_service;

-- User Service Tables
USE eai_user_service;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample users
INSERT INTO `users` (`name`, `email`, `password`, `phone`) VALUES
('Admin User', 'admin@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567890'),
('John Doe', 'john@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567891'),
('Jane Smith', 'jane@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567892'),
('Bob Wilson', 'bob@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567893'),
('Alice Brown', 'alice@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567894'),
('Charlie Davis', 'charlie@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567895'),
('Diana Evans', 'diana@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567896'),
('Frank Miller', 'frank@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567897'),
('Grace Johnson', 'grace@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567898'),
('Henry Lee', 'henry@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '081234567899'),
('Fatih Fikry Oktavianto', 'fatih@example.com', '$2a$10$krH5lrMrKi5NBd6jKMDI1eIcm/wEJibBuvJaQJDlghvixnyhpIB1O', '085713309551');

-- Menu Service Tables
USE eai_menu_service;
CREATE TABLE IF NOT EXISTS `menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample menus
INSERT INTO `menus` (`name`, `description`, `price`, `user_id`) VALUES
('Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 25000.00, 1),
('Ayam Bakar Kecap', 'Ayam bakar dengan bumbu kecap manis dan lalapan', 30000.00, 1),
('Mie Ayam Bakso', 'Mie ayam dengan bakso dan pangsit goreng', 20000.00, 1),
('Gado-Gado Jakarta', 'Gado-gado dengan bumbu kacang khas Jakarta', 18000.00, 1),
('Soto Ayam Lamongan', 'Soto ayam dengan kuah bening dan telur', 22000.00, 1),
('Rendang Daging', 'Rendang daging sapi dengan bumbu rempah', 35000.00, 1),
('Ikan Bakar Sambal', 'Ikan bakar dengan sambal terasi pedas', 28000.00, 1),
('Capcay Seafood', 'Capcay dengan seafood segar dan sayuran', 26000.00, 1),
('Bakmi Jawa', 'Bakmi jawa dengan ayam dan sayuran', 19000.00, 1),
('Gudeg Yogya', 'Gudeg khas Yogyakarta dengan ayam dan telur', 24000.00, 1),
('Es Teh Manis', 'Es teh manis segar', 5000.00, 1),
('Es Jeruk', 'Es jeruk peras segar', 8000.00, 1),
('Jus Alpukat', 'Jus alpukat dengan susu kental manis', 12000.00, 1),
('Kopi Hitam', 'Kopi hitam tubruk tradisional', 6000.00, 1),
('Es Campur', 'Es campur dengan berbagai topping', 15000.00, 1);

-- Order Service Tables
USE eai_order_service;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_id` int NOT NULL,
  `quantity` int NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample orders
INSERT INTO `orders` (`user_id`, `menu_id`, `quantity`, `total_price`) VALUES
(2, 1, 2, 50000.00),  -- John orders 2 Nasi Goreng Spesial
(2, 11, 2, 10000.00), -- John orders 2 Es Teh Manis
(3, 2, 1, 30000.00),  -- Jane orders 1 Ayam Bakar Kecap
(3, 12, 1, 8000.00),  -- Jane orders 1 Es Jeruk
(4, 3, 3, 60000.00),  -- Bob orders 3 Mie Ayam Bakso
(4, 13, 2, 24000.00), -- Bob orders 2 Jus Alpukat
(5, 4, 1, 18000.00),  -- Alice orders 1 Gado-Gado Jakarta
(5, 5, 1, 22000.00),  -- Alice orders 1 Soto Ayam Lamongan
(6, 6, 2, 70000.00),  -- Charlie orders 2 Rendang Daging
(6, 14, 1, 6000.00),  -- Charlie orders 1 Kopi Hitam
(7, 7, 1, 28000.00),  -- Diana orders 1 Ikan Bakar Sambal
(7, 15, 1, 15000.00), -- Diana orders 1 Es Campur
(8, 8, 2, 52000.00),  -- Frank orders 2 Capcay Seafood
(8, 11, 3, 15000.00), -- Frank orders 3 Es Teh Manis
(9, 9, 1, 19000.00),  -- Grace orders 1 Bakmi Jawa
(9, 10, 1, 24000.00), -- Grace orders 1 Gudeg Yogya
(10, 1, 1, 25000.00), -- Henry orders 1 Nasi Goreng Spesial
(10, 2, 1, 30000.00), -- Henry orders 1 Ayam Bakar Kecap
(2, 6, 1, 35000.00),  -- John orders 1 Rendang Daging
(3, 9, 2, 38000.00);  -- Jane orders 2 Bakmi Jawa

-- Review Service Tables
USE eai_review_service;
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_id` int NOT NULL,
  `order_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `sentiment` VARCHAR(50),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `menu_id` (`menu_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample reviews
INSERT INTO `reviews` (`user_id`, `menu_id`, `order_id`, `rating`, `comment`, `sentiment`) VALUES
(2, 1, 1, 5, 'Nasi goreng nya enak banget! Porsi besar dan bumbu nya pas.', 'positive'),
(2, 11, 2, 4, 'Es teh manis nya segar, tapi agak terlalu manis.', 'positive'),
(3, 2, 3, 5, 'Ayam bakar nya juara! Bumbu kecap nya meresap sempurna.', 'positive'),
(3, 12, 4, 5, 'Es jeruk nya segar banget, cocok untuk cuaca panas.', 'positive'),
(4, 3, 5, 4, 'Mie ayam bakso nya enak, cuma bakso nya agak keras.', 'neutral'),
(4, 13, 6, 5, 'Jus alpukat nya creamy dan manis, sangat recommended!', 'positive'),
(5, 4, 7, 3, 'Gado-gado nya biasa aja, bumbu kacang kurang gurih.', 'neutral'),
(5, 5, 8, 4, 'Soto ayam nya enak, kuah nya bening dan segar.', 'positive'),
(6, 6, 9, 5, 'Rendang nya mantap! Daging nya empuk dan bumbu nya rich.', 'positive'),
(6, 14, 10, 4, 'Kopi hitam nya strong, pas untuk pagi hari.', 'positive'),
(7, 7, 11, 4, 'Ikan bakar nya fresh, sambal nya pedas pas.', 'positive'),
(7, 15, 12, 5, 'Es campur nya lengkap, banyak topping nya.', 'positive'),
(8, 8, 13, 3, 'Capcay seafood nya agak hambar, perlu ditambah garam.', 'neutral'),
(8, 11, 14, 4, 'Es teh manis standar, tidak terlalu istimewa.', 'neutral'),
(9, 9, 15, 5, 'Bakmi jawa nya authentic, bumbu nya pas banget!', 'positive'),
(9, 10, 16, 4, 'Gudeg nya manis dan gurih, cocok dengan selera saya.', 'positive'),
(10, 1, 17, 4, 'Nasi goreng nya konsisten enak, always good choice.', 'positive'),
(10, 2, 18, 3, 'Ayam bakar kali ini agak gosong, kurang perfect.', 'neutral'),
(2, 6, 19, 5, 'Rendang nya the best! Worth the price definitely.', 'positive'),
(3, 9, 20, 4, 'Bakmi jawa nya enak, porsi nya juga cukup besar.', 'positive');

-- Payment Service Tables
USE eai_payment_service;
CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `order_id` INT NOT NULL,
    `midtrans_order_id` VARCHAR(50) NOT NULL UNIQUE,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` VARCHAR(50),
    `status` ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
    `snap_token` TEXT,
    `redirect_url` TEXT,
    `transaction_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `transaction_id` VARCHAR(100),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample payments
INSERT INTO `payments` (`user_id`, `order_id`, `midtrans_order_id`, `amount`, `payment_method`, `status`, `transaction_id`) VALUES
(2, 1, 'ORDER-20241209-001', 60000.00, 'gopay', 'paid', 'TXN-20241209-001'),
(3, 3, 'ORDER-20241209-002', 38000.00, 'bank_transfer', 'paid', 'TXN-20241209-002'),
(4, 5, 'ORDER-20241209-003', 84000.00, 'credit_card', 'paid', 'TXN-20241209-003'),
(5, 7, 'ORDER-20241209-004', 40000.00, 'qris', 'paid', 'TXN-20241209-004'),
(6, 9, 'ORDER-20241209-005', 76000.00, 'gopay', 'paid', 'TXN-20241209-005'),
(7, 11, 'ORDER-20241209-006', 43000.00, 'ovo', 'paid', 'TXN-20241209-006'),
(8, 13, 'ORDER-20241209-007', 67000.00, 'dana', 'paid', 'TXN-20241209-007'),
(9, 15, 'ORDER-20241209-008', 43000.00, 'bank_transfer', 'paid', 'TXN-20241209-008'),
(10, 17, 'ORDER-20241209-009', 55000.00, 'credit_card', 'paid', 'TXN-20241209-009'),
(2, 19, 'ORDER-20241209-010', 35000.00, 'qris', 'pending', NULL),
(3, 20, 'ORDER-20241209-011', 38000.00, 'gopay', 'pending', NULL),
(4, 3, 'ORDER-20241209-012', 20000.00, 'ovo', 'failed', NULL),
(5, 4, 'ORDER-20241209-013', 18000.00, 'dana', 'cancelled', NULL);