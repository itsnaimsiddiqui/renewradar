-- ==============================================================================
-- RenewRadar - Complete MariaDB / MySQL Database Schema
-- Version: 1.0.0
-- Compatible with MariaDB 10.4+ / 11.x and MySQL 8.0+
-- Creates all tables from scratch with primary keys, foreign keys, and indexes.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table (Authentication & Access Control)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Platforms Table (Registrars & Hosting Providers)
CREATE TABLE IF NOT EXISTS `platforms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL DEFAULT 1,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('registrar', 'hosting', 'both') NOT NULL DEFAULT 'both',
  `website` VARCHAR(255) DEFAULT NULL,
  `account_identifier` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_platforms_user` (`user_id`),
  INDEX `idx_platforms_name` (`name`),
  CONSTRAINT `fk_platforms_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `company` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_clients_user` (`user_id`),
  INDEX `idx_clients_phone` (`phone`),
  INDEX `idx_clients_name` (`name`),
  CONSTRAINT `fk_clients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Domains Table (with Bundle & Expiry Tracking)
CREATE TABLE IF NOT EXISTS `domains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL DEFAULT 1,
  `client_id` INT DEFAULT NULL,
  `linked_hosting_id` INT DEFAULT NULL,
  `is_bundle` TINYINT(1) DEFAULT 0,
  `domain_name` VARCHAR(255) NOT NULL,
  `registrar` VARCHAR(100) NOT NULL DEFAULT 'Namecheap',
  `account_label` VARCHAR(100) DEFAULT 'Namecheap Account 1',
  `registration_date` DATE DEFAULT NULL,
  `expiry_date` DATE NOT NULL,
  `auto_renew` TINYINT(1) DEFAULT 0,
  `cost_price` DECIMAL(10,2) DEFAULT 0.00,
  `client_price` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('active', 'expiring_soon', 'expired', 'transferred', 'cancelled') NOT NULL DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `last_notified_tier` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_domains_user` (`user_id`),
  INDEX `idx_domains_client` (`client_id`),
  INDEX `idx_domains_expiry` (`expiry_date`),
  INDEX `idx_domains_provider` (`registrar`),
  INDEX `idx_domains_account` (`account_label`),
  INDEX `idx_domains_status` (`status`),
  CONSTRAINT `fk_domains_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_domains_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Hostings Table (with Server, IP & Bundle Tracking)
CREATE TABLE IF NOT EXISTS `hostings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL DEFAULT 1,
  `client_id` INT DEFAULT NULL,
  `linked_domain_id` INT DEFAULT NULL,
  `is_bundle` TINYINT(1) DEFAULT 0,
  `package_name` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(100) NOT NULL DEFAULT 'Namecheap',
  `server_name` VARCHAR(100) DEFAULT 'Cloud Server 1',
  `ip_address` VARCHAR(50) DEFAULT '192.0.2.1',
  `primary_domain` VARCHAR(255) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `expiry_date` DATE NOT NULL,
  `billing_cycle` ENUM('monthly', 'quarterly', 'semi_annual', 'annual', 'biennial') NOT NULL DEFAULT 'annual',
  `cost_price` DECIMAL(10,2) DEFAULT 0.00,
  `client_price` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('active', 'expiring_soon', 'expired', 'suspended', 'cancelled') NOT NULL DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `last_notified_tier` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hostings_user` (`user_id`),
  INDEX `idx_hostings_client` (`client_id`),
  INDEX `idx_hostings_expiry` (`expiry_date`),
  INDEX `idx_hostings_provider` (`provider`),
  INDEX `idx_hostings_status` (`status`),
  CONSTRAINT `fk_hostings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hostings_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Notification Logs Table
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL DEFAULT 1,
  `type` ENUM('domain', 'hosting', 'bundle', 'manual', 'system') NOT NULL,
  `reference_id` INT DEFAULT NULL,
  `item_title` VARCHAR(255) NOT NULL,
  `days_remaining` INT NOT NULL,
  `message` TEXT NOT NULL,
  `telegram_chat_id` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`),
  INDEX `idx_notif_created` (`created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Application & Alert Settings Table
CREATE TABLE IF NOT EXISTS `app_settings` (
  `user_id` INT NOT NULL DEFAULT 1,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `setting_key`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
