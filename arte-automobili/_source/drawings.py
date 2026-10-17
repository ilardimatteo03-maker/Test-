"""Dessins vectoriels à plat : flacons, véhicule utilitaire, vêtements, façade.
Style « dessin technique » : silhouettes simples, proportions justes, aucun effet."""
from kit import A, B, G, N, V, logo_g, rect, text


def bottle(x, y, h, body=N, label=B, ink=N, name="Shampoing", sub="pH neutre · 1 L", ref="N° 01",
           cap=None, shade=True):
    """Flacon d'atelier 1 L à épaules arrondies. (x, y) = bas-centre du flacon."""
    w = 0.38 * h
    nw, nh = 0.15 * h, 0.07 * h
    ch = 0.11 * h
    top = y - h
    sh = 0.10 * h  # hauteur d'épaule
    bx = x - w / 2
    r = 0.035 * h
    body_path = (f"M{bx:.1f} {y - r:.1f} L{bx:.1f} {top + ch + nh + sh:.1f} "
                 f"Q{bx:.1f} {top + ch + nh:.1f} {x - nw / 2:.1f} {top + ch + nh:.1f} "
                 f"L{x + nw / 2:.1f} {top + ch + nh:.1f} "
                 f"Q{bx + w:.1f} {top + ch + nh:.1f} {bx + w:.1f} {top + ch + nh + sh:.1f} "
                 f"L{bx + w:.1f} {y - r:.1f} Q{bx + w:.1f} {y:.1f} {bx + w - r:.1f} {y:.1f} "
                 f"L{bx + r:.1f} {y:.1f} Q{bx:.1f} {y:.1f} {bx:.1f} {y - r:.1f} Z")
    out = [f'<path d="{body_path}" fill="{body}"/>',
           rect(x - nw / 2, top + ch, nw, nh + 2, body),
           rect(x - nw / 2 - 0.012 * h, top, nw + 0.024 * h, ch, cap or N)]
    # stries du bouchon
    for i in range(1, 7):
        out.append(rect(x - nw / 2 - 0.012 * h + i * (nw + 0.024 * h) / 7, top + 0.012 * h, 1.2, ch - 0.024 * h, "#000", 0.35))
    if shade:  # reflet vertical discret
        out.append(rect(bx + w * 0.10, top + ch + nh + sh, w * 0.05, h * 0.62, "#ffffff", 0.06))
    # étiquette
    lx, ly, lw, lh = bx + w * 0.1, y - h * 0.62, w * 0.8, h * 0.50
    out.append(rect(lx, ly, lw, lh, label))
    cx = lx + lw / 2
    out.append(logo_g("monogramme", cx, ly + lh * 0.08, height=lh * 0.17, fill=ink, anchor="tc"))
    out.append(text(cx, ly + lh * 0.47, name, lh * (0.085 if len(name) < 11 else 0.066), "bodoni", 400, ink, anchor="middle"))
    out.append(text(cx, ly + lh * 0.58, sub, lh * 0.045, "mono", 400, ink, anchor="middle", opacity=0.75))
    out.append(rect(lx + lw * 0.2, ly + lh * 0.67, lw * 0.6, max(lh * 0.004, 0.8), ink))
    out.append(text(cx, ly + lh * 0.80, "ARTE AUTOMOBILI", lh * 0.029, "archivo", 600, ink, ls=0.2,
                    anchor="middle", stretch=125))
    out.append(text(cx, ly + lh * 0.91, ref, lh * 0.04, "mono", 400, ink, anchor="middle", opacity=0.6))
    return "".join(out)


def van(x, y, L, body=G, glass="#0b0d0c", tyre="#060707", rim="#3a3f3d", marking=True, mark_fill=B, side="left"):
    """Fourgon moyen (type 5,9 m, toit normal) vu de côté. (x, y) = coin bas-gauche au sol,
    L = longueur hors tout. Avant à gauche."""
    H = L * 0.43
    wr = L * 0.062  # rayon de roue
    gy = y - wr * 0.55  # bas de caisse
    roof = y - H
    hood_x = x + L * 0.13
    ws_top = x + L * 0.235
    p = (f"M{x + L * 0.012:.1f} {gy:.1f} "
         f"L{x:.1f} {y - H * 0.40:.1f} "
         f"Q{x:.1f} {y - H * 0.47:.1f} {x + L * 0.03:.1f} {y - H * 0.50:.1f} "
         f"L{hood_x:.1f} {y - H * 0.585:.1f} "
         f"L{ws_top:.1f} {roof + H * 0.06:.1f} "
         f"Q{ws_top + L * 0.012:.1f} {roof:.1f} {ws_top + L * 0.05:.1f} {roof:.1f} "
         f"L{x + L * 0.985:.1f} {roof:.1f} "
         f"Q{x + L:.1f} {roof:.1f} {x + L:.1f} {roof + H * 0.04:.1f} "
         f"L{x + L:.1f} {gy:.1f} Z")
    out = [f'<path d="{p}" fill="{body}"/>']
    # vitrages : pare-brise (profil) + vitre de porte
    out.append(f'<path d="M{hood_x + L * 0.012:.1f} {y - H * 0.59:.1f} L{ws_top + L * 0.004:.1f} {roof + H * 0.075:.1f} '
               f'L{x + L * 0.262:.1f} {roof + H * 0.075:.1f} L{x + L * 0.262:.1f} {y - H * 0.585:.1f} Z" fill="{glass}"/>')
    out.append(f'<path d="M{x + L * 0.272:.1f} {roof + H * 0.075:.1f} L{x + L * 0.335:.1f} {roof + H * 0.075:.1f} '
               f'L{x + L * 0.335:.1f} {y - H * 0.585:.1f} L{x + L * 0.272:.1f} {y - H * 0.585:.1f} Z" fill="{glass}"/>')
    # lignes d'ouvrants
    for xx in (0.345, 0.66, 0.995):
        out.append(rect(x + L * xx, roof + H * 0.03, 1.4, gy - roof - H * 0.03, "#000", 0.45))
    out.append(rect(x + L * 0.345, y - H * 0.82, L * 0.315, 1.2, "#000", 0.25))  # rail de porte coulissante
    # bandeau bas de caisse
    out.append(rect(x + L * 0.01, gy - H * 0.11, L * 0.99, H * 0.11, "#000", 0.28))
    # passages de roue
    for cx in (x + L * 0.18, x + L * 0.77):
        out.append(f'<circle cx="{cx:.1f}" cy="{y - wr:.1f}" r="{wr * 1.18:.1f}" fill="#0a0b0b"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{y - wr:.1f}" r="{wr:.1f}" fill="{tyre}"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{y - wr:.1f}" r="{wr * 0.6:.1f}" fill="{rim}"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{y - wr:.1f}" r="{wr * 0.18:.1f}" fill="#1a1d1c"/>')
    # optique, rétroviseur, poignée
    out.append(rect(x + L * 0.004, y - H * 0.47, L * 0.045, H * 0.05, "#d9d6cc", 0.85))
    out.append(rect(x + L * 0.262, y - H * 0.60, L * 0.022, H * 0.09, "#050505"))
    out.append(rect(x + L * 0.29, y - H * 0.50, L * 0.025, H * 0.012, "#000", 0.6))
    out.append(rect(x + L * 0.62, y - H * 0.50, L * 0.025, H * 0.012, "#000", 0.6))
    out.append(rect(x + L * 0.985, y - H * 0.55, L * 0.012, H * 0.12, "#7a1c1c", 0.9))
    if marking:
        # marquage discret : monogramme + lettrage, aligné sur la ligne de caisse
        cy = y - H * 0.53
        out.append(logo_g("logo-principal", x + L * 0.43, cy, height=H * 0.11, fill=mark_fill, anchor="cl"))
        out.append(text(x + L * 0.43, cy + H * 0.125, "ATELIER DE DETAILING · SUR RENDEZ-VOUS",
                        H * 0.021, "archivo", 500, mark_fill, ls=0.2, stretch=125, opacity=0.8))
        out.append(text(x + L * 0.43, cy + H * 0.17, "arteautomobili.fr", H * 0.024, "mono", 400, mark_fill, opacity=0.8))
    return "".join(out)
