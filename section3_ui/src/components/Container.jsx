export default function Container({ children, className = "" }) {
    return (
        <div className={`mx-auto w-full max-w-6xl px-4 ${className}`.trim()}>
            {children}
        </div>
    );
}


