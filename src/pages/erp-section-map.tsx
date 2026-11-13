import { ChevronRight, Shield, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { erpNavigation, ErpSectionStatus } from "../components/erp-navigation";
import { Avatar } from "../components/ui";
import { erpSections, type ErpPage } from "../data/erp-sections";
import { usePreferences } from "../data/store";

function SectionLink({
  page,
  icon: Icon,
}: {
  page: ErpPage;
  icon?: LucideIcon;
}) {
  return (
    <li>
      <Link className="erp-section-link" to={page.to}>
        <span className="erp-section-link-label">
          {Icon && <Icon size={17} aria-hidden="true" />}
          {page.label}
        </span>
        <ErpSectionStatus ready={page.ready} />
        <ChevronRight size={15} aria-hidden="true" />
      </Link>
    </li>
  );
}

export function ErpSectionMap() {
  const { name, role } = usePreferences();

  return (
    <>
      <section
        className="card erp-personal-summary"
        aria-labelledby="erp-personal-title"
      >
        <Avatar name={name} />
        <div>
          <h2 id="erp-personal-title">{name}</h2>
          <p>{role}</p>
        </div>
        <Link
          className="btn btn-outline erp-personal-access"
          to={erpSections.access.to}
        >
          <Shield size={16} aria-hidden="true" /> Управление доступами
        </Link>
      </section>
      <section aria-labelledby="erp-section-map-title">
        <div className="erp-section-map-heading">
          <h2 className="erp-page-title" id="erp-section-map-title">
            Карта разделов
          </h2>
          <ErpSectionStatus ready={erpSections.home.ready} />
        </div>
        <div className="erp-section-map">
          {erpNavigation.map(({ title, entries }) => (
            <section
              key={title}
              className="card erp-section-group"
              aria-label={title}
            >
              <h3>{title}</h3>
              <ul>
                {entries.map((entry) => {
                  if ("to" in entry) {
                    return entry.to === erpSections.home.to ? null : (
                      <SectionLink
                        key={entry.to}
                        page={entry}
                        icon={entry.icon}
                      />
                    );
                  }
                  return (
                    <li key={entry.id} className="erp-section-subgroup">
                      <h4>
                        <entry.icon size={17} aria-hidden="true" />
                        {entry.label}
                      </h4>
                      <ul>
                        {entry.pages.map((page) => (
                          <SectionLink key={page.to} page={page} />
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
