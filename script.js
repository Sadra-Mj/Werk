/* WERK Autogalerie — browser-only interactions, no build step. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const euros = (value) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const integer = (value) => new Intl.NumberFormat('de-DE').format(value);
  const vehicles = [
    { id:'porsche', brand:'Porsche', model:'911 Carrera S', price:132900, year:2023, month:'03', mileage:14200, kw:331, ps:450, type:'Coupé', fuel:'Benzin', gearbox:'PDK Automatik', color:'Weiß', image:'porsche-911.jpg', subtitle:'Sport Chrono · PDK · Sportabgasanlage', equipment:['Sport Chrono Paket','PDK Automatikgetriebe','Sportabgasanlage','Sportlenkrad'] },
    { id:'mercedes', brand:'Mercedes-Benz', model:'AMG GT R', price:112900, year:2019, month:'06', mileage:31800, kw:430, ps:585, type:'Coupé', fuel:'Benzin', gearbox:'DCT Automatik', color:'Grau', image:'mercedes-amg.jpg', subtitle:'V8 Biturbo · Carbon · Performance-Sitze', equipment:['AMG Performance-Sitze','Carbon-Elemente','AMG Sportabgasanlage','DCT Automatikgetriebe'] },
    { id:'bmw', brand:'BMW', model:'M4 Competition', price:56900, year:2019, month:'09', mileage:26500, kw:331, ps:450, type:'Coupé', fuel:'Benzin', gearbox:'DKG Automatik', color:'Blau', image:'bmw-m4.jpg', subtitle:'Competition Paket · DKG · M Sportsitze', equipment:['Competition Paket','M Sportsitze','M Doppelkupplungsgetriebe','Harman Kardon Soundsystem'] },
    { id:'audi', brand:'Audi', model:'RS 6 Avant', price:64900, year:2017, month:'05', mileage:44800, kw:412, ps:560, type:'Kombi', fuel:'Benzin', gearbox:'Tiptronic Automatik', color:'Grau', image:'audi-rs6.jpg', subtitle:'quattro · V8 Biturbo · Panorama', equipment:['quattro Allradantrieb','Panorama-Glasdach','RS Sportsitze','Tiptronic Automatikgetriebe'] }
  ];
  const saved = new Set();
  const compared = new Set();
  let savedOnly = false;
  let toastTimer;
  let requestURL;
  try {
    const stored = JSON.parse(localStorage.getItem('werk-saved-v1'));
    if (Array.isArray(stored)) stored.filter((id) => vehicles.some((car) => car.id === id)).forEach((id) => saved.add(id));
  } catch { /* Favourites still work if browser storage is disabled. */ }
  function notify(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4200);
  }
  function updateSaved() {
    $('#saved-count').textContent = saved.size;
    $('#saved-tab-count').textContent = String(saved.size).padStart(2, '0');
    $('#all-tab').classList.toggle('active', !savedOnly);
    $('#saved-tab').classList.toggle('active', savedOnly);
    $('#all-tab').setAttribute('aria-pressed', String(!savedOnly));
    $('#saved-tab').setAttribute('aria-pressed', String(savedOnly));
    $('#saved-nav').setAttribute('aria-pressed', String(savedOnly));
    try { localStorage.setItem('werk-saved-v1', JSON.stringify([...saved])); } catch { /* Optional persistence. */ }
  }
  function renderCards() {
    const search = $('#search').value.trim().toLocaleLowerCase('de');
    const brand = $('#brand-filter').value;
    const type = $('#type-filter').value;
    const budget = $('#budget-filter').value;
    let list = vehicles.filter((car) => (!savedOnly || saved.has(car.id)) && (brand === 'all' || car.brand === brand) && (type === 'all' || car.type === type) && (budget === 'all' || car.price <= Number(budget)) && `${car.brand} ${car.model} ${car.subtitle}`.toLocaleLowerCase('de').includes(search));
    const sort = $('#sort').value;
    if (sort === 'price-low') list.sort((a,b) => a.price-b.price);
    if (sort === 'price-high') list.sort((a,b) => b.price-a.price);
    if (sort === 'mileage') list.sort((a,b) => a.mileage-b.mileage);
    if (sort === 'newest') list.sort((a,b) => b.year-a.year || Number(b.month)-Number(a.month));
    $('#vehicle-grid').innerHTML = list.map((car) => `<article class="vehicle-card" data-vehicle="${car.id}"><div class="vehicle-image ${car.id}"><img src="assets/${car.image}" alt="${car.color}er ${car.brand} ${car.model} – Symbolbild" width="1400" height="850" loading="lazy"><button class="image-detail" data-detail="${car.id}" aria-label="${car.brand} ${car.model}: Fahrzeugprofil öffnen"></button><span class="vehicle-tag">WERK SELECTION / ${car.type.toUpperCase()}</span><button class="save-car" data-save="${car.id}" aria-label="${car.brand} ${car.model} ${saved.has(car.id) ? 'aus Merkliste entfernen' : 'merken'}" aria-pressed="${saved.has(car.id)}">${icon('heart')}</button></div><div class="vehicle-info"><p class="vehicle-brand">${car.brand}</p><div class="vehicle-title-row"><h3>${car.model}</h3><span class="price">${euros(car.price)}</span></div><p class="vehicle-subtitle">${car.subtitle}</p><div class="vehicle-specs"><span>${icon('calendar')}${car.month}/${car.year}</span><span>${icon('gauge')}${integer(car.mileage)} km</span><span>${icon('power')}${car.ps} PS (${car.kw} kW)</span></div><div class="vehicle-actions"><button class="vehicle-detail-button" data-detail="${car.id}">Fahrzeug ansehen ${icon('diagonal')}</button><label class="compare-toggle"><input type="checkbox" data-compare="${car.id}" aria-label="${car.brand} ${car.model} vergleichen" ${compared.has(car.id) ? 'checked' : ''}>Vergleichen</label></div></div></article>`).join('');
    $('#results-status').textContent = `${list.length} ${list.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'} ${savedOnly ? 'in Ihrer Merkliste' : 'in der Auswahl'}`;
    $('#empty-state').hidden = list.length > 0;
    $('#empty-message').textContent = savedOnly && !saved.size ? 'Merken Sie sich Ihre Favoriten über das Herz am Fahrzeug.' : 'Kein Fahrzeug passt zu diesen Filtern. Erweitern Sie Ihre Auswahl.';
    updateSaved();
  }
  function resetFilters() {
    $('#vehicle-filters').reset();
    $('#sort').value = 'curated';
    savedOnly = false;
    renderCards();
  }
  $('#vehicle-filters').addEventListener('submit', (event) => event.preventDefault());
  $('#search').addEventListener('input', renderCards);
  ['brand-filter','type-filter','budget-filter','sort'].forEach((id) => $(`#${id}`).addEventListener('change', renderCards));
  $('#reset-filters').addEventListener('click', resetFilters);
  $('#empty-reset').addEventListener('click', resetFilters);
  $('#all-tab').addEventListener('click', () => { savedOnly = false; renderCards(); });
  $('#saved-tab').addEventListener('click', () => { savedOnly = true; renderCards(); });
  $('#saved-nav').addEventListener('click', () => {
    savedOnly = !savedOnly;
    renderCards();
    $('#kollektion').scrollIntoView({ behavior: prefersReduced.matches ? 'instant' : 'smooth' });
    closeMenu();
  });
  const dialog = $('#detail-dialog');
  let dialogTrigger;
  function openDialog(content, eyebrow = 'WERK / FAHRZEUGPROFIL') {
    if (requestURL) { URL.revokeObjectURL(requestURL); requestURL = undefined; }
    dialogTrigger = document.activeElement;
    $('#dialog-eyebrow').textContent = eyebrow;
    $('#dialog-content').innerHTML = content;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.scrollTop = 0;
  }
  function closeDialog() { dialog.close(); }
  $('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll:true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  function showVehicle(id) {
    const car = vehicles.find((item) => item.id === id);
    if (!car) return;
    openDialog(`<div class="detail-layout"><img class="detail-image" src="assets/${car.image}" alt="${car.brand} ${car.model} – Symbolbild"><div class="detail-copy"><p class="vehicle-brand">${car.brand} / BEISPIELFAHRZEUG</p><h2 id="dialog-title">${car.model}</h2><p class="detail-price">${euros(car.price)}</p><p class="vehicle-subtitle">${car.subtitle}</p><dl class="detail-list"><div><dt>Erstzulassung</dt><dd>${car.month}/${car.year}</dd></div><div><dt>Kilometerstand</dt><dd>${integer(car.mileage)} km</dd></div><div><dt>Leistung</dt><dd>${car.kw} kW / ${car.ps} PS</dd></div><div><dt>Getriebe</dt><dd>${car.gearbox}</dd></div><div><dt>Kraftstoff / Karosserie</dt><dd>${car.fuel} / ${car.type}</dd></div><div><dt>Farbe</dt><dd>${car.color}</dd></div></dl><p class="vehicle-subtitle">${car.equipment.join(' · ')}</p><button class="button button-dark" data-enquire="${car.id}">Besichtigung vorbereiten ${icon('diagonal')}</button><p class="detail-note">Illustrative Fahrzeugdaten und Beispielpreis. Das Symbolbild dokumentiert kein konkretes Verkaufsfahrzeug. Kein Verkaufsangebot.</p></div></div>`);
  }
  $('#vehicle-grid').addEventListener('click', (event) => {
    const saveButton = event.target.closest('[data-save]');
    const detailButton = event.target.closest('[data-detail]');
    if (saveButton) {
      const id = saveButton.dataset.save;
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      renderCards();
      if (event.detail === 0) ($(`[data-save="${id}"]`) || $('#saved-tab')).focus({preventScroll:true});
    } else if (detailButton) showVehicle(detailButton.dataset.detail);
  });
  function updateCompare() {
    $('#compare-count').textContent = compared.size;
    $('#compare-bar').hidden = !compared.size;
    $('#compare-open').disabled = compared.size < 2;
    document.body.classList.toggle('has-compare', compared.size > 0);
  }
  $('#vehicle-grid').addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-compare]');
    if (!checkbox) return;
    if (checkbox.checked && compared.size === 3) { checkbox.checked = false; notify('Sie können bis zu 3 Fahrzeuge gleichzeitig vergleichen.'); return; }
    if (checkbox.checked) compared.add(checkbox.dataset.compare); else compared.delete(checkbox.dataset.compare);
    updateCompare();
  });
  $('#compare-clear').addEventListener('click', () => { compared.clear(); updateCompare(); renderCards(); });
  $('#compare-open').addEventListener('click', () => {
    const cars = vehicles.filter((car) => compared.has(car.id));
    if (cars.length < 2) return;
    const fields = [['Beispielpreis',(car)=>euros(car.price)],['Erstzulassung',(car)=>`${car.month}/${car.year}`],['Kilometerstand',(car)=>`${integer(car.mileage)} km`],['Leistung',(car)=>`${car.kw} kW / ${car.ps} PS`],['Getriebe',(car)=>car.gearbox],['Kraftstoff',(car)=>car.fuel],['Karosserie',(car)=>car.type]];
    openDialog(`<div class="comparison-content"><h2 id="dialog-title">Gute Auswahl. Klarer Vergleich.</h2><div class="comparison-scroll" tabindex="0" role="region" aria-label="Fahrzeugvergleich, bei Bedarf horizontal scrollen"><table class="comparison-table"><caption class="sr-only">Vergleich Ihrer ausgewählten Beispielfahrzeuge</caption><thead><tr><th scope="col">Ihre Auswahl</th>${cars.map((car)=>`<th scope="col"><img src="assets/${car.image}" alt="" width="200" height="110"><span>${car.brand}</span><strong>${car.model}</strong></th>`).join('')}</tr></thead><tbody>${fields.map(([label,value])=>`<tr><th scope="row">${label}</th>${cars.map((car)=>`<td>${value(car)}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Nächster Schritt</th>${cars.map((car)=>`<td><button class="text-link" data-enquire="${car.id}">Termin vorbereiten ${icon('diagonal')}</button></td>`).join('')}</tr></tbody></table></div><p class="detail-note">Illustrative Beispieldaten und Symbolbilder. Keine Verkaufsangebote.</p></div>`, 'WERK / FAHRZEUGVERGLEICH');
  });
  function prepareEnquiry(vehicle = '', interest = 'Besichtigung') {
    if (dialog.open) closeDialog();
    $('#vehicle').value = vehicle;
    $('#interest').value = interest;
    $('#kontakt').scrollIntoView({ behavior: prefersReduced.matches ? 'instant' : 'smooth' });
    setTimeout(() => $('#name').focus({preventScroll:true}), prefersReduced.matches ? 0 : 500);
  }
  $('#dialog-content').addEventListener('click', (event) => {
    const button = event.target.closest('[data-enquire]');
    if (button) prepareEnquiry(button.dataset.enquire);
  });
  $$('[data-request]').forEach((button) => button.addEventListener('click',()=>prepareEnquiry('',button.dataset.request)));
  const localToday = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  };
  $('#date').min = localToday();
  function fieldError(id, message) {
    const field = $(`#${id}`), error = $(`#${id}-error`);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    field.setAttribute('aria-describedby', `${id}-error`);
    error.textContent = message;
    error.hidden = !message;
  }
  $('#enquiry-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('#name').value.trim(), email = $('#email').value.trim(), date = $('#date').value;
    const errors = {name:name ? '' : 'Bitte geben Sie Ihren Namen ein.',email:email && !$('#email').validity.typeMismatch ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',date:date && (date < localToday() || $('#date').validity.badInput) ? 'Bitte wählen Sie heute oder einen späteren Tag.' : ''};
    Object.entries(errors).forEach(([id,message])=>fieldError(id,message));
    const first = Object.keys(errors).find((id)=>errors[id]);
    if (first) { $(`#${first}`).focus(); return; }
    const car = vehicles.find((item)=>item.id === $('#vehicle').value);
    const request = `WERK AUTOGALERIE — ANFRAGEENTWURF\n\nName: ${name}\nE-Mail: ${email}\nAnliegen: ${$('#interest').value}\nFahrzeug: ${car ? `${car.brand} ${car.model}` : 'Noch offen'}\nWunschtermin: ${date ? date.split('-').reverse().join('.') : 'Nach Vereinbarung'}\nTageszeit: ${$('#time').value}\n\nNachricht:\n${$('#message').value.trim() || 'Keine weitere Nachricht.'}\n\nDies ist ein lokal erstellter Entwurf. Es wurde keine Anfrage versendet und kein Termin gebucht.\nWERK Autogalerie ist eine Konzeptwebsite.`;
    openDialog(`<div class="request-content"><h2 id="dialog-title">Ihr nächster Schritt ist vorbereitet.</h2><p>Prüfen Sie Ihren Anfrageentwurf und laden Sie ihn für Ihre Unterlagen herunter. Es wurde nichts versendet und kein Termin gebucht.</p><div class="request-preview" id="request-preview"></div><a class="button button-dark" id="download-request" download="WERK-Anfrage.txt">Anfrageentwurf herunterladen ${icon('download')}</a><p class="detail-note">Ihre Eingaben bleiben lokal. Sie können den Dialog schließen und die Angaben im Formular anpassen.</p></div>`, 'WERK / IHR ANFRAGEENTWURF');
    $('#request-preview').textContent = request;
    requestURL = URL.createObjectURL(new Blob([request],{type:'text/plain;charset=utf-8'}));
    $('#download-request').href = requestURL;
  });
  const info = {
    imprint: ['Ein Konzept mit Charakter.', '<p>WERK Autogalerie ist eine fiktive Autogalerie und ein Designkonzept. Es handelt sich nicht um einen realen Fahrzeughändler. München dient als Standortkonzept; es wird keine echte Geschäftsadresse dargestellt.</p><p>Die gezeigten Fahrzeuge, Spezifikationen, Ausstattungen und Preise sind illustrative Beispieldaten. Die Bilder sind Symbolbilder. Es werden keine Käufe, Buchungen, Finanzierungen oder Nachrichten über diese Website abgewickelt.</p><p>Vor einem realen Geschäftseinsatz müssen die vollständigen Unternehmensangaben und Rechtstexte durch den tatsächlichen Betreiber ergänzt werden.</p>'],
    privacy: ['Ihre Daten bleiben bei Ihnen.', '<p>Diese Website hat keine Konten, Analyse-Tracker oder Werbecookies. Ihre Merkliste wird lokal im Browser gespeichert. Sie können sie über die Herzen leeren oder die Website-Daten in Ihren Browser-Einstellungen löschen.</p><p>Die Formulareingaben werden nicht an einen Server gesendet. Der Anfrageentwurf wird ausschließlich lokal erzeugt. Beim Download wird eine Textdatei auf Ihrem Gerät gespeichert.</p><p>Schriftarten werden von Google Fonts geladen. Dabei erhalten Google und der Hosting-Anbieter technisch erforderliche Verbindungsdaten. Fahrzeugfotos, die 3D-Bibliothek und das Audi-Modell liegen lokal im Projekt.</p>'],
    credits: ['Bilder, die Geschichten erzählen.', '<p>Das Hero-Motiv wurde mit KI für dieses Designkonzept erstellt. Die Fahrzeugbilder sind Symbolbilder und zeigen keine konkreten Verkaufsfahrzeuge.</p><p><a href="https://unsplash.com/photos/7mqiyL9cWbY" target="_blank" rel="noopener noreferrer">Porsche 911 — Luke Thornton / Unsplash</a><br><a href="https://unsplash.com/photos/8qYE6LGHW-c" target="_blank" rel="noopener noreferrer">Mercedes-AMG — Aaron Huber / Unsplash</a><br><a href="https://unsplash.com/photos/JgV1UuzGwqs" target="_blank" rel="noopener noreferrer">BMW M4 — Jonas Rhyner / Unsplash</a><br><a href="https://unsplash.com/photos/bL-q7kK3WZ0" target="_blank" rel="noopener noreferrer">Audi RS 6 — Unsplash</a><br><a href="https://unsplash.com/photos/AAysk8O8eG4" target="_blank" rel="noopener noreferrer">Fahrzeughalle — Unsplash</a></p><p>Das interaktive Audi-Modell basiert auf der vom Auftraggeber bereitgestellten Datei Audi.fbx. Die Geometrie wurde für die Webdarstellung optimiert; Materialien wurden für die Darstellung im Browser aufbereitet. Drei.js / Three.js steht unter der MIT-Lizenz. Marken gehören ihren jeweiligen Inhabern. Es besteht keine Herstellerzugehörigkeit.</p>']
  };
  $$('[data-info]').forEach((button)=>button.addEventListener('click',()=>{
    const [title,body] = info[button.dataset.info];
    openDialog(`<div class="information-content"><h2 id="dialog-title">${title}</h2>${body}</div>`,'WERK / DIE DETAILS');
  }));
  const menu = $('#mobile-nav'), menuButton = $('.menu-toggle');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Menü öffnen'); }
  menuButton.addEventListener('click',()=>{
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open ? 'Menü schließen' : 'Menü öffnen');
  });
  $$('#mobile-nav a').forEach((link)=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',(event)=>{ if(event.key==='Escape' && !menu.hidden){closeMenu();menuButton.focus();} });
  matchMedia('(min-width:761px)').addEventListener('change',(event)=>{if(event.matches)closeMenu();});
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = $('.hero');
  let userPaused = false, heroVisible = true;
  function updateHeroMotion() {
    const paused = userPaused || prefersReduced.matches || !heroVisible || document.hidden;
    hero.classList.toggle('motion-paused',paused);
    $('#hero-motion').disabled = prefersReduced.matches;
    $('#hero-motion').setAttribute('aria-pressed',String(userPaused || prefersReduced.matches));
    $('#hero-motion').setAttribute('aria-label',userPaused ? 'Bildbewegung fortsetzen' : 'Bildbewegung pausieren');
    $('#hero-motion-label').textContent = prefersReduced.matches ? 'Ruhige Ansicht' : userPaused ? 'Bewegung fortsetzen' : 'Bewegung pausieren';
    $('#hero-motion-icon').textContent = userPaused || prefersReduced.matches ? '▷' : 'Ⅱ';
  }
  $('#hero-motion').addEventListener('click',()=>{userPaused=!userPaused;updateHeroMotion();});
  document.addEventListener('visibilitychange',updateHeroMotion);
  prefersReduced.addEventListener('change',updateHeroMotion);
  let revealObserver;
  function setupReveals() {
    revealObserver?.disconnect();
    $$('.reveal').forEach((item)=>item.classList.remove('pending'));
    if(prefersReduced.matches || !('IntersectionObserver' in window))return;
    revealObserver=new IntersectionObserver((entries)=>entries.forEach((entry)=>{
      if(entry.isIntersecting){entry.target.classList.remove('pending');revealObserver.unobserve(entry.target);}
    }),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    $$('.reveal').forEach((item)=>{
      const siblings=[...item.parentElement.children].filter((child)=>child.classList.contains('reveal'));
      item.style.setProperty('--delay',`${Math.max(0,siblings.indexOf(item))*80}ms`);
      if(item.getBoundingClientRect().top>innerHeight-20)item.classList.add('pending');
      revealObserver.observe(item);
    });
  }
  setupReveals();
  prefersReduced.addEventListener('change',setupReveals);
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;updateHeroMotion();},{threshold:0}).observe(hero);
  let headerScheduled=false;
  addEventListener('scroll',()=>{if(!headerScheduled){headerScheduled=true;requestAnimationFrame(()=>{$('#site-header').classList.toggle('is-scrolled',scrollY>180);headerScheduled=false;});}},{passive:true});
  $('#site-header').classList.toggle('is-scrolled',scrollY>180);
  updateHeroMotion();
  $('#year').textContent=new Date().getFullYear();
  renderCards();
  // The heavier 3D model loads only near its showcase, after the page is usable.
  const showcase=$('#audi-experience');
  if(showcase){
    let started=false;
    const start3D=()=>{
      if(started)return;started=true;
      import('./audi-scene.js').then((module)=>module.initializeAudi()).catch(()=>{
        $('#model-status').textContent='Statische Vorschau · Interaktive Ansicht nicht verfügbar.';
        showcase.classList.add('model-unavailable');
      });
    };
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){observer.disconnect();start3D();}},{rootMargin:'500px'});observer.observe(showcase);}else start3D();
  }
})();
