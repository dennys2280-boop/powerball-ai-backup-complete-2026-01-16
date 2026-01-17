import { Link } from "react-router-dom";
import Card from "../components/Card";

export default function NotFound() {
    return (
        <section className="space-y-6">
            <div>
                <h1 className="app-title">404</h1>
                <p className="app-subtitle">This route does not exist.</p>
            </div>

            <Card title="Invalid route" subtitle="We couldn’t find that page">
                <p className="text-slate-700">
                    Check the URL or go back to the home page.
                </p>
                <div className="mt-4">
                    <Link to="/" className="app-btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </Card>
        </section>
    );
}
