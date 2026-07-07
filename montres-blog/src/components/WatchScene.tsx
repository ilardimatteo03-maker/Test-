"use client";

import { useEffect, useRef } from "react";

/**
 * Hero 3D : une montre chrome dont le cadran porte le logo du blog.
 *
 * Choix de performance / SEO (le blog vend sa vitesse comme argument) :
 * - three.js est importe DYNAMIQUEMENT dans l'effet (code-split) : la
 *   librairie (~600 Ko) n'est chargee qu'apres l'affichage de la page, cote
 *   client uniquement. Le HTML initial et le texte du hero restent intacts
 *   pour Google.
 * - Rendu en pause quand la scene n'est pas visible (IntersectionObserver)
 *   ou quand l'onglet est cache (visibilitychange).
 * - prefers-reduced-motion : une seule image fixe, aucune boucle.
 * - Le composant est purement decoratif (aria-hidden) : aucune information
 *   n'est portee uniquement par la 3D.
 */

const BRAND_LABEL = "CHRONO GUIDE";
const BRAND_SUBLABEL = "AUTOMATIC";

export function WatchScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialEl = containerRef.current;
    if (!initialEl) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Import dynamique : three n'entre dans le bundle que pour ce composant,
    // et n'est telecharge qu'a l'execution de cet effet (jamais au SSR).
    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      if (disposed || !containerRef.current) return;
      // Assertion non-null : le garde ci-dessus protege a l'execution, et
      // TS conserve ainsi le type dans les closures (handlers, observers).
      const el: HTMLDivElement = containerRef.current;

      const width = el.clientWidth;
      const height = el.clientHeight;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      // Reflets metalliques procedureux (aucun fichier externe a charger).
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;

      const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
      camera.position.set(0, 0, 7.4);

      // Lumiere d'appoint pour marquer les aretes du boitier.
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x88aaff, 0.6);
      rimLight.position.set(-4, -2, 2);
      scene.add(rimLight);

      const watch = new THREE.Group();
      scene.add(watch);

      const chrome = new THREE.MeshStandardMaterial({
        color: 0xd8dade,
        metalness: 1,
        roughness: 0.18,
        envMapIntensity: 1.3,
      });

      // --- Boitier : anneau creux (openEnded) + fond ferme a l'arriere.
      // Un cylindre PLEIN cacherait le cadran derriere sa face avant chromee ;
      // il faut donc un boitier ouvert a l'avant, comme une vraie montre.
      const caseBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.55, 1.62, 0.42, 96, 1, true),
        chrome
      );
      caseBody.rotation.x = Math.PI / 2;
      watch.add(caseBody);

      // Fond du boitier, juste derriere le cadran (empeche de voir au travers).
      const caseBack = new THREE.Mesh(
        new THREE.CylinderGeometry(1.58, 1.58, 0.05, 96),
        chrome
      );
      caseBack.rotation.x = Math.PI / 2;
      caseBack.position.z = -0.19;
      watch.add(caseBack);

      // --- Lunette (bezel) ---
      const bezel = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.12, 32, 96),
        chrome
      );
      bezel.position.z = 0.2;
      watch.add(bezel);

      // --- Cadran "dark luxe" avec index et logo, dessine sur un canvas ---
      // On dessine tout le cadran (fond soleil, index, logo) dans une texture :
      // c'est plus lisible et plus fiable que des index en 3D, et le logo de
      // la marque est garanti net au centre (exigence : le cadran porte le logo).
      const dialCanvas = document.createElement("canvas");
      dialCanvas.width = 1024;
      dialCanvas.height = 1024;
      const ctx = dialCanvas.getContext("2d")!;
      const C = 512; // centre
      // Fond soleil : radial du bleu-nuit vers le noir.
      const grad = ctx.createRadialGradient(C, C - 40, 60, C, C, 520);
      grad.addColorStop(0, "#1b2534");
      grad.addColorStop(0.55, "#111823");
      grad.addColorStop(1, "#080b11");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(C, C, 512, 0, Math.PI * 2);
      ctx.fill();

      // Index batons (12h), en creme lumineux.
      ctx.save();
      ctx.translate(C, C);
      for (let i = 0; i < 12; i++) {
        ctx.save();
        ctx.rotate((i / 12) * Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? "#f2ede1" : "#c8cdd6";
        const w = i % 3 === 0 ? 22 : 12;
        ctx.fillRect(-w / 2, -455, w, i % 3 === 0 ? 70 : 48);
        ctx.restore();
      }
      // Piste des minutes.
      ctx.fillStyle = "rgba(200,205,214,0.5)";
      for (let i = 0; i < 60; i++) {
        ctx.save();
        ctx.rotate((i / 60) * Math.PI * 2);
        ctx.fillRect(-1.5, -472, 3, 12);
        ctx.restore();
      }
      ctx.restore();

      // Logo de la marque au-dessus du centre.
      ctx.textAlign = "center";
      ctx.fillStyle = "#f4efe4";
      ctx.font = "600 76px Georgia, 'Times New Roman', serif";
      ctx.fillText(BRAND_LABEL, C, C - 150);
      ctx.fillStyle = "#c9a24b"; // or
      ctx.font = "500 38px Georgia, serif";
      ctx.fillText(BRAND_SUBLABEL, C, C - 96);
      ctx.strokeStyle = "#c9a24b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(C - 70, C - 74);
      ctx.lineTo(C + 70, C - 74);
      ctx.stroke();

      const dialTexture = new THREE.CanvasTexture(dialCanvas);
      dialTexture.colorSpace = THREE.SRGBColorSpace;
      dialTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      // Disque de fond sombre (evite de voir a travers derriere le cadran).
      const dialBack = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.04, 96),
        new THREE.MeshStandardMaterial({
          color: 0x0a0e15,
          metalness: 0.1,
          roughness: 0.9,
        })
      );
      dialBack.rotation.x = Math.PI / 2;
      dialBack.position.z = 0.1;
      watch.add(dialBack);

      // Cadran imprime sur un PLAN face a la camera : l'orientation du logo
      // est ainsi garantie (pas d'ambiguite d'UV comme sur un cylindre).
      const dial = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 2.8),
        new THREE.MeshStandardMaterial({
          map: dialTexture,
          transparent: true,
          metalness: 0.1,
          roughness: 0.85,
          envMapIntensity: 0.4,
        })
      );
      dial.position.z = 0.13;
      watch.add(dial);

      // --- Aiguilles (claires pour ressortir sur le cadran sombre) ---
      const handMat = new THREE.MeshStandardMaterial({
        color: 0xf1ede2,
        metalness: 0.9,
        roughness: 0.2,
      });
      function makeHand(length: number, w: number, z: number) {
        const hand = new THREE.Mesh(
          new THREE.BoxGeometry(w, length, 0.02),
          handMat
        );
        // Pivot a la base : on decale la geometrie vers le haut.
        hand.geometry.translate(0, length / 2 - 0.1, 0);
        hand.position.z = z;
        watch.add(hand);
        return hand;
      }
      const hourHand = makeHand(0.75, 0.08, 0.17);
      const minuteHand = makeHand(1.05, 0.06, 0.19);
      const secondHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 1.15, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0xa9762f,
          metalness: 0.5,
          roughness: 0.3,
        })
      );
      secondHand.geometry.translate(0, 1.15 / 2 - 0.15, 0);
      secondHand.position.z = 0.21;
      watch.add(secondHand);

      const centerCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.08, 24),
        chrome
      );
      centerCap.rotation.x = Math.PI / 2;
      centerCap.position.z = 0.22;
      watch.add(centerCap);

      // --- Couronne (crown) sur le cote droit ---
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.2, 24),
        chrome
      );
      crown.rotation.z = Math.PI / 2;
      crown.position.set(1.72, 0, 0);
      watch.add(crown);

      // --- Cornes (lugs) haut et bas pour lire "montre" ---
      const lugGeo = new THREE.BoxGeometry(0.5, 0.4, 0.42);
      for (const sign of [1, -1]) {
        const lug = new THREE.Mesh(lugGeo, chrome);
        lug.position.set(0, sign * 1.6, 0);
        watch.add(lug);
      }

      // --- Verre saphir : simple reflet clearcoat, tres peu opaque ---
      // (on evite `transmission`, mal rendu par certains GPU logiciels et qui
      // voilait le cadran ; un leger clearcoat suffit a l'effet "verre".)
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(1.42, 1.42, 0.06, 96),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0,
          roughness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          transparent: true,
          opacity: 0.12,
          envMapIntensity: 1.5,
        })
      );
      glass.rotation.x = Math.PI / 2;
      glass.position.z = 0.24;
      watch.add(glass);

      watch.rotation.x = 0.12;

      // --- Interaction : leger parallaxe au survol ---
      const pointerTarget = { x: 0, y: 0 };
      function onPointerMove(e: PointerEvent) {
        const rect = el.getBoundingClientRect();
        pointerTarget.x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
        pointerTarget.y = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
      }
      function onPointerLeave() {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
      }
      if (!reduceMotion) {
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerleave", onPointerLeave);
      }

      // --- Boucle d'animation avec pauses ---
      let raf = 0;
      let running = false;
      const clock = new THREE.Clock();
      let lastSecond = -1;

      function renderFrame() {
        const t = clock.getElapsedTime();

        // Oscillation lente : le cadran reste toujours visible.
        const baseY = Math.sin(t * 0.35) * 0.4;
        watch.rotation.y += (baseY + pointerTarget.x - watch.rotation.y) * 0.05;
        watch.rotation.x += (0.12 + pointerTarget.y - watch.rotation.x) * 0.05;

        // Aiguilles : positions figees + trotteuse qui "tique" a la seconde.
        hourHand.rotation.z = -((10 + 10 / 60) / 12) * Math.PI * 2;
        minuteHand.rotation.z = -(10 / 60) * Math.PI * 2;
        const sec = Math.floor(t) % 60;
        if (sec !== lastSecond) {
          lastSecond = sec;
          secondHand.rotation.z = -(sec / 60) * Math.PI * 2;
        }

        renderer.render(scene, camera);
      }

      function loop() {
        if (!running) return;
        renderFrame();
        raf = requestAnimationFrame(loop);
      }
      function start() {
        if (running || reduceMotion) return;
        running = true;
        clock.start();
        loop();
      }
      function stop() {
        running = false;
        cancelAnimationFrame(raf);
      }

      // Pause hors ecran.
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) start();
          else stop();
        },
        { threshold: 0.1 }
      );
      io.observe(el);

      function onVisibility() {
        if (document.hidden) stop();
        else if (!reduceMotion) start();
      }
      document.addEventListener("visibilitychange", onVisibility);

      // Redimensionnement.
      const ro = new ResizeObserver(() => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (!running) renderFrame();
      });
      ro.observe(el);

      // Toujours au moins une image (indispensable en reduced-motion).
      renderFrame();
      if (!reduceMotion) start();

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerleave", onPointerLeave);
        scene.traverse((obj) => {
          const mesh = obj as { geometry?: { dispose(): void }; material?: unknown };
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
          else (mat as { dispose?: () => void })?.dispose?.();
        });
        dialTexture.dispose();
        envTexture.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="h-[320px] w-full sm:h-[420px] lg:h-[480px]"
    />
  );
}
