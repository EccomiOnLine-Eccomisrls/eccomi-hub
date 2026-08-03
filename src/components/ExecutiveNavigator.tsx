import {
  Activity,
  ArrowUp,
  Bot,
  Boxes,
  ListChecks,
  Radar,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

type ExecutiveSection =
  | "snapshot"
  | "timeline"
  | "apps"
  | "intelligence"
  | "actions";

type NavigatorItem = {
  id: ExecutiveSection;
  label: string;
  icon: LucideIcon;
};

const items: NavigatorItem[] = [
  { id: "snapshot", label: "Snapshot", icon: Radar },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "apps", label: "App", icon: Boxes },
  { id: "intelligence", label: "Intelligence", icon: Bot },
  { id: "actions", label: "Azioni", icon: ListChecks },
];

function getSectionElement(section: ExecutiveSection) {
  return document.getElementById(`executive-section-${section}`);
}

export function ExecutiveNavigator() {
  const [activeSection, setActiveSection] =
    useState<ExecutiveSection>("snapshot");

  useEffect(() => {
    const sections = items
      .map((item) => ({
        id: item.id,
        element: getSectionElement(item.id),
      }))
      .filter(
        (
          item,
        ): item is {
          id: ExecutiveSection;
          element: HTMLElement;
        } => Boolean(item.element),
      );

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio,
          )[0];

        if (!visible) {
          return;
        }

        setActiveSection(
          visible.target.id.replace(
            "executive-section-",
            "",
          ) as ExecutiveSection,
        );
      },
      {
        rootMargin: "-15% 0px -65% 0px",
        threshold: [0.05, 0.2, 0.5],
      },
    );

    sections.forEach(({ element }) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  function openSection(section: ExecutiveSection) {
    const element = getSectionElement(section);

    if (!element) {
      return;
    }

    setActiveSection(section);

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function returnToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setActiveSection("snapshot");
  }

  return (
    <nav
      className="executive-navigator executive-navigator--os-dock"
      aria-label="Navigazione Executive Home"
    >
      <div className="executive-navigator__items">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              type="button"
              key={item.id}
              className={
                active
                  ? "executive-navigator__item executive-navigator__item--active"
                  : "executive-navigator__item"
              }
              aria-current={active ? "page" : undefined}
              onClick={() => openSection(item.id)}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <span className="executive-navigator__separator" />

      <button
        type="button"
        className="executive-navigator__top"
        onClick={returnToTop}
        aria-label="Torna all'inizio della Executive Home"
        title="Torna in alto"
      >
        <ArrowUp size={25} />
      </button>
    </nav>
  );
}
