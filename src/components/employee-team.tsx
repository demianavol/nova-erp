import { useState } from "react";
import { company } from "../data/company";
import { TeamNetwork } from "./team-network";

export function EmployeeTeam() {
  const [selectedId, setSelectedId] = useState<string>(
    company.departments[0].id,
  );
  const department = company.departments.find(
    (item) => item.id === selectedId,
  )!;
  return (
    <section
      className="lp-team is-revealed eg-team"
      aria-labelledby="eg-team-title"
    >
      <div className="lp-team-heading">
        <h2 id="eg-team-title">Как устроена команда</h2>
        <p>Выберите отдел, чтобы узнать его роль</p>
      </div>
      <div className="lp-team-layout">
        <TeamNetwork selectedId={selectedId} onSelect={setSelectedId} />
        <div
          className="lp-department-info"
          id="department-info"
          role="region"
          aria-labelledby="department-title"
          aria-live="polite"
        >
          <div key={department.id} className="lp-department-description">
            <span className="lp-kicker">
              {department.group === "front" ? "Фронт-офис" : "Бэк-офис"}
            </span>
            <h3 id="department-title">{department.title}</h3>
            <p>{department.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
