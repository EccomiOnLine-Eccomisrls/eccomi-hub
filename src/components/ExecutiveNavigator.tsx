import {
  Activity,
  Bot,
  Boxes,
  ListChecks,
  Radar,
} from "lucide-react";

type ExecutiveSection =
  | "snapshot"
  | "timeline"
  | "apps"
  | "intelligence"
  | "actions";

type NavigatorItem = {
  id: ExecutiveSection;
  label: string;
  icon: typeof Activity;
};

const items: NavigatorItem[] = [
  {
    id: "snapshot",
    label: "Snapshot",
    icon: Radar,
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: Activity,
  },
  {
    id: "apps",
    label: "App",
    icon: Boxes,
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Bot,
  },
  {
    id: "actions",
    label: "Azioni",
    icon: ListChecks,
  },
];

function scrollToSection(section: ExecutiveSection) {
  const target = document.getElementById(
    `executive-section-${section}`,
  );

  target?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function ExecutiveNavigator() {
  return (
    <nav
      className="executive-navigator"
      aria-label="Navigazione Executive Home"
    >
      <div className="executive-navigator__identity">
        <span>ECCOMI OS</span>
        <strong>Executive Home</strong>
      </div>

      <div className="executive-navigator__items">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => scrollToSection(item.id)}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      <span className="executive-navigator__release">
        0.2
      </span>
    </nav>
  );
}
