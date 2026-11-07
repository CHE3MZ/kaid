// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

export const SIDEBAR_VIEW_ID = 'kaid.sidebar';
export const COMMENT_CONTROLLER_ID = 'kaid-review';

export const COMMANDS = {
  reviewStart: 'kaid.review.start',
  reviewCancel: 'kaid.review.cancel',
  configOpen: 'kaid.config.open',
  commentApply: 'kaid.comment.apply',
  commentDiscard: 'kaid.comment.discard',
  commentFalsePositive: 'kaid.comment.falsePositive',
} as const;
