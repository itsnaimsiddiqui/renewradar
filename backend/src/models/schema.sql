-- RenewRadar - MariaDB 11.4 / MySQL 8.0+ Schema
-- Compatible with cPanel MariaDB / MySQL 8.0+ / Cloud DB

-- Note for cPanel: Create the database (e.g. renewradar_db) from cPanel MySQL Databases first,
-- then select it in phpMyAdmin and run the tables below.
-- (Uncomment the 2 lines below only if running on a local dedicated MariaDB server as root):
-- CREATE DATABASE IF NOT EXISTS `renewradar_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `renewradar_db`;

-- 1. Platforms & Providers Table (Namecheap, Hostinger, HostGator, etc.)
CREATE TABLE IF NOT EXISTS `platforms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `type` ENUM('registrar', 'hosting', 'both') DEFAULT 'both',
  `website` VARCHAR(255) DEFAULT NULL,
  `account_identifier` VARCHAR(255) DEFAULT NULL, -- email/username
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_platform_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_clients_phone` (`phone`),
  INDEX `idx_clients_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Domains Table (with Bundle support)
CREATE TABLE IF NOT EXISTS `domains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT DEFAULT NULL,
  `linked_hosting_id` INT DEFAULT NULL,
  `is_bundle` TINYINT(1) DEFAULT 0,
  `domain_name` VARCHAR(255) NOT NULL UNIQUE,
  `registrar` VARCHAR(100) DEFAULT 'Namecheap',
  `account_label` VARCHAR(100) DEFAULT 'Namecheap Account 1',
  `registration_date` DATE DEFAULT NULL,
  `expiry_date` DATE NOT NULL,
  `auto_renew` TINYINT(1) DEFAULT 0,
  `cost_price` DECIMAL(10,2) DEFAULT 0.00,
  `client_price` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('active', 'expiring_soon', 'expired', 'transferred', 'cancelled') DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `last_notified_tier` INT DEFAULT NULL, -- 30, 15, 7, 3, 1, 0
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_domains_expiry` (`expiry_date`),
  INDEX `idx_domains_account` (`account_label`),
  INDEX `idx_domains_status` (`status`),
  CONSTRAINT `fk_domains_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Hostings Table (with Bundle support)
CREATE TABLE IF NOT EXISTS `hostings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT DEFAULT NULL,
  `linked_domain_id` INT DEFAULT NULL,
  `is_bundle` TINYINT(1) DEFAULT 0,
  `package_name` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(100) DEFAULT 'Namecheap',
  `server_name` VARCHAR(100) DEFAULT 'Cloud Server 1',
  `ip_address` VARCHAR(50) DEFAULT '192.0.2.1',
  `primary_domain` VARCHAR(255) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `expiry_date` DATE NOT NULL,
  `billing_cycle` ENUM('monthly', 'quarterly', 'semi_annual', 'annual', 'biennial') DEFAULT 'annual',
  `cost_price` DECIMAL(10,2) DEFAULT 0.00,
  `client_price` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('active', 'expiring_soon', 'expired', 'suspended', 'cancelled') DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `last_notified_tier` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hostings_expiry` (`expiry_date`),
  INDEX `idx_hostings_status` (`status`),
  CONSTRAINT `fk_hostings_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Notification Logs Table
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('domain', 'hosting', 'bundle', 'manual', 'system') NOT NULL,
  `reference_id` INT DEFAULT NULL,
  `item_title` VARCHAR(255) NOT NULL,
  `days_remaining` INT NOT NULL,
  `message` TEXT NOT NULL,
  `telegram_chat_id` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('sent', 'failed') DEFAULT 'sent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. System Settings Table
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial Platforms (Customizable, Add/Edit/Delete supported)
INSERT INTO `platforms` (`id`, `name`, `type`, `website`, `account_identifier`, `notes`) VALUES
(1, 'Namecheap Account 1', 'both', 'https://namecheap.com', 'account1@agency.com', 'Primary Namecheap account for client domains & hosting'),
(2, 'Namecheap Account 2', 'both', 'https://namecheap.com', 'account2@agency.com', 'Secondary Namecheap account for e-commerce portals'),
(3, 'Hostinger', 'both', 'https://hostinger.com', 'admin@hostinger.com', 'Hostinger cloud & cPanel shared hosting'),
(4, 'HostGator', 'both', 'https://hostgator.com', '', 'HostGator baby/business packages'),
(5, 'GoDaddy', 'registrar', 'https://godaddy.com', '', 'Legacy domain registrar account');

-- Seed Clients
INSERT INTO `clients` (`id`, `name`, `company`, `phone`, `email`, `notes`) VALUES
(1, 'Tanvir Ahmed', 'Skyline Agency', '+8801711223344', 'tanvir@skyline.com', 'Domain & Hosting Combo client'),
(2, 'Sarah Rahman', 'Apex Fashion Ltd', '+8801819876543', 'sarah@apexfashion.com', 'Always renews early'),
(3, 'Kamrul Hasan', 'FinTech Soft', '+8801912345678', 'kamrul@fintechsoft.net', 'Needs reminder 15 days ahead'),
(4, 'Rashidul Islam', 'Dhaka Cart Ecom', '+8801678901234', 'info@dhakacart.com', 'Call directly on mobile');

-- Seed Domains (with linked hosting combo example)
INSERT INTO `domains` (`id`, `client_id`, `linked_hosting_id`, `is_bundle`, `domain_name`, `registrar`, `account_label`, `registration_date`, `expiry_date`, `auto_renew`, `cost_price`, `client_price`, `status`, `notes`) VALUES
(1, 1, 1, 1, 'skylineagency.com', 'Namecheap', 'Namecheap Account 1', '2025-11-01', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 0, 13.99, 25.00, 'expiring_soon', 'Combo bundle with 20GB Pro Hosting'),
(2, 2, NULL, 0, 'apexfashionbd.com', 'Namecheap', 'Namecheap Account 2', '2025-05-15', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 0, 14.50, 28.00, 'expiring_soon', 'Client requested invoice'),
(3, 3, NULL, 0, 'fintechsoft.net', 'Hostinger', 'Hostinger', '2025-10-20', DATE_ADD(CURDATE(), INTERVAL 28 DAY), 0, 16.00, 30.00, 'active', 'Purchased from Hostinger'),
(4, 4, 3, 1, 'dhakacart.com', 'Namecheap', 'Namecheap Account 2', '2024-10-10', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 13.99, 25.00, 'expired', 'Expired 2 days ago! Client needs recovery grace period'),
(5, 1, NULL, 0, 'skyline-portfolio.org', 'Namecheap', 'Namecheap Account 1', '2026-01-10', DATE_ADD(CURDATE(), INTERVAL 180 DAY), 1, 12.00, 22.00, 'active', 'Auto renew enabled');

-- Seed Hostings
INSERT INTO `hostings` (`id`, `client_id`, `linked_domain_id`, `is_bundle`, `package_name`, `provider`, `server_name`, `ip_address`, `primary_domain`, `start_date`, `expiry_date`, `billing_cycle`, `cost_price`, `client_price`, `status`, `notes`) VALUES
(1, 1, 1, 1, '20GB Pro cPanel Package', 'Namecheap', 'Cloud Server 1', '192.0.2.1', 'skylineagency.com', '2025-11-01', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'annual', 45.00, 90.00, 'expiring_soon', 'Combo bundle with skylineagency.com'),
(2, 2, NULL, 0, '10GB Business cPanel', 'Hostinger', 'Cloud Server 2', '192.0.2.2', 'apexfashionbd.com', '2025-05-15', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'annual', 30.00, 65.00, 'expiring_soon', 'Hostinger Cloud cPanel'),
(3, 4, 4, 1, '5GB Starter cPanel', 'Namecheap', 'Cloud Server 1', '192.0.2.1', 'dhakacart.com', '2024-10-10', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'annual', 20.00, 45.00, 'expired', 'Combo bundle with dhakacart.com');

INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES
('alert_days', '30,15,7,3,1,0'),
('cron_time', '09:00'),
('currency', 'USD');
