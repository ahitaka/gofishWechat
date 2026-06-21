import type { ReviewStatus, SpotOperationType, SpotVisibility } from "../models/index";

export const visibilityText: Record<SpotVisibility, string> = {
  PRIVATE: "私人",
  PUBLIC: "公开",
};

export const reviewStatusText: Record<ReviewStatus, string> = {
  NOT_SUBMITTED: "未发布",
  PENDING: "正在审核",
  APPROVED: "审核通过",
  REJECTED: "审核拒绝",
};

export const operationText: Record<SpotOperationType, string> = {
  CREATE: "新增钓点",
  UPDATE: "修改钓点",
  DELETE: "删除钓点",
};
