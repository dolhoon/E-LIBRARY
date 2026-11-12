CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(30) NOT NULL,
    institutional_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    book_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    cover_image VARCHAR(500),
    stock INT NOT NULL DEFAULT 0,
    availability_status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS borrowings (
    borrowing_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    admin_id INTEGER,
    borrow_date DATETIME,
    due_date DATETIME,
    return_date DATETIME,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(book_id),
    CONSTRAINT fk_borrow_admin FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);
