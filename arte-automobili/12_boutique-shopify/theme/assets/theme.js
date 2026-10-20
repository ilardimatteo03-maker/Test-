/* Arte Automobili — interactions : lampe d'inspection, menu mobile, galerie, quantités, variantes. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lampe d'inspection : la bande lumineuse suit le curseur sur le héros
  document.querySelectorAll('[data-lamp]').forEach((zone) => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return;
    zone.addEventListener('mousemove', (e) => {
      const r = zone.getBoundingClientRect();
      const x = Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100));
      zone.style.setProperty('--lx', x + '%');
    });
  });

  // Menu mobile
  const toggle = document.querySelector('[data-menu-toggle]');
  const drawer = document.querySelector('[data-drawer]');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.hasAttribute('open');
      open ? drawer.removeAttribute('open') : drawer.setAttribute('open', '');
      toggle.setAttribute('aria-expanded', String(!open));
      document.body.style.overflow = open ? '' : 'hidden';
    });
  }

  // Galerie produit
  document.querySelectorAll('[data-gallery]').forEach((g) => {
    const main = g.querySelector('.gallery__main img');
    if (!main) return;
    g.querySelectorAll('[data-gallery-thumb]').forEach((b) => {
      b.addEventListener('click', () => {
        main.src = b.dataset.src;
        main.srcset = b.dataset.srcset || '';
        main.alt = b.dataset.alt || '';
        g.querySelectorAll('[data-gallery-thumb]').forEach((x) => x.setAttribute('aria-current', 'false'));
        b.setAttribute('aria-current', 'true');
      });
    });
  });

  // Quantités
  document.querySelectorAll('[data-qty]').forEach((q) => {
    const input = q.querySelector('input');
    q.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const v = Math.max(Number(input.min || 0), (Number(input.value) || 0) + Number(b.dataset.step));
      input.value = v;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }));
  });

  // Variantes : les puces d'options choisissent la variante, le prix et la disponibilité suivent
  document.querySelectorAll('[data-product-form]').forEach((form) => {
    const data = JSON.parse(form.querySelector('[data-variants]').textContent);
    const idInput = form.querySelector('input[name="id"]');
    const price = document.querySelector('[data-price]');
    const btn = form.querySelector('[data-add]');
    const money = (c) => (c / 100).toLocaleString(document.documentElement.lang || 'fr', { style: 'currency', currency: form.dataset.currency || 'EUR' });
    const update = () => {
      const chosen = [...form.querySelectorAll('[data-option]')].map((fs) => (fs.querySelector('input:checked') || {}).value);
      const v = data.find((x) => x.options.every((o, i) => o === chosen[i]));
      if (!v) return;
      idInput.value = v.id;
      if (price) price.textContent = money(v.price);
      btn.disabled = !v.available;
      btn.querySelector('span').textContent = v.available ? btn.dataset.labelAdd : btn.dataset.labelSoldout;
      const url = new URL(window.location.href);
      url.searchParams.set('variant', v.id);
      window.history.replaceState({}, '', url);
    };
    form.querySelectorAll('[data-option] input').forEach((i) => i.addEventListener('change', update));
  });

  // Tri de collection
  document.querySelectorAll('[data-sort]').forEach((s) => s.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', s.value);
    window.location.href = url.toString();
  }));
})();
