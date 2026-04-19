-- CreateTable
CREATE TABLE `students` (
    `roll_no` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `room_no` VARCHAR(10) NULL,
    `hostel_id` INTEGER NULL,
    `last_login` DATETIME(3) NULL,
    `otp` VARCHAR(6) NULL,
    `otp_expiry` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `students_phone_key`(`phone`),
    PRIMARY KEY (`roll_no`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostels` (
    `hostel_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`hostel_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `admin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admins_phone_key`(`phone`),
    PRIMARY KEY (`admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ecommerce_platforms` (
    `platform_id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`platform_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `package_id` VARCHAR(50) NOT NULL,
    `roll_no` VARCHAR(20) NOT NULL,
    `platform_id` VARCHAR(30) NULL,
    `status` ENUM('PENDING', 'COLLECTED', 'OVERDUE', 'RETURNING', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    `arrival_datetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pickup_deadline` DATETIME(3) NOT NULL,
    `delivered_at` DATETIME(3) NULL,
    `delivered_to` VARCHAR(20) NULL,
    `logged_by_admin` INTEGER NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`package_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friendships` (
    `friendship_id` INTEGER NOT NULL AUTO_INCREMENT,
    `requester_id` VARCHAR(20) NOT NULL,
    `receiver_id` VARCHAR(20) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `friendships_requester_id_receiver_id_key`(`requester_id`, `receiver_id`),
    PRIMARY KEY (`friendship_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pickup_auths` (
    `auth_id` INTEGER NOT NULL AUTO_INCREMENT,
    `package_id` VARCHAR(50) NOT NULL,
    `authorized_by` VARCHAR(20) NOT NULL,
    `authorized_to` VARCHAR(20) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'USED') NOT NULL DEFAULT 'PENDING',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`auth_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notif_id` INTEGER NOT NULL AUTO_INCREMENT,
    `roll_no` VARCHAR(20) NOT NULL,
    `package_id` VARCHAR(50) NULL,
    `type` ENUM('ARRIVAL', 'DEADLINE_WARNING', 'PICKUP_AUTHORIZED', 'PICKUP_CONFIRMED', 'FRIEND_REQUEST', 'RETURNING') NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`notif_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_groups` (
    `group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `hostel_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `roll_no` VARCHAR(20) NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `opt_in_community` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `group_members_group_id_roll_no_key`(`group_id`, `roll_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_hostel_id_fkey` FOREIGN KEY (`hostel_id`) REFERENCES `hostels`(`hostel_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_roll_no_fkey` FOREIGN KEY (`roll_no`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `ecommerce_platforms`(`platform_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_delivered_to_fkey` FOREIGN KEY (`delivered_to`) REFERENCES `students`(`roll_no`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_logged_by_admin_fkey` FOREIGN KEY (`logged_by_admin`) REFERENCES `admins`(`admin_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `friendships_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `friendships_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickup_auths` ADD CONSTRAINT `pickup_auths_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`package_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickup_auths` ADD CONSTRAINT `pickup_auths_authorized_by_fkey` FOREIGN KEY (`authorized_by`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickup_auths` ADD CONSTRAINT `pickup_auths_authorized_to_fkey` FOREIGN KEY (`authorized_to`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_roll_no_fkey` FOREIGN KEY (`roll_no`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`package_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `community_groups`(`group_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_roll_no_fkey` FOREIGN KEY (`roll_no`) REFERENCES `students`(`roll_no`) ON DELETE RESTRICT ON UPDATE CASCADE;
