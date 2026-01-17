export default function Card({
    title,
    subtitle,
    children,
    footer,
    className = "",
}) {
    return (
        <div
            className={[
                "rounded-2xl bg-white p-6 shadow-sm border border-slate-200",
                className,
            ].join(" ")}
        >
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && (
                        <div className="text-sm text-slate-500">
                            {title}
                        </div>
                    )}
                    {subtitle && (
                        <div className="mt-2 text-lg font-semibold text-slate-900">
                            {subtitle}
                        </div>
                    )}
                </div>
            )}

            {children}

            {footer && <div className="mt-4 pt-4 border-t border-slate-200">{footer}</div>}
        </div>
    );
}
