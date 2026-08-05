import { useState } from "react";
import type { User } from "../types/auth.types";
import FieldWorkspace from "./FieldWorkspace";
import PortalDashboard from "./PortalDashboard";

type Section = "overview" | "field";

interface StudentPanelProps {
  accessToken: string;
  user: User;
  onUnauthorized: () => void;
}

function StudentPanel({
  accessToken,
  user,
  onUnauthorized,
}: StudentPanelProps) {
  const [section, setSection] = useState<Section>("overview");

  return (
    <section className="student-panel">
      <nav className="dashboard-nav" aria-label="Módulos de alumno">
        {(["overview", "field"] as Section[]).map((item) => (
          <button
            key={item}
            className={section === item ? "active" : ""}
            type="button"
            onClick={() => setSection(item)}
          >
            {{ overview: "Resumen", field: "Árboles y observaciones" }[item]}
          </button>
        ))}
      </nav>
      {section === "overview" ? (
        <PortalDashboard
          accessToken={accessToken}
          user={user}
          onUnauthorized={onUnauthorized}
        />
      ) : (
        <FieldWorkspace
          accessToken={accessToken}
          user={user}
          onUnauthorized={onUnauthorized}
        />
      )}
    </section>
  );
}

export default StudentPanel;
