-- GoFish 测试数据清理脚本（兼容版）
-- 目标：删除用户「溪边阿陈」、「路亚林子」、「夜钓老许」及其发布的钓点和帖子
-- 对应种子数据用户 ID：2, 3, 4
-- 执行方式：在 MySQL 客户端中逐条或整段执行（执行前建议先备份数据库）

-- ============================================================
-- 1. 删除这三个用户产生的关联行为数据
-- ============================================================

-- 1.1 浏览历史
DELETE FROM fc_browse_history
WHERE user_id IN (2, 3, 4)
   OR post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));

-- 1.2 用户关注关系（fc_user_follow 没有 user_id，只有 follower_id / following_id）
DELETE FROM fc_user_follow
WHERE follower_id IN (2, 3, 4)
   OR following_id IN (2, 3, 4);

-- 1.3 通知（发给这些人 / 由这些人触发）
DELETE FROM fc_notification
WHERE receiver_id IN (2, 3, 4)
   OR actor_id IN (2, 3, 4);

-- 1.4 钓点收藏（这些人收藏的钓点 / 这些人创建的钓点被别人收藏）
DELETE FROM fc_spot_favorite
WHERE user_id IN (2, 3, 4)
   OR spot_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4));

-- 1.5 钓点评价（这些人评价的钓点 / 这些人创建的钓点被别人评价）
DELETE FROM fc_spot_review
WHERE user_id IN (2, 3, 4)
   OR spot_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4));

-- 1.6 帖子点赞（这些人点的赞 / 这些人发布的帖子被别人点赞）
DELETE FROM fc_post_like
WHERE user_id IN (2, 3, 4)
   OR post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));

-- 1.7 评论（这些人发表的评论 / 这些人发布的帖子下的所有评论）
DELETE FROM fc_comment
WHERE user_id IN (2, 3, 4)
   OR post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));

-- 1.8 文件对象（这些人上传的文件记录）
DELETE FROM fc_file_object
WHERE user_id IN (2, 3, 4);

-- 1.9 举报（这些人发起的举报，或举报了这些人创建的钓点/帖子）
DELETE FROM fc_report
WHERE reporter_id IN (2, 3, 4)
   OR (target_type = 'SPOT' AND target_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4)))
   OR (target_type = 'POST' AND target_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4)));

-- ============================================================
-- 2. 删除这些用户发布的帖子及其子表数据
-- ============================================================

DELETE FROM fc_post_tag
WHERE post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));

DELETE FROM fc_post_image
WHERE post_id IN (SELECT id FROM fc_post WHERE user_id IN (2, 3, 4));

DELETE FROM fc_post
WHERE user_id IN (2, 3, 4);

-- ============================================================
-- 3. 删除这些用户创建的钓点及其子表数据
-- ============================================================

DELETE FROM fc_spot_fish_species
WHERE spot_id IN (SELECT id FROM fc_fishing_spot WHERE creator_id IN (2, 3, 4));

DELETE FROM fc_fishing_spot
WHERE creator_id IN (2, 3, 4);

-- ============================================================
-- 4. 删除这三个用户本身
-- ============================================================

DELETE FROM fc_user
WHERE id IN (2, 3, 4);

-- ============================================================
-- 5. 刷新计数器（确保数据一致性）
-- ============================================================

-- 刷新用户发帖数
UPDATE fc_user u
SET post_count = (
    SELECT COUNT(1)
    FROM fc_post p
    WHERE p.user_id = u.id AND p.deleted = 0
),
updated_at = UTC_TIMESTAMP(3);

-- 刷新用户收获的赞数（点赞自己发布帖子的总数）
UPDATE fc_user u
SET liked_count = (
    SELECT COALESCE(SUM(p.like_count), 0)
    FROM fc_post p
    WHERE p.user_id = u.id AND p.deleted = 0
),
updated_at = UTC_TIMESTAMP(3);

-- 刷新用户关注/粉丝数
UPDATE fc_user u
SET following_count = (
    SELECT COUNT(1) FROM fc_user_follow f WHERE f.follower_id = u.id
),
    follower_count = (
    SELECT COUNT(1) FROM fc_user_follow f WHERE f.following_id = u.id
),
updated_at = UTC_TIMESTAMP(3);

-- 刷新钓点帖子数
UPDATE fc_fishing_spot s
SET post_count = (
    SELECT COUNT(1)
    FROM fc_post p
    WHERE p.spot_id = s.id
      AND p.deleted = 0
      AND p.status = 'PUBLISHED'
      AND p.visibility = 'PUBLIC'
),
updated_at = UTC_TIMESTAMP(3);

-- 刷新帖子点赞/评论数
UPDATE fc_post p
SET like_count = (
    SELECT COUNT(1) FROM fc_post_like l WHERE l.post_id = p.id
),
    comment_count = (
    SELECT COUNT(1) FROM fc_comment c WHERE c.post_id = p.id AND c.deleted = 0
),
updated_at = UTC_TIMESTAMP(3);

-- 刷新钓点收藏数
UPDATE fc_fishing_spot s
SET favorite_count = (
    SELECT COUNT(1) FROM fc_spot_favorite f WHERE f.spot_id = s.id
),
updated_at = UTC_TIMESTAMP(3);

-- ============================================================
-- 执行后建议：
-- 1. 登录 MinIO 删除这些用户上传的真实图片文件（object_key 对应 bucket/fishing 下）
-- 2. 检查 fc_user 中是否还有测试用户，按需继续清理
-- ============================================================
