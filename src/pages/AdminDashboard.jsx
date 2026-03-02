import { TrendingUp, Users, Package, Truck, ArrowUpRight, ArrowDownRight, ThermometerSnowflake, Beer, AlertTriangle, Download } from 'lucide-react';

export default function AdminDashboard() {
    const metrics = [
        { label: 'Viagens no Mês', value: '18', change: '+2', positive: true, icon: Truck },
        { label: 'Volume Ocioso Captado', value: '3.250kg', change: '+15%', positive: true, icon: Package },
        { label: 'Retorno de Barris', value: '840', change: '+18%', positive: true, icon: Beer },
        { label: 'Faturamento Extra', value: 'R$ 4.500', change: '+12%', positive: true, icon: TrendingUp },
    ];

    return (
        <div className="fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Relatório Operacional da Frota</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">Resumo das operações do motorista Zate para a Transportadora.</p>
                </div>
                <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
                    <Download size={18} /> Exportar PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                        <div key={idx} className="bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-[var(--color-primary)]/10 rounded-[var(--radius-md)]">
                                    <Icon size={20} className="text-[var(--color-primary)]" />
                                </div>
                                <div className={`flex items-center text-sm font-medium ${metric.positive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                    {metric.change}
                                    {metric.positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-[var(--color-text-primary)]">{metric.value}</h3>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">{metric.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alertas Críticos da Cadeia de Frio */}
                <div className="lg:col-span-2 bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-[var(--color-warning)]" /> Alertas da Cadeia de Frio
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5">
                            <div className="hidden sm:block p-2 bg-[var(--color-error)]/10 rounded-full">
                                <ThermometerSnowflake size={24} className="text-[var(--color-error)]" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-[var(--color-error)]">Quebra de Temperatura Crítica</h3>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]">URGENTE</span>
                                </div>
                                <p className="text-sm text-[var(--color-text-primary)]">Caminhão Placa ABC-1234 (Rota Curitiba) relatou baú a 12°C. Temperatura ideal: 4°C. Chopp em risco.</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-2">Carga: 45 Barris IPA | Motorista: João S.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
                            <div className="hidden sm:block p-2 bg-[var(--color-warning)]/10 rounded-full">
                                <Beer size={24} className="text-[var(--color-warning)]" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-[var(--color-warning)]">Alerta de Avaria (Vidro)</h3>
                                </div>
                                <p className="text-sm text-[var(--color-text-primary)]">Motorista da Rota Joinville alertou estrada de terra esburacada. Risco elevado de quebra de engradados.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Routes */}
                <div className="bg-[var(--color-surface)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Rotas Frequentes (Este Mês)</h2>
                    <div className="space-y-4">
                        {[
                            { route: 'Joinville → Rio do Sul', count: 12, profit: 'Alta' },
                            { route: 'Joinville → Pomerode', count: 12, profit: 'Alta' },
                            { route: 'Joinville → Curitiba', count: 3, profit: 'Média' },
                            { route: 'Joinville → São Paulo', count: 1, profit: 'Baixa' }
                        ].map((r, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] transition-colors">
                                <div>
                                    <p className="font-medium text-sm text-[var(--color-text-primary)]">{r.route}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{r.count} cotações</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.profit === 'Alta' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' :
                                    r.profit === 'Média' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
                                        'bg-[var(--color-error)]/10 text-[var(--color-error)]'
                                    }`}>
                                    {r.profit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
