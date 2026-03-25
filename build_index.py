import os

html_content = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Damas Clean - Gerador de Orçamento Premium</title>
    <meta name="description" content="Sistema de geração de orçamentos profissionais da Damas Clean - Higienização de Estofados">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
    <style>
        :root {
            --primary: #0F172A; /* Azul Escuro Premium */
            --primary-hover: #1E293B;
            --brand: #2563EB; /* Azul Royal Marca */
            --brand-light: #EFF6FF;
            --success: #10B981;
            --success-light: #ECFDF5;
            --background: #F8FAFC;
            --surface: #FFFFFF;
            --text-main: #0F172A;
            --text-muted: #64748B;
            --border: #E2E8F0;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            --radius-md: 12px;
            --radius-lg: 16px;
            --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--background);
            color: var(--text-main);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            overflow-y: scroll;
        }

        /* HEADER */
        .app-header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 50;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: var(--shadow-sm);
        }
        .brand-section {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .brand-logo {
            width: 40px; height: 40px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid var(--border);
        }
        .brand-text h1 { font-size: 1.125rem; font-weight: 700; color: var(--primary); letter-spacing: -0.01em; }
        .brand-text p { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
        
        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .status-badge {
            background: #FEF3C7; color: #92400E;
            padding: 4px 10px; border-radius: 999px;
            font-size: 0.75rem; font-weight: 600;
        }
        
        /* LAYOUT */
        .app-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* TOP CARDS */
        .top-cards {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 20px;
        }
        
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
        }
        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            color: var(--primary);
            background: #FAFAFA;
        }
        .card-header .icon {
            font-size: 1.1rem;
        }
        .card-body {
            padding: 20px;
        }

        /* GRID FOR FORM */
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
        }
        .form-group {
            display: flex; flex-direction: column; gap: 6px;
        }
        .form-group.col-span-2 { grid-column: span 2; }
        .form-group label {
            font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
        }
        .form-control {
            padding: 10px 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 0.9rem;
            font-family: inherit;
            color: var(--text-main);
            transition: var(--transition);
            background: var(--surface);
        }
        .form-control:focus {
            outline: none; border-color: var(--brand);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-control[readonly] { background: var(--background); color: var(--text-muted); cursor: default; }

        /* SPLIT SCREEN */
        .split-layout {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 24px;
            align-items: start;
        }

        /* CATALOG PANEL */
        .catalog-panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .catalog-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .catalog-header h2 { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
        .service-counter {
            background: var(--brand-light); color: var(--brand);
            padding: 4px 12px; border-radius: 999px;
            font-size: 0.75rem; font-weight: 600;
            transition: var(--transition);
        }
        .service-counter.active { background: var(--success); color: white; }

        .search-wrap {
            padding: 16px 20px;
            background: #FAFAFA;
            border-bottom: 1px solid var(--border);
        }
        .search-input {
            width: 100%;
            padding: 12px 16px 12px 40px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 0.95rem;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%2364748B" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>') no-repeat 14px center;
            background-color: var(--surface);
            transition: var(--transition);
        }
        .search-input:focus {
            outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .services-list {
            padding: 12px 20px 24px;
            min-height: 400px;
        }
        
        /* CATEGORY ACCORDION */
        .category-group {
            margin-top: 16px;
        }
        .category-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center;
        }
        .category-subtitle { font-size: 0.7rem; font-weight: 400; text-transform: none; background:#FEF3C7; color:#92400E; padding: 2px 6px; border-radius: 4px;}

        /* SERVICE CARD */
        .service-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 14px 16px;
            margin-bottom: 10px;
            transition: var(--transition);
        }
        .service-card:hover { border-color: #CBD5E1; box-shadow: var(--shadow-sm); }
        .service-card.selected { border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); background: #F8FAFC; }
        
        .svc-info { flex: 1; }
        .svc-name { font-weight: 600; font-size: 0.95rem; color: var(--primary); }
        .svc-price { font-weight: 700; color: var(--brand); font-size: 0.85rem; margin-top: 4px; }
        .svc-package-tag { font-size: 0.7rem; color: var(--success); font-weight: 600; background: var(--success-light); padding: 2px 6px; border-radius: 4px; margin-left: 8px; }

        .svc-controls {
            display: flex; align-items: center; gap: 16px;
        }
        
        /* Stepper */
        .stepper {
            display: inline-flex;
            align-items: center;
            background: var(--background);
            border-radius: 8px;
            border: 1px solid var(--border);
            overflow: hidden;
        }
        .stepper button {
            background: transparent; border: none; width: 32px; height: 32px;
            font-size: 1.1rem; color: var(--text-muted); cursor: pointer; transition: var(--transition);
            display: flex; align-items: center; justify-content: center;
        }
        .stepper button:hover { background: var(--border); color: var(--primary); }
        .stepper input {
            width: 36px; height: 32px; border: none; border-left: 1px solid var(--border); border-right: 1px solid var(--border);
            text-align: center; font-weight: 600; font-family: inherit; font-size: 0.95rem; color: var(--primary); background: transparent;
        }
        .stepper input:focus { outline: none; }

        .svc-total {
            font-weight: 700; width: 85px; text-align: right; color: var(--text-main); font-size: 0.95rem;
        }
        .svc-total.active { color: var(--success); }
        
        .svc-discount-wrap {
            display: flex; align-items: center; gap: 6px; margin-top: 6px; background: #fff; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); width: fit-content;
        }
        .svc-discount-wrap label { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
        .svc-discount-wrap input { width: 50px; border: none; font-size: 0.8rem; font-weight: 600; color: var(--primary); outline: none; text-align: right; }

        /* UPSELL */
        .upsell-box {
            margin: 0 20px 20px;
            background: linear-gradient(to right, #FFFBEB, #FEF3C7);
            border: 1px solid #FDE68A;
            border-radius: var(--radius-md);
            padding: 16px;
            display: flex; align-items: center; gap: 16px;
        }
        .upsell-icon { font-size: 2rem; }
        .upsell-content { flex: 1; }
        .upsell-content h4 { color: #92400E; font-size: 0.95rem; font-weight: 700; margin-bottom: 2px;}
        .upsell-content p { color: #B45309; font-size: 0.8rem; }
        .upsell-price { color: #D97706; font-weight: 700; font-size: 0.85rem; margin-top: 4px; display: inline-block; }
        
        .toggle-switch {
            position: relative; width: 44px; height: 24px; cursor: pointer; display: inline-block;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
            position: absolute; top:0; left:0; right:0; bottom:0; background: #D1D5DB; border-radius: 24px; transition: .3s;
        }
        .toggle-slider:before {
            position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s;
        }
        .toggle-switch input:checked + .toggle-slider { background: #F59E0B; }
        .toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }

        /* SUMMARY STICKY */
        .summary-panel {
            position: sticky;
            top: 24px;
            display: flex; flex-direction: column; gap: 16px;
        }
        .summary-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            overflow: hidden;
            display: flex; flex-direction: column;
        }
        .summary-header {
            padding: 16px 20px;
            background: var(--primary);
            color: white;
            display: flex; flex-direction: column; gap: 4px;
        }
        .summary-header h3 { font-size: 1.1rem; font-weight: 600; }
        .mini-client { font-size: 0.8rem; color: #CBD5E1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .summary-items {
            padding: 16px 20px;
            max-height: 250px;
            overflow-y: auto;
            border-bottom: 1px dashed var(--border);
        }
        .empty-state { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px 0; font-style: italic; }
        .summary-item {
            display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; font-size: 0.85rem;
        }
        .summary-item:last-child { margin-bottom: 0; }
        .summary-item .name { font-weight: 500; color: var(--text-main); flex: 1; padding-right: 10px; line-height: 1.3; }
        .summary-item .val { font-weight: 600; color: var(--text-main); white-space: nowrap; }

        .summary-totals {
            padding: 16px 20px;
            background: #FAFAFA;
        }
        .sum-row {
            display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 10px; color: var(--text-muted);
        }
        .sum-row .val { color: var(--text-main); font-weight: 600; }
        .sum-row.upsell-totalRow { color: #D97706; }
        .sum-row.upsell-totalRow .val { color: #D97706; }

        .total-final-box {
            background: var(--surface);
            border: 1px solid var(--brand);
            border-radius: var(--radius-md);
            padding: 16px;
            margin-top: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
        }
        .total-label { font-size: 0.75rem; font-weight: 700; color: var(--brand); text-transform: uppercase; letter-spacing: 0.05em; }
        .total-value { font-size: 1.8rem; font-weight: 800; color: var(--primary); margin: 4px 0 8px; line-height: 1; }
        .total-details {
            display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; background: var(--brand-light); padding: 8px; border-radius: 6px;
        }
        .details-pix { color: var(--success); font-weight: 700; }
        .details-inst { color: var(--brand); font-weight: 600; }

        /* OBS */
        .obs-wrap { padding: 16px 20px; border-top: 1px solid var(--border); }
        .obs-wrap label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; display: block; }
        .obs-textarea {
            width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical; min-height: 60px; background: var(--background);
        }
        .obs-textarea:focus { outline: none; border-color: var(--brand); background: var(--surface); }

        /* ACTIONS */
        .actions-wrap { padding: 0 20px 20px; display: grid; gap: 10px; }
        .btn {
            width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; font-family: inherit; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn-success { background: var(--success); color: white; }
        .btn-success:hover { background: #059669; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
        .btn-outline:hover { background: var(--background); border-color: #CBD5E1; }

        /* QUICK ACTIONS ROW */
        .quick-actions {
            display: flex; gap: 10px; padding: 0 20px 16px;
        }
        .btn-sm { flex: 1; padding: 10px; font-size: 0.8rem; }

        /* MOBILE BOTTOM BAR */
        .mobile-bottom-bar {
            display: none; position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); padding: 16px; z-index: 100; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); align-items: center; justify-content: space-between;
        }
        .mobile-total .lbl { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .mobile-total .val { font-size: 1.25rem; font-weight: 800; color: var(--primary); line-height: 1; }
        .btn-mobile-sheet { background: var(--primary); color: white; padding: 10px 16px; border-radius: 8px; font-weight: 600; border: none; }

        /* MODAL */
        .modal-overlay {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-overlay.active { display: flex; animation: fadeIn 0.2s; }
        .modal {
            background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--surface); z-index: 10; }
        .modal-header h2 { font-size: 1.1rem; color: var(--primary); }
        .modal-close { background: var(--background); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;}
        .modal-close:hover { background: var(--border); }
        .modal-body { padding: 24px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; }

        /* PREVIEW CONTENT REUSE */
        .preview-container { font-size: 0.85rem; }
        .preview-header { text-align: center; border-bottom: 2px solid var(--brand-light); padding-bottom: 16px; margin-bottom: 16px;}
        .preview-header .company-name { font-size: 1.15rem; font-weight: 700; color: var(--primary); }
        .preview-client-box { background: var(--background); padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;}
        .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .preview-table th { background: var(--primary); color: white; padding: 8px 12px; font-weight: 600; text-align: left; font-size: 0.8rem;}
        .preview-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
        .preview-total-box { background: var(--primary); color: white; padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;}
        .preview-total-box .total-value { font-size: 1.25rem; font-weight: 800; }
        .preview-obs { font-size: 0.75rem; color: var(--text-muted); background: var(--brand-light); padding: 12px; border-left: 3px solid var(--brand); border-radius: 0 6px 6px 0; }

        /* TOAST */
        .toast {
            position: fixed; bottom: 24px; right: 24px; background: var(--primary); color: white; padding: 12px 20px; border-radius: 8px; font-weight: 500; font-size: 0.9rem; box-shadow: var(--shadow-lg); z-index: 2000; display: none;
        }
        .toast.error { background: #DC2626; }
        .toast.show { display: block; animation: slideUp 0.3s; }

        /* ANIMATIONS */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
            .split-layout { grid-template-columns: 1fr; }
            .top-cards { grid-template-columns: 1fr; }
            .summary-panel { position: static; }
            body { padding-bottom: 80px; }
            .mobile-bottom-bar { display: flex; }
        }
        @media (max-width: 640px) {
            .app-container { padding: 16px; }
            .form-grid { grid-template-columns: 1fr; }
            .svc-controls { flex-direction: column; align-items: flex-end; gap: 8px;}
            .svc-total { text-align: right; }
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <header class="app-header">
        <div class="brand-section">
            <img src="assents/Damas.png" alt="Logo" class="brand-logo" onerror="this.style.display='none'">
            <div class="brand-text">
                <h1>Damas Clean</h1>
                <p>Gerador de Orçamentos</p>
            </div>
        </div>
        <div class="header-actions">
            <span class="status-badge">Rascunho</span>
            <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem; width: auto;" onclick="gerarPDF()" id="btnGerarPDFTop">📥 Gerar PDF</button>
        </div>
    </header>

    <main class="app-container">

        <!-- TOP CARDS -->
        <div class="top-cards">
            <!-- Orçamento -->
            <div class="card">
                <div class="card-header"><span class="icon">📋</span> Dados do Orçamento</div>
                <div class="card-body form-grid">
                    <div class="form-group">
                        <label>Nº do Orçamento</label>
                        <input type="text" id="numOrcamento" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Emissão</label>
                        <input type="text" id="dataEmissao" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Validade</label>
                        <input type="text" id="dataValidade" class="form-control" readonly>
                    </div>
                </div>
            </div>

            <!-- Cliente -->
            <div class="card">
                <div class="card-header"><span class="icon">👤</span> Dados do Cliente</div>
                <div class="card-body form-grid">
                    <div class="form-group col-span-2">
                        <label>Nome Completo</label>
                        <input type="text" id="nomeCliente" class="form-control" placeholder="Nome do cliente" onkeyup="document.getElementById('miniClientName').textContent = this.value || 'Cliente não informado'">
                    </div>
                    <div class="form-group">
                        <label>WhatsApp</label>
                        <input type="tel" id="telefoneCliente" class="form-control" placeholder="(31) 99999-9999">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Endereço</label>
                        <input type="text" id="enderecoCliente" class="form-control" placeholder="Rua, nº - Complemento">
                    </div>
                    <div class="form-group">
                        <label>Bairro</label>
                        <input type="text" id="bairroCliente" class="form-control" placeholder="Bairro">
                    </div>
                </div>
            </div>
        </div>

        <!-- SPLIT LAYOUT -->
        <div class="split-layout">
            
            <!-- LEFT: CATALOG -->
            <div class="catalog-panel">
                <div class="catalog-header">
                    <h2>Catálogo de Serviços</h2>
                    <span class="service-counter" id="serviceCounter">0 serviço(s)</span>
                </div>
                
                <div class="search-wrap">
                    <input type="text" class="search-input" id="searchService" placeholder="Buscar estofado, colchão ou pacote..." onkeyup="filterServices()">
                </div>

                <div class="services-list" id="servicesBody">
                    <!-- Gerado por JS -->
                </div>

                <div class="upsell-box" id="upsellBox">
                    <div class="upsell-icon">🛡️</div>
                    <div class="upsell-content">
                        <h4>Proteção Extra: Impermeabilização</h4>
                        <p>Aumente o ticket do orçamento oferecendo proteção contra manchas e líquidos.</p>
                        <span class="upsell-price">Por peça: + R$ 80,00</span>
                    </div>
                    <div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="upsellCheck" onchange="onUpsellChange()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- RIGHT: SUMMARY STICKY -->
            <aside class="summary-panel" id="summarySidebar">
                <div class="summary-card">
                    <div class="summary-header">
                        <h3>Resumo Final</h3>
                        <div class="mini-client">👤 <span id="miniClientName">Cliente não informado</span></div>
                    </div>
                    
                    <div class="summary-items" id="summaryItemsList">
                        <div class="empty-state">Nenhum serviço selecionado no momento.</div>
                    </div>

                    <div class="summary-totals">
                        <div class="sum-row">
                            <span>Subtotal</span>
                            <span class="val" id="subtotal">R$ 0,00</span>
                        </div>
                        <div class="sum-row upsell-totalRow" id="upsellRow" style="display:none;">
                            <span>💡 Impermeabilização</span>
                            <span class="val" id="upsellTotal">+ R$ 0,00</span>
                        </div>

                        <div class="total-final-box">
                            <div class="total-label">Total do Orçamento</div>
                            <div class="total-value" id="totalFinal">R$ 0,00</div>
                            <div class="total-details">
                                <span class="details-pix" id="pixHighlight">💰 PIX à vista: R$ 0,00</span>
                                <span class="details-inst" id="installmentHighlight">💳 4x de R$ 0,00</span>
                            </div>
                        </div>
                    </div>

                    <div class="obs-wrap">
                        <label><span style="font-size: 1rem; vertical-align:-2px;">📝</span> Observações Internas / Especial</label>
                        <textarea id="observacoes" class="obs-textarea" placeholder="Inclui removedor de odores grátis..."></textarea>
                    </div>

                    <!-- Hidden inputs for compatibility -->
                    <span id="descontoPix" style="display:none"></span>
                    <span id="parcela4x" style="display:none"></span>
                    <span id="upsellLabel" style="display:none"></span>
                    
                    <div class="quick-actions">
                        <button class="btn btn-outline btn-sm" onclick="preVisualizar()" id="btnPreview">👁️ Preview</button>
                        <button class="btn btn-outline btn-sm" onclick="limparFormulario()" id="btnLimpar">🗑️ Limpar</button>
                    </div>

                    <div class="actions-wrap">
                        <button class="btn btn-success" onclick="copiarWhatsApp()" id="btnWhatsApp">💬 Enviar via WhatsApp</button>
                        <button class="btn btn-primary" onclick="gerarPDF()" id="btnGerarPDF">📥 Finalizar & Gerar PDF</button>
                    </div>
                </div>
            </aside>

        </div>
    </main>

    <!-- MOBILE STICKY BAR -->
    <div class="mobile-bottom-bar">
        <div class="mobile-total">
            <div class="lbl">Total do Orçamento</div>
            <div class="val" id="mobileTotal">R$ 0,00</div>
        </div>
        <button class="btn-mobile-sheet" onclick="scrollToSummary()">Ver Resumo 👆</button>
    </div>

    <!-- MODAL DE PREVIEW -->
    <div class="modal-overlay" id="previewModal">
        <div class="modal">
            <div class="modal-header">
                <h2>Pré-visualização do Orçamento</h2>
                <button class="modal-close" onclick="fecharPreview()">✕</button>
            </div>
            <div class="modal-body" id="previewBody"></div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="fecharPreview()" style="width:auto">Voltar</button>
                <button class="btn btn-primary" onclick="fecharPreview(); gerarPDF();" style="width:auto">Gerar PDF</button>
            </div>
        </div>
    </div>

    <!-- HIDDEN IMAGES FOR PDF -->
    <img id="coverImage" src="assents/professional.png" alt="" style="display:none;" crossorigin="anonymous">
    <img id="imgLimpezaPet" src="assents/limpeza-pet.png" alt="" style="display:none;" crossorigin="anonymous">
    <img id="imgImpermeabilizacao" src="assents/impermeabilizacao.png" alt="" style="display:none;" crossorigin="anonymous">
    <img id="imgSofaLimpo" src="assents/sofa-limpo.png" alt="" style="display:none;" crossorigin="anonymous">

    <div class="toast" id="toast"></div>

"""

html_tail = r"""
</body>
</html>
"""

# Now we need to read the JS part from the original index.html
with open(r"e:\sistemas\gerador de orçamentos\index.html", "r", encoding="utf-8") as f:
    orig = f.read()

# find <script> section at end
script_start = orig.rfind("<script>")
script_end = orig.rfind("</script>") + len("</script>")
js_content = orig[script_start:script_end]

# We need to inject our modified renderServicesTable and changeQty into the JS.
# Let's replace renderServicesTable in js_content with our new one.

old_render = r"function renderServicesTable() {"
end_render = r"        // ---- CALCULATIONS ----"

start_idx = js_content.find(old_render)
end_idx = js_content.find(end_render)

new_render = r"""
        // ---- RENDER SERVICES TABLE (NOVO MODELO SaaS) ----
        function renderServicesTable() {
            const container = document.getElementById('servicesBody');
            container.innerHTML = '';

            let globalIndex = 0;
            SERVICE_CATEGORIES.forEach(cat => {
                const group = document.createElement('div');
                group.className = 'category-group';
                group.innerHTML = `<div class="category-title">${cat.category} ${cat.subtitle ? `<span class="category-subtitle">${cat.subtitle}</span>` : ''}</div>`;
                
                cat.services.forEach(svc => {
                    const i = globalIndex;
                    const card = document.createElement('div');
                    card.className = 'service-card';
                    card.id = `serviceRow_${i}`;

                    // Hidden checkbox compatibility
                    const chk = `<input type="checkbox" id="check_${i}" onchange="onServiceChange(${i})" style="display:none">`;
                    
                    let discountHtml = '';
                    if (!svc.isPackage) {
                        discountHtml = `<div class="svc-discount-wrap"><label>Desc. R$</label><input type="number" id="discount_${i}" value="0" min="0" step="5" onchange="onServiceChange(${i})" oninput="onServiceChange(${i})"></div>`;
                    } else {
                         // hidden discount to keep logic intact
                         discountHtml = `<input type="hidden" id="discount_${i}" value="0">`;
                    }

                    const badge = svc.isPackage ? `<span class="svc-package-tag">Pacote</span>` : '';

                    card.innerHTML = `
                        ${chk}
                        <div class="svc-info">
                            <div class="svc-name">${svc.name} ${badge}</div>
                            <div class="svc-price">${formatCurrency(svc.price)}</div>
                            ${discountHtml}
                        </div>
                        <div class="svc-controls">
                            <div class="stepper">
                                <button onclick="changeQty(${i}, -1)">–</button>
                                <input type="number" id="qty_${i}" value="0" min="0" max="20" onchange="onServiceChange(${i})" oninput="onServiceChange(${i})">
                                <button onclick="changeQty(${i}, 1)">+</button>
                            </div>
                            <div class="svc-total" id="total_${i}">R$ 0,00</div>
                        </div>
                    `;
                    group.appendChild(card);
                    globalIndex++;
                });
                container.appendChild(group);
            });
        }

        function changeQty(index, delta) {
            const input = document.getElementById(`qty_${index}`);
            let val = parseInt(input.value) || 0;
            val += delta;
            if (val < 0) val = 0;
            if (val > 20) val = 20;
            input.value = val;
            onServiceChange(index);
        }

        function filterServices() {
            const query = document.getElementById('searchService').value.toLowerCase();
            const cards = document.querySelectorAll('.service-card');
            cards.forEach(card => {
                const text = card.querySelector('.svc-name').textContent.toLowerCase();
                if (text.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
            // Hide empty categories
            document.querySelectorAll('.category-group').forEach(group => {
                const visible = Array.from(group.querySelectorAll('.service-card')).some(c => c.style.display !== 'none');
                group.style.display = visible ? 'block' : 'none';
            });
        }

        function scrollToSummary() {
            document.getElementById('summarySidebar').scrollIntoView({ behavior: 'smooth' });
        }

"""

js_content = js_content[:start_idx] + new_render + js_content[end_idx:]

# Additionally, intercept updateSummary to populate summaryItemsList and mobileTotal
old_updateSummary = r"function updateSummary() {"
old_updateSummary_content = js_content[js_content.find(old_updateSummary):]

# Let's cleanly inject the items list code right at the end of updateSummary
end_of_updateSummary = r"document.getElementById('installmentHighlight').textContent = `💳 4x de ${formatCurrency(parcela)}`;"

inject_items = r"""
            // NOVO: Populate Summary Sidebar
            const itemsList = document.getElementById('summaryItemsList');
            const selectedList = getSelectedServices();
            if(selectedList.length === 0) {
                itemsList.innerHTML = '<div class="empty-state">Nenhum serviço selecionado no momento.</div>';
            } else {
                itemsList.innerHTML = selectedList.map(sv => `
                    <div class="summary-item">
                        <span class="name">${sv.qty}x ${sv.name}</span>
                        <span class="val">${formatCurrency(sv.total)}</span>
                    </div>
                `).join('');
            }
            
            // NOVO: Update Mobile Bottom Bar Total
            const mobileTotalEl = document.getElementById('mobileTotal');
            if(mobileTotalEl) mobileTotalEl.textContent = formatCurrency(totalComUpsell);
"""

js_content = js_content.replace(end_of_updateSummary, end_of_updateSummary + "\n" + inject_items)

# Add event listeners or small patches if needed...
# The original logic checks 'check_i' which is now display:none toggle.
# But changeQty automatically updates it. 
# Wait, auto-check is handled in onServiceChange in original logic:
# if (qty > 0 && !checked) document.getElementById(`check_${index}`).checked = true;
# That's perfectly fine as it still exists visually hidden.

# Complete new HTML
final_html = html_content + js_content + html_tail

with open(r"e:\sistemas\gerador de orçamentos\index.html", "w", encoding="utf-8") as f:
    f.write(final_html)

print("Redesign applied successfully!")
