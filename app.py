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
    /* Premium Light/Yellow Theme Injection */
    .stApp {
        background-color: #FFFFFF;
        color: #121212;
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
        border: 1px solid #121212;
        transform: scale(1.02);
    }
    .metric-value {
        color: #121212;
        font-size: 32px;
        font-weight: 900;
        text-shadow: 0px 1px 2px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
        color: #121212 !important;
    }
    .card {
        background-color: #F8FAFC;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #E2E8F0;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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
        # Prevent DNS Error if user accidentally pasted URL with extra quotes in st.secrets
        clean_url = st.secrets["SUPABASE_URL"].strip().strip('"').strip("'")
        clean_key = st.secrets["SUPABASE_KEY"].strip().strip('"').strip("'")
        return create_client(clean_url, clean_key)
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
# 4. SISTEMA DE AUTENTICAÇÃO (LOGIN)
# ==========================================
if "user" not in st.session_state:
    st.session_state.user = None

def login_form():
    st.markdown("<h2 style='text-align: center; color: #121212;'>Zate Log | Portal</h2>", unsafe_allow_html=True)
    with st.form("login_form"):
        email = st.text_input("E-mail corporativo")
        password = st.text_input("Senha", type="password")
        col1, col2 = st.columns(2)
        with col1:
            submit_login = st.form_submit_button("Entrar", use_container_width=True)
        with col2:
            submit_register = st.form_submit_button("Criar Conta", use_container_width=True)
        
        import re

        if submit_register and supabase:
            try:
                # Sanitização Avançada: Regex limpa qualquer caractere escondido (ex: \u200b)
                safe_email = re.sub(r'[^a-zA-Z0-9_\-\.\@]', '', email).lower()
                auth_resp = supabase.auth.sign_up({"email": safe_email, "password": password})
                st.success("Conta criada! Verifique seu E-mail ou tente Entrar se não houver confirmação ativada.")
            except Exception as e:
                st.error(f"Erro no Registro: {e}")
                
        if submit_login and supabase:
            try:
                # Sanitização Avançada 
                safe_email = re.sub(r'[^a-zA-Z0-9_\-\.\@]', '', email).lower()
                auth_resp = supabase.auth.sign_in_with_password({"email": safe_email, "password": password})
                st.session_state.user = auth_resp.user
                st.rerun()
            except Exception as e:
                st.error("Credenciais inválidas ou erro de conexão falhou.")

# Se não estiver logado, bloqueia a tela inteira renderizando apenas o Login
if not st.session_state.user:
    st.markdown("<br><br>", unsafe_allow_html=True)
    c_empty1, c_auth, c_empty2 = st.columns([1, 2, 1])
    with c_auth:
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        login_form()
        st.markdown("</div>", unsafe_allow_html=True)
    st.stop()  # Impede que o resto do app.py seja lido!

# Botão de Logout para usuário logado
st.sidebar.write(f"👤 Logado como: **{st.session_state.user.email}**")
if st.sidebar.button("🚪 Sair do Sistema"):
    st.session_state.user = None
    if supabase: supabase.auth.sign_out()
    st.rerun()

# ==========================================
# 5. INTERFACE PRINCIPAL
# ==========================================

# HEADER
c1, c2, c3 = st.columns([1, 2, 1])
with c2:
    st.markdown("""
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 5px;">
            <div style="background-color: #FACC15; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <span style="color: #000000; font-size: 28px; font-weight: 900; font-family: sans-serif;">Z</span>
            </div>
            <h1 style="margin: 0; padding: 0; font-size: 38px; color: #121212 !important; font-weight: 900;">Zate Transportes</h1>
        </div>
    """, unsafe_allow_html=True)
    st.markdown("<h4 style='text-align: center; color: #666;'>Simulador Avançado de Fretes Fracionados</h4>", unsafe_allow_html=True)

st.markdown("<div class='premium-divider'></div>", unsafe_allow_html=True)

# Admin Authorization
ADMIN_EMAIL = "mglfranco15@gmail.com" # Exemplo de email do dono. Pode ser alterado depois.
is_admin = st.session_state.user and st.session_state.user.email == ADMIN_EMAIL

if is_admin:
    tab_calc, tab_admin = st.tabs(["🛣️ Cotação de Carga", "🔒 Painel Administrativo"])
else:
    tab_calc, = st.tabs(["🛣️ Cotação de Carga"])

with tab_calc:
    # Tabela editável para múltiplos destinos organizados e dados da carga
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.subheader("📍 Roteiros e Cargas")
    
    col_orig, col_type = st.columns([2, 1])
    with col_orig:
        origin = st.text_input("Cidade de Origem", value="Joinville - SC")
    with col_type:
        cargo_type = st.selectbox("Tipo de Material", ["Carga Mista (Fracionado)", "Comum", "Refrigerada"])
    
    st.write("Adicione os clientes, cidades e os dados das respectivas notas fiscais abaixo:")
    
    if 'destinations_df' not in st.session_state:
        # Colunas: Cliente/Bairro, Cidade / UF, Qtd Pallets, Peso Bruto (kg), Valor NF (R$)
        st.session_state.destinations_df = pd.DataFrame([
            {"Cliente": "Supermercado X - Centro", "Cidade": "Jaguaruna - SC", "Pallets": 2, "Peso": 1500.0, "NF": 12500.0},
            {"Cliente": "Distribuidora Y", "Cidade": "Turvo - SC", "Pallets": 1, "Peso": 850.5, "NF": 5300.20}
        ])
        
    edited_df = st.data_editor(
        st.session_state.destinations_df,
        num_rows="dynamic",
        use_container_width=True,
        column_config={
            "Cliente": st.column_config.TextColumn("Cliente e Bairro", required=True),
            "Cidade": st.column_config.TextColumn("Cidade / UF", required=True),
            "Pallets": st.column_config.NumberColumn("Qtd Pallets", min_value=1, step=1, required=True, format="%d"),
            "Peso": st.column_config.NumberColumn("Peso Bruto (kg)", min_value=0.1, step=10.0, required=True, format="%.2f"),
            "NF": st.column_config.NumberColumn("Valor NF (R$)", min_value=0.0, step=100.0, required=True, format="R$ %.2f")
        }
    )
    
    # Sincroniza estado para manter as edições e adições
    st.session_state.destinations_df = edited_df
    
    c_add = st.columns([1, 2])
    if c_add[0].button("➕ Adicionar Linha / Cliente"):
        new_row = pd.DataFrame([{"Cliente": "Novo Cliente", "Cidade": "Nova Cidade - SC", "Pallets": 1, "Peso": 1000.0, "NF": 5000.0}])
        st.session_state.destinations_df = pd.concat([st.session_state.destinations_df, new_row], ignore_index=True)
        st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown("<div class='card'>", unsafe_allow_html=True)
    st.write("Adicionais Restritivos:")
    r1, r2, r3 = st.columns(3)
    with r1: needs_cold = st.checkbox("Refrigeração", value=("Refrigerada" in cargo_type))
    with r2: collect_empties = st.checkbox("Logística Reversa")
    with r3: vuc_rest = st.checkbox("Restrição VUC")
    st.markdown("</div>", unsafe_allow_html=True)

    # BOTÃO CENTRAL DE CÁLCULO
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("CALCULAR FRETE 🚀"):
        if edited_df.empty or edited_df["Cidade"].str.strip().eq("").all():
            st.error("🚨 Insira ao menos um destino válido.")
        else:
            with st.spinner("📡 Triangulando rotas OSRM via satélite e calculando tributos..."):
                # 1. Obter cidades válidas do grid (remover vazias e resetar erro)
                valid_dests = edited_df[edited_df["Cidade"].str.strip() != ""]
                cities_list = valid_dests["Cidade"].tolist()
                
                # Opcional: Lista de Clientes para uso no WhatsApp
                clients_list = valid_dests["Cliente"].tolist()
                
                # Cada linha na nova tabela representa 1 Cliente/Parada
                total_clients = len(valid_dests)
                
                # Agregação Matemática dos inputs dinâmicos
                cargo_qty = valid_dests["Pallets"].sum()
                cargo_weight = valid_dests["Peso"].sum()
                invoice_value = valid_dests["NF"].sum()
                
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
                            "destinations": {"cities": cities_list, "clients": clients_list},
                            "total_volumes": int(cargo_qty),
                            "total_weight": float(cargo_weight),
                            "invoice_value": float(invoice_value),
                            "distance_km": dist_km,
                            "base_freight": float(total_percurso),
                            "cargo_cost": float(total_cargo),
                            "icms": float(icms_tax),
                            "total_suggested": float(total_final)
                        }).execute()
                    except Exception as e:
                        st.error(f"⚠️ Erro ao salvar cotação no Supabase: {str(e)}")
                
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
                    st.write(f"**Tributação (ICMS 12%):** R$ {icms_tax:,.2f}")
                    st.markdown("</div>", unsafe_allow_html=True)

                # ==========================================
                # BOTÃO DE WHATSAPP NEGOCIAÇÃO
                # ==========================================
                st.markdown("<br>", unsafe_allow_html=True)
                
                # Montando a mensagem para o WhatsApp
                lista_cidades = ", ".join(cities_list)
                zap_msg = f"Olá Zate Transportes, fiz uma simulação no App e gostaria de negociar uma carga! 🚛\n\n"
                zap_msg += f"📍 *Origem:* {origin}\n"
                zap_msg += f"🎯 *Destinos ({total_clients} clientes):* {lista_cidades}\n➖➖➖➖➖➖\n"
                zap_msg += f"📦 *Volumes:* {cargo_qty} un\n"
                zap_msg += f"⚖️ *Peso:* {cargo_weight} kg\n"
                zap_msg += f"🧾 *Valor NF:* R$ {invoice_value:,.2f}\n➖➖➖➖➖➖\n"
                zap_msg += f"💰 *Investimento Sugerido:* R$ {total_final:,.2f}\n"
                zap_msg += f"\nVamos fechar?"
                
                msg_encoded = quote(zap_msg)
                WHATSAPP_NUMBER = "5545984180671" # <- O USUÁRIO PODE MUDAR ESSE NÚMERO AQUI
                zap_link = f"https://wa.me/{WHATSAPP_NUMBER}?text={msg_encoded}"
                
                col_btn = st.columns([1, 2, 1])
                with col_btn[1]:
                    st.link_button("📱 NEGOCIAR PELO WHATSAPP", zap_link, type="primary", use_container_width=True)
                
if is_admin:
    with tab_admin:
        st.header("🏢 Zate Log Backoffice")
    if not supabase:
        st.warning("🚨 Supabase não configurado ou credenciais inválidas em `.streamlit/secrets.toml`")
    else:
        st.write("Visualização de Banco de Dados de Produção")
        
        # --- B.I. DASHBOARD ---
        st.markdown("<h3 style='margin-top: 20px; color: #121212;'>📊 Painel de Inteligência Comercial</h3>", unsafe_allow_html=True)
        try:
            rq_all = supabase.table("zate_quotes").select("created_at, origin, total_suggested, distance_km").execute()
            if rq_all.data:
                df_all = pd.DataFrame(rq_all.data)
                df_all['total_suggested'] = pd.to_numeric(df_all['total_suggested'], errors='coerce').fillna(0)
                
                total_cotado = df_all['total_suggested'].sum()
                total_leads = len(df_all)
                ticket_medio = total_cotado / total_leads if total_leads > 0 else 0
                
                m1, m2, m3 = st.columns(3)
                m1.metric(label="💰 Volume Total Cotado", value=f"R$ {total_cotado:,.2f}")
                m2.metric(label="👥 Total de Leads (Cotações)", value=f"{total_leads}")
                m3.metric(label="📈 Ticket Médio", value=f"R$ {ticket_medio:,.2f}")
                
                st.markdown("<br>", unsafe_allow_html=True)
                
                # Ranking de Cidades Origem (Mapa de Calor Simples)
                st.write("**Top Cidades de Origem Cotadas**")
                city_counts = df_all['origin'].value_counts().reset_index()
                city_counts.columns = ['Cidade Origem', 'Qtd de Cotações']
                st.bar_chart(city_counts.set_index('Cidade Origem'))
            else:
                st.info("Aguardando novas cotações para gerar inteligência de dados.")
        except Exception as e:
            st.error(f"Erro no módulo de B.I.: {e}")
            
        st.markdown("<div class='premium-divider'></div>", unsafe_allow_html=True)
        
        # --- INFRAESTRUTURA ADMIN ---
        dash_c1, dash_c2 = st.columns([1, 2])
        
        with dash_c1:
            st.markdown("<div class='card'>", unsafe_allow_html=True)
            st.subheader("Configurar Margens")
            curr = fetch_settings()
            n_cost = st.number_input("Cobrança por KM Rodado (R$)", value=float(curr.get("cost_per_km", 4.5)), step=0.1)
            n_drop = st.number_input("Taxa de Parada Extra (R$)", value=float(curr.get("drop_fee", 100.0)), step=10.0)
            if st.button("Atualizar SaaS Engine"):
                try:
                    supabase.table("zate_settings").update({"cost_per_km": n_cost, "drop_fee": n_drop}).eq("id", 1).execute()
                    st.success("Tabela de fretes Globais Atualizada!")
                except Exception as e:
                    st.error(f"🚨 Falha de Conexão com o Banco de Dados. O sistema não pode salvar a alteração. Detalhes: {e}")
                    st.warning("👉 DICA: Isso ocorre porque a URL do Supabase (SUPABASE_URL) configurada nos 'Secrets' do Streamlit Cloud está incorreta ou o servidor está offline. Atualize os Secrets.")
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
            except Exception as e:
                st.error(f"Erro ao ler quotes: {str(e)} | Supabase URL: '{st.secrets.get('SUPABASE_URL', '')}'")
            st.markdown("</div>", unsafe_allow_html=True)
