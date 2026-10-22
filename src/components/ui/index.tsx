import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Search, ArrowUpRight, Inbox, Check } from "lucide-react";
import { cn, initials } from "../../lib/utils";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      outline: "btn-outline",
      danger: "btn-danger",
    },
    size: { default: "", sm: "btn-sm", icon: "btn-icon" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input className={cn("input", className)} ref={ref} {...props} />
));
Input.displayName = "Input";
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea className={cn("input textarea", className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";
const FieldLabelContext = React.createContext<string | undefined>(undefined);

// Keep a native form control for React Hook Form; render the popup in a portal
// so its position is independent of dialog transforms and page scaling.
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  const fieldLabel = React.useContext(FieldLabelContext);
  const nativeRef = React.useRef<HTMLSelectElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = React.useState(
    String(props.value ?? props.defaultValue ?? ""),
  );
  const [options, setOptions] = React.useState<
    { value: string; label: string; disabled: boolean }[]
  >([]);

  React.useLayoutEffect(() => {
    const native = nativeRef.current;
    if (!native) return;
    setSelected(native.value);
    const next = Array.from(native.options, (option) => ({
      value: option.value,
      label: option.text,
      disabled: option.disabled,
    }));
    setOptions((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
    );
  });

  const change = (value: string) => {
    const native = nativeRef.current;
    if (!native || value === native.value) return;
    native.value = value;
    setSelected(value);
    native.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <>
      <select
        {...props}
        hidden
        aria-hidden="true"
        tabIndex={-1}
        ref={(element) => {
          nativeRef.current = element;
          if (element) element.focus = () => triggerRef.current?.focus();
          if (typeof ref === "function") ref(element);
          else if (ref) ref.current = element;
        }}
      >
        {children}
      </select>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            id={props.id ? `${props.id}-trigger` : undefined}
            className={cn("input select select-trigger", className)}
            disabled={props.disabled}
            aria-label={props["aria-label"] ?? fieldLabel}
            aria-labelledby={props["aria-labelledby"]}
            aria-invalid={props["aria-invalid"]}
            aria-describedby={props["aria-describedby"]}
            onBlur={() => {
              const native = nativeRef.current;
              if (native)
                native.dispatchEvent(
                  new FocusEvent("focusout", { bubbles: true }),
                );
            }}
          >
            <span>
              {options.find((option) => option.value === selected)?.label ??
                "Выберите…"}
            </span>
          </button>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            className="dropdown select-menu"
            align="start"
            sideOffset={6}
            collisionPadding={12}
          >
            <Dropdown.RadioGroup value={selected} onValueChange={change}>
              {options.map((option) => (
                <Dropdown.RadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="dropdown-item select-option"
                  textValue={option.label}
                >
                  <span className="select-check">
                    <Dropdown.ItemIndicator>
                      <Check size={14} />
                    </Dropdown.ItemIndicator>
                  </span>
                  <span>{option.label}</span>
                </Dropdown.RadioItem>
              ))}
            </Dropdown.RadioGroup>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </>
  );
});
Select.displayName = "Select";
export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <FieldLabelContext.Provider value={label}>
      <label className={cn("field", className)}>
        <span>{label}</span>
        {children}
        {error && (
          <span role="alert" className="field-error">
            {error}
          </span>
        )}
      </label>
    </FieldLabelContext.Provider>
  );
}
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>
  );
}
export function Avatar({
  name,
  color = "violet",
  size = "normal",
}: {
  name: string;
  color?: string;
  size?: "normal" | "sm" | "lg";
}) {
  return (
    <span
      className={cn("avatar", `avatar-${color}`, `avatar-${size}`)}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
          className={cn("dialog-content", wide && "dialog-wide")}
        >
          <div className="dialog-header">
            <div>
              <DialogPrimitive.Title className="dialog-title">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                className={cn("dialog-description", !description && "sr-only")}
              >
                {description || "Просмотр и редактирование данных"}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Закрыть">
                <X size={19} />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export function Menu({
  trigger,
  items,
  label,
}: {
  trigger: React.ReactNode;
  label?: string;
  items: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    danger?: boolean;
  }[];
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          className="dropdown"
          align="end"
          sideOffset={6}
          collisionPadding={12}
        >
          {label && (
            <Dropdown.Label className="dropdown-label">{label}</Dropdown.Label>
          )}
          {items.map((item) => (
            <Dropdown.Item
              key={item.label}
              className={cn("dropdown-item", item.danger && "danger-text")}
              onSelect={item.onClick}
            >
              {item.icon}
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={16} />
      <Input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange("")}
          aria-label="Очистить поиск"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = "Ничего не найдено",
  description = "Попробуйте изменить поиск или сбросить фильтры.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Inbox size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>
          {title}
          <span className="heading-dot">.</span>
        </h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">{actions}</div>
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
