-- GoFish 测试数据清理脚本（v3 兼容版，去掉了 fc_browse_history）
-- 目标：删除用户「溪边阿陈」、「路亚林子」、「夜钓老许」及其发布的钓点和帖子
-- 对应种子数据用户 ID：2, 3, 4
-- 说明：如果 fc_browse_history 表不存在或没有 user_id 字段，请使用本版本
-- 执行方式：在 DBeaver 中选中所有 SQL 后按 Alt + X（Mac Option + X），或逐条执行

-- 1. 删除这三个用户产生的关联行为数据（已去掉 fc_browse_history）
DELETE FROM fc_user_follow WHERE follower_id IN (2, 3, 4) OR following_id IN (2, 3, 4);
DELETE FROM fc_notification WHERE receiver_id IN (2, 3, 4) OR actor_id IN (2, 3, 4);
DELETE FROM fc_spot_favorite WHERE user_id IN (2, 3, 4) OR spot_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4));
DELETE FROM fc_spot_review WHERE user_id IN (2, 3, 4) OR spot_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4));
DELETE FROM fc_post_like WHERE user_id IN (2, 3, 4) OR post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));
DELETE FROM fc_comment WHERE user_id IN (2, 3, 4) OR post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));
DELETE FROM fc_file_object WHERE user_id IN (2, 3, 4);
DELETE FROM fc_report WHERE reporter_id IN (2, 3, 4)
   OR (target_type = 'SPOT' AND target_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4)))
   OR (target_type = 'POST' AND target_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4)));

-- 2. 删除这些用户发布的帖子及其子表数据
DELETE FROM fc_post_tag WHERE post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));
DELETE FROM fc_post_image WHERE post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));
DELETE FROM fc_post WHERE user_id IN (2, 3, 4);

-- 3. 删除这些用户创建的钓点及其子表数据
DELETE FROM fc_spot_fish_species WHERE spot_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4));
DELETE FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4);

-- 4. 删除这三个用户本身
DELETE FROM fc_user WHERE id IN (2, 3, 4);

-- 5. 刷新计数器
UPDATE fc_user u SET post_count = (SELECT COUNT(1) FROM fc_post p WHERE p.user_id = u.id AND p.deleted = 0), updated_at = UTC_TIMESTAMP(3);
UPDATE fc_user u SET liked_count = (SELECT COALESCE(SUM(p.like_count), 0) FROM fc_post p WHERE p.user_id = u.id AND p.deleted = 0), updated_at = UTC_TIMESTAMP(3);
UPDATE fc_user u SET following_count = (SELECT COUNT(1) FROM fc_user_follow f WHERE f.follower_id = u.id), follower_count = (SELECT COUNT(1) FROM fc_user_follow f WHERE f.following_id = u.id), updated_at = UTC_TIMESTAMP(3);
UPDATE fc_fishing_spot s SET post_count = (SELECT COUNT(1) FROM fc_post p WHERE p.spot_id = s.id AND p.deleted = 0 AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC'), updated_at = UTC_TIMESTAMP(3);
UPDATE fc_post p SET like_count = (SELECT COUNT(1) FROM fc_post_like l WHERE l.post_id = p.id), comment_count = (SELECT COUNT(1) FROM fc_comment c WHERE c.post_id = p.id AND c.deleted = 0), updated_at = UTC_TIMESTAMP(3);
UPDATE fc_fishing_spot s SET favorite_count = (SELECT COUNT(1) FROM fc_spot_favorite f WHERE f.spot_id = s.id), updated_at = UTC_TIMESTAMP(3);
