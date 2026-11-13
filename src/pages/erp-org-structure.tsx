import {
  Archive,
  Building2,
  Camera,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  departmentAnchor,
  departmentIcon,
} from "../components/erp-department-grid";
import { OnboardingEmoji } from "../components/onboarding-emoji";
import { OrgStatIcon } from "../components/org-stat-icon";
import { Avatar, Button, Dialog, Field, Input, Select } from "../components/ui";
import { PageLoader } from "../components/ui/page-loader";
import { useAccessBoard } from "../data/access-board";
import { useAuth } from "../data/erp-session";
import {
  availableOrgManagers,
  orgArchiveSchema,
  orgRosterSchema,
  type OrgArchive,
  type OrgMemberInput,
  type OrgMemberUpdate,
  type OrgRoster,
} from "../data/erp-org";
import "./erp-org-structure.css";

const deletedDate = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeZone: "Europe/Moscow",
});

type RosterState =
  | { status: "loading" }
  | { status: "missing" | "error" }
  | { status: "ready"; roster: OrgRoster };

type Person = OrgRoster["people"][number];
type AddMember = (member: OrgMemberInput) => Promise<void>;
type UpdateMember = (id: string, member: OrgMemberUpdate) => Promise<void>;
type DeleteMember = (id: string) => Promise<void>;
type RestoreMember = (token: string) => Promise<void>;
type PhotoControls = {
  choose: (id: string) => void;
  versions: Record<string, number>;
  uploading: boolean;
};

const photoTypes = ["image/jpeg", "image/png", "image/webp"];

async function preparePhoto(file: File) {
  const image = await createImageBitmap(file);
  try {
    const side = Math.min(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 384;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob?.type === "image/webp") resolve(blob);
          else reject(new Error("Could not encode photo"));
        },
        "image/webp",
        0.88,
      );
    });
  } finally {
    image.close();
  }
}

function OrgHeading({ children }: { children?: ReactNode }) {
  return (
    <header className="erp-org-heading">
      <h1 id="erp-org-title">Организационная структура</h1>
      {children}
    </header>
  );
}

function OrgArchiveDialog({
  roster,
  onRestore,
  canManage,
}: {
  roster: OrgRoster;
  onRestore: RestoreMember;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<OrgArchive | null>(null);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const pending = useRef(false);
  const archiveBody = useRef<HTMLDivElement>(null);
  const departmentNames = new Map(
    roster.departments.map(({ id, name }) => [id, name]),
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function loadArchive() {
      try {
        const response = await fetch("/api/erp/org-roster/archive", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Archive unavailable");
        const archive = orgArchiveSchema.parse(await response.json());
        if (!controller.signal.aborted) setEntries(archive);
      } catch {
        if (!controller.signal.aborted)
          setError(
            "Не удалось загрузить архив. Закройте и откройте его снова.",
          );
      }
    }
    void loadArchive();
    return () => controller.abort();
  }, [open]);

  async function restore(token: string) {
    if (pending.current) return;
    pending.current = true;
    setRestoring(token);
    setError("");
    try {
      await onRestore(token);
      setEntries(
        (entries) => entries?.filter((entry) => entry.token !== token) ?? null,
      );
      archiveBody.current?.focus();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось восстановить сотрудника.",
      );
    } finally {
      pending.current = false;
      setRestoring(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (pending.current) return;
        if (value) {
          setEntries(null);
          setError("");
        }
        setOpen(value);
      }}
      title="Архив сотрудников"
      description="Удалённые карточки можно вернуть в оргструктуру."
      trigger={
        <button
          type="button"
          className="erp-org-archive-trigger"
          aria-label="Архив сотрудников"
          title="Архив сотрудников"
        >
          <Archive size={16} aria-hidden="true" />
          <span>Архив сотрудников</span>
        </button>
      }
    >
      <div ref={archiveBody} className="dialog-body" tabIndex={-1}>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {entries === null && !error && <p role="status">Загружаем архив…</p>}
        {entries?.length === 0 && (
          <p tabIndex={-1} role="status">
            В архиве пока нет сотрудников.
          </p>
        )}
        {entries && entries.length > 0 && (
          <ul className="erp-org-archive-list">
            {entries.map(({ token, person, deletedAt }) => (
              <li key={token}>
                <Avatar name={person.name} portrait={false} size="sm" />
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.position}</p>
                  {person.departmentId && (
                    <p>{departmentNames.get(person.departmentId)}</p>
                  )}
                  <time dateTime={deletedAt}>
                    Дата удаления · {deletedDate.format(new Date(deletedAt))}
                  </time>
                </div>
                {canManage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={restoring !== null}
                    onClick={() => restore(token)}
                    aria-label={`Восстановить — ${person.name}`}
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    {restoring === token ? "Возвращаем…" : "Восстановить"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

function OrgAvatar({
  person,
  photos,
  large = false,
  canManage,
}: {
  person: Person;
  photos: PhotoControls;
  large?: boolean;
  canManage: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState("");
  const version = photos.versions[person.id];
  const src = `/api/erp/org-roster/photos/${encodeURIComponent(person.id)}.webp${version ? `?v=${version}` : ""}`;
  const showPhoto = Boolean((person.hasPhoto || version) && failedSrc !== src);
  const action = showPhoto ? "Заменить фото" : "Загрузить фото";
  const avatar = showPhoto ? (
    <img
      className={`avatar avatar-${large ? "lg" : "sm"} erp-org-photo`}
      src={src}
      alt=""
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  ) : (
    <Avatar name={person.name} portrait={false} size={large ? "lg" : "sm"} />
  );
  if (!canManage) return avatar;
  return (
    <button
      type="button"
      className="erp-org-avatar-button"
      aria-label={`${action} — ${person.name}`}
      title={action}
      data-has-photo={showPhoto}
      disabled={photos.uploading}
      onClick={() => photos.choose(person.id)}
    >
      {avatar}
      <span className="erp-org-avatar-camera">
        <Camera size={11} aria-hidden="true" />
      </span>
    </button>
  );
}

function PersonRow({
  person,
  photos,
  onEdit,
  onProfile,
  temporary = false,
}: {
  person: Person;
  photos: PhotoControls;
  onEdit?: (id: string) => void;
  onProfile: (id: string) => void;
  temporary?: boolean;
}) {
  return (
    <div className="erp-org-person">
      <OrgAvatar person={person} photos={photos} canManage={!!onEdit} />
      <button
        type="button"
        className="erp-org-person-profile"
        aria-label={`Открыть профиль — ${person.name}`}
        data-person-id={person.id}
        onClick={() => onProfile(person.id)}
      >
        <strong>{person.name}</strong>
        <span className="erp-org-position" title={person.position}>
          {person.position}
        </span>
        {temporary && <span className="erp-org-temporary">Временно</span>}
      </button>
      {onEdit && (
        <button
          type="button"
          className="erp-org-edit"
          aria-label={`Редактировать сотрудника — ${person.name}`}
          title="Редактировать сотрудника"
          data-person-id={person.id}
          onClick={() => onEdit(person.id)}
        >
          <Pencil size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function EmployeeProfile({
  person,
  roster,
  photos,
  canManage,
  onProfile,
  onEdit,
  close,
}: {
  person: Person;
  roster: OrgRoster;
  photos: PhotoControls;
  canManage: boolean;
  onProfile: (id: string) => void;
  onEdit: () => void;
  close: () => void;
}) {
  const department = roster.departments.find(
    ({ id }) => id === person.departmentId,
  );
  const temporary = roster.departments.filter(({ id }) =>
    person.temporaryDepartmentIds?.includes(id),
  );
  const manager = roster.people.find(({ id }) => id === person.managerId);
  const reports = roster.people.filter(
    ({ managerId }) => managerId === person.id,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={person.name}
      description={person.position}
      className="erp-org-profile-dialog"
    >
      <div className="dialog-body">
        <div className="erp-org-profile-photo">
          <OrgAvatar
            person={person}
            photos={photos}
            large
            canManage={canManage}
          />
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={photos.uploading}
              onClick={() => photos.choose(person.id)}
            >
              <Camera size={15} aria-hidden="true" />{" "}
              {person.hasPhoto || photos.versions[person.id]
                ? "Заменить фото"
                : "Загрузить фото"}
            </Button>
          )}
        </div>
        <dl className="erp-org-profile-details">
          {department && (
            <div>
              <dt>Основной отдел</dt>
              <dd>{department.name}</dd>
            </div>
          )}
          {temporary.length > 0 && (
            <div>
              <dt>Временные отделы</dt>
              <dd>{temporary.map(({ name }) => name).join(", ")}</dd>
            </div>
          )}
          {person.id !== roster.directorId && (
            <div>
              <dt>Руководитель</dt>
              <dd>
                {manager ? (
                  <button type="button" onClick={() => onProfile(manager.id)}>
                    {manager.name}
                  </button>
                ) : (
                  "Не указан"
                )}
              </dd>
            </div>
          )}
          {reports.length > 0 && (
            <div>
              <dt>Прямые подчинённые</dt>
              <dd>
                <ul>
                  {reports.map((report) => (
                    <li key={report.id}>
                      <button
                        type="button"
                        onClick={() => onProfile(report.id)}
                      >
                        {report.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
      {canManage && person.id !== roster.directorId && (
        <div className="dialog-footer">
          <Button type="button" variant="outline" onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" /> Редактировать
          </Button>
        </div>
      )}
    </Dialog>
  );
}

function AddMemberForm({
  departmentId,
  managers,
  onAdd,
  close,
}: {
  departmentId: string;
  managers: Person[];
  onAdd: AddMember;
  close: () => void;
}) {
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const position = String(form.get("position") ?? "").trim();
    if (!name || !position) {
      setError("Укажите имя и должность сотрудника.");
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await onAdd({
        name,
        position,
        departmentId,
        managerId: String(form.get("managerId") ?? "") || null,
      });
      close();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось добавить сотрудника.",
      );
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <form className="erp-org-add-form" onSubmit={submit}>
      <div className="dialog-body">
        <Field label="Имя и фамилия">
          <Input name="name" required maxLength={100} disabled={saving} />
        </Field>
        <Field label="Должность">
          <Input name="position" required maxLength={150} disabled={saving} />
        </Field>
        <Field label="Руководитель">
          <Select name="managerId" defaultValue="" disabled={saving}>
            <option value="">Не указан</option>
            {managers.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="dialog-footer">
        <Button
          type="button"
          variant="outline"
          onClick={close}
          disabled={saving}
        >
          Отмена
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Добавляем…" : "Добавить"}
        </Button>
      </div>
    </form>
  );
}

function EditMemberForm({
  person,
  roster,
  onUpdate,
  close,
  confirmDelete,
}: {
  person: Person;
  roster: OrgRoster;
  onUpdate: UpdateMember;
  close: () => void;
  confirmDelete: () => void;
}) {
  const [departmentId, setDepartmentId] = useState(person.departmentId ?? "");
  const [temporary, setTemporary] = useState(
    person.temporaryDepartmentIds ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const allowedManagers = availableOrgManagers(roster.people, person.id);
  const managers = roster.people.filter(
    (manager) =>
      manager.id === person.managerId || allowedManagers.includes(manager),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const values = new FormData(event.currentTarget);
    const position = String(values.get("position") ?? "").trim();
    if (!position) {
      setError("Укажите должность сотрудника.");
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await onUpdate(person.id, {
        position,
        departmentId,
        managerId: String(values.get("managerId") ?? "") || null,
        temporaryDepartmentIds: temporary,
      });
      close();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось сохранить изменения.",
      );
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="dialog-body">
        <Field label="Должность">
          <Input
            name="position"
            defaultValue={person.position}
            required
            maxLength={150}
            disabled={saving}
          />
        </Field>
        <Field label="Руководитель">
          <Select
            name="managerId"
            defaultValue={person.managerId ?? ""}
            disabled={saving}
          >
            <option value="">Не указан</option>
            {managers.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Основной отдел">
          <Select
            name="departmentId"
            defaultValue={departmentId}
            disabled={saving}
            onChange={(event) => {
              const id = event.currentTarget.value;
              setDepartmentId(id);
              setTemporary((departments) =>
                departments.filter((value) => value !== id),
              );
            }}
          >
            {roster.departments.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        {roster.departments.length > 1 && (
          <fieldset className="erp-org-temporary-fields" disabled={saving}>
            <legend>Временные отделы</legend>
            <div>
              {roster.departments
                .filter(({ id }) => id !== departmentId)
                .map(({ id, name }) => (
                  <label key={id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={temporary.includes(id)}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setTemporary((departments) =>
                          checked
                            ? [...departments, id]
                            : departments.filter((value) => value !== id),
                        );
                      }}
                    />
                    {name}
                  </label>
                ))}
            </div>
          </fieldset>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="dialog-footer erp-org-edit-footer">
        <Button
          type="button"
          variant="ghost"
          className="erp-org-delete-action"
          onClick={confirmDelete}
          disabled={saving}
        >
          <Trash2 size={15} aria-hidden="true" /> Удалить
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={close}
          disabled={saving}
        >
          Отмена
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function MemberEditor({
  person,
  roster,
  onUpdate,
  onDelete,
  close,
}: {
  person: Person;
  roster: OrgRoster;
  onUpdate: UpdateMember;
  onDelete: DeleteMember;
  close: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const hasReports = roster.people.some(
    ({ managerId }) => managerId === person.id,
  );

  useEffect(() => {
    if (confirming) cancelButton.current?.focus();
  }, [confirming]);

  function cancelDeletion() {
    if (pending.current) return;
    setError("");
    setConfirming(false);
    window.requestAnimationFrame(() =>
      editor.current
        ?.querySelector<HTMLButtonElement>(".erp-org-delete-action")
        ?.focus(),
    );
  }

  async function deleteMember() {
    if (pending.current) return;
    pending.current = true;
    setDeleting(true);
    setError("");
    try {
      await onDelete(person.id);
      close();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось удалить сотрудника.",
      );
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (open || pending.current) return;
        if (confirming) cancelDeletion();
        else close();
      }}
      title={confirming ? "Удалить сотрудника?" : "Редактировать сотрудника"}
      description={person.name}
    >
      <div ref={editor} hidden={confirming}>
        <EditMemberForm
          person={person}
          roster={roster}
          onUpdate={onUpdate}
          close={close}
          confirmDelete={() => setConfirming(true)}
        />
      </div>
      {confirming && (
        <>
          <div className="dialog-body">
            <p>Карточка исчезнет из основного и временных отделов.</p>
            {hasReports && (
              <p>
                У сотрудников, которые подчиняются этому руководителю, поле
                «Руководитель» будет очищено.
              </p>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="dialog-footer">
            <Button
              ref={cancelButton}
              type="button"
              variant="outline"
              onClick={cancelDeletion}
              disabled={deleting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={deleteMember}
              disabled={deleting}
            >
              {deleting ? "Удаляем…" : "Удалить сотрудника"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

function DepartmentCard({
  department,
  visibleMembers,
  photos,
  managers,
  onAdd,
  onEdit,
  onProfile,
}: {
  department: OrgRoster["departments"][number];
  visibleMembers: Person[];
  photos: PhotoControls;
  managers: Person[];
  onAdd?: AddMember;
  onEdit?: (id: string) => void;
  onProfile: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const icon = departmentIcon(department.id);
  const visibleIds = new Set(visibleMembers.map(({ id }) => id));
  const reports = new Map<string, Person[]>();
  for (const person of visibleMembers) {
    if (person.managerId && visibleIds.has(person.managerId)) {
      const siblings = reports.get(person.managerId) ?? [];
      siblings.push(person);
      reports.set(person.managerId, siblings);
    }
  }
  const rendered = new Set<string>();
  function renderPerson(person: Person): ReactNode {
    if (rendered.has(person.id)) return null;
    rendered.add(person.id);
    const children =
      reports.get(person.id)?.filter(({ id }) => !rendered.has(id)) ?? [];
    return (
      <li
        key={person.id}
        className={children.length ? "erp-org-lead" : undefined}
      >
        <PersonRow
          person={person}
          photos={photos}
          onEdit={onEdit}
          onProfile={onProfile}
          temporary={person.departmentId !== department.id}
        />
        {children.length > 0 && (
          <ul className="erp-org-reports">{children.map(renderPerson)}</ul>
        )}
      </li>
    );
  }
  const roots = visibleMembers
    .filter(({ managerId }) => !managerId || !visibleIds.has(managerId))
    .sort((a, b) => Number(reports.has(b.id)) - Number(reports.has(a.id)));
  const tree = roots.map(renderPerson);
  // Keep imported employees visible even if their reporting data contains a cycle.
  tree.push(
    ...visibleMembers.filter(({ id }) => !rendered.has(id)).map(renderPerson),
  );

  return (
    <li
      className="erp-org-team"
      id={departmentAnchor(department.id)}
      tabIndex={-1}
    >
      <header className="erp-org-team-header">
        {icon ? (
          <OnboardingEmoji asset={icon} />
        ) : (
          <Building2 size={22} aria-hidden="true" />
        )}
        <h2>{department.name}</h2>
      </header>
      <div className="erp-org-team-people">
        {visibleMembers.length > 0 && (
          <ul className="erp-org-members">{tree}</ul>
        )}
        {visibleMembers.length === 0 && (
          <div className="erp-org-empty">
            <p>Пока нет сотрудников</p>
          </div>
        )}
      </div>
      {onAdd && (
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Добавить сотрудника"
          description={department.name}
          trigger={
            <button
              type="button"
              className="erp-org-add"
              aria-label={`Добавить сотрудника в отдел «${department.name}»`}
              title="Добавить сотрудника"
            >
              <Plus size={15} aria-hidden="true" />
              Добавить сотрудника
            </button>
          }
        >
          <AddMemberForm
            departmentId={department.id}
            managers={managers}
            onAdd={onAdd}
            close={() => setOpen(false)}
          />
        </Dialog>
      )}
    </li>
  );
}

function OrgChart({
  roster,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
  canManage,
}: {
  roster: OrgRoster;
  onAdd: AddMember;
  onUpdate: UpdateMember;
  onDelete: DeleteMember;
  onRestore: RestoreMember;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const editTrigger = useRef<HTMLElement | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const selectedPersonId = useRef("");
  const [photoVersions, setPhotoVersions] = useState<Record<string, number>>(
    {},
  );
  const [uploading, setUploading] = useState(false);
  const photos: PhotoControls = {
    versions: photoVersions,
    uploading,
    choose(id) {
      selectedPersonId.current = id;
      photoInput.current?.click();
    },
  };

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const id = selectedPersonId.current;
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !id || uploading || !canManage) return;
    if (!photoTypes.includes(file.type)) {
      toast.error("Выберите фото в формате JPG, PNG или WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Выберите фото размером до 20 МБ.");
      return;
    }
    setUploading(true);
    try {
      const photo = await preparePhoto(file).catch(() => null);
      if (!photo) {
        toast.error("Не удалось открыть фото. Выберите другой файл.");
        return;
      }
      const response = await fetch(
        `/api/erp/org-roster/photos/${encodeURIComponent(id)}.webp`,
        {
          method: "POST",
          headers: { "Content-Type": photo.type },
          body: photo,
        },
      );
      if (!response.ok) throw new Error("Photo upload failed");
      setPhotoVersions((versions) => ({ ...versions, [id]: Date.now() }));
      toast.success("Фото сохранено.");
    } catch {
      toast.error("Не удалось сохранить фото. Попробуйте ещё раз.");
    } finally {
      setUploading(false);
    }
  }

  const { people, departments, directorId, openVacancies } = roster;
  const editingPerson = canManage
    ? people.find(({ id }) => id === editingId)
    : undefined;
  const profile = people.find(({ id }) => id === profileId);
  const director = people.find(({ id }) => id === directorId)!;
  const managerIds = new Set(
    people.map(({ managerId }) => managerId).filter(Boolean),
  );
  const searchText = query.trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
  const matches = (value: string) =>
    value.toLocaleLowerCase("ru").replaceAll("ё", "е").includes(searchText);
  const teams = departments.map((department) => {
    const members = people.filter(
      ({ departmentId }) => departmentId === department.id,
    );
    const assignedMembers = [
      ...members,
      ...people.filter((person) =>
        person.temporaryDepartmentIds?.includes(department.id),
      ),
    ];
    if (matches(department.name))
      return { department, matchingMembers: assignedMembers };
    const assignedById = new Map(
      assignedMembers.map((person) => [person.id, person]),
    );
    const matchingIds = new Set<string>();
    for (const person of assignedMembers) {
      if (!matches(`${person.name} ${person.position}`)) continue;
      for (
        let current: Person | undefined = person;
        current && !matchingIds.has(current.id);
        current = current.managerId
          ? assignedById.get(current.managerId)
          : undefined
      ) {
        matchingIds.add(current.id);
      }
    }
    return {
      department,
      matchingMembers: assignedMembers.filter(({ id }) => matchingIds.has(id)),
    };
  });
  const visibleTeams = teams.filter(
    ({ department, matchingMembers }) =>
      matches(department.name) || matchingMembers.length > 0,
  );
  const showDirector =
    visibleTeams.length > 0 || matches(`${director.name} ${director.position}`);
  const managers = [director, ...people.filter(({ id }) => id !== directorId)];
  const metrics = [
    { label: "Сотрудников", value: people.length, icon: "employees" },
    { label: "Отделов", value: departments.length, icon: "departments" },
    { label: "Руководителей", value: managerIds.size, icon: "leaders" },
    {
      label: "Открытых вакансий",
      value: openVacancies,
      icon: "vacancies",
    },
  ] as const;

  async function addMember(member: OrgMemberInput) {
    await onAdd(member);
    setQuery("");
  }

  function editMember(id: string) {
    if (!canManage) return;
    if (!profileId)
      editTrigger.current = document.activeElement as HTMLElement | null;
    setProfileId(null);
    setEditingId(id);
  }

  function openProfile(id: string) {
    if (!profileId)
      editTrigger.current = document.activeElement as HTMLElement | null;
    setProfileId(id);
  }

  function closePerson() {
    const id = editingId ?? profileId;
    const trigger = editTrigger.current;
    setEditingId(null);
    setProfileId(null);
    if (!id) return;
    // Radix releases its focus trap on close. The original card may have moved.
    window.setTimeout(() => {
      const target = trigger?.isConnected
        ? trigger
        : document.querySelector<HTMLElement>(
            `.erp-org-person-profile[data-person-id="${CSS.escape(id)}"]`,
          );
      (target ?? searchRef.current)?.focus();
    });
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        document.querySelector(
          '[role="dialog"], .erp-sidebar-backdrop[data-open="true"]',
        )
      )
        return;
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.code === "KeyK" || event.key.toLowerCase() === "k")
      ) {
        event.preventDefault();
        event.stopPropagation();
        searchRef.current?.focus();
      } else if (event.key === "Escape" && expanded) {
        setExpanded(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expanded]);

  return (
    <section
      className="erp-org-page erp-page-frame"
      data-expanded={expanded}
      aria-labelledby="erp-org-title"
    >
      <input
        ref={photoInput}
        type="file"
        accept={photoTypes.join(",")}
        hidden
        onChange={uploadPhoto}
      />
      <OrgHeading>
        <div className="erp-org-toolbar">
          <div className="erp-org-search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              aria-label="Поиск по сотрудникам и отделам"
              aria-keyshortcuts="Control+K Meta+K"
              placeholder="Сотрудник или отдел"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={15} aria-hidden="true" />
              </button>
            ) : (
              <kbd aria-hidden="true">Ctrl K</kbd>
            )}
          </div>
          <OrgArchiveDialog
            roster={roster}
            onRestore={onRestore}
            canManage={canManage}
          />
          <button
            type="button"
            className="erp-org-expand"
            aria-label={
              expanded ? "Свернуть оргструктуру" : "Развернуть оргструктуру"
            }
            title={expanded ? "Свернуть" : "Развернуть"}
            aria-pressed={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <Minimize2 size={17} aria-hidden="true" />
            ) : (
              <Maximize2 size={17} aria-hidden="true" />
            )}
          </button>
        </div>
      </OrgHeading>

      {showDirector ? (
        <div
          className="erp-org-scroll"
          tabIndex={0}
          role="region"
          aria-label="Оргструктура команды"
        >
          <div
            className="erp-org-chart"
            style={
              {
                "--org-team-count": Math.max(1, visibleTeams.length),
              } as CSSProperties
            }
          >
            <div className="erp-org-director">
              <OrgAvatar
                person={director}
                photos={photos}
                large
                canManage={canManage}
              />
              <div>
                <h2>
                  <button
                    type="button"
                    className="erp-org-person-profile"
                    aria-label={`Открыть профиль — ${director.name}`}
                    onClick={() => openProfile(director.id)}
                  >
                    {director.name}
                  </button>
                </h2>
                <p className="erp-org-position" title={director.position}>
                  {director.position}
                </p>
              </div>
              <OnboardingEmoji asset="org-chart" />
            </div>
            {visibleTeams.length > 0 && (
              <ul className="erp-org-teams" aria-label="Отделы">
                {visibleTeams.map(({ department, matchingMembers }) => (
                  <DepartmentCard
                    key={department.id}
                    department={department}
                    visibleMembers={matchingMembers}
                    photos={photos}
                    managers={managers}
                    onAdd={canManage ? addMember : undefined}
                    onEdit={canManage ? editMember : undefined}
                    onProfile={openProfile}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="erp-org-no-results" role="status">
          Ничего не найдено. Попробуйте изменить запрос.
        </p>
      )}

      <footer className="erp-org-footer">
        <dl className="erp-org-summary">
          {metrics.map(({ label, value, icon }) => (
            <div key={label}>
              <OrgStatIcon icon={icon} />
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </footer>
      {editingPerson && (
        <MemberEditor
          key={editingPerson.id}
          person={editingPerson}
          roster={roster}
          onUpdate={onUpdate}
          onDelete={onDelete}
          close={closePerson}
        />
      )}
      {profile && (
        <EmployeeProfile
          person={profile}
          roster={roster}
          photos={photos}
          canManage={canManage}
          onProfile={openProfile}
          onEdit={() => editMember(profile.id)}
          close={closePerson}
        />
      )}
    </section>
  );
}

export function OrgStructure() {
  const authenticated = useAuth((state) => state.authenticated);
  const previewEmployeeId = useAccessBoard((state) => state.previewEmployeeId);
  const canManage = authenticated === true && !previewEmployeeId;
  const { hash } = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RosterState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function loadRoster() {
      try {
        const response = await fetch("/api/erp/org-roster", {
          signal: controller.signal,
        });
        if (response.status === 404) {
          setState({ status: "missing" });
        } else if (!response.ok) {
          setState({ status: "error" });
        } else {
          const roster = orgRosterSchema.parse(await response.json());
          if (!controller.signal.aborted) setState({ status: "ready", roster });
        }
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void loadRoster();
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (state.status !== "ready" || !hash.startsWith("#department-")) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1));
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, state.status]);

  async function addMember(member: OrgMemberInput) {
    const response = await fetch("/api/erp/org-roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    }).catch(() => null);
    if (response?.status === 409)
      throw new Error("Сотрудник с таким именем уже есть в этом отделе.");
    if (!response?.ok)
      throw new Error("Не удалось добавить сотрудника. Попробуйте ещё раз.");
    const roster = orgRosterSchema.parse(await response.json());
    setState({ status: "ready", roster });
  }

  async function updateMember(id: string, member: OrgMemberUpdate) {
    const response = await fetch(
      `/api/erp/org-roster/people/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      },
    ).catch(() => null);
    if (response?.status === 400)
      throw new Error("Проверьте выбранного руководителя и отделы.");
    if (response?.status === 409)
      throw new Error("Сотрудник с таким именем уже есть в выбранном отделе.");
    if (!response?.ok)
      throw new Error("Не удалось сохранить изменения. Попробуйте ещё раз.");
    const roster = orgRosterSchema.parse(await response.json());
    setState({ status: "ready", roster });
    toast.success("Карточка сотрудника обновлена.");
  }

  async function deleteMember(id: string) {
    const response = await fetch(
      `/api/erp/org-roster/people/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ).catch(() => null);
    if (!response?.ok)
      throw new Error("Не удалось удалить сотрудника. Попробуйте ещё раз.");
    const roster = orgRosterSchema.parse(await response.json());
    setState({ status: "ready", roster });
    const token = response.headers.get("X-Org-Undo-Token");
    if (!token) {
      toast.success("Сотрудник удалён из оргструктуры.");
      return;
    }
    let restoring = false;
    toast.success("Сотрудник удалён из оргструктуры.", {
      id: token,
      duration: 15_000,
      action: {
        label: "Отменить",
        onClick: async (event) => {
          event.preventDefault();
          if (restoring) return;
          restoring = true;
          try {
            await restoreMember(token);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Не удалось восстановить сотрудника.",
            );
          } finally {
            restoring = false;
          }
        },
      },
    });
  }

  async function restoreMember(token: string) {
    const response = await fetch(
      `/api/erp/org-roster/restore/${encodeURIComponent(token)}`,
      { method: "POST" },
    ).catch(() => null);
    if (response?.status === 410) {
      toast.dismiss(token);
      throw new Error("Этой записи уже нет в архиве.");
    }
    if (response?.status === 409)
      throw new Error(
        "Не удалось вернуть сотрудника из-за изменений в оргструктуре.",
      );
    if (!response?.ok)
      throw new Error(
        "Не удалось восстановить сотрудника. Попробуйте ещё раз.",
      );
    const roster = orgRosterSchema.parse(await response.json());
    setState({ status: "ready", roster });
    toast.dismiss(token);
    toast.success("Сотрудник возвращён в оргструктуру.");
  }

  if (state.status === "ready")
    return (
      <OrgChart
        key={hash}
        roster={state.roster}
        onAdd={addMember}
        onUpdate={updateMember}
        onDelete={deleteMember}
        onRestore={restoreMember}
        canManage={canManage}
      />
    );

  return (
    <section
      className="erp-org-page erp-page-frame"
      aria-labelledby="erp-org-title"
    >
      <OrgHeading />
      {state.status === "loading" && (
        <PageLoader compact title="Загрузка состава команды…" />
      )}
      {(state.status === "missing" || state.status === "error") && (
        <div className="erp-org-unavailable">
          <p>
            {state.status === "missing"
              ? "Состав команды ещё не импортирован."
              : "Не удалось загрузить состав команды."}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          >
            Повторить
          </Button>
        </div>
      )}
    </section>
  );
}
