import { Camera, MapPin, CheckCircle, Navigation, Truck, ThermometerSnowflake, Beer, AlertTriangle } from 'lucide-react';

export default function DriverApp() {
    const routes = [
        { client: 'Bar do Zé', address: 'Rua das Flores, 123 - SP', status: 'done', temp: true },
        { client: 'Distribuidora ABC', address: 'Av. Brasil, 4500 - SP', status: 'current', temp: true, glass: true },
        { client: 'Lojas Varejão', address: 'Rod. Anhanguera, km 15 - SP', status: 'pending', temp: false },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-surface-hover)] pb-20 fade-in">
            {/* Header */}
            <header className="bg-[var(--color-primary)] text-white p-6 rounded-b-[var(--radius-xl)] shadow-md">
                <h1 className="text-2xl font-bold tracking-tight mb-1">Olá, Motorista</h1>
                <p className="text-white/80 text-sm flex items-center gap-1">
                    <Truck size={14} /> Placa ABC-1234
                </p>
            </header>

            <main className="p-4 space-y-6 mt-2 max-w-md mx-auto">

                {/* Current Stop & Action Area */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider bg-[var(--color-primary)]/10 px-2 py-1 rounded">Parada Atual</span>
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-2">Distribuidora ABC</h2>
                            <p className="text-sm text-[var(--color-text-secondary)] flex items-start gap-1 mt-1">
                                <MapPin size={16} className="text-[var(--color-text-muted)] shrink-0 mt-0.5" />
                                Av. Brasil, 4500 - SP
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 p-3 rounded-[var(--radius-md)] flex items-start gap-3">
                            <AlertTriangle size={20} className="text-[var(--color-error)] shrink-0" />
                            <div>
                                <p className="font-bold text-[var(--color-error)] text-sm uppercase">Carga de Vidro</p>
                                <p className="text-xs text-[var(--color-error)] mt-0.5">Descarregue com cuidado. Risco de Avaria.</p>
                            </div>
                        </div>

                        <div className="bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 p-3 rounded-[var(--radius-md)]">
                            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
                                <ThermometerSnowflake className="text-[var(--color-secondary)]" size={16} /> Check-in de Frio
                            </h3>
                            <input
                                type="number"
                                placeholder="Temp do Baú (°C)"
                                className="w-full p-2 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-md)]"
                            />
                        </div>

                        <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 p-3 rounded-[var(--radius-md)]">
                            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
                                <Beer className="text-[var(--color-warning)]" size={16} /> Logística Reversa
                            </h3>
                            <input
                                type="number"
                                placeholder="Qtd. Barris Coletados"
                                className="w-full p-2 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-md)]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                        <button className="flex-1 btn-success flex flex-col items-center gap-1 py-3 h-auto rounded-[var(--radius-lg)] shadow-md shadow-[var(--color-success)]/20">
                            <Camera size={24} />
                            <span className="text-xs font-medium">Lacre + Canhoto</span>
                        </button>
                        <button className="flex-1 btn-secondary flex flex-col items-center gap-1 py-3 h-auto rounded-[var(--radius-lg)]">
                            <Navigation size={24} className="text-[var(--color-primary)]" />
                            <span className="text-xs font-medium">Navegar</span>
                        </button>
                    </div>
                </div>

                {/* Route List */}
                <div>
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-4 px-1">Roteiro do Dia</h3>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                        {routes.map((route, idx) => (
                            <div key={idx} className={`p-4 flex gap-4 border-b border-[var(--color-border)] last:border-0 relative ${route.status === 'done' ? 'opacity-60 bg-[var(--color-surface-hover)]' : ''}`}>

                                {/* Timeline connector (visual) */}
                                {idx !== routes.length - 1 && (
                                    <div className="absolute left-[31px] top-10 bottom-[-16px] w-[2px] bg-[var(--color-border)]"></div>
                                )}

                                <div className="shrink-0 relative z-10">
                                    {route.status === 'done' ? (
                                        <CheckCircle size={24} className="text-[var(--color-success)] bg-[var(--color-surface)] rounded-full" />
                                    ) : route.status === 'current' ? (
                                        <div className="w-6 h-6 rounded-full border-4 border-[var(--color-primary)] bg-white shadow-[0_0_0_4px_rgba(79,70,229,0.2)]"></div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] bg-white"></div>
                                    )}
                                </div>

                                <div>
                                    <h4 className={`font-semibold text-sm ${route.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                                        {route.client}
                                    </h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{route.address}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}

