import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

type Tone =
  | "primary"
  | "ai"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type Size = "sm" | "md" | "lg";

function joinClasses(
  ...values: Array<string | false | null | undefined>
) {
  return values.filter(Boolean).join(" ");
}

type EcoButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
};

export function EcoButton({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "start",
  className,
  children,
  type = "button",
  ...props
}: EcoButtonProps) {
  return (
    <button
      type={type}
      className={joinClasses(
        "eco-button",
        `eco-button--${variant}`,
        `eco-button--${size}`,
        className,
      )}
      {...props}
    >
      {icon && iconPosition === "start" && (
        <span className="eco-button__icon">{icon}</span>
      )}

      <span>{children}</span>

      {icon && iconPosition === "end" && (
        <span className="eco-button__icon">{icon}</span>
      )}
    </button>
  );
}

type EcoBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
};

export function EcoBadge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: EcoBadgeProps) {
  return (
    <span
      className={joinClasses(
        "eco-badge",
        `eco-badge--${tone}`,
        className,
      )}
      {...props}
    >
      {dot && <i aria-hidden="true" />}
      {children}
    </span>
  );
}

type EcoCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  tone?: Tone;
  interactive?: boolean;
};

export function EcoCard({
  as: Component = "article",
  tone = "neutral",
  interactive = false,
  className,
  children,
  ...props
}: EcoCardProps) {
  return (
    <Component
      className={joinClasses(
        "eco-card",
        `eco-card--${tone}`,
        interactive && "eco-card--interactive",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type EcoKpiCardProps = {
  label: string;
  value: string | number;
  description: string;
  icon?: ReactNode;
  tone?: Tone;
  trend?: string;
  onClick?: () => void;
};

export function EcoKpiCard({
  label,
  value,
  description,
  icon,
  tone = "primary",
  trend,
  onClick,
}: EcoKpiCardProps) {
  const content = (
    <>
      {icon && <span className="eco-kpi__icon">{icon}</span>}

      <div className="eco-kpi__content">
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{description}</p>

        {trend && (
          <span className="eco-kpi__trend">{trend}</span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`eco-kpi eco-kpi--${tone}`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={`eco-kpi eco-kpi--${tone}`}>
      {content}
    </article>
  );
}

type EcoToolCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  tone?: Tone;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
};

export function EcoToolCard({
  eyebrow,
  title,
  description,
  action,
  tone = "primary",
  icon,
  onClick,
  className,
}: EcoToolCardProps) {
  return (
    <EcoCard
      tone={tone}
      interactive
      className={joinClasses(
        "eco-tool-card",
        `eco-tool-card--${tone}`,
        className,
      )}
    >
      {icon && (
        <span className="eco-tool-card__icon">
          {icon}
        </span>
      )}

      <div className="eco-tool-card__copy">
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <EcoButton
        variant="secondary"
        size="sm"
        iconPosition="end"
        onClick={onClick}
      >
        {action}
      </EcoButton>
    </EcoCard>
  );
}

type EcoSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EcoSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: EcoSectionHeaderProps) {
  return (
    <header className="eco-section-header">
      <div>
        {eyebrow && <small>{eyebrow}</small>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action && (
        <div className="eco-section-header__action">
          {action}
        </div>
      )}
    </header>
  );
}
