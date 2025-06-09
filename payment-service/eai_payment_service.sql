USE eai_payment_service;

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    midtrans_order_id VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
    snap_token TEXT,
    redirect_url TEXT,
    transaction_time DATETIME DEFAULT CURRENT_TIMESTAMP
);