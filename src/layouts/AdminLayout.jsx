import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Truck, Map, Receipt } from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Tabelas', icon: Settings, path: '/admin/tabelas' },
        { label: 'Ocupação', icon: Truck, path: '/admin/ocupacao' },
        { label: 'Tracking', icon: Map, path: '/admin/tracking' },
        { label: 'Canhotos', icon: Receipt, path: '/admin/canhotos' },
    ];

    return (
        <div className="flex h-screen bg-[var(--color-surface-hover)]">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold premium-gradient-text tracking-tight">Zate Log Pro</h1>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Backoffice Administrativo</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${isActive
                                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-[var(--color-primary)]' : ''} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[var(--color-border)]">
                    <Link to="/" className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-2">
                        Ver Calculadora
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-[var(--color-background)]">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
