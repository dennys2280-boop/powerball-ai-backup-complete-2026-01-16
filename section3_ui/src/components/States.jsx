function BaseState({ title, message, children }) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {message && <p className="mt-2 text-slate-600">{message}</p>}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}

export function LoadingState({ title = "Cargando…" }) {
    return (
        <BaseState title={title} message="Preparando datos y UI.">
            <div className="space-y-3">
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="h-24 w-full rounded bg-slate-100" />
            </div>
        </BaseState>
    );
}

export function EmptyState({
    title = "Sin resultados",
    message = "No hay datos para mostrar todavía.",
    action,
}) {
    return (
        <BaseState title={title} message={message}>
            {action}
        </BaseState>
    );
}

export function ErrorState({
    title = "Ocurrió un error",
    message = "No pudimos cargar esta sección. Intenta de nuevo.",
    action,
}) {
    return (
        <BaseState title={title} message={message}>
            {action}
        </BaseState>
    );
}
