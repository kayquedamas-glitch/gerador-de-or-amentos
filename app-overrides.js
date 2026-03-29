(function () {
    const AUTO_DISCOUNT_RULES = {
        sofaProtectionPerSet: 30,
        sofaMattressPerSet: 25,
        completeComboPerSet: 60,
        multiItem3Plus: 20,
        multiItem5Plus: 40
    };

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
    SERVICE_CATEGORIES.forEach(cat => {
        cat.services.forEach(service => {
            SERVICES.push({ ...service, category: cat.category });
        });
    });

    function getImpermeabilizacaoInput(index) {
        return document.getElementById(`impermeabilizacao_${index}`);
    }

    function buildBudgetData() {
        const services = [];

        SERVICES.forEach((service, index) => {
            const checked = document.getElementById(`check_${index}`)?.checked;
            const qty = parseInt(document.getElementById(`qty_${index}`)?.value || '0', 10) || 0;
            if (!checked || qty <= 0) return;

            const discount = parseFloat(document.getElementById(`discount_${index}`)?.value || '0') || 0;
            services.push({
                index,
                name: service.name,
                price: service.price,
                qty,
                discount,
                total: Math.max(0, (service.price * qty) - discount),
                category: service.category,
                comboGroup: service.comboGroup,
                impermeabilizacao: service.impermeabilizacao,
                impermeabilizacaoSelected: Boolean(getImpermeabilizacaoInput(index)?.checked)
            });
        });

        const lineItems = [];
        services.forEach(service => {
            lineItems.push({
                kind: 'service',
                name: service.name,
                price: service.price,
                qty: service.qty,
                discount: service.discount,
                total: service.total
            });

            if (service.impermeabilizacaoSelected && typeof service.impermeabilizacao === 'number') {
                lineItems.push({
                    kind: 'extra',
                    name: getImpermeabilizacaoLabel(service.name),
                    price: service.impermeabilizacao,
                    qty: service.qty,
                    discount: 0,
                    total: service.impermeabilizacao * service.qty
                });
            }
        });

        const totalSofaQty = services.filter(service => service.comboGroup === 'sofa').reduce((sum, service) => sum + service.qty, 0);
        const totalProtectedSofaQty = services.filter(service => service.comboGroup === 'sofa' && service.impermeabilizacaoSelected).reduce((sum, service) => sum + service.qty, 0);
        const totalMattressQty = services.filter(service => service.comboGroup === 'colchao').reduce((sum, service) => sum + service.qty, 0);
        const totalMainPieces = services.reduce((sum, service) => sum + service.qty, 0);
        const comboDiscounts = [];

        const completeComboQty = Math.min(totalProtectedSofaQty, totalMattressQty);
        if (completeComboQty > 0) comboDiscounts.push({ label: 'Combo inteligente: sofa + colchao + protecao', amount: completeComboQty * AUTO_DISCOUNT_RULES.completeComboPerSet });

        const sofaProtectionQty = Math.max(0, totalProtectedSofaQty - completeComboQty);
        if (sofaProtectionQty > 0) comboDiscounts.push({ label: 'Combo inteligente: sofa com protecao impermeabilizante', amount: sofaProtectionQty * AUTO_DISCOUNT_RULES.sofaProtectionPerSet });

        const sofaMattressQty = Math.max(0, Math.min(totalSofaQty, totalMattressQty) - completeComboQty);
        if (sofaMattressQty > 0) comboDiscounts.push({ label: 'Combo inteligente: sofa + colchao', amount: sofaMattressQty * AUTO_DISCOUNT_RULES.sofaMattressPerSet });

        const progressiveDiscount = totalMainPieces >= 5 ? AUTO_DISCOUNT_RULES.multiItem5Plus : totalMainPieces >= 3 ? AUTO_DISCOUNT_RULES.multiItem3Plus : 0;
        if (progressiveDiscount > 0) comboDiscounts.push({ label: 'Desconto progressivo por volume', amount: progressiveDiscount });

        const serviceSubtotal = services.reduce((sum, service) => sum + service.total, 0);
        const extraSubtotal = lineItems.filter(item => item.kind === 'extra').reduce((sum, item) => sum + item.total, 0);
        const comboDiscountTotal = comboDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
        const subtotal = serviceSubtotal + extraSubtotal;
        const totalGeral = Math.max(0, subtotal - comboDiscountTotal);
        const totalPix = totalGeral - (totalGeral * PIX_DISCOUNT);

        return {
            services,
            lineItems,
            serviceSubtotal,
            extraSubtotal,
            comboDiscounts,
            comboDiscountTotal,
            subtotal,
            totalGeral,
            totalPix,
            parcela: totalGeral / INSTALLMENTS
        };
    }

    getImpermeabilizacaoLabel = function (serviceName) {
        return `Protecao impermeabilizante ${serviceName}`;
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

    syncImpermeabilizacaoState = function (index) {
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
    };

    onImpermeabilizacaoChange = function (index) {
        syncImpermeabilizacaoState(index);
        updateSummary();
    };

    renderServicesTable = function () {
        const container = document.getElementById('servicesBody');
        container.innerHTML = '';

        let globalIndex = 0;
        SERVICE_CATEGORIES.forEach(cat => {
            const group = document.createElement('div');
            group.className = 'category-group';
            group.innerHTML = `<div class="category-title">${cat.category}</div>`;

            cat.services.forEach(service => {
                const index = globalIndex;
                const card = document.createElement('div');
                card.className = 'service-card';
                card.id = `serviceRow_${index}`;

                const extraHtml = typeof service.impermeabilizacao === 'number' ? `
                    <div class="service-extra disabled" id="extraBox_${index}">
                        <div class="service-extra-copy">
                            <span class="service-extra-kicker">Protecao Premium</span>
                            <label class="service-extra-title" for="impermeabilizacao_${index}">Adicionar protecao impermeabilizante</label>
                            <span class="service-extra-subtitle">Protecao contra liquidos e manchas para este item.</span>
                            <span class="service-extra-price">+ ${formatCurrency(service.impermeabilizacao)} por unidade</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="impermeabilizacao_${index}" onchange="onImpermeabilizacaoChange(${index})" disabled>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>` : '';

                card.innerHTML = `
                    <input type="checkbox" id="check_${index}" onchange="onServiceChange(${index})" style="display:none">
                    <div class="svc-info">
                        <div class="svc-name">${service.name}</div>
                        <div class="svc-price">${formatCurrency(service.price)}</div>
                        <div class="svc-discount-wrap">
                            <label>Desc. R$</label>
                            <input type="number" id="discount_${index}" value="0" min="0" step="5" onchange="onServiceChange(${index})" oninput="onServiceChange(${index})">
                        </div>
                        ${extraHtml}
                    </div>
                    <div class="svc-controls">
                        <div class="stepper">
                            <button onclick="changeQty(${index}, -1)">-</button>
                            <input type="number" id="qty_${index}" value="0" min="0" max="20" onchange="onServiceChange(${index})" oninput="onServiceChange(${index})">
                            <button onclick="changeQty(${index}, 1)">+</button>
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

    onServiceChange = function (index) {
        const qty = parseInt(document.getElementById(`qty_${index}`)?.value || '0', 10) || 0;
        const row = document.getElementById(`serviceRow_${index}`);
        const totalEl = document.getElementById(`total_${index}`);
        const discount = parseFloat(document.getElementById(`discount_${index}`)?.value || '0') || 0;
        const checkEl = document.getElementById(`check_${index}`);

        checkEl.checked = qty > 0;

        if (qty > 0) {
            totalEl.textContent = formatCurrency(Math.max(0, (SERVICES[index].price * qty) - discount));
            totalEl.classList.add('active');
            row.classList.add('selected');
        } else {
            totalEl.textContent = 'R$ 0,00';
            totalEl.classList.remove('active');
            row.classList.remove('selected');
            row.classList.remove('has-protection');
        }

        syncImpermeabilizacaoState(index);
        updateSummary();
        updateServiceCounter();
    };

    updateServiceCounter = function () {
        const count = buildBudgetData().services.length;
        const counter = document.getElementById('serviceCounter');
        counter.textContent = `${count} servi\u00E7o(s) selecionado(s)`;
        counter.className = 'service-counter' + (count > 0 ? ' active' : '');
    };

    updateSummary = function () {
        const budget = buildBudgetData();

        document.getElementById('subtotal').textContent = formatCurrency(budget.serviceSubtotal);

        const extraSubtotalRow = document.getElementById('extraSubtotalRow');
        if (extraSubtotalRow) {
            if (budget.extraSubtotal > 0) {
                extraSubtotalRow.style.display = 'flex';
                document.getElementById('extraSubtotal').textContent = formatCurrency(budget.extraSubtotal);
            } else {
                extraSubtotalRow.style.display = 'none';
            }
        }

        const comboDiscountsWrap = document.getElementById('comboDiscountsWrap');
        if (comboDiscountsWrap) {
            if (budget.comboDiscounts.length > 0) {
                comboDiscountsWrap.style.display = 'block';
                comboDiscountsWrap.innerHTML = budget.comboDiscounts.map(discount => `
                    <div class="sum-row discount-row">
                        <span>${discount.label}</span>
                        <span class="val">- ${formatCurrency(discount.amount)}</span>
                    </div>
                `).join('');
            } else {
                comboDiscountsWrap.style.display = 'none';
                comboDiscountsWrap.innerHTML = '';
            }
        }

        const itemsList = document.getElementById('summaryItemsList');
        if (budget.lineItems.length === 0) {
            itemsList.innerHTML = '<div class="empty-state">Nenhum servi\u00E7o selecionado no momento.</div>';
        } else {
            itemsList.innerHTML = budget.lineItems.map(item => `
                <div class="summary-item ${item.kind === 'extra' ? 'extra' : ''}">
                    <span class="name">${item.name} (${item.qty}x)</span>
                    <span class="val">${formatCurrency(item.total)}</span>
                </div>
            `).join('');
        }

        document.getElementById('descontoPix').textContent = formatCurrency(budget.totalPix);
        document.getElementById('parcela4x').textContent = `4x ${formatCurrency(budget.parcela)}`;
        document.getElementById('totalFinal').textContent = formatCurrency(budget.totalGeral);
        document.getElementById('pixHighlight').textContent = `PIX a vista: ${formatCurrency(budget.totalPix)}`;
        document.getElementById('installmentHighlight').textContent = `4x de ${formatCurrency(budget.parcela)}`;

        const mobileTotal = document.getElementById('mobileTotal');
        if (mobileTotal) mobileTotal.textContent = formatCurrency(budget.totalGeral);

        const legacyUpsellRow = document.getElementById('upsellRow');
        if (legacyUpsellRow) legacyUpsellRow.style.display = 'none';
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
            document.getElementById(`discount_${index}`).value = 0;
            document.getElementById(`total_${index}`).textContent = 'R$ 0,00';
            document.getElementById(`total_${index}`).classList.remove('active');
            document.getElementById(`serviceRow_${index}`).classList.remove('selected');
            document.getElementById(`serviceRow_${index}`).classList.remove('has-protection');
            const extraInput = getImpermeabilizacaoInput(index);
            if (extraInput) extraInput.checked = false;
            syncImpermeabilizacaoState(index);
        });

        generateBudgetNumber();
        setDates();
        updateSummary();
        updateServiceCounter();
        showToast('Formulario limpo com sucesso!');
    };

    copiarWhatsApp = function () {
        if (!validate()) return;

        const budget = buildBudgetData();
        let msg = 'Segue o orcamento conforme solicitado!\n';
        msg += '━━━━━━━━━━━━━━━━━━━\n';
        msg += 'SERVICOS\n';
        msg += '━━━━━━━━━━━━━━━━━━━\n';

        budget.lineItems.forEach(item => {
            msg += `✅ ${item.name} (${item.qty}x) → ${formatCurrency(item.total)}\n`;
        });

        if (budget.comboDiscounts.length > 0) {
            msg += '━━━━━━━━━━━━━━━━━━━\n';
            msg += 'DESCONTOS AUTOMATICOS\n';
            budget.comboDiscounts.forEach(discount => {
                msg += `• ${discount.label} → - ${formatCurrency(discount.amount)}\n`;
            });
        }

        msg += '━━━━━━━━━━━━━━━━━━━\n';
        msg += `Total: ${formatCurrency(budget.totalGeral)}\n`;
        msg += `PIX a vista: ${formatCurrency(budget.totalPix)} (5% OFF)\n`;
        msg += `Cartao: 4x de ${formatCurrency(budget.parcela)} sem juros\n`;
        msg += '━━━━━━━━━━━━━━━━━━━\n';
        msg += 'Tenho horario disponivel ainda essa semana no seu bairro. Qual horario fica melhor para voce?';

        navigator.clipboard.writeText(msg).then(() => {
            showToast('Mensagem copiada para o WhatsApp!');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = msg;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Mensagem copiada para o WhatsApp!');
        });
    };

    buildPreviewHTML = function () {
        const budget = buildBudgetData();
        const bairro = document.getElementById('bairroCliente').value;
        const obs = document.getElementById('observacoes').value.trim();

        const rows = budget.lineItems.map(item => {
            const discountDisplay = item.kind === 'service' && item.discount > 0 ? formatCurrency(item.discount) : '&mdash;';
            const note = item.kind === 'extra'
                ? '<div style="font-size:0.72rem;color:#9A3412;margin-top:4px;">Protecao complementar vinculada ao item principal.</div>'
                : '';
            const rowStyle = item.kind === 'extra' ? ' style="background:#FFF7ED"' : '';
            const totalColor = item.kind === 'extra' ? '#C2410C' : '#1E6B3C';

            return `
                <tr${rowStyle}>
                    <td>${item.name}${note}</td>
                    <td style="text-align:center">${formatCurrency(item.price)}</td>
                    <td style="text-align:center">${item.qty}</td>
                    <td style="text-align:center;color:${item.kind === 'service' && item.discount > 0 ? '#1E6B3C' : 'inherit'}">${discountDisplay}</td>
                    <td style="text-align:center;color:${totalColor};font-weight:700">${formatCurrency(item.total)}</td>
                </tr>`;
        }).join('');

        const protectionHtml = budget.extraSubtotal > 0 ? `
            <div style="background:#FFF7ED;border-left:4px solid #D97706;padding:10px 14px;margin-bottom:12px;border-radius:0 6px 6px 0;">
                <strong style="color:#9A3412;">Protecao impermeabilizante ativa:</strong>
                <span style="color:#C2410C;font-weight:700;">${formatCurrency(budget.extraSubtotal)}</span><br>
                <span style="color:#9A3412;font-size:0.78rem;">Cobertura premium contra liquidos e manchas vinculada aos itens selecionados.</span>
            </div>` : '';

        const comboDiscountsHtml = budget.comboDiscounts.map(discount => `
            <p style="color:#1E6B3C"><strong>${discount.label}:</strong> - ${formatCurrency(discount.amount)}</p>
        `).join('');

        const obsHtml = obs ? `
            <div style="background:#F4F6F9;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:0.78rem;">
                <strong style="color:#1A3C5E;">Observacoes:</strong><br>${obs}
            </div>` : '';

        return `
        <div class="preview-container">
            <div class="preview-header">
                <div class="company-name">Damas Clean · Higienizacao de Estofados</div>
                <div class="company-contact">WhatsApp: (31) 9971-0420 · Instagram: @damas_clean</div>
            </div>

            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Orcamento</th>
                        <th>Data</th>
                        <th>Validade</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${document.getElementById('numOrcamento').value}</td>
                        <td>${document.getElementById('dataEmissao').value}</td>
                        <td style="font-weight:700;color:#1A3C5E;">${document.getElementById('dataValidade').value}</td>
                        <td style="color:#2D6A9F;font-weight:800">${formatCurrency(budget.totalGeral)}</td>
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
                        <th style="text-align:center">Preco Unit.</th>
                        <th style="text-align:center">Qtd</th>
                        <th style="text-align:center">Desconto</th>
                        <th style="text-align:center">Total</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            ${protectionHtml}

            <div class="preview-summary">
                <p><strong>Subtotal limpeza:</strong> ${formatCurrency(budget.serviceSubtotal)}</p>
                ${budget.extraSubtotal > 0 ? `<p style="color:#C2410C"><strong>Protecao impermeabilizante:</strong> ${formatCurrency(budget.extraSubtotal)}</p>` : ''}
                ${comboDiscountsHtml}
            </div>

            <div class="preview-total-box">
                <span class="total-label">Total a Pagar</span>
                <span class="total-value">${formatCurrency(budget.totalGeral)}</span>
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
                Damas Clean · Higienizacao Profissional de Estofados · BH e Regiao<br>
                WhatsApp: (31) 9971-0420 · contato@damasclean.com.br
            </div>
        </div>`;
    };

    gerarPDF = async function () {
        if (!validate()) return;

        try {
            const btnPDF = document.getElementById('btnGerarPDF');
            const originalText = btnPDF.innerHTML;
            btnPDF.innerHTML = 'Gerando PDF...';
            btnPDF.disabled = true;

            const templateBytes = await fetch('exemplo.pdf').then(res => {
                if (!res.ok) throw new Error('Nao foi possivel carregar o template PDF');
                return res.arrayBuffer();
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
            const t1Row1H = 20;
            const t1Row2H = 34;

            page2.drawRectangle({ x: marginX, y: currentY - t1Row1H, width: tableW, height: t1Row1H, borderColor: PRETO, borderWidth: 1 });
            page2.drawRectangle({ x: marginX, y: currentY - t1Row1H - t1Row2H, width: tableW, height: t1Row2H, borderColor: PRETO, borderWidth: 1 });

            const colsT1 = [tableW * 0.22, tableW * 0.22, tableW * 0.22, tableW * 0.34];
            let curX = marginX;
            for (let i = 0; i < 3; i++) {
                curX += colsT1[i];
                page2.drawLine({ start: { x: curX, y: currentY }, end: { x: curX, y: currentY - t1Row1H - t1Row2H }, color: PRETO, thickness: 1 });
            }

            const headersT1 = ['Orcamento', 'Data', 'Validade', 'Valor'];
            curX = marginX;
            for (let i = 0; i < 4; i++) {
                page2.drawText(headersT1[i], {
                    x: curX + (colsT1[i] / 2) - (helveticaBoldOblique.widthOfTextAtSize(headersT1[i], 10) / 2),
                    y: currentY - 14,
                    size: 10,
                    font: helveticaBoldOblique,
                    color: PRETO
                });
                curX += colsT1[i];
            }

            const dataY = currentY - t1Row1H - 18;
            page2.drawText(numOrc, { x: marginX + (colsT1[0] / 2) - (helvetica.widthOfTextAtSize(numOrc, 10) / 2), y: dataY, size: 10, font: helvetica, color: PRETO });
            page2.drawText(dataEmissao, { x: marginX + colsT1[0] + (colsT1[1] / 2) - (helvetica.widthOfTextAtSize(dataEmissao, 10) / 2), y: dataY, size: 10, font: helvetica, color: PRETO });
            page2.drawText(dataValidade, { x: marginX + colsT1[0] + colsT1[1] + (colsT1[2] / 2) - (helvetica.widthOfTextAtSize(dataValidade, 10) / 2), y: dataY, size: 10, font: helvetica, color: PRETO });

            const v4x = `4x de ${formatCurrency(budget.parcela)}`;
            const vVista = `ou ${formatCurrency(budget.totalPix)} a vista`;
            const vXBase = marginX + colsT1[0] + colsT1[1] + colsT1[2] + (colsT1[3] / 2);
            page2.drawText(v4x, { x: vXBase - (helveticaBoldOblique.widthOfTextAtSize(v4x, 12) / 2), y: dataY + 4, size: 12, font: helveticaBoldOblique, color: PRETO });
            page2.drawText(vVista, { x: vXBase - (helvetica.widthOfTextAtSize(vVista, 9) / 2), y: dataY - 8, size: 9, font: helvetica, color: PRETO });

            currentY -= (t1Row1H + t1Row2H + 15);

            const clientBoxH = 50;
            const clientLabel = 'Cliente: ';
            const endLabel = 'Endereco: ';
            page2.drawRectangle({ x: marginX, y: currentY - clientBoxH, width: tableW, height: clientBoxH, borderColor: PRETO, borderWidth: 1 });
            page2.drawText(clientLabel, { x: marginX + 5, y: currentY - 20, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText(`${nomeCliente}${telefone ? '    ' + telefone : ''}`, {
                x: marginX + 5 + helveticaBoldOblique.widthOfTextAtSize(clientLabel, 10),
                y: currentY - 20,
                size: 10,
                font: helvetica,
                color: PRETO
            });
            page2.drawText(endLabel, { x: marginX + 5, y: currentY - 40, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText(enderecoFull || '-', {
                x: marginX + 5 + helveticaBoldOblique.widthOfTextAtSize(endLabel, 10),
                y: currentY - 40,
                size: 10,
                font: helvetica,
                color: PRETO
            });

            currentY -= (clientBoxH + 15);
            page2.drawText('Descricao do servico', { x: marginX, y: currentY - 14, size: 11, font: helveticaBoldOblique, color: PRETO });
            currentY -= 20;

            const t3HeaderH = 20;
            const svcCols = [tableW * 0.40, tableW * 0.12, tableW * 0.24, tableW * 0.24];
            page2.drawRectangle({ x: marginX, y: currentY - t3HeaderH, width: tableW, height: t3HeaderH, borderColor: PRETO, borderWidth: 1 });

            curX = marginX;
            for (let i = 0; i < 3; i++) {
                curX += svcCols[i];
                page2.drawLine({ start: { x: curX, y: currentY }, end: { x: curX, y: currentY - t3HeaderH }, color: PRETO, thickness: 1 });
            }

            page2.drawText('Servico', { x: marginX + 5, y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText('Valor unitario', { x: marginX + svcCols[0] + svcCols[1] + (svcCols[2] / 2) - (helveticaBoldOblique.widthOfTextAtSize('Valor unitario', 10) / 2), y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });
            page2.drawText('Valor total', { x: marginX + svcCols[0] + svcCols[1] + svcCols[2] + (svcCols[3] / 2) - (helveticaBoldOblique.widthOfTextAtSize('Valor total', 10) / 2), y: currentY - 14, size: 10, font: helveticaBoldOblique, color: PRETO });

            currentY -= t3HeaderH;

            budget.lineItems.forEach(item => {
                const rowH = 34;
                page2.drawRectangle({ x: marginX, y: currentY - rowH, width: tableW, height: rowH, borderColor: PRETO, borderWidth: 1 });

                let cx = marginX;
                for (let i = 0; i < 3; i++) {
                    cx += svcCols[i];
                    page2.drawLine({ start: { x: cx, y: currentY }, end: { x: cx, y: currentY - rowH }, color: PRETO, thickness: 1 });
                }

                let nameY = currentY - 12;
                splitText(item.name, helvetica, 9, svcCols[0] - 10).forEach(line => {
                    page2.drawText(line, { x: marginX + 5, y: nameY, size: 9, font: helvetica, color: PRETO });
                    nameY -= 12;
                });

                const qtyText = String(item.qty);
                const unitText = formatCurrency(item.price);
                const totalText = formatCurrency(item.total);
                page2.drawText(qtyText, { x: marginX + svcCols[0] + (svcCols[1] / 2) - (helvetica.widthOfTextAtSize(qtyText, 9) / 2), y: currentY - 20, size: 9, font: helvetica, color: PRETO });
                page2.drawText(unitText, { x: marginX + svcCols[0] + svcCols[1] + (svcCols[2] / 2) - (helvetica.widthOfTextAtSize(unitText, 9) / 2), y: currentY - 20, size: 9, font: helvetica, color: PRETO });
                page2.drawText(totalText, { x: marginX + svcCols[0] + svcCols[1] + svcCols[2] + (svcCols[3] / 2) - (helvetica.widthOfTextAtSize(totalText, 9) / 2), y: currentY - 20, size: 9, font: helvetica, color: PRETO });

                currentY -= rowH;
            });

            currentY -= 15;
            page2.drawText('Resumo do investimento', { x: marginX, y: currentY - 14, size: 11, font: helveticaBoldOblique, color: PRETO });
            currentY -= 20;

            const summaryRows = [
                { label: 'Subtotal limpeza', amount: budget.serviceSubtotal },
                ...(budget.extraSubtotal > 0 ? [{ label: 'Protecao impermeabilizante', amount: budget.extraSubtotal }] : []),
                ...(budget.comboDiscountTotal > 0 ? [{ label: 'Descontos automaticos', amount: -budget.comboDiscountTotal }] : []),
                { label: 'Total a Pagar', amount: budget.totalGeral, emphasize: true }
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
                page2.drawText(valueText, { x: marginX + tableW - 6 - font.widthOfTextAtSize(valueText, fontSize), y: currentY - 16, size: fontSize, font, color: PRETO });
                currentY -= rowH;
            });

            currentY -= 20;
            const footerText = obsCustom || 'A taxa de servico da Damas Clean pode ser isentada para servicos que ultrapassem duzentos e dez reais. Para valores menores, uma taxa de servico pode ser cobrada para cobrir custos de operacao, deslocamento e atendimento.';
            splitText(footerText, helvetica, 7.5, tableW).forEach(line => {
                page2.drawText(line, { x: marginX, y: currentY, size: 7.5, font: helvetica, color: PRETO });
                currentY -= 10;
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const nomeClienteFile = nomeCliente.replace(/[^a-zA-ZÀ-ú\s]/g, '').trim().replace(/\s+/g, '_');
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
            showToast('Erro ao gerar PDF: ' + error.message, true);
        }
    };
})();
