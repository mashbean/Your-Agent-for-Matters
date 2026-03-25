function normalizeQuietHours(quietHours = []) {
  return Array.isArray(quietHours) ? quietHours : [];
}

export function createRuntimeState() {
  return {
    last_article_at: null,
    last_moment_at: null,
    incidents: [],
    counters: {
      articles_published: 0,
      moments_posted: 0,
      comments_posted: 0,
      supports_sent: 0
    }
  };
}

export function createSchedulePolicy(policy = {}) {
  return {
    timezone: policy.timezone || "Asia/Taipei",
    article_cron: policy.article_cron || "0 8 * * *",
    moment_cron: policy.moment_cron || "0 */8 * * *",
    quiet_hours: normalizeQuietHours(policy.quiet_hours)
  };
}

export function computeNextExecutionPlan({ botSpec = {}, runtimeState = {}, schedule = {}, promptContext = {} }) {
  const actionPolicy = botSpec.action_policy || {};
  const nextActions = [];

  if (actionPolicy.publish_enabled) nextActions.push("write_next_article");
  if (actionPolicy.moment_enabled) nextActions.push("post_moment");
  if (actionPolicy.comment_enabled) nextActions.push("review_comment_candidates");
  if (actionPolicy.support_enabled) nextActions.push("review_support_candidates");

  return {
    bot_slug: botSpec.bot_slug || "unknown-bot",
    generated_at: new Date().toISOString(),
    next_actions: nextActions,
    policy: {
      timezone: schedule.timezone || "Asia/Taipei",
      quiet_hours: schedule.quiet_hours || []
    },
    runtime_state: runtimeState,
    prompt_sections: Array.isArray(promptContext.sections) ? promptContext.sections.map((section) => section.file) : []
  };
}
