-- company_profiles テーブルを作成

-- company_name
-- contact_name
-- description
-- industry
-- wallet_address
-- logo_url
-- seeking_people
-- average_salary
-- average_age
-- strengths
-- benefits

create table company_profiles (
    id INT AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    industry VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255) NOT NULL,
    seeking_people TEXT NOT NULL,
    average_salary INT NOT NULL,
    average_age INT NOT NULL,
    strengths TEXT NOT NULL,
    benefits TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY (wallet_address)
);
