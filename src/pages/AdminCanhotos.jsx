import { Receipt, FileImage, Check } from 'lucide-react';

export default function AdminCanhotos() {
    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gestão de Canhotos</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Aprove comprovantes de entrega para iniciar o faturamento bancário.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { id: 'NF-9081', status: 'pending', date: 'Hoje, 14:30' },
                    { id: 'NF-9082', status: 'pending', date: 'Hoje, 15:10' },
                    { id: 'NF-9083', status: 'approved', date: 'Ontem, 09:15' },
                ].map((nf, idx) => (
                    <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                        {/* Image placeholder */}
                        <div className="h-40 bg-[var(--color-border)] flex items-center justify-center relative">
                            <FileImage size={40} className="text-[var(--color-text-muted)] opacity-50" />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Foto Motorista</div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold flex items-center gap-2"><Receipt size={16} /> {nf.id}</h3>
                                {nf.status === 'approved' && <Check size={18} className="text-[var(--color-success)]" />}
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mb-4">Recebido: {nf.date}</p>

                            {nf.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <button className="btn-success flex-1 text-sm py-1.5 flex justify-center gap-1">
                                        Aprovar
                                    </button>
                                    <button className="btn-secondary flex-1 text-sm py-1.5 border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
                                        Recusar
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm text-[var(--color-success)] font-medium text-center bg-[var(--color-success)]/10 py-1.5 rounded">
                                    Faturamento Liberado
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
