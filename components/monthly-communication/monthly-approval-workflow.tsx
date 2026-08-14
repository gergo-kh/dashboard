"use client";

import { useActionState } from "react";
import type { MonthlyReviewEditorActionState } from "@/app/(portal)/monthly-review-actions";
import type {
  MonthlyReviewApprovalWorkflowViewModel
} from "@/lib/monthly-communication/approval-workflow";

type MonthlyReviewWorkflowAction = (
  previousState: MonthlyReviewEditorActionState,
  formData: FormData
) => Promise<MonthlyReviewEditorActionState>;

type MonthlyApprovalWorkflowProps = Readonly<{
  workflow: MonthlyReviewApprovalWorkflowViewModel;
  approveAction: MonthlyReviewWorkflowAction;
  publishAction: MonthlyReviewWorkflowAction;
  initialState?: MonthlyReviewEditorActionState;
}>;

export function MonthlyApprovalWorkflow({
  workflow,
  approveAction,
  publishAction,
  initialState = {
    status: "idle",
    message: "",
    fieldErrors: {}
  }
}: MonthlyApprovalWorkflowProps) {
  const [approveState, approveFormAction, isApprovePending] = useActionState(
    approveAction,
    initialState
  );
  const [publishState, publishFormAction, isPublishPending] = useActionState(
    publishAction,
    initialState
  );
  const activeState = publishState.status !== "idle" ? publishState : approveState;
  const isPending = isApprovePending || isPublishPending;
  const approveErrorId = activeState.fieldErrors.approvedSummary
    ? "monthly-approval-approved-summary-error"
    : undefined;

  return (
    <section className="kh-card kh-monthly-workflow" aria-labelledby="monthly-approval-title">
      <div className="kh-card-header-row">
        <div className="kh-card-title-block">
          <p className="kh-section-kicker">Jóváhagyási workflow</p>
          <h2 id="monthly-approval-title">Havi összefoglaló jóváhagyása</h2>
          <p className="kh-muted-tight">{workflow.description}</p>
        </div>
        <div className="kh-workflow-status" aria-label="Havi összefoglaló állapota">
          <span>Állapot</span>
          <strong>{workflow.statusLabel}</strong>
        </div>
      </div>

      {activeState.message ? (
        <p
          className={`kh-alert ${
            activeState.status === "success" ? "kh-alert-success" : "kh-alert-error"
          }`}
          role={activeState.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {activeState.message}
        </p>
      ) : null}

      {workflow.approvedMetadataLabel ? (
        <p className="kh-workflow-note">{workflow.approvedMetadataLabel}</p>
      ) : null}

      {workflow.historyProtectionLabel ? (
        <p className="kh-workflow-note">{workflow.historyProtectionLabel}</p>
      ) : null}

      {workflow.state === "error" ? (
        <p className="kh-alert kh-alert-error" role="alert">
          {workflow.description}
        </p>
      ) : null}

      <div className="kh-workflow-grid">
        <form className="kh-editor-form" aria-busy={isPending}>
          <input type="hidden" name="reviewId" value={workflow.reviewId ?? ""} />
          <label className="kh-editor-field">
            <span>Jóváhagyott ügyfélszöveg</span>
            <textarea
              name="approvedSummary"
              defaultValue={workflow.approvedSummary}
              rows={5}
              aria-label="Jóváhagyott ügyfélszöveg"
              aria-describedby={approveErrorId}
              disabled={!workflow.canApprove || isPending}
              required
            />
            {activeState.fieldErrors.approvedSummary ? (
              <small className="kh-editor-error" id="monthly-approval-approved-summary-error">
                {activeState.fieldErrors.approvedSummary}
              </small>
            ) : null}
          </label>
          {workflow.approveDisabledReason ? (
            <p className="kh-disabled-reason" id="monthly-approve-disabled-reason">
              {workflow.approveDisabledReason}
            </p>
          ) : null}
          <button
            className="kh-button"
            type="submit"
            formAction={approveFormAction}
            disabled={!workflow.canApprove || isPending}
            aria-describedby={
              workflow.approveDisabledReason ? "monthly-approve-disabled-reason" : undefined
            }
          >
            {isApprovePending ? "Jóváhagyás folyamatban..." : "Jóváhagyás"}
          </button>
        </form>

        <form className="kh-workflow-publish-form" aria-busy={isPending}>
          <input type="hidden" name="reviewId" value={workflow.reviewId ?? ""} />
          <div>
            <h3>Publikálás az ügyfélportálra</h3>
            <p>
              Publikálás után a havi összefoglaló ügyféloldali tartalomként jelenhet meg.
            </p>
          </div>
          {workflow.publishDisabledReason ? (
            <p className="kh-disabled-reason" id="monthly-publish-disabled-reason">
              {workflow.publishDisabledReason}
            </p>
          ) : null}
          <button
            className="kh-button kh-button-secondary"
            type="submit"
            formAction={publishFormAction}
            disabled={!workflow.canPublish || isPending}
            aria-describedby={
              workflow.publishDisabledReason ? "monthly-publish-disabled-reason" : undefined
            }
          >
            {isPublishPending ? "Publikálás folyamatban..." : "Publikálás"}
          </button>
        </form>
      </div>
    </section>
  );
}
