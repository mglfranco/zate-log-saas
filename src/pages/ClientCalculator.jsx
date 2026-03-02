import { useState } from 'react';
import { MapPin, ArrowRight, Info, CheckCircle2, Beer, ThermometerSnowflake, Package, Plus, X, Truck, Loader2 } from 'lucide-react';
import { scCities } from '../data/scCities';
import '../styles/calculator.css';

export default function CalculatorPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        origin: 'Joinville - SC',
        destinations: ['Pomerode - SC'], // Array of destinations
        cargoType: 'keg', // 'keg', 'crate', 'loose'
        quantity: 1, // Can be number of kegs or pallets depending on type
        weight: '',
        invoiceValue: '',
        needsRefrigeration: false,
        collectEmpties: false,
        vucRestriction: false,
        proposedPrice: '', // Custom offer from the client
    });

    const priorityRegions = [
        "Rio do Sul - SC",
        "Pomerode - SC",
        "Curitiba - PR",
        "São Paulo - SP",
    ];

    // Remove duplicates from IBGE array that we already prioritized
    const otherSCCities = Array.from(new Set(scCities.filter(city => city !== "Rio do Sul - SC" && city !== "Pomerode - SC"))).sort();

    const regions = [
        ...priorityRegions,
        ...otherSCCities,
        "Outra Região (Sob Consulta)"
    ];

    const [isCalculating, setIsCalculating] = useState(false);
    const [quote, setQuote] = useState(null);

    const handleNext = () => setStep((s) => Math.min(s + 1, 3));
    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const geocodeCity = async (cityName) => {
        try {
            const query = cityName.includes(' SC') || cityName.includes(' PR') || cityName.includes(' SP') || cityName.includes(' RS') ? `${cityName}, Brasil` : cityName;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
            }
            return null;
        } catch (e) {
            console.error("Erro geocoding", cityName, e);
            return null;
        }
    };

    const getOSRMRoute = async (coordinatesArray) => {
        const coordsStr = coordinatesArray.map(c => `${c[0]},${c[1]}`).join(';');
        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`);
            const data = await response.json();
            if (data && data.routes && data.routes.length > 0) {
                return data.routes[0].distance / 1000;
            }
            return null;
        } catch (e) {
            console.error("Erro routing", e);
            return null;
        }
    };

    const calculateFreight = async () => {
        setIsCalculating(true);
        try {
            const citiesToRoute = [formData.origin, ...formData.destinations];
            const coords = [];

            for (const city of citiesToRoute) {
                if (city === 'Outra Região (Sob Consulta)') continue;

                const coord = await geocodeCity(city);
                if (coord) {
                    coords.push(coord);
                }
                // Respeitar limite da API Nominatim (requer ~1 seg entre reqs)
                await new Promise(r => setTimeout(r, 800));
            }

            let totalDistanceKm = 0;
            let requiresManualQuote = formData.destinations.includes('Outra Região (Sob Consulta)');

            if (coords.length >= 2 && !requiresManualQuote) {
                const calculatedDistance = await getOSRMRoute(coords);
                if (calculatedDistance !== null) {
                    totalDistanceKm = Math.round(calculatedDistance);
                } else {
                    requiresManualQuote = true;
                }
            } else {
                requiresManualQuote = true;
            }

            // Novo cálculo de frete base via distância (R$ 4,50 / km por exemplo)
            const costPerKm = 4.50;

            // Multi-stop Drop Fee: Primeira entrega está no frete base, extras +R$100
            const dropFee = formData.destinations.length > 1 && !requiresManualQuote ? (formData.destinations.length - 1) * 100 : 0;

            const routeBasePrice = requiresManualQuote ? 0 : (totalDistanceKm * costPerKm) + dropFee;
            const distanceKm = totalDistanceKm;

            const val = parseFloat(formData.invoiceValue) || 0;

            // Base costs
            const gris = val * 0.003;
            const adValorem = val * 0.002;

            // Cargo unit cost & Volume penalties
            let unitCost = 0;
            if (formData.cargoType === 'keg') {
                unitCost = 25; // 25 per keg
            } else if (formData.cargoType === 'crate') {
                unitCost = 60; // 60 per pallet of crates (fragile)
            } else if (formData.cargoType === 'loose') {
                unitCost = 40; // 40 per pallet of cans
            } else {
                unitCost = 50; // mixed
            }

            const baseCargoCost = formData.quantity * unitCost;

            // Volume Penalty (Truck vs Toco limit logic)
            const needsBiggerTruck =
                (formData.cargoType === 'keg' && formData.quantity > 30) ||
                (formData.cargoType !== 'keg' && formData.quantity > 4);

            const cargoCost = needsBiggerTruck ? baseCargoCost * 1.5 : baseCargoCost;

            // Brewery specific fees
            const coldChainFee = formData.needsRefrigeration && routeBasePrice > 0 ? ((routeBasePrice + cargoCost) * 0.25) : 0;
            const reverseLogisticsFee = formData.collectEmpties ? 120 : 0;
            const vucFee = formData.vucRestriction ? 200 : 0;

            const partialTotal = routeBasePrice + gris + adValorem + cargoCost + coldChainFee + reverseLogisticsFee + vucFee;
            const icmsFee = routeBasePrice > 0 ? partialTotal * 0.12 : 0; // 12% ICMS

            setQuote({
                baseFreight: routeBasePrice,
                gris: gris + adValorem,
                cargoCost: cargoCost,
                coldChainFee,
                reverseLogisticsFee,
                vucFee,
                icms: icmsFee,
                total: routeBasePrice === 0 ? 0 : partialTotal + icmsFee,
                distance: distanceKm,
            });
            setStep(3);
        } catch (error) {
            console.error("Erro ao calcular frete:", error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleWhatsApp = () => {
        const hasOffer = formData.proposedPrice && parseFloat(formData.proposedPrice) > 0;
        const offerText = hasOffer ? ` A tabela sugeriu R$ ${quote.total.toFixed(2)}, mas minha proposta imediata é fechar por *R$ ${parseFloat(formData.proposedPrice).toFixed(2)}*. Fechamos negócio?` : ` O valor de tabela sugerido foi R$ ${quote.total.toFixed(2)}. Podemos seguir com a contratação?`;

        let destString = '';
        if (formData.destinations.length === 1) {
            destString = formData.destinations[0];
        } else {
            destString = `múltiplas entregas: ${formData.destinations.map((d, i) => `${i + 1}. ${d}`).join(', ')}`;
        }

        const noQuoteText = ` Olá Zate! Tenho uma carga especial de Joinville com destino a *${destString}*. Como parte da viagem exigirá rota dedicada/consulta prévia, gostaria de abrir negociação para o pacote fechado.`;

        const cargoName = formData.cargoType === 'keg' ? 'barris' : formData.cargoType === 'crate' ? 'pallets de garrafas' : formData.cargoType === 'loose' ? 'pallets de latas' : 'pallets mistos';

        const text = quote.baseFreight === 0
            ? noQuoteText
            : `Olá Zate! Tenho uma carga saindo de Joinville para *${destString}*. Carga: ${formData.quantity} ${cargoName}, total de ${formData.weight}kg. Refrigeração: ${formData.needsRefrigeration ? 'Sim' : 'Não'}.${offerText}`;

        window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="calculator-container slide-in-bottom">

            {/* Header Section */}
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                    <div className="bg-[var(--color-surface)] shadow-md p-2 rounded-xl border-2 border-[var(--color-border)]">
                        <div className="text-4xl font-black italic text-[var(--color-text-primary)] tracking-tighter w-14 h-14 flex items-center justify-center border-4 border-[var(--color-primary)] rounded-lg">
                            Z
                        </div>
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4 tracking-tight">
                    Zate Log
                </h1>
                <p className="text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
                    Logística Cervejeira Oficial. Rio do Sul, Pomerode e todo o Brasil.
                </p>
            </div>

            {/* Main Card */}
            <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-8 absolute top-0 left-0 w-full">
                    <div className={`h-1.5 flex-1 transition-all ${step >= 1 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                    <div className={`h-1.5 flex-1 transition-all ${step >= 2 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                    <div className={`h-1.5 flex-1 transition-all ${step >= 3 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`} />
                </div>

                {/* Step 1: Origem e Destino */}
                {step === 1 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <MapPin className="text-[var(--color-primary)]" /> Para onde vamos?
                        </h2>
                        <div className="space-y-4">
                            <div className="input-group">
                                <label>Região de Origem</label>
                                <div className="calc-input bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] font-medium flex items-center cursor-not-allowed">
                                    Joinville - SC (Fábrica Opa Bier)
                                </div>
                            </div>

                            {formData.destinations.map((dest, index) => (
                                <div key={index} className="input-group relative animate-fade-in">
                                    <div className="absolute left-6 -top-2 bottom-6 w-[2px] bg-dashed border-l-2 border-dashed border-[var(--color-border)] z-0 hidden md:block"></div>
                                    <label className="flex justify-between items-center">
                                        <span>Destino {index + 1}</span>
                                        {index > 0 && (
                                            <button
                                                onClick={() => {
                                                    const newDest = [...formData.destinations];
                                                    newDest.splice(index, 1);
                                                    setFormData({ ...formData, destinations: newDest });
                                                }}
                                                className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 p-1 rounded-md transition-colors text-xs flex items-center gap-1"
                                            >
                                                <X size={14} /> Remover
                                            </button>
                                        )}
                                    </label>
                                    <select
                                        value={dest}
                                        onChange={(e) => {
                                            const newDest = [...formData.destinations];
                                            newDest[index] = e.target.value;
                                            setFormData({ ...formData, destinations: newDest });
                                        }}
                                        className="calc-input bg-white relative z-10"
                                    >
                                        {regions.map((r, i) => <option key={`${r}-${i}`} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            ))}

                            {formData.destinations.length < 4 && (
                                <div className="pt-2 pl-2 border-l-2 border-dashed border-[var(--color-border)] ml-6 md:ml-6 mt-[-10px] pb-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, destinations: [...formData.destinations, 'Pomerode - SC'] })}
                                        className="text-[var(--color-primary)] font-medium text-sm flex items-center gap-1 hover:underline ml-6"
                                    >
                                        <Plus size={16} /> Adicionar Parada Extra (R$ 100/ponto)
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleNext} className="btn-primary" disabled={!formData.origin || formData.destinations.length === 0}>
                                Próximo passo <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Carga */}
                {step === 2 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <ThermometerSnowflake className="text-[var(--color-secondary)]" /> Captação de Lotes
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="input-group col-span-2 md:col-span-1">
                                <label>Tipo de Carga</label>
                                <select
                                    value={formData.cargoType}
                                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                                    className="calc-input bg-white"
                                >
                                    <option value="keg">Barris de Chopp (Kegs)</option>
                                    <option value="crate">Engradados (Garrafas)</option>
                                    <option value="loose">Latas/Fardos</option>
                                    <option value="mixed">Misto</option>
                                </select>
                            </div>
                            <div className="input-group col-span-2 md:col-span-1">
                                <label>Quantidade (Unidades/Pallets)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    className="calc-input"
                                />
                            </div>
                            <div className="input-group col-span-2 md:col-span-1">
                                <label>Peso Físico Total (kg)</label>
                                <input
                                    type="number"
                                    placeholder="Ex: 800"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="calc-input"
                                />
                            </div>
                            <div className="input-group col-span-2 md:col-span-1">
                                <label className="flex items-center gap-2">
                                    Valor da Nota Fiscal (R$)
                                    <span className="tooltip" title="Necessário para cálculo de seguro">
                                        <Info size={16} className="text-[var(--color-text-muted)]" />
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Ex: 15000"
                                    value={formData.invoiceValue}
                                    onChange={(e) => setFormData({ ...formData, invoiceValue: e.target.value })}
                                    className="calc-input"
                                />
                            </div>

                            {/* Brewery Specific Toggles */}
                            <div className="col-span-2 space-y-3 mt-4 border-t border-[var(--color-border)] pt-4">
                                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Exigências Específicas</h3>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.needsRefrigeration}
                                        onChange={(e) => setFormData({ ...formData, needsRefrigeration: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="font-medium">Cadeia de Frio Cervejeira (Caminhão Refrigerado)</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.collectEmpties}
                                        onChange={(e) => setFormData({ ...formData, collectEmpties: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="font-medium">Logística Reversa (Coleta de Barris/Cascos Vazios)</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.vucRestriction}
                                        onChange={(e) => setFormData({ ...formData, vucRestriction: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="font-medium">Restrição de Acesso VUC (Bares/Centros Urbanos)</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            <button onClick={handleBack} className="btn-secondary" disabled={isCalculating}>Voltar</button>
                            <button onClick={calculateFreight} className="btn-primary" disabled={!formData.weight || !formData.invoiceValue || isCalculating}>
                                {isCalculating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Calculando...
                                    </>
                                ) : (
                                    "Calcular Frete"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Resultado & Handoff */}
                {step === 3 && quote && (
                    <div className="fade-in text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-[var(--color-success)]/10 rounded-full mb-6">
                            <CheckCircle2 size={48} className="text-[var(--color-success)]" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Simulação Concluída!</h2>
                        <p className="text-[var(--color-text-secondary)] mb-8">
                            Distância calculada: ~{quote.distance} km
                        </p>

                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 mb-8 inline-block w-full max-w-sm mx-auto shadow-sm text-left">
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-[var(--color-text-secondary)]">Frete Base</span>
                                <span>R$ {quote.baseFreight.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-[var(--color-text-secondary)]">GRIS + AdValorem</span>
                                <span>R$ {quote.gris.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="text-[var(--color-text-secondary)]">Custo de Carga</span>
                                <span>R$ {quote.cargoCost.toFixed(2)}</span>
                            </div>
                            {quote.icms > 0 && (
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-[var(--color-text-secondary)]">ICMS (12%)</span>
                                    <span>R$ {quote.icms.toFixed(2)}</span>
                                </div>
                            )}
                            {quote.coldChainFee > 0 && (
                                <div className="flex justify-between mb-2 text-sm text-[var(--color-secondary)] font-medium">
                                    <span>Tx. Refrigeração (Cold Chain)</span>
                                    <span>+ R$ {quote.coldChainFee.toFixed(2)}</span>
                                </div>
                            )}
                            {quote.reverseLogisticsFee > 0 && (
                                <div className="flex justify-between mb-2 text-sm text-[var(--color-primary)] font-medium">
                                    <span>Logística Reversa (Vazios)</span>
                                    <span>+ R$ {quote.reverseLogisticsFee.toFixed(2)}</span>
                                </div>
                            )}
                            {quote.vucFee > 0 && (
                                <div className="flex justify-between mb-4 text-sm text-[var(--color-error)] font-medium">
                                    <span>Tx. Restrição VUC</span>
                                    <span>+ R$ {quote.vucFee.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t border-[var(--color-border)] pt-4 mt-2 mb-6">
                                <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Valor Estimado Sugerido</p>
                                <p className="text-4xl font-bold text-[var(--color-text-primary)] flex items-baseline gap-2">
                                    {quote.total > 0 ? `R$ ${quote.total.toFixed(2).replace('.', ',')}` : 'Sob Consulta'}
                                </p>
                            </div>

                            {quote.total > 0 && (
                                <div className="bg-[var(--color-primary)]/10 p-4 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 mt-4">
                                    <label className="text-sm font-semibold text-[var(--color-text-primary)] block mb-2">
                                        Proposta de Acordo (Opcional)
                                    </label>
                                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                                        Gostaria de sugerir um valor de fechamento rápido direto no WhatsApp do Zate?
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--color-text-secondary)]">R$</span>
                                        <input
                                            type="number"
                                            placeholder="Ex: 750"
                                            className="w-full p-2 text-lg font-bold bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            value={formData.proposedPrice}
                                            onChange={(e) => setFormData({ ...formData, proposedPrice: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-md mx-auto">
                            Ao clicar abaixo, você será redirecionado para o WhatsApp direto do Zate para bater o martelo sobre a carga.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => setStep(1)} className="btn-secondary">Nova Cotação</button>
                            <button onClick={handleWhatsApp} className="btn-success flex items-center justify-center gap-2">
                                <Truck size={20} /> Negociar no WhatsApp
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
