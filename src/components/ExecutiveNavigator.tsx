import {
  Activity,
  ArrowUp,
  Bot,
  Boxes,
  ListChecks,
  Radar,
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

function getSectionElement(section: ExecutiveSection) {
  return document.getElementById(`executive-section-${section}`);
}

function scrollToSection(section: ExecutiveSection) {
  getSectionElement(section)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function ExecutiveNavigator() {
  const [activeSection, setActiveSection] =
    useState<ExecutiveSection>("snapshot");

  const [progress, setProgress] = useState(0);

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
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio,
          );

        const visible = visibleEntries[0];

        if (!visible) {
          return;
        }

        const id = visible.target.id.replace(
          "executive-section-",
          "",
        ) as ExecutiveSection;

        setActiveSection(id);
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.05, 0.2, 0.5, 0.8],
      },
    );

    sections.forEach(({ element }) => observer.observe(element));

    function updateProgress() {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setProgress(100);
        return;
      }

      const nextProgress = Math.min(
        100,
        Math.max(0, (window.scrollY / scrollableHeight) * 100),
      );

      setProgress(Math.round(nextProgress));
    }

    updateProgress();

    window.addEventListener("scroll", updateProgress, {
      passive: true,
    });

    window.addEventListener("resize", updateProgress);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  function returnToTop() {
    getSectionElement("snapshot")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <nav
      className="executive-navigator"
      aria-label="Navigazione Executive Home"
    >
      <div className="executive-navigator__progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="executive-navigator__identity">
        <span>ECCOMI OS</span>
        <strong>Executive Home</strong>
        <small>La tua azienda, sotto controllo.</small>
      </div>

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
              onClick={() => scrollToSection(item.id)}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="executive-navigator__end">
        <span className="executive-navigator__percentage">
          {progress}%
        </span>

        <button
          type="button"
          className="executive-navigator__top"
          aria-label="Torna all'inizio della Executive Home"
          title="Torna in alto"
          onClick={returnToTop}
        >
          <ArrowUp size={15} />
        </button>

        <span className="executive-navigator__release">
          0.2
        </span>
      </div>
    </nav>
  );
}
