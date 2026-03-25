import test from "node:test";
import assert from "node:assert/strict";
import { createRuntimeState, createSchedulePolicy, computeNextExecutionPlan } from "../packages/runtime/src/index.mjs";

test("autonomous plan respects bot slug and actions", () => {
  const plan = computeNextExecutionPlan({
    botSpec: {
      bot_slug: "sun-bot",
      persona_bundle_path: "bundle.json",
      action_policy: {
        publish_enabled: true,
        moment_enabled: true,
        comment_enabled: false,
        support_enabled: false
      }
    },
    runtimeState: createRuntimeState(),
    schedule: createSchedulePolicy({ quiet_hours: [] }),
    promptContext: { sections: [{ file: "constitution" }] }
  });
  assert.equal(plan.bot_slug, "sun-bot");
  assert.deepEqual(plan.next_actions, ["write_next_article", "post_moment"]);
});
