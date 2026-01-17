import React from "react";

export default function SectionLayout({ title, subtitle, actions, children }) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="app-title">{title}</h1>
          {subtitle && <p className="app-subtitle">{subtitle}</p>}
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </header>

      {children}
    </section>
  );
}
