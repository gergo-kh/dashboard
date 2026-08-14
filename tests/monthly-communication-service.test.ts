import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { CurrentUser, UserProfile } from "@/lib/auth/session";
import {
  monthlyReviewApprovalSchema,
  monthlyReviewDraftSchema,
  type MonthlyReviewDraftInput
} from "@/lib/monthly-communication/schemas";
import {
  approveMonthlyReview,
  publishMonthlyReview,
  saveMonthlyReviewDraft,
  submitMonthlyReviewForReview
} from "@/lib/monthly-communication/service";
import type {
  MonthlyCommunicationRepository,
  MonthlyReviewDraftWrite,
  MonthlyReviewRecord,
  MonthlyReviewStatusUpdate
} from "@/lib/monthly-communication/types";
import { MonthlyCommunicationError } from "@/lib/monthly-communication/types";

const agencyProfile = {
  id: "219ab6cd-06b4-423c-a560-af2c05198f0f",
  full_name: "Agency Admin",
  email: "agency@example.invalid",
  avatar_url: null,
  role: "agency_admin",
  client_id: null,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z"
} satisfies UserProfile;

const clientProfile = {
  ...agencyProfile,
  id: "1e0957db-1b2b-4803-888e-c3e6d5b26d3c",
  full_name: "Client User",
  email: "client@example.invalid",
  role: "client_user",
  client_id: "90000000-0000-4000-8000-000000000001"
} satisfies UserProfile;

const authUser = {
  id: agencyProfile.id,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-08-01T00:00:00Z"
} satisfies User;

const agencyUser = {
  authUser,
  profile: agencyProfile,
  projects: []
} satisfies CurrentUser;

const clientUser = {
  authUser: {
    ...authUser,
    id: clientProfile.id
  },
  profile: clientProfile,
  projects: []
} satisfies CurrentUser;

const baseDraft: MonthlyReviewDraftInput = {
  projectId: "90000000-0000-4000-8000-000000000011",
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  summaryDraft: "A hónap fő tanulsága és a következő lépés röviden.",
  outcomeType: "mixed",
  outcomeItems: [
    {
      label: "ROAS",
      value: "+12%",
      state: "positive"
    },
    {
      label: "CPA",
      value: "+8%",
      state: "negative",
      explanation: "A kreatívfáradás emelte a költséget."
    }
  ],
  correctiveActions: ["Új kreatívteszt indul a következő héten."],
  nextMonthPlan: [
    {
      title: "Shopping fókusz",
      detail: "A fő termékkategóriák licitstruktúráját finomítjuk."
    }
  ]
};

function createReview(
  overrides: Partial<MonthlyReviewRecord> = {}
): MonthlyReviewRecord {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    project_id: baseDraft.projectId,
    period_start: baseDraft.periodStart,
    period_end: baseDraft.periodEnd,
    summary_draft: baseDraft.summaryDraft,
    summary_approved: null,
    outcome_type: "mixed",
    outcome_items: baseDraft.outcomeItems,
    corrective_actions: baseDraft.correctiveActions,
    next_month_plan: baseDraft.nextMonthPlan,
    status: "draft",
    approved_by: null,
    approved_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides
  };
}

function createRepository(initialReview: MonthlyReviewRecord | null = null) {
  const state = {
    review: initialReview,
    savedDrafts: [] as MonthlyReviewDraftWrite[],
    statusUpdates: [] as MonthlyReviewStatusUpdate[]
  };

  const repository: MonthlyCommunicationRepository = {
    async findMonthlyReviewByProjectPeriod({ projectId, periodStart, periodEnd }) {
      if (
        state.review?.project_id === projectId &&
        state.review.period_start === periodStart &&
        state.review.period_end === periodEnd
      ) {
        return state.review;
      }

      return null;
    },
    async findMonthlyReviewById(reviewId) {
      return state.review?.id === reviewId ? state.review : null;
    },
    async upsertMonthlyReviewDraft(input) {
      state.savedDrafts.push(input);
      state.review = createReview({
        project_id: input.project_id,
        period_start: input.period_start,
        period_end: input.period_end,
        summary_draft: input.summary_draft,
        summary_approved: input.summary_approved,
        outcome_type: input.outcome_type,
        outcome_items: input.outcome_items,
        corrective_actions: input.corrective_actions,
        next_month_plan: input.next_month_plan,
        status: input.status,
        approved_by: input.approved_by,
        approved_at: input.approved_at
      });

      return state.review;
    },
    async updateMonthlyReviewStatus(input) {
      if (!state.review || state.review.id !== input.id) {
        throw new Error("Missing fake review");
      }

      state.statusUpdates.push(input);
      state.review = {
        ...state.review,
        status: input.status,
        summary_approved: input.summary_approved ?? state.review.summary_approved,
        approved_by:
          input.approved_by === undefined ? state.review.approved_by : input.approved_by,
        approved_at:
          input.approved_at === undefined ? state.review.approved_at : input.approved_at,
        updated_at: "2026-08-02T00:00:00Z"
      };

      return state.review;
    }
  };

  return { repository, state };
}

describe("monthly communication schemas", () => {
  it("accepts a valid monthly review draft", () => {
    expect(monthlyReviewDraftSchema.parse(baseDraft).summaryDraft).toBe(
      "A hónap fő tanulsága és a következő lépés röviden."
    );
  });

  it("requires corrective actions for focus outcomes", () => {
    const result = monthlyReviewDraftSchema.safeParse({
      ...baseDraft,
      outcomeType: "focus",
      correctiveActions: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative outcome items without explanation or corrective action", () => {
    const result = monthlyReviewDraftSchema.safeParse({
      ...baseDraft,
      outcomeItems: [
        {
          label: "CPA",
          value: "+8%",
          state: "negative"
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("normalizes approval input defaults", () => {
    const approval = monthlyReviewApprovalSchema.parse({
      reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      approvedSummary: "Jóváhagyott havi összefoglaló."
    });

    expect(approval.publishImmediately).toBe(false);
  });
});

describe("monthly communication service foundation", () => {
  it("allows agency admins to save a monthly review draft", async () => {
    const { repository, state } = createRepository();
    const savedReview = await saveMonthlyReviewDraft({
      currentUser: agencyUser,
      repository,
      draft: baseDraft
    });

    expect(savedReview.status).toBe("draft");
    expect(state.savedDrafts[0]?.summary_draft).toBe(baseDraft.summaryDraft);
    expect(state.savedDrafts[0]?.approved_by).toBeNull();
    expect(state.savedDrafts[0]?.approved_at).toBeNull();
  });

  it("rejects client users before saving monthly content", async () => {
    const { repository, state } = createRepository();

    await expect(
      saveMonthlyReviewDraft({
        currentUser: clientUser,
        repository,
        draft: baseDraft
      })
    ).rejects.toMatchObject({
      code: "permission_denied"
    });
    expect(state.savedDrafts).toHaveLength(0);
  });

  it("does not overwrite approved monthly reviews as drafts", async () => {
    const { repository } = createRepository(
      createReview({
        status: "approved",
        summary_approved: "Korábban jóváhagyott szöveg.",
        approved_by: agencyProfile.id,
        approved_at: "2026-08-02T08:00:00Z"
      })
    );

    await expect(
      saveMonthlyReviewDraft({
        currentUser: agencyUser,
        repository,
        draft: baseDraft
      })
    ).rejects.toMatchObject({
      code: "invalid_transition"
    });
  });

  it("submits draft reviews for approval without approving client-visible content", async () => {
    const { repository, state } = createRepository(createReview());
    const updatedReview = await submitMonthlyReviewForReview({
      currentUser: agencyUser,
      repository,
      transition: {
        reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      }
    });

    expect(updatedReview.status).toBe("review");
    expect(state.statusUpdates[0]).toMatchObject({
      status: "review",
      approved_by: null,
      approved_at: null
    });
  });

  it("approves review content with approver metadata", async () => {
    const { repository, state } = createRepository(
      createReview({
        status: "review"
      })
    );

    const updatedReview = await approveMonthlyReview({
      currentUser: agencyUser,
      repository,
      approval: {
        reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        approvedSummary: "Jóváhagyott havi összefoglaló.",
        publishImmediately: true
      },
      now: () => new Date("2026-08-03T09:30:00Z")
    });

    expect(updatedReview.status).toBe("published");
    expect(state.statusUpdates[0]).toMatchObject({
      status: "published",
      summary_approved: "Jóváhagyott havi összefoglaló.",
      approved_by: agencyProfile.id,
      approved_at: "2026-08-03T09:30:00.000Z"
    });
  });

  it("approves without publishing and records mandatory approval metadata", async () => {
    const { repository, state } = createRepository(
      createReview({
        status: "review"
      })
    );

    const updatedReview = await approveMonthlyReview({
      currentUser: agencyUser,
      repository,
      approval: {
        reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        approvedSummary: "Jóváhagyott, még nem publikált összefoglaló."
      },
      now: () => new Date("2026-08-04T10:15:00Z")
    });

    expect(updatedReview.status).toBe("approved");
    expect(state.statusUpdates[0]).toMatchObject({
      status: "approved",
      summary_approved: "Jóváhagyott, még nem publikált összefoglaló.",
      approved_by: agencyProfile.id,
      approved_at: "2026-08-04T10:15:00.000Z"
    });
  });

  it("rejects client users before approving monthly content", async () => {
    const { repository, state } = createRepository(createReview({ status: "review" }));

    await expect(
      approveMonthlyReview({
        currentUser: clientUser,
        repository,
        approval: {
          reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          approvedSummary: "Jóváhagyott havi összefoglaló."
        }
      })
    ).rejects.toMatchObject({
      code: "permission_denied"
    });
    expect(state.statusUpdates).toHaveLength(0);
  });

  it("requires focus reviews to include corrective actions before approval", async () => {
    const { repository } = createRepository(
      createReview({
        status: "review",
        outcome_type: "focus",
        corrective_actions: []
      })
    );

    await expect(
      approveMonthlyReview({
        currentUser: agencyUser,
        repository,
        approval: {
          reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          approvedSummary: "Jóváhagyott havi összefoglaló."
        }
      })
    ).rejects.toBeInstanceOf(MonthlyCommunicationError);
  });

  it("publishes only already approved monthly reviews", async () => {
    const { repository, state } = createRepository(
      createReview({
        status: "approved",
        summary_approved: "Jóváhagyott havi összefoglaló.",
        approved_by: agencyProfile.id,
        approved_at: "2026-08-03T09:30:00Z"
      })
    );

    const updatedReview = await publishMonthlyReview({
      currentUser: agencyUser,
      repository,
      transition: {
        reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      }
    });

    expect(updatedReview.status).toBe("published");
    expect(state.statusUpdates[0]).toEqual({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      status: "published"
    });
  });

  it("blocks publishing draft monthly reviews", async () => {
    const { repository } = createRepository(createReview());

    await expect(
      publishMonthlyReview({
        currentUser: agencyUser,
        repository,
        transition: {
          reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        }
      })
    ).rejects.toMatchObject({
      code: "invalid_transition"
    });
  });

  it("rejects client users before publishing monthly content", async () => {
    const { repository, state } = createRepository(
      createReview({
        status: "approved",
        summary_approved: "Jóváhagyott havi összefoglaló.",
        approved_by: agencyProfile.id,
        approved_at: "2026-08-03T09:30:00Z"
      })
    );

    await expect(
      publishMonthlyReview({
        currentUser: clientUser,
        repository,
        transition: {
          reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        }
      })
    ).rejects.toMatchObject({
      code: "permission_denied"
    });
    expect(state.statusUpdates).toHaveLength(0);
  });

  it("blocks publishing approved focus reviews without corrective actions", async () => {
    const { repository } = createRepository(
      createReview({
        status: "approved",
        summary_approved: "Jóváhagyott fókusz összefoglaló.",
        outcome_type: "focus",
        corrective_actions: [],
        approved_by: agencyProfile.id,
        approved_at: "2026-08-03T09:30:00Z"
      })
    );

    await expect(
      publishMonthlyReview({
        currentUser: agencyUser,
        repository,
        transition: {
          reviewId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        }
      })
    ).rejects.toMatchObject({
      code: "invalid_content"
    });
  });

  it("does not overwrite published monthly reviews as drafts", async () => {
    const { repository, state } = createRepository(
      createReview({
        status: "published",
        summary_approved: "Publikált történeti ügyfélszöveg.",
        approved_by: agencyProfile.id,
        approved_at: "2026-08-02T08:00:00Z"
      })
    );

    await expect(
      saveMonthlyReviewDraft({
        currentUser: agencyUser,
        repository,
        draft: baseDraft
      })
    ).rejects.toMatchObject({
      code: "invalid_transition"
    });
    expect(state.savedDrafts).toHaveLength(0);
  });
});
