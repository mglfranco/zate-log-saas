import streamlit as st
import pandas as pd
import requests
import time
from urllib.parse import quote
import os

try:
    from supabase import create_client
except ImportError:
    pass

# ==========================================
# 1. SETUP DE PÁGINA E CSS PREMIUM
# ==========================================
st.set_page_config(
    page_title="Zate Log | Premium SaaS",
    page_icon="🚛",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    /* Premium Dark/Yellow Theme Injection */
    .stApp {
        background-color: #121212;
        color: #FFFFFF;
    }
    .stButton>button {
        width: 100%;
        border-radius: 8px;
        font-weight: 800;
        background-color: #FACC15;
        color: #121212;
        border: none;
        transition: 0.3s;
        padding: 12px;
        font-size: 16px;
    }
    .stButton>button:hover {
        background-color: #EAB308;
        color: #000;
        border: 1px solid #FFF;
        transform: scale(1.02);
    }
    .metric-value {
        color: #FACC15;
        font-size: 32px;
        font-weight: 900;
        text-shadow: 0px 2px 4px rgba(0,0,0,0.5);
    }
    h1, h2, h3 {
        color: #FACC15 !important;
    }
    .card {
        background-color: #1E1E1E;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #333;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    .premium-divider {
        height: 2px;
        background: linear-gradient(90deg, transparent, #FACC15, transparent);
        margin: 20px 0;
    }
    .stDataFrame {
        border-radius: 8px;
        overflow: hidden;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# 2. CONEXÃO BANCO DE DADOS
# ==========================================
@st.cache_resource
def init_connection():
    if "SUPABASE_URL" in st.secrets and "SUPABASE_KEY" in st.secrets:
        return create_client(st.secrets["SUPABASE_URL"], st.secrets["SUPABASE_KEY"])
    return None

supabase = init_connection()

def fetch_settings():
    default_sts = {"cost_per_km": 4.5, "drop_fee": 100.0}
    if supabase:
        try:
            r = supabase.table("zate_settings").select("*").eq("id", 1).execute()
            if r.data: return r.data[0]
        except: pass
    return default_sts

# ==========================================
# 3. LÓGICA DE GEOLOCALIZAÇÃO E ROTAS
# ==========================================
@st.cache_data
def geocode_city(city_name):
    query = f"{city_name}, SC, Brasil" if "-" not in city_name else f"{city_name}, Brasil"
    try:
        res = requests.get(f"https://nominatim.openstreetmap.org/search?format=json&q={quote(query)}", headers={'User-Agent': 'ZateLogBR/2.0'})
        data = res.json()
        if data:
            return [float(data[0]['lon']), float(data[0]['lat'])]
    except: pass
    return None

@st.cache_data
def get_osrm_route(coords):
    coords_str = ";".join([f"{c[0]},{c[1]}" for c in coords])
    try:
        res = requests.get(f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=false")
        data = res.json()
        if data and 'routes' in data and len(data['routes']) > 0:
            return data['routes'][0]['distance'] / 1000
    except: pass
    return None

# ==========================================
# 4. INTERFACE PRINCIPAL
# ==========================================

# HEADER
c1, c2, c3 = st.columns([1, 2, 1])
with c2:
    if os.path.exists("logo.png"):
        st.image("logo.png", use_container_width=True)
    else:
        st.markdown("<h1 style='text-align: center;'>ZATE LOG</h1>", unsafe_allow_html=True)
    st.markdown("<h4 style='text-align: center; color: #AAA;'>Simulador Avançado de Fretes Fracionados</h4>", unsafe_allow_html=True)

st.markdown("<div class='premium-divider'></div>", unsafe_allow_html=True)

tab_calc, tab_admin = st.tabs(["🛣️ Cotação de Carga", "🔒 Painel Administrativo"])

with tab_calc:
    col_left, col_right = st.columns([1.2, 1])
    
    with col_left:
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        st.subheader("📍 Roteirização Inteligente")
        origin = st.text_input("Cidade de Origem", value="Joinville - SC")
        
        st.write("Cidades de Destino & Número de Entregas (Clientes)")
        # Tabela editável para múltiplos destinos organizados
        if 'destinations_df' not in st.session_state:
            st.session_state.destinations_df = pd.DataFrame([
                {"Cidade": "Jaguaruna - SC", "Clientes_Paradas": 5},
                {"Cidade": "Rio Fortuna - SC", "Clientes_Paradas": 1},
                {"Cidade": "Ararangua - SC", "Clientes_Paradas": 2},
                {"Cidade": "Balneario Rincao - SC", "Clientes_Paradas": 2},
                {"Cidade": "Turvo - SC", "Clientes_Paradas": 1},
                {"Cidade": "Biguaçu - SC", "Clientes_Paradas": 2}
            ])
            
        edited_df = st.data_editor(
            st.session_state.destinations_df,
            num_rows="dynamic",
            use_container_width=True,
            column_config={
                "Cidade": st.column_config.TextColumn("Nome da Cidade / UF", required=True),
                "Clientes_Paradas": st.column_config.NumberColumn("Qtd de Clientes/Paradas", min_value=1, step=1, required=True)
            }
        )
        st.markdown("</div>", unsafe_allow_html=True)

    with col_right:
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        st.subheader("📦 Dados da Carga")
        
        c_req1, c_req2 = st.columns(2)
        with c_req1:
            cargo_qty = st.number_input("Volumes Totais", min_value=1, value=247)
            cargo_weight = st.number_input("Peso Bruto (kg)", min_value=1.0, value=5146.16, format="%.2f")
        with c_req2:
            invoice_value = st.number_input("Valor da NF (R$)", min_value=0.0, value=30051.32, format="%.2f")
            cargo_type = st.selectbox("Tipo de Material", ["Carga Mista (Fracionado)", "Seca Comum", "Refrigerada"])
            
        st.write("Adicionais Restritivos:")
        r1, r2, r3 = st.columns(3)
        with r1: needs_cold = st.checkbox("Refrigeração", value=("Refrigerada" in cargo_type))
        with r2: collect_empties = st.checkbox("Logística Reversa")
        with r3: vuc_rest = st.checkbox("Restrição VUC")
        st.markdown("</div>", unsafe_allow_html=True)

    # BOTÃO CENTRAL DE CÁLCULO
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("CALCULAR INVESTIMENTO LOGÍSTICO 🚀"):
        if edited_df.empty or edited_df["Cidade"].str.strip().eq("").all():
            st.error("🚨 Insira ao menos um destino válido.")
        else:
            with st.spinner("📡 Triangulando rotas OSRM via satélite e calculando tributos..."):
                # 1. Obter cidades válidas do grid (remover vazias e resetar erro)
                valid_dests = edited_df[edited_df["Cidade"].str.strip() != ""]
                cities_list = valid_dests["Cidade"].tolist()
                stops_list = valid_dests["Clientes_Paradas"].tolist()
                
                total_clients = sum(stops_list)
                
                # Geocode Route
                route_cities = [origin] + cities_list
                coords = []
                for city in route_cities:
                    c = geocode_city(city)
                    if c: coords.append(c)
                    time.sleep(1) # Beep Nomimatim API

                # Routing Distance
                dist_km = 0
                if len(coords) >= 2:
                    dist = get_osrm_route(coords)
                    if dist: dist_km = round(dist, 1)

                # Finance Math
                sts = fetch_settings()
                ckm = float(sts.get("cost_per_km", 4.5))
                c_drop = float(sts.get("drop_fee", 100.0))

                route_base_cost = dist_km * ckm
                
                # Total clients minus 1 (first client is the actual destination goal covered by KM base)
                extra_stops = total_clients - 1 if total_clients > 1 else 0
                drop_costs = extra_stops * c_drop
                
                total_percurso = route_base_cost + drop_costs

                gris_advalorem = float(invoice_value) * 0.005 # 0.5% sum of GRIS and Seguros
                
                # Handling factor based on weight or volumes
                base_cargo_handling = cargo_qty * 15.0 # R$15 per mixed pallet/volume
                if cargo_weight > 4000:
                    base_cargo_handling *= 1.4 # Overweight penalty handler
                    
                total_cargo = base_cargo_handling
                
                cold_fee = (total_percurso * 0.25) if needs_cold else 0
                rev_fee = 150.0 if collect_empties else 0
                vuc_fee = 250.0 if vuc_rest else 0
                
                partial_sum = total_percurso + gris_advalorem + total_cargo + cold_fee + rev_fee + vuc_fee
                
                # Tributação (Cálculo do ICMS "por dentro" - Padrão Fiscal)
                # Alíquota ICMS de transporte intermunicipal em SC é 12%
                aliquota_icms = 0.12
                total_final = partial_sum / (1 - aliquota_icms)
                icms_tax = total_final - partial_sum

                # Insert to Supabase
                if supabase and dist_km > 0:
                    try:
                        supabase.table("zate_quotes").insert({
                            "origin": origin,
                            "destinations": {"cities": cities_list, "stops": stops_list},
                            "total_volumes": int(cargo_qty),
                            "total_weight": float(cargo_weight),
                            "invoice_value": float(invoice_value),
                            "distance_km": dist_km,
                            "base_freight": float(total_percurso),
                            "cargo_cost": float(total_cargo),
                            "icms": float(icms_tax),
                            "total_suggested": float(total_final)
                        }).execute()
                    except: pass
                
                # RESULT SHOWCASE
                st.success("CÁLCULO E ROTEIRIZAÇÃO CONCLUÍDOS COM SUCESSO!", icon="✅")
                
                res_col1, res_col2 = st.columns([1, 1.5])
                with res_col1:
                    st.markdown("<div class='card' style='text-align: center;'>", unsafe_allow_html=True)
                    st.write("Distância Total Roteirizada OSRM")
                    st.markdown(f"<span class='metric-value'>{dist_km} km</span>", unsafe_allow_html=True)
                    st.write(f"Total de Clientes/Paradas Atendidas: **{total_clients}**")
                    st.markdown("</div>", unsafe_allow_html=True)
                    
                    st.markdown("<div class='card' style='text-align: center; border-color: #FACC15;'>", unsafe_allow_html=True)
                    st.write("VALOR ESTIMADO SUGERIDO")
                    st.markdown(f"<span class='metric-value'>R$ {total_final:,.2f}</span>", unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)
                    
                with res_col2:
                    st.markdown("<div class='card'>", unsafe_allow_html=True)
                    st.subheader("Desmembramento de Custos")
                    st.write(f"**Frete Percurso (KM Rodado):** R$ {route_base_cost:,.2f}")
                    st.write(f"**Taxas de Entregas Fracionadas ({extra_stops} extras):** R$ {drop_costs:,.2f}")
                    st.write(f"**GRIS + AdValorem (0.5% NF):** R$ {gris_advalorem:,.2f}")
                    st.write(f"**Operação de Carga/Cubagem:** R$ {total_cargo:,.2f}")
                    if needs_cold: st.write(f"**Refrigeração (25% Base):** R$ {cold_fee:,.2f}")
                    if collect_empties: st.write(f"**Logística Reversa:** R$ {rev_fee:,.2f}")
                    if vuc_rest: st.write(f"**Taxa Restrição VUC:** R$ {vuc_fee:,.2f}")
                    st.write(f"**Tributação (ICMS 12%):** R$ {icms_tax:,.2f}")
                    st.markdown("</div>", unsafe_allow_html=True)

with tab_admin:
    st.header("🏢 Zate Log Backoffice")
    if not supabase:
        st.warning("🚨 Supabase não configurado ou credenciais inválidas em `.streamlit/secrets.toml`")
    else:
        st.write("Visualização de Banco de Dados de Produção")
        dash_c1, dash_c2 = st.columns([1, 2])
        
        with dash_c1:
            st.markdown("<div class='card'>", unsafe_allow_html=True)
            st.subheader("Configurar Margens")
            curr = fetch_settings()
            n_cost = st.number_input("Cobrança por KM Rodado (R$)", value=float(curr.get("cost_per_km", 4.5)), step=0.1)
            n_drop = st.number_input("Taxa de Parada Extra (R$)", value=float(curr.get("drop_fee", 100.0)), step=10.0)
            if st.button("Atualizar SaaS Engine"):
                supabase.table("zate_settings").update({"cost_per_km": n_cost, "drop_fee": n_drop}).eq("id", 1).execute()
                st.success("Tabela de fretes Globais Atualizada!")
            st.markdown("</div>", unsafe_allow_html=True)
            
        with dash_c2:
            st.markdown("<div class='card'>", unsafe_allow_html=True)
            st.subheader("Auditoria de Leads Recentes")
            try:
                rq = supabase.table("zate_quotes").select("created_at, origin, total_suggested, distance_km").order("created_at", desc=True).limit(5).execute()
                if rq.data:
                    dfq = pd.DataFrame(rq.data)
                    st.dataframe(dfq, use_container_width=True)
                else:
                    st.info("Nenhuma cotação salva.")
            except:
                st.error("Erro ao ler quotes.")
            st.markdown("</div>", unsafe_allow_html=True)
