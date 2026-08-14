"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { MonthlyReviewEditorActionState } from "@/app/(portal)/monthly-review-actions";
import type {
  ClientActionWorkItemViewModel,
  MonthlyWorkManagementViewModel,
  OptimizationWorkItemViewModel,
  WorkManagementOption
} from "@/lib/monthly-communication/work-management-view-model";

type MonthlyWorkManagementAction = (
  previousState: MonthlyReviewEditorActionState,
  formData: FormData
) => Promise<MonthlyReviewEditorActionState>;

type MonthlyWorkManagementProps = Readonly<{
  management: MonthlyWorkManagementViewModel;
  saveOptimizationAction: MonthlyWorkManagementAction;
  saveClientActionAction: MonthlyWorkManagementAction;
  initialState?: MonthlyReviewEditorActionState;
}>;

const defaultActionState = {
  status: "idle",
  message: "",
  fieldErrors: {}
} satisfies MonthlyReviewEditorActionState;

export function MonthlyWorkManagement({
  management,
  saveOptimizationAction,
  saveClientActionAction,
  initialState = defaultActionState
}: MonthlyWorkManagementProps) {
  const [optimizationState, optimizationFormAction, isOptimizationPending] = useActionState(
    saveOptimizationAction,
    initialState
  );
  const [clientActionState, clientActionFormAction, isClientActionPending] = useActionState(
    saveClientActionAction,
    initialState
  );

  return (
    <section className="kh-card kh-monthly-work-management" aria-labelledby="monthly-work-title">
      <div className="kh-card-header-row">
        <div className="kh-card-title-block">
          <p className="kh-section-kicker">Munkák és ügyfélteendők</p>
          <h2 id="monthly-work-title">Havi munka kezelése</h2>
          <p className="kh-muted-tight">{management.description}</p>
        </div>
        <div className="kh-editor-context" aria-label="Kezelt projekt">
          <span>{management.clientName}</span>
          <strong>{management.projectName}</strong>
          <small>Csak ügynökségi szerkesztés</small>
        </div>
      </div>

      {management.state === "error" ? (
        <p className="kh-alert kh-alert-error" role="alert">
          {management.description}
        </p>
      ) : null}

      <div className="kh-work-management-grid">
        <WorkManagementColumn
          title="Optimalizálások"
          emptyText="Még nincs mentett optimalizálás ehhez a projekthez."
          hasItems={management.optimizationItems.length > 0}
          state={optimizationState}
          isPending={isOptimizationPending}
        >
          <OptimizationItemForm
            formId="optimization-create"
            item={null}
            management={management}
            formAction={optimizationFormAction}
            isPending={isOptimizationPending}
            state={optimizationState}
          />
          {management.optimizationItems.map((item) => (
            <OptimizationItemForm
              formId={`optimization-${item.id}`}
              item={item}
              management={management}
              formAction={optimizationFormAction}
              isPending={isOptimizationPending}
              state={optimizationState}
              key={item.id}
            />
          ))}
        </WorkManagementColumn>

        <WorkManagementColumn
          title="Ügyfélteendők"
          emptyText="Még nincs mentett ügyfélteendő ehhez a projekthez."
          hasItems={management.clientActionItems.length > 0}
          state={clientActionState}
          isPending={isClientActionPending}
        >
          <ClientActionItemForm
            formId="client-action-create"
            item={null}
            management={management}
            formAction={clientActionFormAction}
            isPending={isClientActionPending}
            state={clientActionState}
          />
          {management.clientActionItems.map((item) => (
            <ClientActionItemForm
              formId={`client-action-${item.id}`}
              item={item}
              management={management}
              formAction={clientActionFormAction}
              isPending={isClientActionPending}
              state={clientActionState}
              key={item.id}
            />
          ))}
        </WorkManagementColumn>
      </div>
    </section>
  );
}

function WorkManagementColumn({
  title,
  emptyText,
  hasItems,
  state,
  isPending,
  children
}: Readonly<{
  title: string;
  emptyText: string;
  hasItems: boolean;
  state: MonthlyReviewEditorActionState;
  isPending: boolean;
  children: ReactNode;
}>) {
  return (
    <div className="kh-work-management-column" aria-busy={isPending}>
      <h3>{title}</h3>
      {state.message ? (
        <p
          className={`kh-alert ${
            state.status === "success" ? "kh-alert-success" : "kh-alert-error"
          }`}
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
      {hasItems ? null : <p className="kh-empty-inline">{emptyText}</p>}
      {children}
    </div>
  );
}

function OptimizationItemForm({
  formId,
  item,
  management,
  formAction,
  isPending,
  state
}: Readonly<{
  formId: string;
  item: OptimizationWorkItemViewModel | null;
  management: MonthlyWorkManagementViewModel;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  state: MonthlyReviewEditorActionState;
}>) {
  const titleErrorId = fieldErrorId("title", formId, state);

  return (
    <form className="kh-work-management-form" action={formAction}>
      <input type="hidden" name="projectId" value={management.projectId} />
      <input type="hidden" name="itemId" value={item?.id ?? ""} />
      <div className="kh-work-form-heading">
        <strong>{item ? item.title : "Új optimalizálás"}</strong>
        {item ? <span>{item.updatedLabel}</span> : <span>Manuális rögzítés</span>}
      </div>
      <label className="kh-editor-field">
        <span>Cím</span>
        <input
          name="title"
          defaultValue={item?.title ?? ""}
          aria-describedby={titleErrorId}
          required
        />
        <FieldError field="title" formId={formId} state={state} />
      </label>
      <label className="kh-editor-field">
        <span>Leírás</span>
        <textarea name="description" defaultValue={item?.description ?? ""} rows={3} />
      </label>
      <div className="kh-work-form-row">
        <label className="kh-editor-field">
          <span>Kategória</span>
          <SelectOptions
            name="category"
            options={management.optimizationCategoryOptions}
            defaultValue={item?.category ?? "google_ads"}
          />
        </label>
        <label className="kh-editor-field">
          <span>Státusz</span>
          <SelectOptions
            name="status"
            options={management.optimizationStatusOptions}
            defaultValue={item?.status ?? "planned"}
          />
        </label>
      </div>
      <div className="kh-work-form-row">
        <label className="kh-editor-field">
          <span>Jóváhagyás</span>
          <SelectOptions
            name="approvalStatus"
            options={management.approvalStatusOptions}
            defaultValue={item?.approvalStatus ?? "draft"}
          />
        </label>
        <label className="kh-editor-field kh-editor-checkbox">
          <input
            type="checkbox"
            name="isClientVisible"
            value="true"
            defaultChecked={item?.isClientVisible ?? false}
          />
          <span>Ügyfélnek látható</span>
        </label>
      </div>
      <div className="kh-work-form-row">
        <label className="kh-editor-field">
          <span>Kezdés dátuma</span>
          <input name="startedDate" type="date" defaultValue={item?.startedDate ?? ""} />
        </label>
        <label className="kh-editor-field">
          <span>Elkészülés dátuma</span>
          <input name="completedDate" type="date" defaultValue={item?.completedDate ?? ""} />
        </label>
      </div>
      <button className="kh-button kh-button-tertiary" type="submit" disabled={isPending}>
        {isPending ? "Mentés..." : item ? "Optimalizálás mentése" : "Optimalizálás létrehozása"}
      </button>
      {item ? (
        <p className="kh-work-form-note">
          {item.statusLabel} · {item.approvalStatusLabel}
          {item.isClientVisible ? " · ügyfélnek látható" : " · ügyfélnek rejtett"}
        </p>
      ) : null}
    </form>
  );
}

function ClientActionItemForm({
  formId,
  item,
  management,
  formAction,
  isPending,
  state
}: Readonly<{
  formId: string;
  item: ClientActionWorkItemViewModel | null;
  management: MonthlyWorkManagementViewModel;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  state: MonthlyReviewEditorActionState;
}>) {
  const titleErrorId = fieldErrorId("title", formId, state);

  return (
    <form className="kh-work-management-form" action={formAction}>
      <input type="hidden" name="projectId" value={management.projectId} />
      <input type="hidden" name="itemId" value={item?.id ?? ""} />
      <div className="kh-work-form-heading">
        <strong>{item ? item.title : "Új ügyfélteendő"}</strong>
        {item ? <span>{item.updatedLabel}</span> : <span>Manuális rögzítés</span>}
      </div>
      <label className="kh-editor-field">
        <span>Cím</span>
        <input
          name="title"
          defaultValue={item?.title ?? ""}
          aria-describedby={titleErrorId}
          required
        />
        <FieldError field="title" formId={formId} state={state} />
      </label>
      <label className="kh-editor-field">
        <span>Leírás</span>
        <textarea name="description" defaultValue={item?.description ?? ""} rows={3} />
      </label>
      <div className="kh-work-form-row">
        <label className="kh-editor-field">
          <span>Kategória</span>
          <input name="category" defaultValue={item?.category ?? "merchant_center"} required />
        </label>
        <label className="kh-editor-field">
          <span>Prioritás</span>
          <SelectOptions
            name="priority"
            options={management.clientActionPriorityOptions}
            defaultValue={item?.priority ?? "recommended"}
          />
        </label>
      </div>
      <div className="kh-work-form-row">
        <label className="kh-editor-field">
          <span>Jóváhagyás és láthatóság</span>
          <SelectOptions
            name="visibility"
            options={management.clientActionVisibilityOptions}
            defaultValue={item?.visibility ?? "draft"}
          />
        </label>
        <label className="kh-editor-field">
          <span>Ügyféloldali státusz</span>
          <SelectOptions
            name="status"
            options={management.clientActionStatusOptions}
            defaultValue={item?.visibleStatus ?? "open"}
          />
        </label>
      </div>
      <div className="kh-work-form-row">
        <label className="kh-editor-field">
          <span>Érintett elem</span>
          <input
            name="affectedCount"
            type="number"
            min="0"
            defaultValue={item?.affectedCount ?? ""}
          />
        </label>
        <label className="kh-editor-field">
          <span>Határidő</span>
          <input name="dueDate" type="date" defaultValue={item?.dueDate ?? ""} />
        </label>
      </div>
      <label className="kh-editor-field">
        <span>Megoldás dátuma</span>
        <input name="resolvedDate" type="date" defaultValue={item?.resolvedDate ?? ""} />
      </label>
      <button className="kh-button kh-button-tertiary" type="submit" disabled={isPending}>
        {isPending ? "Mentés..." : item ? "Ügyfélteendő mentése" : "Ügyfélteendő létrehozása"}
      </button>
      {item ? (
        <p className="kh-work-form-note">
          {item.priorityLabel} · {item.statusLabel} · {item.visibilityLabel}
        </p>
      ) : null}
    </form>
  );
}

function SelectOptions<Value extends string>({
  name,
  options,
  defaultValue
}: Readonly<{
  name: string;
  options: WorkManagementOption<Value>[];
  defaultValue: Value | string;
}>) {
  return (
    <select name={name} defaultValue={defaultValue}>
      {options.map((option) => (
        <option value={option.value} key={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FieldError({
  field,
  formId,
  state
}: Readonly<{
  field: string;
  formId: string;
  state: MonthlyReviewEditorActionState;
}>) {
  const message = state.fieldErrors[field];

  return message ? (
    <small className="kh-editor-error" id={`${formId}-${field}-error`}>
      {message}
    </small>
  ) : null;
}

function fieldErrorId(field: string, formId: string, state: MonthlyReviewEditorActionState) {
  return state.fieldErrors[field] ? `${formId}-${field}-error` : undefined;
}
