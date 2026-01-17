import Card from "../components/Card";
import { LoadingState, ErrorState } from "../components/States";
import SectionLayout from "../layouts/SectionLayout";
import useSettingsData from "../hooks/useSettingsData";

export default function Settings() {
    const { status, data, run } = useSettingsData();

    if (status === "idle" || status === "loading") {
        return <LoadingState title="Cargando Dashboard…" />;
    }

    if (status === "error")
        return (
            <ErrorState
                title="Settings no disponible"
                message="Intenta de nuevo."
                action={
                    <button className="app-btn-primary" onClick={run}>
                        Reintentar
                    </button>
                }
            />
        );

    return (
        <SectionLayout
            title="Settings"
            subtitle="UI base + datos stub."
            actions={
                <button className="app-btn-ghost" onClick={run}>
                    Refrescar
                </button>
            }
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card title="Preferencias" subtitle="General">
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-medium text-slate-900">Theme</div>
                            <div className="mt-1 text-slate-700">{data.theme}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-900">Density</div>
                            <div className="mt-1 text-slate-700">{data.density}</div>
                        </div>
                    </div>
                </Card>

                <Card title="Acciones" subtitle="UI only">
                    <div className="flex gap-2">
                        <button className="app-btn-primary">Guardar</button>
                        <button className="app-btn-ghost">Cancelar</button>
                    </div>
                </Card>
            </div>
        </SectionLayout>
    );
}
