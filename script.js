// Utilidades básicas
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// Menu mobile
const hamburger = $('.hamburger');
const menu = $('.menu');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const open = menu.style.display === 'flex';
    menu.style.display = open ? 'none' : 'flex';
    hamburger.setAttribute('aria-expanded', String(!open));
  });

  // Fechar menu ao clicar em link
  $$('.menu a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 680) menu.style.display = 'none';
  }));
}

// Ano no rodapé
$('#year').textContent = new Date().getFullYear();

// Botão flutuante WhatsApp (coloque o número da loja)
const whatsappNumber = '5511900000000'; // DDI+DDD+numero
const fabWhats = $('#fabWhats');
fabWhats.href = `https://wa.me/${whatsappNumber}?text=Olá%20Doblof!%20Quero%20tirar%20uma%20dúvida.`;

// Agenda (LocalStorage)
const STORAGE_KEY = 'doblof_agendamentos_v1';
const bookingForm = $('#bookingForm');
const agendaTabela = $('#agendaTabela tbody');
const successModal = $('#successModal');
const successText = $('#successText');
const modalFechar = $('#modalFechar');
const modalWhats = $('#modalWhats');

// Definir data mínima = hoje
const inputData = $('#data');
const today = new Date();
const toISODate = d => d.toISOString().split('T')[0];
inputData.min = toISODate(today);

// Carregar agendamentos do LocalStorage
function loadAgendamentos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}
function saveAgendamentos(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// Renderizar tabela do dia selecionado (ou hoje por padrão)
function renderAgenda(dia = toISODate(today)) {
  const ags = loadAgendamentos().filter(a => a.data === dia).sort((a,b) => a.hora.localeCompare(b.hora));
  agendaTabela.innerHTML = ags.map(a => `
    <tr>
      <td>${a.hora}</td>
      <td>${a.nome}</td>
      <td>${a.servico}</td>
      <td>${a.tipo}</td>
    </tr>
  `).join('') || `<tr><td colspan="4">Sem reservas para ${dia.split('-').reverse().join('/')}</td></tr>`;
}
renderAgenda();

// Atualizar agenda quando a data do formulário mudar
inputData.addEventListener('change', e => renderAgenda(e.target.value));

// Validação simples
function setError(el, msg) {
  const wrap = el.closest('.field') || el.parentElement;
  const small = $('.error', wrap);
  if (small) small.textContent = msg || '';
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (msg) el.focus();
}

function validate(form) {
  let ok = true;

  const requiredFields = [
    ['#nome', 'Informe seu nome'],
    ['#whats', 'Informe seu WhatsApp'],
    ['#tipo', 'Selecione o tipo de veículo'],
    ['#servico', 'Selecione o serviço'],
    ['#data', 'Escolha a data'],
    ['#hora', 'Escolha a hora']
  ];

  requiredFields.forEach(([sel, msg]) => {
    const el = $(sel, form);
    if (!el.value.trim()) {
      setError(el, msg); ok = false;
    } else {
      setError(el, '');
    }
  });

  const tel = $('#whats').value.replace(/\D/g, '');
  if (tel.length < 10) { setError($('#whats'), 'Número inválido'); ok = false; }

  const aceite = $('#aceite');
  if (!aceite.checked) { setError(aceite, 'Necessário aceitar os termos'); ok = false; }
  else setError(aceite, '');

  // Evitar colisão de horário (mesma data + hora)
  const data = $('#data').value;
  const hora = $('#hora').value;
  const colide = loadAgendamentos().some(a => a.data === data && a.hora === hora);
  if (colide) { setError($('#hora'), 'Este horário já foi reservado'); ok = false; }

  // Data no passado
  if (data && new Date(`${data}T00:00`) < new Date(toISODate(today))) {
    setError($('#data'), 'Data no passado não é permitida'); ok = false;
  }

  return ok;
}

// Submit do agendamento
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate(bookingForm)) return;

  const dados = {
    nome: $('#nome').value.trim(),
    whats: $('#whats').value.trim(),
    placa: $('#placa').value.trim().toUpperCase(),
    tipo: $('#tipo').value,
    servico: $('#servico').value,
    data: $('#data').value,
    hora: $('#hora').value,
    obs: $('#obs').value.trim(),
    criadoEm: new Date().toISOString()
  };

  const lista = loadAgendamentos();
  lista.push(dados);
  saveAgendamentos(lista);
  renderAgenda(dados.data);

  // Mensagem de confirmação
  const dataBR = dados.data.split('-').reverse().join('/');
  successText.textContent = `Olá, ${dados.nome}! Seu agendamento de "${dados.servico}" para ${dataBR} às ${dados.hora} foi registrado.`;
  modalWhats.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Olá! Confirmação de agendamento na Doblof:\n\nCliente: ${dados.nome}\nServiço: ${dados.servico}\nData: ${dataBR}\nHora: ${dados.hora}\nVeículo: ${dados.tipo} ${dados.placa ? `- Placa ${dados.placa}`:''}\n\nAté breve!`
  )}`;
  successModal.showModal();
  bookingForm.reset();
  $('#aceite').checked = false;
  $('#data').value = dados.data; // mantém o dia para ver na agenda
});

modalFechar.addEventListener('click', () => successModal.close());

// Newsletter (fake)
$('#newsletterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#emailNews').value.trim();
  if (!email.includes('@')) return alert('Digite um e-mail válido.');
  alert('Obrigado! Você receberá nossas promoções.');
  e.target.reset();
});

// Acessibilidade: fechar modal com Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && successModal.open) successModal.close();
});
