(function () {
    const JUSTIFICATION_POOL = [
        'Desconto aplicado por otimizacao de rota na sua regiao',
        'Condicao especial por encaixe na agenda',
        'Valor reduzido para atendimento na sua localizacao',
        'Desconto aplicado automaticamente pelo sistema'
    ];

    const COMMERCIAL_ENDINGS = [9, 19, 29, 39, 49, 59, 69, 79, 89, 99];

    SERVICE_CATEGORIES = [
        {
            category: 'SOF\u00C1S',
            services: [
                { name: 'Sof\u00E1 2 lugares', price: 220, impermeabilizacao: 180, comboGroup: 'sofa' },
                { name: 'Sof\u00E1 3 lugares', price: 280, impermeabilizacao: 220, comboGroup: 'sofa' },
                { name: 'Sof\u00E1 retr\u00E1til / chaise', price: 320, impermeabilizacao: 250, comboGroup: 'sofa' },
                { name: 'Sof\u00E1 em L (canto)', price: 380, impermeabilizacao: 260, comboGroup: 'sofa' },
                { name: 'Sof\u00E1 4 lugares ou mais', price: 420, impermeabilizacao: null, comboGroup: 'sofa' }
            ]
        },
        {
            category: 'COLCH\u00D5ES',
            services: [
                { name: 'Colch\u00E3o solteiro', price: 180, impermeabilizacao: 100, comboGroup: 'colchao' },
                { name: 'Colch\u00E3o casal', price: 250, impermeabilizacao: 130, comboGroup: 'colchao' },
                { name: 'Colch\u00E3o queen', price: 280, impermeabilizacao: 150, comboGroup: 'colchao' },
                { name: 'Colch\u00E3o king', price: 300, impermeabilizacao: null, comboGroup: 'colchao' }
            ]
        },
        {
            category: 'OUTROS',
            services: [
                { name: 'Poltrona', price: 100, impermeabilizacao: 70, comboGroup: 'poltrona' },
                { name: 'Cadeira estofada', price: 60, impermeabilizacao: null, comboGroup: 'cadeira' },
                { name: 'Carro (completo)', price: 450, impermeabilizacao: null, comboGroup: 'automotivo' }
            ]
        }
    ];

    SERVICES = [];
    SERVICE_CATEGORIES.forEach(category => {
        category.services.forEach(service => {
            SERVICES.push({ ...service, category: category.category });
        });
    });

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getImpermeabilizacaoInput(index) {
        return document.getElementById(`impermeabilizacao_${index}`);
    }

    function getImpermeabilizacaoLabel(serviceName) {
        return `Prote\u00E7\u00E3o impermeabilizante ${serviceName}`;
    }

    function getAnchorPercent(basePrice, seed) {
        let percent;

        if (basePrice >= 420) percent = 0.22;
        else if (basePrice >= 320) percent = 0.24;
        else if (basePrice >= 250) percent = 0.27;
        else if (basePrice >= 180) percent = 0.30;
        else if (basePrice >= 120) percent = 0.34;
        else percent = 0.38;

        const variation = ((seed % 3) - 1) * 0.01;
        return clamp(percent + variation, 0.2, 0.4);
    }

    function isCommercialValue(value) {
        const remainder = value % 100;
        return COMMERCIAL_ENDINGS.includes(remainder);
    }

    function roundToCommercialValue(target, min, max) {
        const safeMin = Math.ceil(min);
        const safeMax = Math.floor(max);
        const candidates = [];

        for (let value = safeMin; value <= safeMax; value++) {
            if (isCommercialValue(value)) {
                candidates.push(value);
            }
        }

        if (candidates.length === 0) {
            return Math.round(clamp(target, min, max));
        }

        return candidates.reduce((best, candidate) => {
            if (best === null) return candidate;
            return Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best;
        }, null);
    }

    function getOriginalUnitPrice(basePrice, seed) {
        const percent = getAnchorPercent(basePrice, seed);
        const min = basePrice * 1.2;
        const max = basePrice * 1.4;
        const target = basePrice * (1 + percent);
        return roundToCommercialValue(target, min, max);
    }

    function getItemJustification(meta) {
        const candidates = [];

        if (meta.kind === 'extra') {
            candidates.push('Condicao especial por encaixe na agenda');
            candidates.push('Desconto aplicado automaticamente pelo sistema');
        }

        if (meta.comboGroup === 'sofa' || meta.comboGroup === 'colchao') {
            candidates.push('Desconto aplicado por otimizacao de rota na sua regiao');
        }

        if (meta.comboGroup === 'automotivo') {
            candidates.push('Valor reduzido para atendimento na sua localizacao');
        }

        if (meta.qty >= 2) {
            candidates.push('Condicao especial por encaixe na agenda');
        }

        candidates.push(...JUSTIFICATION_POOL);

        const uniqueCandidates = [...new Set(candidates)];
        const seed = meta.seed + meta.qty + meta.name.length;
        return uniqueCandidates[seed % uniqueCandidates.length];
    }

    function createStrategicLineItem(meta) {
        const originalUnitPrice = getOriginalUnitPrice(meta.price, meta.seed);
        const originalTotal = originalUnitPrice * meta.qty;
        const total = meta.price * meta.qty;
        const discountValue = originalTotal - total;

        return {
            kind: meta.kind,
            name: meta.name,
            qty: meta.qty,
            price: meta.price,
            originalUnitPrice,
            originalTotal,
            total,
            discountValue,
            hasDiscount: discountValue > 0,
            discountReason: getItemJustification(meta),
            category: meta.category,
            comboGroup: meta.comboGroup
        };
    }

    function renderServiceBenefitMarkup(item) {
        if (!item.hasDiscount) return '';

        return `
            <div class="svc-benefit-row old">
                <span class="lbl">De:</span>
                <span class="amount">${formatCurrency(item.originalTotal)}</span>
            </div>
            <div class="svc-benefit-row new">
                <span class="lbl">Por:</span>
                <span class="amount">${formatCurrency(item.total)}</span>
            </div>
            <div class="svc-benefit-copy">Voce esta economizando ${formatCurrency(item.discountValue)} neste servico</div>
            <div class="svc-benefit-reason">${item.discountReason}</div>
        `;
    }

    function renderSummaryItemMarkup(item) {
        return `
            <div class="summary-item discounted ${item.kind === 'extra' ? 'extra' : ''}">
                <div class="summary-item-head">
                    <span class="name">${item.name} (${item.qty}x)</span>
                    <span class="summary-item-badge">Economia ${formatCurrency(item.discountValue)}</span>
                </div>
                <div class="summary-item-pricing">
                    <div class="summary-price-line old">
                        <span class="lbl">De:</span>
                        <span class="amount">${formatCurrency(item.originalTotal)}</span>
                    </div>
                    <div class="summary-price-line new">
                        <span class="lbl">Por:</span>
                        <span class="amount">${formatCurrency(item.total)}</span>
                    </div>
                </div>
                <div class="summary-item-copy">Voce esta economizando ${formatCurrency(item.discountValue)} neste servico</div>
                <div class="summary-item-reason">${item.discountReason}</div>
            </div>
        `;
    }

    function getBudgetDiscountReason(budget) {
        const uniqueReasons = [...new Set(
            budget.lineItems
                .map(item => item.discountReason)
                .filter(Boolean)
        )];

        if (uniqueReasons.length === 0) return '';
        if (uniqueReasons.length === 1) return uniqueReasons[0];

        return 'Condicoes especiais aplicadas automaticamente conforme rota, agenda e localizacao do atendimento.';
    }

    function buildBudgetData() {
        const services = [];
        const lineItems = [];

        SERVICES.forEach((service, index) => {
            const qty = parseInt(document.getElementById(`qty_${index}`)?.value || '0', 10) || 0;
            const checked = qty > 0;
            const checkEl = document.getElementById(`check_${index}`);
            if (checkEl) checkEl.checked = checked;
            if (!checked) return;

            const mainItem = createStrategicLineItem({
                kind: 'service',
                name: service.name,
                price: service.price,
                qty,
                seed: index,
                category: service.category,
                comboGroup: service.comboGroup
            });

            services.push(mainItem);
            lineItems.push(mainItem);

            if (typeof service.impermeabilizacao === 'number' && getImpermeabilizacaoInput(index)?.checked) {
                lineItems.push(createStrategicLineItem({
                    kind: 'extra',
                    name: getImpermeabilizacaoLabel(service.name),
                    price: service.impermeabilizacao,
                    qty,
                    seed: index + SERVICES.length + 7,
                    category: service.category,
                    comboGroup: service.comboGroup
                }));
            }
        });

        const serviceItems = lineItems.filter(item => item.kind === 'service');
        const extraItems = lineItems.filter(item => item.kind === 'extra');
        const serviceSubtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
        const extraSubtotal = extraItems.reduce((sum, item) => sum + item.total, 0);
        const subtotal = serviceSubtotal + extraSubtotal;
        const originalBudgetTotal = lineItems.reduce((sum, item) => sum + item.originalTotal, 0);
        const totalEconomy = lineItems.reduce((sum, item) => sum + item.discountValue, 0);
        const totalGeral = subtotal;
        const totalPix = totalGeral - (totalGeral * PIX_DISCOUNT);

        return {
            services,
            lineItems,
            serviceOriginalSubtotal: serviceItems.reduce((sum, item) => sum + item.originalTotal, 0),
            serviceSubtotal,
            serviceDiscountTotal: serviceItems.reduce((sum, item) => sum + item.discountValue, 0),
            extraSubtotal,
            extraDiscountTotal: extraItems.reduce((sum, item) => sum + item.discountValue, 0),
            subtotal,
            originalBudgetTotal,
            totalEconomy,
            totalGeral,
            totalPix,
            parcela: totalGeral / INSTALLMENTS
        };
    }

    function syncImpermeabilizacaoState(index) {
        const service = SERVICES[index];
        if (!service || typeof service.impermeabilizacao !== 'number') return;

        const qty = parseInt(document.getElementById(`qty_${index}`)?.value || '0', 10) || 0;
        const input = getImpermeabilizacaoInput(index);
        const box = document.getElementById(`extraBox_${index}`);
        const row = document.getElementById(`serviceRow_${index}`);
        if (!input || !box || !row) return;

        const enabled = qty > 0;
        input.disabled = !enabled;
        if (!enabled) input.checked = false;

        box.classList.toggle('disabled', !enabled);
        box.classList.toggle('active', enabled && input.checked);
        row.classList.toggle('has-protection', enabled && input.checked);
    }

    renderServicesTable = function () {
        const container = document.getElementById('servicesBody');
        container.innerHTML = '';

        let globalIndex = 0;
        SERVICE_CATEGORIES.forEach(category => {
            const group = document.createElement('div');
            group.className = 'category-group';
            group.innerHTML = `<div class="category-title">${category.category}</div>`;

            category.services.forEach(service => {
                const index = globalIndex;
                const card = document.createElement('div');
                card.className = 'service-card';
                card.id = `serviceRow_${index}`;

                const strategicNote = `
                    <div style="margin-top:10px;font-size:0.78rem;color:#64748B;line-height:1.45;">
                        O sistema apresenta automaticamente a melhor condicao comercial deste item na proposta final.
                    </div>
                `;

                const extraHtml = typeof service.impermeabilizacao === 'number' ? `
                    <div class="service-extra disabled" id="extraBox_${index}">
                        <div class="service-extra-copy">
                            <span class="service-extra-kicker">Prote\u00E7\u00E3o Premium</span>
                            <label class="service-extra-title" for="impermeabilizacao_${index}">Adicionar prote\u00E7\u00E3o impermeabilizante</label>
                            <span class="service-extra-subtitle">Prote\u00E7\u00E3o contra liquidos e manchas para este item.</span>
                            <span class="service-extra-price">Valor base ${formatCurrency(service.impermeabilizacao)} por unidade</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="impermeabilizacao_${index}" onchange="onImpermeabilizacaoChange(${index})" disabled>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                ` : '';

                card.innerHTML = `
                    <input type="checkbox" id="check_${index}" style="display:none">
                    <div class="svc-info">
                        <div class="svc-name">${service.name}</div>
                        <div class="svc-price">${formatCurrency(service.price)}</div>
                        ${strategicNote}
                        <div class="svc-benefit" id="benefit_${index}"></div>
                        ${extraHtml}
                    </div>
                    <div class="svc-controls">
                        <div class="stepper">
                            <button type="button" onclick="changeQty(${index}, -1)">-</button>
                            <input type="number" id="qty_${index}" value="0" min="0" max="20" onchange="onServiceChange(${index})" oninput="onServiceChange(${index})">
                            <button type="button" onclick="changeQty(${index}, 1)">+</button>
                        </div>
                        <div class="svc-total" id="total_${index}">R$ 0,00</div>
                    </div>
                `;

                group.appendChild(card);
                globalIndex++;
            });

            container.appendChild(group);
        });
    };

    function normalizeSearchValue(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    filterServices = function () {
        const query = normalizeSearchValue(document.getElementById('searchService').value);
        const cards = document.querySelectorAll('.service-card');

        cards.forEach(card => {
            const text = normalizeSearchValue(card.querySelector('.svc-name')?.textContent || '');
            card.style.display = text.includes(query) ? 'flex' : 'none';
        });

        document.querySelectorAll('.category-group').forEach(group => {
            const visible = Array.from(group.querySelectorAll('.service-card')).some(card => card.style.display !== 'none');
            group.style.display = visible ? 'block' : 'none';
        });
    };

    onServiceChange = function (index) {
        const qty = parseInt(document.getElementById(`qty_${index}`)?.value || '0', 10) || 0;
        const row = document.getElementById(`serviceRow_${index}`);
        const totalEl = document.getElementById(`total_${index}`);
        const benefitEl = document.getElementById(`benefit_${index}`);
        const checkEl = document.getElementById(`check_${index}`);

        if (checkEl) checkEl.checked = qty > 0;

        if (qty > 0) {
            const item = createStrategicLineItem({
                kind: 'service',
                name: SERVICES[index].name,
                price: SERVICES[index].price,
                qty,
                seed: index,
                category: SERVICES[index].category,
                comboGroup: SERVICES[index].comboGroup
            });

            totalEl.textContent = formatCurrency(item.total);
            totalEl.classList.add('active');
            row.classList.add('selected');
            benefitEl.innerHTML = renderServiceBenefitMarkup(item);
            benefitEl.classList.add('visible');
        } else {
            totalEl.textContent = 'R$ 0,00';
            totalEl.classList.remove('active');
            row.classList.remove('selected');
            row.classList.remove('has-protection');
            benefitEl.innerHTML = '';
            benefitEl.classList.remove('visible');
        }

        syncImpermeabilizacaoState(index);
        updateSummary();
        updateServiceCounter();
    };

    onImpermeabilizacaoChange = function (index) {
        syncImpermeabilizacaoState(index);
        updateSummary();
    };

    updateServiceCounter = function () {
        const count = buildBudgetData().services.length;
        const counter = document.getElementById('serviceCounter');
        counter.textContent = `${count} servico(s) selecionado(s)`;
        counter.className = 'service-counter' + (count > 0 ? ' active' : '');
    };

    updateSummary = function () {
        const budget = buildBudgetData();

        document.getElementById('subtotal').textContent = formatCurrency(budget.serviceSubtotal);

        const extraSubtotalRow = document.getElementById('extraSubtotalRow');
        if (budget.extraSubtotal > 0) {
            extraSubtotalRow.style.display = 'flex';
            document.getElementById('extraSubtotal').textContent = formatCurrency(budget.extraSubtotal);
        } else {
            extraSubtotalRow.style.display = 'none';
        }

        const comboDiscountsWrap = document.getElementById('comboDiscountsWrap');
        comboDiscountsWrap.style.display = 'none';
        comboDiscountsWrap.innerHTML = '';

        const itemsList = document.getElementById('summaryItemsList');
        if (budget.lineItems.length === 0) {
            itemsList.innerHTML = '<div class="empty-state">Nenhum servico selecionado no momento.</div>';
        } else {
            itemsList.innerHTML = budget.lineItems.map(renderSummaryItemMarkup).join('');
        }

        const totalSavingsRow = document.getElementById('totalSavingsRow');
        const totalSavingsValue = document.getElementById('totalSavingsValue');
        const budgetOriginalTotalWrap = document.getElementById('budgetOriginalTotalWrap');
        const budgetOriginalTotal = document.getElementById('budgetOriginalTotal');
        const budgetCurrentPrefix = document.getElementById('budgetCurrentPrefix');
        const budgetSavingsNote = document.getElementById('budgetSavingsNote');
        const budgetDiscountReason = document.getElementById('budgetDiscountReason');

        if (budget.totalEconomy > 0) {
            totalSavingsRow.style.display = 'flex';
            totalSavingsValue.textContent = formatCurrency(budget.totalEconomy);
            budgetOriginalTotalWrap.style.display = 'flex';
            budgetOriginalTotal.textContent = formatCurrency(budget.originalBudgetTotal);
            budgetCurrentPrefix.style.display = 'inline';
            budgetSavingsNote.style.display = 'block';
            budgetSavingsNote.textContent = `Economia total neste orcamento: ${formatCurrency(budget.totalEconomy)}`;
            budgetDiscountReason.style.display = 'block';
            budgetDiscountReason.textContent = getBudgetDiscountReason(budget);
        } else {
            totalSavingsRow.style.display = 'none';
            budgetOriginalTotalWrap.style.display = 'none';
            budgetCurrentPrefix.style.display = 'none';
            budgetSavingsNote.style.display = 'none';
            budgetDiscountReason.style.display = 'none';
            budgetDiscountReason.textContent = '';
        }

        document.getElementById('totalFinal').textContent = formatCurrency(budget.totalGeral);
        document.getElementById('descontoPix').textContent = formatCurrency(budget.totalPix);
        document.getElementById('parcela4x').textContent = `4x ${formatCurrency(budget.parcela)}`;
        document.getElementById('pixHighlight').textContent = `PIX a vista: ${formatCurrency(budget.totalPix)}`;
        document.getElementById('installmentHighlight').textContent = `4x de ${formatCurrency(budget.parcela)}`;

        const mobileTotal = document.getElementById('mobileTotal');
        if (mobileTotal) mobileTotal.textContent = formatCurrency(budget.totalGeral);

        const legacyUpsellRow = document.getElementById('upsellRow');
        if (legacyUpsellRow) legacyUpsellRow.style.display = 'none';
    };

    getSelectedServices = function () {
        return buildBudgetData().services;
    };

    getSelectedItemsWithExtras = function () {
        return buildBudgetData().lineItems;
    };

    getBudgetData = function () {
        return buildBudgetData();
    };

    getUpsellTotal = function () {
        return 0;
    };

    onUpsellChange = function () {
        const upsellCheck = document.getElementById('upsellCheck');
        if (upsellCheck) upsellCheck.checked = false;
        updateSummary();
    };

    validate = function () {
        const nome = document.getElementById('nomeCliente').value.trim();
        if (!nome) {
            showToast('Preencha o nome do cliente.', true);
            document.getElementById('nomeCliente').focus();
            return false;
        }

        if (buildBudgetData().services.length === 0) {
            showToast('Selecione ao menos um servico.', true);
            return false;
        }

        return true;
    };

    limparFormulario = function () {
        document.getElementById('nomeCliente').value = '';
        document.getElementById('telefoneCliente').value = '';
        document.getElementById('enderecoCliente').value = '';
        document.getElementById('bairroCliente').value = '';
        document.getElementById('observacoes').value = '';
        document.getElementById('miniClientName').textContent = 'Cliente nao informado';

        SERVICES.forEach((service, index) => {
            document.getElementById(`check_${index}`).checked = false;
            document.getElementById(`qty_${index}`).value = 0;
            document.getElementById(`total_${index}`).textContent = 'R$ 0,00';
            document.getElementById(`total_${index}`).classList.remove('active');
            document.getElementById(`serviceRow_${index}`).classList.remove('selected');
            document.getElementById(`serviceRow_${index}`).classList.remove('has-protection');

            const benefitEl = document.getElementById(`benefit_${index}`);
            benefitEl.innerHTML = '';
            benefitEl.classList.remove('visible');

            const extraInput = getImpermeabilizacaoInput(index);
            if (extraInput) extraInput.checked = false;
            syncImpermeabilizacaoState(index);
        });

        const upsellCheck = document.getElementById('upsellCheck');
        if (upsellCheck) upsellCheck.checked = false;

        generateBudgetNumber();
        setDates();
        updateSummary();
        updateServiceCounter();
        showToast('Formulario limpo com sucesso!');
    };

    copiarWhatsApp = function () {
        if (!validate()) return;

        const budget = buildBudgetData();
        let msg = `Para o seu caso, referente a todos os itens, o valor total fica em ${formatCurrency(budget.totalGeral)}.\n`;
        msg += `podendo parcelar em ate 4x de ${formatCurrency(budget.parcela)} sem juros 💰\n\n`;
        msg += 'A limpeza inclui:\n';
        msg += '✔ Limpeza profunda de todos os estofados\n';
        msg += '✔ Remocao de acaros, fungos e bacterias\n';
        msg += '✔ Eliminacao de odores\n';
        msg += '✔ Secagem rapida\n';
        msg += '✔ Finalizacao com aroma suave\n\n';

        if (budget.extraSubtotal > 0) {
            msg += `💧 A impermeabilizacao ja foi incluida neste orcamento, somando ${formatCurrency(budget.extraSubtotal)} para proteger o tecido contra liquidos e sujeiras por meses 👍\n\n`;
        } else {
            msg += '💧 Tambem temos a opcao de impermeabilizacao, que ajuda a proteger o tecido contra liquidos e sujeiras por meses — se depois quiser incluir, consigo ajustar pra voce 👍\n\n';
        }

        msg += 'Tenho disponibilidade ai na sua regiao essa semana — me fala qual periodo fica melhor pra voce que ja reservo 👍';

        navigator.clipboard.writeText(msg).then(() => {
            showToast('Mensagem copiada para o WhatsApp!');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = msg;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Mensagem copiada para o WhatsApp!');
        });
    };

    buildPreviewHTML = function () {
        const budget = buildBudgetData();
        const bairro = document.getElementById('bairroCliente').value;
        const obs = document.getElementById('observacoes').value.trim();

        const totalHeaderHtml = `
            <div style="font-size:0.76rem;color:#94A3B8;">De: <span style="text-decoration:line-through;">${formatCurrency(budget.originalBudgetTotal)}</span></div>
            <div style="color:#2D6A9F;font-weight:800;">Por: ${formatCurrency(budget.totalGeral)}</div>
        `;

        const rows = budget.lineItems.map(item => `
            <tr${item.kind === 'extra' ? ' style="background:#FFF7ED"' : ''}>
                <td>
                    <strong>${item.name}</strong>
                    <div style="font-size:0.75rem;color:#64748B;margin-top:4px;">Quantidade: ${item.qty}</div>
                </td>
                <td style="text-align:center">${formatCurrency(item.price)}</td>
                <td>
                    <div style="font-size:0.76rem;color:#94A3B8;">De: <span style="text-decoration:line-through;">${formatCurrency(item.originalTotal)}</span></div>
                    <div style="font-size:0.96rem;color:${item.kind === 'extra' ? '#C2410C' : '#1A3C5E'};font-weight:800;">Por: ${formatCurrency(item.total)}</div>
                </td>
                <td>
                    <div style="color:#166534;font-weight:700;">Voce economiza ${formatCurrency(item.discountValue)}</div>
                    <div style="color:#475569;font-size:0.76rem;margin-top:4px;line-height:1.45;">${item.discountReason}</div>
                </td>
            </tr>
        `).join('');

        const obsHtml = obs ? `
            <div style="background:#F4F6F9;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:0.78rem;">
                <strong style="color:#1A3C5E;">Observacoes:</strong><br>${obs}
            </div>
        ` : '';

        return `
            <div class="preview-container">
                <div class="preview-header">
                    <div class="company-name">Damas Clean - Higienizacao de Estofados</div>
                    <div class="company-contact">WhatsApp: (31) 9971-0420 - Instagram: @damas_clean</div>
                </div>

                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Orcamento</th>
                            <th>Data</th>
                            <th>Validade</th>
                            <th>Investimento</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${document.getElementById('numOrcamento').value}</td>
                            <td>${document.getElementById('dataEmissao').value}</td>
                            <td style="font-weight:700;color:#1A3C5E;">${document.getElementById('dataValidade').value}</td>
                            <td>${totalHeaderHtml}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="preview-client-box">
                    <p><strong>Cliente:</strong> ${document.getElementById('nomeCliente').value}</p>
                    <p><strong>Telefone:</strong> ${document.getElementById('telefoneCliente').value || '-'}</p>
                    <p><strong>Endereco:</strong> ${document.getElementById('enderecoCliente').value || '-'}${bairro ? ' - ' + bairro : ''}</p>
                </div>

                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Servico</th>
                            <th style="text-align:center">Valor real</th>
                            <th>Oferta apresentada</th>
                            <th>Justificativa</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <div class="preview-summary">
                    <p><strong>Subtotal limpeza:</strong> ${formatCurrency(budget.serviceSubtotal)}</p>
                    ${budget.extraSubtotal > 0 ? `<p style="color:#C2410C;"><strong>Protecao impermeabilizante:</strong> ${formatCurrency(budget.extraSubtotal)}</p>` : ''}
                    <p style="color:#166534;"><strong>Economia total:</strong> ${formatCurrency(budget.totalEconomy)}</p>
                    <p style="color:#475569;font-size:0.78rem;line-height:1.45;">${getBudgetDiscountReason(budget)}</p>
                </div>

                <div class="preview-total-box" style="display:block;">
                    <span class="total-label">Total a pagar</span>
                    <div style="margin-top:10px;font-size:0.82rem;color:#94A3B8;">De: <span style="text-decoration:line-through;">${formatCurrency(budget.originalBudgetTotal)}</span></div>
                    <div style="font-size:1.35rem;font-weight:800;color:#1A3C5E;margin-top:4px;">Por: ${formatCurrency(budget.totalGeral)}</div>
                    <div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#ECFDF5;color:#166534;font-weight:800;">
                        Economia total neste orcamento: ${formatCurrency(budget.totalEconomy)}
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;background:#1E6B3C;color:#fff;padding:8px 16px;border-radius:0 0 6px 6px;margin-top:-8px;margin-bottom:12px;font-size:0.82rem;font-weight:600;">
                    <span>PIX a vista: ${formatCurrency(budget.totalPix)}</span>
                    <span>4x de ${formatCurrency(budget.parcela)}</span>
                </div>

                <div class="preview-payment">
                    <span>PIX (5% desc.)</span>
                    <span>Dinheiro</span>
                    <span>Debito</span>
                    <span>Credito 4x s/ juros</span>
                </div>

                ${obsHtml}

                <div class="preview-obs">
                    Este orcamento tem validade de 7 dias. O agendamento sera confirmado apos contato via WhatsApp. Atendemos em domicilio em BH e regiao.
                </div>

                <div class="preview-footer">
                    Damas Clean - Higienizacao Profissional de Estofados - BH e Regiao<br>
                    WhatsApp: (31) 9971-0420 - contato@damasclean.com.br
                </div>
            </div>
        `;
    };

    function splitTextLocal(text, font, fontSize, maxWidth) {
        const words = String(text || '').split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const candidate = currentLine ? `${currentLine} ${word}` : word;
            if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = candidate;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    gerarPDF = async function () {
        if (!validate()) return;

        try {
            const btnPDF = document.getElementById('btnGerarPDF');
            const originalText = btnPDF.innerHTML;
            btnPDF.innerHTML = 'Gerando PDF...';
            btnPDF.disabled = true;

            const templateBytes = await fetch('exemplo.pdf').then(response => {
                if (!response.ok) throw new Error('Nao foi possivel carregar o template PDF');
                return response.arrayBuffer();
            });

            const { PDFDocument, rgb, StandardFonts } = PDFLib;
            const pdfDoc = await PDFDocument.load(templateBytes);
            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
            const page2 = pdfDoc.getPages()[1];
            const { width } = page2.getSize();

            const BRANCO = rgb(1, 1, 1);
            const PRETO = rgb(0, 0, 0);
            const VERDE = rgb(22 / 255, 101 / 255, 52 / 255);
            const CINZA = rgb(100 / 255, 116 / 255, 139 / 255);
            const LARANJA = rgb(194 / 255, 65 / 255, 12 / 255);
            const budget = buildBudgetData();

            const numOrc = document.getElementById('numOrcamento').value;
            const dataEmissao = document.getElementById('dataEmissao').value;
            const dataValidade = document.getElementById('dataValidade').value;
            const nomeCliente = document.getElementById('nomeCliente').value;
            const telefone = document.getElementById('telefoneCliente').value || '';
            const endereco = document.getElementById('enderecoCliente').value || '';
            const bairro = document.getElementById('bairroCliente').value || '';
            const enderecoFull = endereco + (bairro ? ' - ' + bairro : '');
            const obsCustom = document.getElementById('observacoes').value.trim();

            page2.drawRectangle({ x: 0, y: 0, width, height: 675, color: BRANCO });
            let currentY = 630;
            const marginX = 45;
            const tableW = width - (marginX * 2);
            const colsT1 = [tableW * 0.22, tableW * 0.22, tableW * 0.22, tableW * 0.34];

            page2.drawRectangle({ x: marginX, y: currentY - 20, width: tableW, height: 20, borderColor: PRETO, borderWidth: 1 });
            page2.drawRectangle({ x: marginX, y: currentY - 54, width: tableW, height: 34, borderColor: PRETO, borderWidth: 1 });

            let currentX = marginX;
            for (let i = 0; i < 3; i++) {
                currentX += colsT1[i];
                page2.drawLine({ start: { x: currentX, y: currentY }, end: { x: currentX, y: currentY - 54 }, color: PRETO, thickness: 1 });
            }

            ['Orcamento', 'Data', 'Validade', 'Valor'].forEach((header, index) => {
                const startX = colsT1.slice(0, index).reduce((sum, value) => sum + value, marginX);
                page2.drawText(header, {
                    x: startX + (colsT1[index] / 2) - (helveticaBoldOblique.widthOfTextAtSize(header, 10) / 2),
                    y: currentY - 14,
                    size: 10,
                    font: helveticaBoldOblique,
                    color: PRETO
                });
            });

            const dataY = currentY - 38;
            page2.drawText(numOrc, { x: marginX + (colsT1[0] / 2) - (helvetica.widthOfTextAtSize(numOrc, 10) / 2), y: dataY, size: 10, font: helvetica, color: PRETO });
            page2.drawText(dataEmissao, { x: marginX + colsT1[0] + (colsT1[1] / 2) - (helvetica.widthOfTextAtSize(dataEmissao, 10) / 2), y: dataY, size: 10, font: helvetica, color: PRETO });
            page2.drawText(dataValidade, { x: marginX + colsT1[0] + colsT1[1] + (colsT1[2] / 2) - (helvetica.widthOfTextAtSize(dataValidade, 10) / 2), y: dataY, size: 10, font: helvetica, color: PRETO });

            const totalBlockPrimary = `Por: ${formatCurrency(budget.totalGeral)}`;
            const totalBlockSecondary = `De: ${formatCurrency(budget.originalBudgetTotal)}`;
            const totalColCenter = marginX + colsT1[0] + colsT1[1] + colsT1[2] + (colsT1[3] / 2);
            page2.drawText(totalBlockSecondary, {
                x: totalColCenter - (helvetica.widthOfTextAtSize(totalBlockSecondary, 8) / 2),
                y: dataY + 5,
                size: 8,
                font: helvetica,
                color: CINZA
            });
            page2.drawLine({
                start: { x: totalColCenter - (helvetica.widthOfTextAtSize(totalBlockSecondary, 8) / 2) + 18, y: dataY + 8 },
                end: { x: totalColCenter + (helvetica.widthOfTextAtSize(totalBlockSecondary, 8) / 2), y: dataY + 8 },
                color: CINZA,
                thickness: 1
            });
            page2.drawText(totalBlockPrimary, {
                x: totalColCenter - (helveticaBoldOblique.widthOfTextAtSize(totalBlockPrimary, 11) / 2),
                y: dataY - 8,
                size: 11,
                font: helveticaBoldOblique,
                color: PRETO
            });

            currentY -= 69;

            page2.drawRectangle({ x: marginX, y: currentY - 50, width: tableW, height: 50, borderColor: PRETO, borderWidth: 1 });
            page2.drawText('Cliente: ', { x: marginX + 5, y: currentY - 20, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText(`${nomeCliente}${telefone ? `    ${telefone}` : ''}`, {
                x: marginX + 5 + helveticaBoldOblique.widthOfTextAtSize('Cliente: ', 10),
                y: currentY - 20,
                size: 10,
                font: helvetica,
                color: PRETO
            });
            page2.drawText('Endereco: ', { x: marginX + 5, y: currentY - 40, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText(enderecoFull || '-', {
                x: marginX + 5 + helveticaBoldOblique.widthOfTextAtSize('Endereco: ', 10),
                y: currentY - 40,
                size: 10,
                font: helvetica,
                color: PRETO
            });

            currentY -= 65;
            page2.drawText('Descricao do servico', { x: marginX, y: currentY - 14, size: 11, font: helveticaBoldOblique, color: PRETO });
            currentY -= 20;

            const svcCols = [tableW * 0.40, tableW * 0.12, tableW * 0.20, tableW * 0.28];
            page2.drawRectangle({ x: marginX, y: currentY - 20, width: tableW, height: 20, borderColor: PRETO, borderWidth: 1 });

            currentX = marginX;
            for (let i = 0; i < 3; i++) {
                currentX += svcCols[i];
                page2.drawLine({ start: { x: currentX, y: currentY }, end: { x: currentX, y: currentY - 20 }, color: PRETO, thickness: 1 });
            }

            page2.drawText('Servico', { x: marginX + 5, y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText('Qtd', { x: marginX + svcCols[0] + (svcCols[1] / 2) - (helveticaBoldOblique.widthOfTextAtSize('Qtd', 10) / 2), y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText('Valor real', { x: marginX + svcCols[0] + svcCols[1] + (svcCols[2] / 2) - (helveticaBoldOblique.widthOfTextAtSize('Valor real', 10) / 2), y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText('Oferta', { x: marginX + svcCols[0] + svcCols[1] + svcCols[2] + (svcCols[3] / 2) - (helveticaBoldOblique.widthOfTextAtSize('Oferta', 10) / 2), y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });

            currentY -= 20;

            budget.lineItems.forEach(item => {
                const nameLines = splitTextLocal(item.name, helvetica, 9, svcCols[0] - 10);
                const noteLines = splitTextLocal(item.discountReason, helvetica, 7.2, svcCols[0] - 10).slice(0, 2);
                const rowH = Math.max(40, 12 + (nameLines.length * 10) + (noteLines.length * 9));

                page2.drawRectangle({ x: marginX, y: currentY - rowH, width: tableW, height: rowH, borderColor: PRETO, borderWidth: 1 });

                let rowX = marginX;
                for (let i = 0; i < 3; i++) {
                    rowX += svcCols[i];
                    page2.drawLine({ start: { x: rowX, y: currentY }, end: { x: rowX, y: currentY - rowH }, color: PRETO, thickness: 1 });
                }

                let nameY = currentY - 12;
                nameLines.forEach(line => {
                    page2.drawText(line, { x: marginX + 5, y: nameY, size: 9, font: helvetica, color: PRETO });
                    nameY -= 10;
                });

                page2.drawText(`Economia: ${formatCurrency(item.discountValue)}`, {
                    x: marginX + 5,
                    y: nameY - 1,
                    size: 7.2,
                    font: helveticaBold,
                    color: item.kind === 'extra' ? LARANJA : VERDE
                });
                nameY -= 9;

                noteLines.forEach(line => {
                    page2.drawText(line, { x: marginX + 5, y: nameY - 1, size: 7.2, font: helvetica, color: CINZA });
                    nameY -= 9;
                });

                const centerY = currentY - (rowH / 2) - 4;
                const qtyText = String(item.qty);
                const unitText = formatCurrency(item.price);
                page2.drawText(qtyText, {
                    x: marginX + svcCols[0] + (svcCols[1] / 2) - (helvetica.widthOfTextAtSize(qtyText, 9) / 2),
                    y: centerY,
                    size: 9,
                    font: helvetica,
                    color: PRETO
                });
                page2.drawText(unitText, {
                    x: marginX + svcCols[0] + svcCols[1] + (svcCols[2] / 2) - (helvetica.widthOfTextAtSize(unitText, 9) / 2),
                    y: centerY,
                    size: 9,
                    font: helvetica,
                    color: PRETO
                });

                const offerColStart = marginX + svcCols[0] + svcCols[1] + svcCols[2];
                const offerColWidth = svcCols[3];
                const oldText = `De: ${formatCurrency(item.originalTotal)}`;
                const newText = `Por: ${formatCurrency(item.total)}`;
                const oldX = offerColStart + offerColWidth - 8 - helvetica.widthOfTextAtSize(oldText, 7.5);
                const oldY = currentY - 14;

                page2.drawText(oldText, { x: oldX, y: oldY, size: 7.5, font: helvetica, color: CINZA });
                page2.drawLine({
                    start: { x: oldX + 18, y: oldY + 3 },
                    end: { x: oldX + helvetica.widthOfTextAtSize(oldText, 7.5), y: oldY + 3 },
                    color: CINZA,
                    thickness: 1
                });
                page2.drawText(newText, {
                    x: offerColStart + offerColWidth - 8 - helveticaBold.widthOfTextAtSize(newText, 9),
                    y: currentY - 27,
                    size: 9,
                    font: helveticaBold,
                    color: item.kind === 'extra' ? LARANJA : VERDE
                });

                currentY -= rowH;
            });

            currentY -= 15;
            page2.drawText('Resumo do investimento', { x: marginX, y: currentY - 14, size: 11, font: helveticaBoldOblique, color: PRETO });
            currentY -= 20;

            const summaryRows = [
                { label: 'Valor original do orcamento', amount: budget.originalBudgetTotal },
                { label: 'Economia total aplicada', amount: -budget.totalEconomy },
                { label: 'Total a pagar', amount: budget.totalGeral, emphasize: true }
            ];
            const summaryLabelWidth = tableW * 0.62;

            summaryRows.forEach(row => {
                const rowH = 24;
                const font = row.emphasize ? helveticaBold : helvetica;
                const fontSize = row.emphasize ? 10.5 : 9.5;
                const valueText = row.amount < 0 ? `- ${formatCurrency(Math.abs(row.amount))}` : formatCurrency(row.amount);

                page2.drawRectangle({ x: marginX, y: currentY - rowH, width: tableW, height: rowH, borderColor: PRETO, borderWidth: 1 });
                page2.drawLine({ start: { x: marginX + summaryLabelWidth, y: currentY }, end: { x: marginX + summaryLabelWidth, y: currentY - rowH }, color: PRETO, thickness: 1 });
                page2.drawText(row.label, { x: marginX + 5, y: currentY - 16, size: fontSize, font, color: PRETO });
                page2.drawText(valueText, {
                    x: marginX + tableW - 6 - font.widthOfTextAtSize(valueText, fontSize),
                    y: currentY - 16,
                    size: fontSize,
                    font,
                    color: row.amount < 0 ? VERDE : PRETO
                });
                currentY -= rowH;
            });

            currentY -= 14;
            splitTextLocal(`Economia total neste orcamento: ${formatCurrency(budget.totalEconomy)}. ${getBudgetDiscountReason(budget)}`, helvetica, 7.5, tableW).forEach((line, index) => {
                page2.drawText(line, {
                    x: marginX,
                    y: currentY,
                    size: 7.5,
                    font: index === 0 ? helveticaBold : helvetica,
                    color: index === 0 ? VERDE : CINZA
                });
                currentY -= 10;
            });

            currentY -= 10;
            const footerText = obsCustom || 'A taxa de servico da Damas Clean pode ser isentada para servicos que ultrapassem duzentos e dez reais. Para valores menores, uma taxa de servico pode ser cobrada para cobrir custos de operacao, deslocamento e atendimento.';
            splitTextLocal(footerText, helvetica, 7.5, tableW).forEach(line => {
                page2.drawText(line, { x: marginX, y: currentY, size: 7.5, font: helvetica, color: PRETO });
                currentY -= 10;
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const nomeClienteFile = nomeCliente.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');

            link.href = url;
            link.download = `Orcamento_${numOrc}_${nomeClienteFile}.pdf`;
            link.click();
            URL.revokeObjectURL(url);

            btnPDF.innerHTML = originalText;
            btnPDF.disabled = false;
            showToast('PDF gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            const btnPDF = document.getElementById('btnGerarPDF');
            btnPDF.innerHTML = 'Gerar PDF';
            btnPDF.disabled = false;
            showToast(`Erro ao gerar PDF: ${error.message}`, true);
        }
    };

    const upsellBox = document.getElementById('upsellBox');
    if (upsellBox) upsellBox.style.display = 'none';

    const upsellCheck = document.getElementById('upsellCheck');
    if (upsellCheck) upsellCheck.checked = false;

    renderServicesTable();
    SERVICES.forEach((service, index) => {
        if (typeof service.impermeabilizacao === 'number') {
            syncImpermeabilizacaoState(index);
        }
    });
    updateSummary();
    updateServiceCounter();
})();
