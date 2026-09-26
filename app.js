const $ = (s) => document.getElementById(s);
const hours = [.5, 1, 1.5, 2, 3, 4];
const money = (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
const pct = (n) => `${(Math.round(n * 10) / 10).toLocaleString('id-ID', {minimumFractionDigits: Number.isInteger(Math.round(n * 10) / 10) ? 0 : 1, maximumFractionDigits: 1})}%`;
function compute() {
  const ingredients = Math.max(0, +$('ingredients').value || 0);
  const energy = Math.max(0, +$('energy').value || 0);
  const packaging = Math.max(0, +$('packaging').value || 0);
  const yieldCount = Math.max(1, +$('yield').value || 1);
  const margin = Math.min(70, Math.max(10, +$('margin').value || 40));
  const workHours = hours[+$('hours').value] || .5;
  const current = Math.max(0, +$('current').value || 0);
  const batch = ingredients + energy;
  const hpp = batch / yieldCount + packaging;
  const suggested = Math.ceil((hpp / (1 - margin / 100)) / 500) * 500;
  const recommendedProfit = suggested - hpp;
  const recommendedMargin = suggested ? recommendedProfit / suggested * 100 : 0;
  const actualProfit = current - hpp;
  const actualMargin = current ? actualProfit / current * 100 : 0;
  const actualMarkup = hpp ? actualProfit / hpp * 100 : 0;
  const hourly = actualProfit * yieldCount / workHours;
  const fmt = (n) => Math.round(n).toLocaleString('id-ID');
  $('batch').textContent = money(batch);
  $('yield-chip').textContent = `${yieldCount} potong`;
  $('hours-text').textContent = `${String(workHours).replace('.', ',')} jam`;
  $('price').textContent = fmt(suggested);
  $('hpp').textContent = money(hpp);
  $('profit').textContent = money(recommendedProfit);
  $('markup').textContent = pct(hpp ? recommendedProfit / hpp * 100 : 0);
  $('hourly').textContent = money(hourly);
  $('hero-price').textContent = money(suggested);
  $('hero-hpp').textContent = money(hpp);
  $('hero-margin').textContent = pct(recommendedMargin);
  $('hero-target').textContent = `${margin}%`;
  $('hero-hour').textContent = money(hourly);
  $('hour-showcase').innerHTML = `${money(hourly)} <small>/ jam</small>`;
  $('cost-label').textContent = money(batch / yieldCount);
  $('pack-label').textContent = money(packaging);
  $('profit-label').textContent = money(recommendedProfit);
  const status = $('status');
  status.textContent = actualMargin < margin ? `Di bawah target ${margin}% · margin ${pct(actualMargin)} pada harga sekarang` : `Margin ${pct(actualMargin)} · target ${margin}%`;
  status.classList.toggle('alert', actualMargin < margin);
  $('explanation').textContent = `Markup ${pct(actualMarkup)} artinya harga jual ${pct(actualMarkup)} di atas modal. Margin ${pct(actualMargin)} artinya dari setiap ${money(current)} yang kamu terima, ${money(actualProfit)} adalah untung.`;
  const costs = batch / yieldCount, total = Math.max(1, costs + packaging + recommendedProfit);
  document.querySelector('.cost-part').style.height = `${Math.max(8, 68 * costs / total)}px`;
  document.querySelector('.pack-part').style.height = `${Math.max(6, 68 * packaging / total)}px`;
  document.querySelector('.profit-part').style.height = `${Math.max(6, 68 * recommendedProfit / total)}px`;
  $('margin').setAttribute('aria-valuetext', `${margin} persen, harga jual ${money(suggested)}`);
  $('hero-range').value = margin;
  try { localStorage.setItem('takaran-demo', JSON.stringify({ingredients, energy, packaging, yieldCount, margin, hoursIndex: +$('hours').value, current})); } catch {}
}

['ingredients','energy','packaging','yield','margin','hours','current'].forEach((key) => $(key).addEventListener('input', compute));
$('hero-range').addEventListener('input', (e) => { $('margin').value = e.target.value; compute(); });
$('reset').addEventListener('click', () => {
  Object.entries({ingredients:27800,energy:3000,packaging:1000,yield:16,margin:40,hours:2,current:5000}).forEach(([key,value]) => $(key).value = value);
  $('feedback').textContent = ''; compute();
});
$('type-margin').addEventListener('click', () => {
  const answer = prompt('Masukkan target margin antara 10 dan 70 persen', $('margin').value);
  if (answer === null) return;
  const value = Number(answer);
  if (Number.isFinite(value) && value >= 10 && value <= 70) { $('margin').value = value; compute(); }
  else alert('Masukkan angka dari 10 sampai 70.');
});
$('save').addEventListener('click', () => {
  const hpp = ((+$('ingredients').value || 0) + (+$('energy').value || 0)) / Math.max(1, +$('yield').value || 1) + (+$('packaging').value || 0);
  $('current').value = Math.ceil((hpp / (1 - (+$('margin').value / 100))) / 500) * 500;
  compute(); $('feedback').textContent = 'Harga saran disimpan sebagai harga yang kamu pakai.';
});
$('copy').addEventListener('click', async () => {
  const text = `Takaran · Contoh hitungan brownies\nHarga jual: Rp ${$('price').textContent} per potong\nHPP: ${$('hpp').textContent} per potong\nTarget margin: ${$('margin').value}%`;
  try { await navigator.clipboard.writeText(text); $('feedback').textContent = 'Ringkasan hitungan disalin.'; }
  catch { $('feedback').textContent = text; }
});
$('theme').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  try { localStorage.setItem('takaran-theme', dark ? 'dark' : 'light'); } catch {}
  $('theme').setAttribute('aria-label', dark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
});
$('signup').addEventListener('submit', (e) => { e.preventDefault(); $('form-feedback').textContent = 'Formulir demo ini belum mengirim data, jadi kontakmu tidak disimpan.'; });
$('menu').addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  if (links.style.display === 'flex') { links.removeAttribute('style'); return; }
  Object.assign(links.style, {display:'flex',position:'absolute',top:'60px',left:'16px',right:'16px',flexDirection:'column',alignItems:'stretch',padding:'16px',border:'1px solid var(--line)',borderRadius:'16px',background:'var(--surface)',boxShadow:'var(--shadow)'});
});
try {
  const savedTheme = localStorage.getItem('takaran-theme');
  document.documentElement.dataset.theme = savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const saved = JSON.parse(localStorage.getItem('takaran-demo'));
  if (saved) {
    $('ingredients').value = saved.ingredients; $('energy').value = saved.energy; $('packaging').value = saved.packaging;
    $('yield').value = saved.yieldCount; $('margin').value = saved.margin; $('hours').value = saved.hoursIndex; $('current').value = saved.current;
  }
} catch {}
compute();
