-- ==============================================================================
-- RenewRadar - Demo Seed Data
-- Matches the live demo account with realistic sample domains, hosting plans,
-- clients, providers, and upcoming expiries for testing Telegram alerts.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Demo Administrator User (username: admin, default demo user id: 1)
INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2b$10$YourHashedOrDemoPasswordPlaceholder', 'admin')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 2. Seed Platforms & Providers
INSERT INTO `platforms` (`id`, `user_id`, `name`, `type`, `website`, `account_identifier`, `notes`) VALUES
(1, 1, 'Namecheap Account 1', 'both', 'https://namecheap.com', 'account1@agency.com', 'Primary Namecheap account for client domains & hosting'),
(2, 1, 'Namecheap Account 2', 'both', 'https://namecheap.com', 'account2@agency.com', 'Secondary Namecheap account for e-commerce portals'),
(3, 1, 'Hostinger', 'both', 'https://hostinger.com', 'admin@hostinger.com', 'Hostinger cloud & cPanel shared hosting'),
(4, 1, 'HostGator', 'both', 'https://hostgator.com', '', 'HostGator baby/business packages'),
(5, 1, 'GoDaddy', 'registrar', 'https://godaddy.com', '', 'Legacy domain registrar account')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Seed Clients
INSERT INTO `clients` (`id`, `user_id`, `name`, `company`, `phone`, `email`, `notes`) VALUES
(1, 1, 'Tanvir Ahmed', 'Skyline Agency', '+8801711223344', 'tanvir@skyline.com', 'Domain & Hosting Combo client'),
(2, 1, 'Sarah Rahman', 'Apex Fashion Ltd', '+8801819876543', 'sarah@apexfashion.com', 'Always renews early'),
(3, 1, 'Kamrul Hasan', 'FinTech Soft', '+8801912345678', 'kamrul@fintechsoft.net', 'Needs reminder 15 days ahead'),
(4, 1, 'Rashidul Islam', 'Dhaka Cart Ecom', '+8801678901234', 'info@dhakacart.com', 'Call directly on mobile')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Seed Domains (Includes upcoming 5-day expiry for alert testing)
INSERT INTO `domains` (`id`, `user_id`, `client_id`, `linked_hosting_id`, `is_bundle`, `domain_name`, `registrar`, `account_label`, `registration_date`, `expiry_date`, `auto_renew`, `cost_price`, `client_price`, `status`, `notes`) VALUES
(1, 1, 1, 1, 1, 'skylineagency.com', 'Namecheap', 'Namecheap Account 1', '2025-11-01', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 0, 13.99, 25.00, 'expiring_soon', 'Combo bundle with 20GB Pro Hosting'),
(2, 1, 2, NULL, 0, 'apexfashionbd.com', 'Namecheap', 'Namecheap Account 2', '2025-05-15', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 0, 14.50, 28.00, 'expiring_soon', 'Client requested invoice'),
(3, 1, 3, NULL, 0, 'fintechsoft.net', 'Hostinger', 'Hostinger', '2025-10-20', DATE_ADD(CURDATE(), INTERVAL 28 DAY), 0, 16.00, 30.00, 'active', 'Purchased from Hostinger'),
(4, 1, 4, 3, 1, 'dhakacart.com', 'Namecheap', 'Namecheap Account 2', '2024-10-10', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 13.99, 25.00, 'expired', 'Expired 2 days ago! Recovery grace period active'),
(5, 1, 1, NULL, 0, 'skyline-portfolio.org', 'Namecheap', 'Namecheap Account 1', '2026-01-10', DATE_ADD(CURDATE(), INTERVAL 180 DAY), 1, 12.00, 22.00, 'active', 'Auto renew enabled')
ON DUPLICATE KEY UPDATE `domain_name` = VALUES(`domain_name`);

-- 5. Seed Hosting Plans (Linked bundles matching domains)
INSERT INTO `hostings` (`id`, `user_id`, `client_id`, `linked_domain_id`, `is_bundle`, `package_name`, `provider`, `server_name`, `ip_address`, `primary_domain`, `start_date`, `expiry_date`, `billing_cycle`, `cost_price`, `client_price`, `status`, `notes`) VALUES
(1, 1, 1, 1, 1, '20GB Pro cPanel Package', 'Namecheap', 'Cloud Server 1', '192.0.2.1', 'skylineagency.com', '2025-11-01', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'annual', 45.00, 90.00, 'expiring_soon', 'Combo bundle with skylineagency.com'),
(2, 1, 2, NULL, 0, '10GB Business cPanel', 'Hostinger', 'Cloud Server 2', '192.0.2.2', 'apexfashionbd.com', '2025-05-15', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'annual', 30.00, 65.00, 'expiring_soon', 'Hostinger Cloud cPanel'),
(3, 1, 4, 4, 1, '5GB Starter cPanel', 'Namecheap', 'Cloud Server 1', '192.0.2.1', 'dhakacart.com', '2024-10-10', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'annual', 20.00, 45.00, 'expired', 'Combo bundle with dhakacart.com')
ON DUPLICATE KEY UPDATE `package_name` = VALUES(`package_name`);

-- 6. Initial Application Settings
INSERT INTO `app_settings` (`user_id`, `setting_key`, `setting_value`) VALUES
(1, 'alert_days', '30,15,7,3,1,0'),
(1, 'cron_time', '09:00'),
(1, 'currency', 'USD')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

SET FOREIGN_KEY_CHECKS = 1;
