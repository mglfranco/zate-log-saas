import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function AdminTabelas() {
    const [rates, setRates] = useState({
        baseKm: 2.85,
        palletCost: 55.00,
        cubagemFactor: 300,
        adValoremPercent: 0.20,
        grisPercent: 0.30
    });

    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 800);
    };

    return (
        <div className="fade-in space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Tabelas de Frete</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Configure os algoritmos de preço da calculadora web.</p>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-primary)]/5">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <AlertCircle size={18} className="text-[var(--color-primary)]" />
                        Variáveis Globais
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Estes valores afetam imediatamente todas as novas cotações geradas pelo site.
                    </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Section 1 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Custos Base</h3>

                        <div className="input-group">
                            <label>Taxa Base por Km (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={rates.baseKm}
                                onChange={e => setRates({ ...rates, baseKm: parseFloat(e.target.value) })}
                                className="calc-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>Custo Fixo por Pallet (R$)</label>
                            <input
                                type="number"
                                step="1"
                                value={rates.palletCost}
                                onChange={e => setRates({ ...rates, palletCost: parseFloat(e.target.value) })}
                                className="calc-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>Fator de Cubagem (kg/m³)</label>
                            <input
                                type="number"
                                step="10"
                                value={rates.cubagemFactor}
                                onChange={e => setRates({ ...rates, cubagemFactor: parseFloat(e.target.value) })}
                                className="calc-input"
                            />
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Taxas & Impostos</h3>

                        <div className="input-group">
                            <label>Ad Valorem (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={rates.adValoremPercent}
                                onChange={e => setRates({ ...rates, adValoremPercent: parseFloat(e.target.value) })}
                                className="calc-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>GRIS (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={rates.grisPercent}
                                onChange={e => setRates({ ...rates, grisPercent: parseFloat(e.target.value) })}
                                className="calc-input"
                            />
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface-hover)] flex justify-end">
                    <button onClick={handleSave} className="btn-primary" disabled={saving}>
                        {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
