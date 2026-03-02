import { MapPin, Search } from 'lucide-react';

export default function AdminTracking() {
    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Rastreamento</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Atualização rápida de status para reduzir ligações de clientes.</p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="input-group flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                        <input type="text" placeholder="Buscar por NF, Cliente ou ID do Rastreiok" className="calc-input pl-10" />
                    </div>
                </div>
                <button className="btn-primary">Buscar</button>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                            <th className="p-4 font-medium min-w-[120px]">Pedido</th>
                            <th className="p-4 font-medium min-w-[200px]">Cliente</th>
                            <th className="p-4 font-medium min-w-[150px]">Destino</th>
                            <th className="p-4 font-medium min-w-[150px]">Status</th>
                            <th className="p-4 font-medium min-w-[100px]">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { id: '#10495', client: 'Indústria Metalúrgica Ltda', dest: 'SP', status: 'Em Trânsito' },
                            { id: '#10496', client: 'Distribuidora ABC', dest: 'RJ', status: 'Saiu para Entrega' },
                            { id: '#10497', client: 'Lojas Varejão', dest: 'PR', status: 'Aguardando Coleta' },
                        ].map((row, idx) => (
                            <tr key={idx} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors text-sm">
                                <td className="p-4 font-medium text-[var(--color-text-primary)]">{row.id}</td>
                                <td className="p-4 text-[var(--color-text-secondary)]">{row.client}</td>
                                <td className="p-4 text-[var(--color-text-secondary)] flex items-center gap-1"><MapPin size={14} /> {row.dest}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Em Trânsito' ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]' :
                                            row.status === 'Saiu para Entrega' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
                                                'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                                        }`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button className="text-[var(--color-primary)] hover:underline">Atualizar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
