import { AlertTriangle, CheckCircle, PackageSearch } from 'lucide-react';

export default function AdminOcupacao() {
    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Ocupação da Frota</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Identifique rotas com baús ociosos para focar vendas da calculadora.</p>
            </div>

            <div className="grid gap-4">
                {[
                    { truck: 'Placa ABC-1234', route: 'SP → SC', capacity: '85%', status: 'good' },
                    { truck: 'Placa XYZ-9876', route: 'SP → MG', capacity: '40%', status: 'warning' },
                    { truck: 'Placa DEF-5678', route: 'PR → RS', capacity: '95%', status: 'good' }
                ].map((t, idx) => (
                    <div key={idx} className="bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${t.status === 'warning' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'}`}>
                                {t.status === 'warning' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{t.truck}</h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">Rota programada: {t.route}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold block">{t.capacity}</span>
                            <span className="text-xs text-[var(--color-text-muted)] uppercase">Ocupado</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
