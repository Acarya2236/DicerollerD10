/**
 * ---------------------------------------------------------
 * LOGICA & DATI
 * ---------------------------------------------------------
 */

class DiceLogic {
    static rollPool(nDice, triggers) {
        let grandTotal = 0;
        const details = [];

        for (let i = 0; i < nDice; i++) {
            let chain = [];
            // Math.random() genera [0, 1). *10 diventa [0, 9.99]. floor diventa [0, 9]. +1 diventa [1, 10].
            let current = Math.floor(Math.random() * 10) + 1;
            chain.push(current);

            // While loop per esplosioni
            while (triggers.has(current)) {
                current = Math.floor(Math.random() * 10) + 1;
                chain.push(current);
            }

            // Somma della catena
            const chainSum = chain.reduce((a, b) => a + b, 0);
            grandTotal += chainSum;
            details.push({ sum: chainSum, values: chain });
        }

        return { grandTotal, details };
    }
}

class RollLog {
    constructor(maxEntries = 20) {
        this.history = [];
        this.maxEntries = maxEntries;
    }

    add(i1, i2, triggers, total, successes) {
        const now = new Date();
        const ts = now.toLocaleTimeString('it-IT', { hour12: false });
        
        // Converti il Set in stringa ordinata
        const trigArray = Array.from(triggers).sort((a, b) => b - a);
        const trigStr = trigArray.length > 0 ? trigArray.join(",") : "-";

        const entry = `[${ts}] In:${i1}+${i2} | Expl:${trigStr} | SUCC:${successes} | TOT:${total}`;
        
        this.history.unshift(entry); // Aggiungi all'inizio
        if (this.history.length > this.maxEntries) {
            this.history = this.history.slice(0, this.maxEntries);
        }
    }

    getText() {
        return this.history.length > 0 ? this.history.join("\n\n") : "Nessun lancio registrato.";
    }
}

/**
 * ---------------------------------------------------------
 * APP CONTROLLER (Interfaccia)
 * ---------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Stato ---
    const logger = new RollLog();
    let currentTheme = 'light';

    // --- Elementi DOM ---
    const elBody = document.documentElement; // <html> tag
    const btnTheme = document.getElementById('btn-theme');
    
    const inpBase = document.getElementById('input-base');
    const inpMod = document.getElementById('input-mod');
    
    const chk10 = document.getElementById('exp-10');
    const chk9 = document.getElementById('exp-9');
    const chk8 = document.getElementById('exp-8');
    
    const btnRoll = document.getElementById('btn-roll');
    const btnClear = document.getElementById('btn-clear');
    
    const lblSuccess = document.getElementById('lbl-success');
    const lblTotal = document.getElementById('lbl-total');
    const txtRes = document.getElementById('txt-res');
    const txtHist = document.getElementById('txt-hist');
    
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Funzioni Helper ---

    // Renderizza una riga di risultato con HTML colorato
    function renderResultLine(index, chainObj) {
        const { sum, values } = chainObj;
        let html = `<span class="txt-dim">D${index}: [</span>`;

        values.forEach((val, idx) => {
            if (idx > 0) html += `<span class="txt-dim"> → </span>`;
            
            let cssClass = "txt-norm";
            if (val >= 8) cssClass = "txt-success";
            else if (val === 1) cssClass = "txt-fail";

            html += `<span class="${cssClass}">${val}</span>`;
        });

        html += `<span class="txt-dim">] = ${sum}</span><br>`;
        return html;
    }

    // --- Gestione Eventi ---

    // 1. Cambio Tema
    btnTheme.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        elBody.setAttribute('data-theme', currentTheme);
        btnTheme.textContent = currentTheme === 'light' ? '☾' : '☀';
    });

    // 2. Lancio Dadi
    btnRoll.addEventListener('click', () => {
        const base = parseInt(inpBase.value) || 0;
        const mod = parseInt(inpMod.value) || 0;
        const totalDice = base + mod;

        if (totalDice < 1) {
            alert("Errore: Minimo 1 dado.");
            return;
        }

        // Costruisci Set triggers
        const triggers = new Set();
        if (chk10.checked) triggers.add(10);
        if (chk9.checked) triggers.add(9);
        if (chk8.checked) triggers.add(8);

        // Logica
        const { grandTotal, details } = DiceLogic.rollPool(totalDice, triggers);

        // Calcola Successi e Costruisci HTML
        let successes = 0;
        let htmlOutput = "";

        details.forEach((d, i) => {
            // Conta successi nella catena
            d.values.forEach(v => { if (v >= 8) successes++; });
            htmlOutput += renderResultLine(i + 1, d);
        });

        // Aggiorna UI Risultati
        lblSuccess.textContent = successes;
        lblTotal.textContent = grandTotal;
        txtRes.innerHTML = htmlOutput;

        // Aggiorna Storico
        logger.add(base, mod, triggers, grandTotal, successes);
        txtHist.innerText = logger.getText();

        // Passa automaticamente alla tab Risultati
        document.querySelector('[data-tab="tab-results"]').click();
    });

    // 3. Clear
    btnClear.addEventListener('click', () => {
        lblSuccess.textContent = "-";
        lblTotal.textContent = "-";
        txtRes.innerHTML = "";
        // Lo storico NON viene cancellato, come da specifica originale
    });

    // 4. Gestione Tabs
    tabLinks.forEach(btn => {
        btn.addEventListener('click', () => {
            // Rimuovi active da tutti
            tabLinks.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Aggiungi active al corrente
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });
});