"use client";

import { useActionState } from "react";
import type {
  MonthlyReviewEditorActionState
} from "@/app/(portal)/monthly-review-actions";
import type { MonthlyReviewEditorViewModel } from "@/lib/monthly-communication/editor-view-model";

type MonthlyReviewEditorAction = (
  previousState: MonthlyReviewEditorActionState,
  formData: FormData
) => Promise<MonthlyReviewEditorActionState>;

type MonthlyReviewEditorProps = Readonly<{
  editor: MonthlyReviewEditorViewModel;
  saveAction: MonthlyReviewEditorAction;
  submitAction: MonthlyReviewEditorAction;
  initialState?: MonthlyReviewEditorActionState;
}>;

export function MonthlyReviewEditor({
  editor,
  saveAction,
  submitAction,
  initialState = {
    status: "idle",
    message: "",
    fieldErrors: {}
  }
}: MonthlyReviewEditorProps) {
  const [saveState, saveFormAction, isSavePending] = useActionState(saveAction, initialState);
  const [submitState, submitFormAction, isSubmitPending] = useActionState(
    submitAction,
    initialState
  );
  const activeState = submitState.status !== "idle" ? submitState : saveState;
  const isPending = isSavePending || isSubmitPending;

  return (
    <section className="kh-card kh-monthly-editor" aria-labelledby="monthly-review-editor-title">
      <div className="kh-card-header-row">
        <div className="kh-card-title-block">
          <p className="kh-section-kicker">Ügynökségi munkafelület</p>
          <h2 id="monthly-review-editor-title">Havi összefoglaló szerkesztése</h2>
          <p className="kh-muted-tight">
            A vázlat csak ügynökségi oldalon készül. Ügyfélnek kizárólag jóváhagyás után jelenhet meg.
          </p>
        </div>
        <div className="kh-editor-context" aria-label="Szerkesztett projekt">
          <span>{editor.clientName}</span>
          <strong>{editor.projectName}</strong>
          <small>{editor.periodLabel}</small>
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

      <form className="kh-editor-form" aria-busy={isPending}>
        <input type="hidden" name="projectId" value={editor.projectId} />
        <input type="hidden" name="periodStart" value={editor.periodStart} />
        <input type="hidden" name="periodEnd" value={editor.periodEnd} />

        <label className="kh-editor-field">
          <span>Összefoglaló vázlat</span>
          <textarea
            name="summaryDraft"
            defaultValue={editor.summaryDraft}
            rows={5}
            aria-label="Összefoglaló vázlat"
            aria-describedby={fieldErrorId("summaryDraft", activeState)}
            required
          />
          <FieldError field="summaryDraft" state={activeState} />
        </label>

        <fieldset className="kh-editor-fieldset">
          <legend>Havi eredmény típusa</legend>
          <div className="kh-editor-radio-row">
            <label>
              <input
                type="radio"
                name="outcomeType"
                value="positive"
                defaultChecked={editor.outcomeType === "positive"}
              />
              Pozitív
            </label>
            <label>
              <input
                type="radio"
                name="outcomeType"
                value="mixed"
                defaultChecked={editor.outcomeType === "mixed"}
              />
              Vegyes
            </label>
            <label>
              <input
                type="radio"
                name="outcomeType"
                value="focus"
                defaultChecked={editor.outcomeType === "focus"}
              />
              Fókuszt igényel
            </label>
          </div>
          <FieldError field="outcomeType" state={activeState} />
        </fieldset>

        <fieldset className="kh-editor-fieldset">
          <legend>Eredménypontok</legend>
          <div className="kh-editor-repeat-grid">
            {editor.outcomeItems.map((item, index) => (
              <div className="kh-editor-repeat-row" key={`outcome-${index}`}>
                <label>
                  <span>Mutató</span>
                  <input name={`outcomeItems.${index}.label`} defaultValue={item.label} />
                </label>
                <label>
                  <span>Érték</span>
                  <input name={`outcomeItems.${index}.value`} defaultValue={item.value} />
                </label>
                <label>
                  <span>Állapot</span>
                  <select name={`outcomeItems.${index}.state`} defaultValue={item.state}>
                    <option value="positive">Pozitív</option>
                    <option value="neutral">Semleges</option>
                    <option value="negative">Negatív</option>
                  </select>
                </label>
                <label>
                  <span>Magyarázat</span>
                  <input
                    name={`outcomeItems.${index}.explanation`}
                    defaultValue={item.explanation ?? ""}
                  />
                </label>
                <label>
                  <span>Javító lépés</span>
                  <input
                    name={`outcomeItems.${index}.correctiveAction`}
                    defaultValue={item.correctiveAction ?? ""}
                  />
                </label>
              </div>
            ))}
          </div>
          <FieldError field="outcomeItems" state={activeState} />
        </fieldset>

        <fieldset className="kh-editor-fieldset">
          <legend>Javító lépések</legend>
          <div className="kh-editor-stack">
            {editor.correctiveActions.map((action, index) => (
              <label key={`corrective-${index}`}>
                <span>{index + 1}. javító lépés</span>
                <input name={`correctiveActions.${index}`} defaultValue={action} />
              </label>
            ))}
          </div>
          <FieldError field="correctiveActions" state={activeState} />
        </fieldset>

        <fieldset className="kh-editor-fieldset">
          <legend>Következő havi terv</legend>
          <div className="kh-editor-stack">
            {editor.nextMonthPlan.map((item, index) => (
              <div className="kh-editor-plan-row" key={`plan-${index}`}>
                <label>
                  <span>Terv címe</span>
                  <input name={`nextMonthPlan.${index}.title`} defaultValue={item.title} />
                </label>
                <label>
                  <span>Részletek</span>
                  <textarea
                    name={`nextMonthPlan.${index}.detail`}
                    defaultValue={item.detail}
                    rows={3}
                  />
                </label>
              </div>
            ))}
          </div>
          <FieldError field="nextMonthPlan" state={activeState} />
        </fieldset>

        <div className="kh-editor-actions">
          <button
            className="kh-button kh-button-tertiary"
            type="submit"
            formAction={saveFormAction}
            disabled={isPending}
          >
            {isSavePending ? "Vázlat mentése..." : "Vázlat mentése"}
          </button>
          <button
            className="kh-button"
            type="submit"
            formAction={submitFormAction}
            disabled={isPending}
          >
            {isSubmitPending ? "Küldés folyamatban..." : "Jóváhagyásra küldés"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FieldError({
  field,
  state
}: Readonly<{
  field: string;
  state: MonthlyReviewEditorActionState;
}>) {
  const message = state.fieldErrors[field];

  return message ? (
    <small className="kh-editor-error" id={`monthly-review-error-${field}`}>
      {message}
    </small>
  ) : null;
}

function fieldErrorId(field: string, state: MonthlyReviewEditorActionState) {
  return state.fieldErrors[field] ? `monthly-review-error-${field}` : undefined;
}
