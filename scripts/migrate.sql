-- Migration: Add leagues, meet_templates, password_reset_tokens tables
-- and add leagueId columns to swim_clubs and users
-- Run against: u817378305_swim_team_db

-- 1. leagues table
CREATE TABLE IF NOT EXISTS `leagues` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `abbreviation` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. meet_templates table
CREATE TABLE IF NOT EXISTS `meet_templates` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `scope` ENUM('league', 'club') NOT NULL DEFAULT 'club',
  `leagueId` VARCHAR(255) NULL,
  `clubId` VARCHAR(255) NULL,
  `course` ENUM('SCY', 'SCM', 'LCM') NOT NULL DEFAULT 'SCY',
  `meetEvents` TEXT NOT NULL DEFAULT ('[]'),
  `availableEvents` TEXT NOT NULL DEFAULT ('[]'),
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. password_reset_tokens table
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` VARCHAR(255) NOT NULL,
  `userId` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_unique` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add leagueId to swim_clubs (if not exists)
ALTER TABLE `swim_clubs`
  ADD COLUMN IF NOT EXISTS `leagueId` VARCHAR(255) NULL;

-- 5. Add leagueId to users (if not exists)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `leagueId` VARCHAR(255) NULL;

-- 6. Update users.role ENUM to include leagueAdmin (if not already present)
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('coach', 'family', 'admin', 'leagueAdmin') NOT NULL;
