import { Outlet } from 'react-router-dom';

export default function CalculatorLayout() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
                {/* We can put a global header or branding here later */}
                <Outlet />
            </main>
            <footer className="w-full max-w-4xl mx-auto py-6 text-center text-sm text-[var(--color-text-muted)]">
                Powered by Zate Log &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
}
