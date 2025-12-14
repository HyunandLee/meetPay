create table student_profiles (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    grade VARCHAR(255) NOT NULL,
    skills TEXT,
    about TEXT,
    wallet_address VARCHAR(255) NOT NULL,
    icon_url VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY (wallet_address)
);