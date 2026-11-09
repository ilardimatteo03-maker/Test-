"""Maquettes de vêtements en SVG : vue « mannequin invisible », 1000 × 1250 px.

Chaque pièce est décrite par sa demi-silhouette (moitié gauche de l'image), symétrisée.
Le rendu superpose : ombre portée, couleur, ombrages (volumes, plis), côtes, coutures,
puis texture du tissu, et enfin broderies et accessoires métal.
Échelle : ~6,8 px par centimètre de vêtement.
"""
import brand as B
import fx

CX = 500
PX_CM = 6.8


# ---------------------------------------------------------------- utilitaires
def _hex(c):
    c = c.lstrip("#")
    return [int(c[i:i + 2], 16) for i in (0, 2, 4)]


def shade(c, f):
    """f > 0 éclaircit, f < 0 assombrit."""
    r = _hex(c)
    if f >= 0:
        r = [v + (255 - v) * f for v in r]
    else:
        r = [v * (1 + f) for v in r]
    return "#" + "".join(f"{int(max(0, min(255, v))):02x}" for v in r)


def lum(c):
    r, g, b = _hex(c)
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255


def mx(x):
    return 2 * CX - x


def sym(half):
    """half : segments de la moitié gauche, du haut-centre au bas-centre.
    ('M',x,y) puis ('L',x,y) / ('C',x1,y1,x2,y2,x,y). Retourne le tracé complet fermé."""
    d = []
    pts = []  # points d'arrivée
    cur = None
    for s in half:
        if s[0] == "M":
            d.append(f"M{s[1]:.1f} {s[2]:.1f}")
            cur = (s[1], s[2])
        elif s[0] == "L":
            d.append(f"L{s[1]:.1f} {s[2]:.1f}")
            pts.append(("L", cur, (s[1], s[2])))
            cur = (s[1], s[2])
        elif s[0] == "C":
            d.append("C" + " ".join(f"{v:.1f}" for v in s[1:]))
            pts.append(("C", cur, (s[1], s[2]), (s[3], s[4]), (s[5], s[6])))
            cur = (s[5], s[6])
    # moitié droite : segments inversés et miroir
    for seg in reversed(pts):
        if seg[0] == "L":
            p0 = seg[1]
            d.append(f"L{mx(p0[0]):.1f} {p0[1]:.1f}")
        else:
            _, p0, c1, c2, p3 = seg
            d.append(f"C{mx(c2[0]):.1f} {c2[1]:.1f} {mx(c1[0]):.1f} {c1[1]:.1f} {mx(p0[0]):.1f} {p0[1]:.1f}")
    return "".join(d) + "Z"


def mirror_d(d_pts):
    """Polyligne/polygone (liste de points) et son symétrique → deux tracés."""
    a = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in d_pts) + "Z"
    b = "M" + "L".join(f"{mx(x):.1f} {y:.1f}" for x, y in d_pts) + "Z"
    return a, b


def mirror_path(d):
    """Symétrise un tracé SVG simple (commandes absolues M L C Q Z avec nombres)."""
    import re
    toks = re.findall(r"[MLCQZ]|-?\d+\.?\d*", d)
    out, i, cmd, k = [], 0, None, 0
    for t in toks:
        if t in "MLCQZ":
            out.append(t)
            k = 0
        else:
            v = float(t)
            out.append(f"{(mx(v) if k % 2 == 0 else v):.1f}")
            k += 1
    return " ".join(out)


def both(d):
    return d + " " + mirror_path(d)


# ---------------------------------------------------------------- géométries
def geo_tee(view="front", over=False):
    if not over:
        neck_y, hps, sh, sl_o, sl_i, arm, hem_y, side = 214, (434, 168), (304, 196), (190, 364), (268, 400), (318, 350), 1016, 320
        half = [("M", 500, neck_y if view == "front" else 160), ("C", 468, neck_y - 1, 444, neck_y - 16, *hps) if view == "front"
                else ("C", 470, 160, 448, 162, *hps),
                ("L", *sh), ("C", 282, 206, 250, 236, 232, 268), ("L", *sl_o), ("L", *sl_i),
                ("C", 290, 388, 306, 368, *arm), ("C", side - 2, 520, side - 4, 800, side, hem_y - 6),
                ("C", 400, hem_y, 460, hem_y + 2, 500, hem_y + 2)]
    else:
        neck_y, hps, sh, sl_o, sl_i, arm, hem_y, side = 212, (430, 162), (266, 206), (148, 478), (252, 506), (276, 412), 1070, 276
        half = [("M", 500, neck_y if view == "front" else 156), ("C", 466, neck_y - 1, 440, neck_y - 18, *hps) if view == "front"
                else ("C", 468, 156, 444, 158, *hps),
                ("L", *sh), ("C", 236, 226, 200, 290, 180, 350), ("L", *sl_o), ("L", *sl_i),
                ("C", 262, 474, 270, 440, *arm), ("C", side, 600, side - 2, 860, side + 2, hem_y - 6),
                ("C", 380, hem_y, 450, hem_y + 2, 500, hem_y + 2)]
    body = sym(half)
    g = {"body": body, "parts": [], "ribs": [], "stitch": [], "folds": [], "lights": [], "seams": []}
    nk = f"M{hps[0]} {hps[1]}C{hps[0] + 10} {neck_y - 16} {468 if not over else 466} {neck_y - 1} 500 {neck_y}"
    if view == "front":
        back = f"M{hps[0]} {hps[1]}C{hps[0] + 22} {hps[1] - 13} {mx(hps[0] + 22)} {hps[1] - 13} {mx(hps[0])} {hps[1]}"
        inside = back + f"C{mx(hps[0] + 10)} {neck_y - 16} {mx(468 if not over else 466)} {neck_y - 1} 500 {neck_y}" \
                        f"C{468 if not over else 466} {neck_y - 1} {hps[0] + 10} {neck_y - 16} {hps[0]} {hps[1]}Z"
        g["inside"] = inside
        g["inside_rib"] = back
        g["label"] = (500, hps[1] - 2)
        g["neck"] = both(nk)
    else:
        g["neck"] = f"M{hps[0]} {hps[1]}C{448 if not over else 444} 162 470 {160 if not over else 156} 500 {160 if not over else 156}" \
                    f"C{530} {160 if not over else 156} {552 if not over else 556} 162 {mx(hps[0])} {hps[1]}"
    g["neck_w"] = 16 if not over else 18
    # coutures
    g["seams"] += [both(f"M{hps[0]} {hps[1] + 2}L{sh[0]} {sh[1] + 2}")]
    g["seams"] += [both(f"M{sh[0]} {sh[1]}C{sh[0] + 8} {sh[1] + 50} {arm[0] - 6} {arm[1] - 40} {arm[0]} {arm[1]}")]
    sx, sy = sl_o
    ix, iy = sl_i
    dx, dy = ix - sx, iy - sy
    n = (dy / (dx * dx + dy * dy) ** .5, -dx / (dx * dx + dy * dy) ** .5)
    g["stitch"] += [both(f"M{sx + n[0] * 16:.1f} {sy + n[1] * 16:.1f}L{ix + n[0] * 16:.1f} {iy + n[1] * 16:.1f}")]
    g["stitch"] += [both(f"M{side + 1} {hem_y - 22}C{400} {hem_y - 16} 460 {hem_y - 14} 500 {hem_y - 14}")]
    # plis
    if not over:
        g["folds"] += [(both("M318 380C350 430 380 470 420 500"), 0.6, 18), (both("M325 860C360 900 380 960 392 1010"), 0.35, 22),
                       (both("M236 290C250 320 262 350 280 380"), 0.45, 14), (both("M330 640C350 700 352 760 340 820"), 0.25, 26)]
        g["lights"] += [(both("M380 260C400 330 410 420 404 520"), 0.5, 40), (both("M260 300C270 320 280 340 292 360"), 0.35, 10)]
    else:
        g["folds"] += [(both("M278 440C320 500 360 540 410 560"), 0.6, 22), (both("M290 900C330 960 350 1010 360 1060"), 0.4, 24),
                       (both("M200 330C214 380 226 420 244 470"), 0.5, 16), (both("M300 680C330 760 330 830 316 900"), 0.25, 30),
                       (both("M470 230C474 300 470 360 460 420"), 0.18, 20)]
        g["lights"] += [(both("M360 270C380 360 390 460 380 600"), 0.5, 46), (both("M220 360C230 390 240 420 250 450"), 0.35, 12)]
    g["chest"] = (500, 300 if not over else 310)
    g["chest_l"] = (568, 300)
    g["back"] = (500, 270 if not over else 290)
    return g


def geo_long(kind="hoodie", view="front"):
    """Hoodie, crewneck, veste zippée, bomber : manches longues, bord-côte en bas."""
    hps = (412, 192) if kind == "hoodie" else (430, 170)
    sh = (290, 228)
    rib_top, hem = (958, 1034) if kind != "bomber" else (950, 1018)
    side_x = 300 if kind != "bomber" else 292
    half = [("M", 500, 200 if kind == "hoodie" else (212 if kind == "crew" else 170)),
            ("L", *hps) if kind == "hoodie" else ("C", 470, 212 if kind == "crew" else 170, 444, 196 if kind == "crew" else 170, *hps),
            ("L", *sh), ("C", 262, 244, 240, 300, 230, 360), ("L", 198, 762), ("L", 196, 834), ("L", 264, 840),
            ("L", 268, 772), ("C", 274, 600, 286, 470, 300, 384),
            ("C", side_x + 2, 600, side_x, 840, side_x + 2, rib_top),
            ("L", side_x + 6 if kind != "bomber" else side_x + 18, hem),
            ("C", 400, hem + 4, 460, hem + 6, 500, hem + 6)]
    if kind == "crew" and view == "back":
        half[0] = ("M", 500, 160)
        half[1] = ("C", 470, 160, 446, 164, *hps)
    g = {"body": sym(half), "parts": [], "ribs": [], "stitch": [], "folds": [], "lights": [], "seams": []}
    # côtes : poignets et bas
    cuff = [(198, 762), (268, 772), (264, 840), (196, 834)]
    a, b = mirror_d(cuff)
    g["ribs"] += [(a, -2), (b, 2)]
    hemp = (f"M{side_x + 2} {rib_top}C400 {rib_top + 4} 460 {rib_top + 6} 500 {rib_top + 6}"
            f"C540 {rib_top + 6} 600 {rib_top + 4} {mx(side_x + 2)} {rib_top}L{mx(side_x + 6 if kind != 'bomber' else side_x + 18)} {hem}"
            f"C600 {hem + 4} 540 {hem + 6} 500 {hem + 6}C460 {hem + 6} 400 {hem + 4} {side_x + 6 if kind != 'bomber' else side_x + 18} {hem}Z")
    g["ribs"] += [(hemp, 0)]
    g["seams"] += [both(f"M{side_x + 2} {rib_top}C400 {rib_top + 4} 460 {rib_top + 6} 500 {rib_top + 6}"),
                   both("M198 762L268 772")]
    if kind == "crew":
        # manches raglan
        g["seams"] += [both("M446 196C400 250 340 320 300 384")]
        if view == "front":
            nk = "M430 170C444 196 470 212 500 212"
            g["inside"] = ("M430 170C452 157 548 157 570 170C556 196 530 212 500 212C470 212 444 196 430 170Z")
            g["inside_rib"] = "M430 170C452 157 548 157 570 170"
            g["label"] = (500, 168)
            g["neck"] = both(nk)
        else:
            g["neck"] = "M430 170C446 164 470 160 500 160C530 160 554 164 570 170"
        g["neck_w"] = 22
    else:
        g["seams"] += [both(f"M{hps[0]} {hps[1] + 2}L290 228"), both("M290 228C298 280 300 330 300 384")]
    if kind in ("zip", "bomber"):
        if kind == "zip":
            # col cheminée
            g["collar"] = "M426 172C424 150 424 128 428 108C470 102 530 102 572 108C576 128 576 150 574 172C540 180 460 180 426 172Z"
            g["collar_in"] = "M428 108C470 102 530 102 572 108C540 120 460 120 428 108Z"
        else:
            g["collar"] = "M424 172C420 158 420 146 424 132C470 140 530 140 576 132C580 146 580 158 576 172C540 184 460 184 424 172Z"
            g["collar_in"] = "M424 132C470 140 530 140 576 132C540 150 460 150 424 132Z"
            g["collar_rib"] = True
        g["zip"] = (110 if kind == "zip" else 140, hem + 4)
        g["pockets"] = [both("M352 690L392 800"), ]
    if kind == "hoodie":
        if view == "front":
            g["hood"] = ("M404 206C378 150 414 92 500 86C586 92 622 150 596 206C580 214 560 214 548 210"
                         "C556 168 534 124 500 122C466 124 444 168 452 210C440 214 420 214 404 206Z")
            g["hood_in"] = "M452 210C444 168 466 124 500 122C534 124 556 168 548 210C536 236 516 252 500 254C484 252 464 236 452 210Z"
            g["hood_edge"] = "M452 210C444 168 466 124 500 122C534 124 556 168 548 210"
            g["cords"] = [(470, 240, 452, 420), (530, 240, 548, 418)]
            g["pocket"] = "M396 692L604 692L646 884L354 884Z"
        else:
            g["hood_back"] = ("M408 200C396 150 436 110 500 108C564 110 604 150 592 200C602 280 584 380 500 424"
                              "C416 380 398 280 408 200Z")
    # plis communs manches longues
    g["folds"] += [(both("M232 400C240 470 238 540 226 600"), 0.45, 16), (both("M250 700C258 720 262 740 262 760"), 0.5, 12),
                   (both("M300 420C340 470 372 500 410 520"), 0.45, 20), (both("M320 870C360 900 380 930 392 958"), 0.35, 22),
                   (both("M214 640C224 660 236 680 252 690"), 0.4, 10)]
    g["lights"] += [(both("M380 300C400 380 408 470 400 600"), 0.45, 46), (both("M244 380C250 450 248 520 240 580"), 0.35, 12)]
    g["chest"] = (500, 330)
    g["chest_l"] = (566, 330)
    g["back"] = (500, 300 if kind != "hoodie" else 480)
    return g


def geo_polo():
    hps, sh = (432, 166), (306, 194)
    half = [("M", 500, 150), ("C", 470, 150, 446, 156, *hps), ("L", *sh), ("C", 282, 204, 252, 236, 234, 268),
            ("L", 200, 352), ("L", 272, 384), ("C", 292, 372, 306, 360, 318, 346),
            ("C", 316, 520, 316, 800, 318, 950), ("L", 322, 1012), ("C", 400, 1016, 460, 1018, 500, 1018)]
    g = {"body": sym(half), "parts": [], "ribs": [], "stitch": [], "folds": [], "lights": [], "seams": []}
    g["vopen"] = "M436 166C462 210 482 270 500 330C518 270 538 210 564 166C540 156 460 156 436 166Z"
    g["wing"] = "M432 160C448 206 472 262 496 316C470 302 420 282 382 264C390 232 402 202 414 176C418 168 424 163 432 160Z"
    g["stand"] = "M430 162C452 146 548 146 570 162C548 154 452 154 430 162Z"
    cuff = [(200, 352), (272, 384), (264, 402), (194, 368)]
    g["ribs"] += [("M200 352L272 384L280 368L208 336Z", 66), (mirror_d([(200, 352), (272, 384), (280, 368), (208, 336)])[1], -66),
                  ("M318 950C400 954 460 956 500 956C540 956 600 954 682 950L678 1012C600 1016 540 1018 500 1018C460 1018 400 1016 322 1012Z", 0)]
    g["seams"] += [both("M432 168L306 196"), both("M306 194C314 250 318 300 318 346"),
                   both("M318 950C400 954 460 956 500 956")]
    g["folds"] += [(both("M318 380C350 430 380 470 420 500"), 0.5, 18), (both("M330 640C350 700 352 760 340 820"), 0.25, 26),
                   (both("M238 280C250 310 262 336 280 360"), 0.4, 12)]
    g["lights"] += [(both("M380 300C400 360 410 440 404 540"), 0.45, 40)]
    g["chest"] = (500, 380)
    g["chest_l"] = (570, 380)
    return g


def geo_pants(short=False):
    if not short:
        half = [("M", 500, 140), ("L", 324, 140), ("L", 322, 204), ("C", 306, 300, 300, 420, 306, 560),
                ("C", 316, 760, 336, 960, 348, 1076), ("L", 350, 1132), ("L", 466, 1132), ("L", 468, 1078),
                ("C", 476, 900, 486, 720, 494, 600), ("C", 496, 590, 498, 584, 500, 582)]
    else:
        half = [("M", 500, 150), ("L", 322, 150), ("L", 320, 214), ("C", 306, 330, 298, 480, 294, 640),
                ("L", 472, 672), ("C", 482, 600, 490, 548, 500, 530)]
    g = {"body": sym(half), "parts": [], "ribs": [], "stitch": [], "folds": [], "lights": [], "seams": []}
    top = 140 if not short else 150
    wb = 204 if not short else 214
    g["waist"] = (f"M{324 if not short else 322} {top}L{mx(324 if not short else 322)} {top}"
                  f"L{mx(322 if not short else 320)} {wb}L{322 if not short else 320} {wb}Z")
    g["ribs"] += [(g["waist"], 90)]
    g["seams"] += [f"M{322 if not short else 320} {wb}L{mx(322 if not short else 320)} {wb}",
                   both(f"M342 {wb + 6}C370 {wb + 60} 392 {wb + 110} 400 {wb + 170}")]  # poches italiennes
    g["stitch"] += [f"M512 {wb + 4}L512 {wb + 150}C512 {wb + 176} 506 {wb + 190} 500 {wb + 196}",
                    both(f"M348 {wb + 4}C374 {wb + 60} 394 {wb + 110} 402 {wb + 168}")]
    if not short:
        g["ribs"] += [("M348 1076L468 1078L466 1132L350 1132Z", 0), (mirror_d([(348, 1076), (468, 1078), (466, 1132), (350, 1132)])[1], 0)]
        g["crease"] = both("M400 220C402 500 404 800 408 1076")
        g["cord"] = True
        g["folds"] += [(both("M470 600C460 660 452 700 446 760"), 0.35, 16), (both("M372 1000C390 1020 410 1030 440 1040"), 0.5, 14),
                       (both("M360 960C380 980 410 990 444 996"), 0.4, 12), (both("M330 380C340 430 344 480 342 540"), 0.3, 20)]
        g["lights"] += [(both("M392 300C398 500 404 700 404 900"), 0.4, 30)]
    else:
        g["stitch"] += [both("M296 622L470 652")]
        g["crease"] = both("M398 230C398 400 400 520 400 650")
        g["cord"] = True
        g["folds"] += [(both("M470 560C462 590 458 610 456 640"), 0.4, 14), (both("M320 420C324 480 322 540 316 600"), 0.25, 18)]
        g["lights"] += [(both("M384 280C390 400 392 500 390 620"), 0.4, 28)]
    g["hip"] = (612, 260) if not short else (380, 600)
    return g


def geo_cap():
    g = {"parts": [], "ribs": [], "stitch": [], "folds": [], "lights": [], "seams": []}
    g["crown"] = "M296 652C286 520 384 404 548 390C690 380 778 470 772 610C700 650 430 676 296 652Z"
    g["brim"] = ("M300 646C232 690 214 768 284 800C392 846 566 812 646 748C670 726 662 694 632 670"
                 "C530 684 390 680 300 646Z")
    g["brim_under"] = "M300 646C390 680 530 684 632 670C640 678 646 686 648 694C540 712 380 706 292 664Z"
    g["seams"] = ["M548 392C500 470 470 560 466 672", "M548 392C440 430 352 520 318 656",
                  "M548 392C640 420 712 500 744 626", "M548 392C590 470 616 560 626 668"]
    g["stitch"] = ["M268 776C360 816 520 800 620 742", "M256 752C350 792 510 780 610 724", "M262 726C350 766 500 758 600 706"]
    g["eyelets"] = [(408, 470), (682, 470), (580, 432)]
    g["button"] = (548, 392)
    g["folds"] = [("M330 600C360 630 400 650 440 660", 0.35, 18), ("M740 540C730 580 712 610 690 630", 0.4, 22),
                  ("M300 700C320 740 360 770 420 790", 0.5, 16)]
    g["lights"] = [("M460 440C500 420 560 410 620 420", 0.6, 40), ("M330 720C400 760 500 770 600 740", 0.3, 18)]
    g["front"] = (468, 560)
    return g


# ---------------------------------------------------------------- rendu
def _rib_pattern(pid, color, angle, pitch=4.2):
    dk = shade(color, -0.32 if lum(color) > 0.2 else -0.5)
    lt = shade(color, 0.10 if lum(color) > 0.5 else 0.08)
    return (f'<pattern id="{pid}" width="{pitch}" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate({angle})">'
            f'<rect width="{pitch}" height="10" fill="{color}"/><rect width="{pitch * 0.3:.2f}" height="10" fill="{dk}" opacity=".55"/>'
            f'<rect x="{pitch * 0.55:.2f}" width="{pitch * 0.2:.2f}" height="10" fill="{lt}" opacity=".45"/></pattern>')


FIT = {  # étirement vertical (proportions réelles) et boîte de la géométrie
    "tee": (0.64, (188, 150, 812, 1020)), "oversize": (0.6, (146, 150, 854, 1072)),
    "hoodie": (0.62, (194, 84, 806, 1042)), "crew": (0.62, (194, 155, 806, 1042)),
    "zip": (0.62, (194, 100, 806, 1042)), "bomber": (0.6, (194, 128, 806, 1026)),
    "polo": (0.64, (192, 144, 808, 1020)), "jogger": (0.86, (298, 138, 702, 1134)),
    "short": (0.92, (292, 148, 708, 674)), "cap": (1.0, (212, 380, 782, 844)),
}


def canvas_map(kind, w=1000, h=1250, fill=0.80, offset=(0, 0)):
    """Fonction (x, y) géométrie → (X, Y) image, et l'échelle — pour les recadrages de détail."""
    sy, (x0, y0, x1, y1) = FIT[kind]
    fill = fill * {"short": 0.8, "cap": 0.86, "jogger": 1.04}.get(kind, 1.0)
    sc = min(w * fill / (x1 - x0), h * fill / ((y1 - y0) * sy))
    cx, cy = w / 2 + offset[0], h * 0.5 + offset[1]
    return (lambda x, y: (cx + sc * (x - (x0 + x1) / 2), cy + sc * sy * (y - (y0 + y1) / 2))), sc


def render(kind, color, view="front", fabric="jersey", logos=(), arts=(), bg=None, pid="g", pattern=None,
           trim=None, hardware=B.OTTONE, label=True, w=1000, h=1250, fill=0.80, cords=True, shadow=True,
           transparent=False, offset=(0, 0)):
    """SVG complet d'une pièce. logos : [{lk, x, y, w|h, fill, fx}] ; arts : [{art, x, y, w, fx, anchor}]
    (coordonnées de la géométrie 1000 × 1250 avant mise à l'échelle). pattern : (defs, url)."""
    if kind in ("tee", "oversize"):
        g = geo_tee(view, over=(kind == "oversize"))
    elif kind in ("hoodie", "crew", "zip", "bomber"):
        g = geo_long(kind, view)
    elif kind == "polo":
        g = geo_polo()
    elif kind in ("jogger", "short"):
        g = geo_pants(short=(kind == "short"))
    elif kind == "cap":
        g = geo_cap()
    else:
        raise ValueError(kind)
    sy, (x0, y0, x1, y1) = FIT[kind]
    fill = fill * {"short": 0.8, "cap": 0.86, "jogger": 1.04}.get(kind, 1.0)
    gw, gh = x1 - x0, (y1 - y0) * sy
    sc = min(w * fill / gw, h * fill / gh)
    cx, cy = w / 2 + offset[0], h * 0.5 + offset[1]
    mxc, myc = (x0 + x1) / 2, (y0 + y1) / 2
    T = f"translate({cx:.2f} {cy:.2f}) scale({sc:.5f} {sc * sy:.5f}) translate({-mxc:.2f} {-myc:.2f})"

    def M(x, y):
        return cx + sc * (x - mxc), cy + sc * sy * (y - myc)

    L = lum(color)
    dark = L < 0.25
    k_f = 0.55 if dark else (0.32 if L < 0.6 else 0.20)
    k_l = 0.10 if dark else (0.14 if L < 0.6 else 0.30)
    trim = trim or color
    inside_c = shade(color, -0.45 if not dark else -0.35)
    stitch_c = shade(color, 0.22) if dark else shade(color, -0.22)
    seam_c = shade(color, -0.5) if not dark else "#000"
    defs = [fx.fabric(f"{pid}fab", fabric, seed=3, strength=1.0 if not dark else 1.3), fx.blur(f"{pid}b8", 8),
            fx.blur(f"{pid}b14", 14), fx.blur(f"{pid}b3", 2.2),
            f'<filter id="{pid}sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>',
            f'<linearGradient id="{pid}cyl" x1="0" x2="1" y1="0" y2="0">'
            f'<stop offset="0" stop-color="#000" stop-opacity="{0.42 * k_f / 0.32:.2f}"/>'
            f'<stop offset=".2" stop-color="#000" stop-opacity="{0.06 * k_f / 0.32:.2f}"/>'
            f'<stop offset=".42" stop-color="#fff" stop-opacity="{k_l * 0.6:.2f}"/>'
            f'<stop offset=".58" stop-color="#fff" stop-opacity="{k_l * 0.3:.2f}"/>'
            f'<stop offset=".8" stop-color="#000" stop-opacity="{0.08 * k_f / 0.32:.2f}"/>'
            f'<stop offset="1" stop-color="#000" stop-opacity="{0.5 * k_f / 0.32:.2f}"/></linearGradient>',
            f'<linearGradient id="{pid}vert" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="{k_l * .7:.2f}"/>'
            f'<stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="#000" stop-opacity="{0.25 * k_f / 0.32:.2f}"/></linearGradient>',
            f'<filter id="{pid}met"><feDropShadow dx="1.5" dy="2" stdDeviation="1.4" flood-opacity=".5"/></filter>',
            f'<filter id="{pid}wsh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="6" stdDeviation="6" '
            f'flood-opacity="{0.3 if not dark else .55}"/></filter>']
    bgc = bg or B.PIETRA
    defs.append(f'<radialGradient id="{pid}bg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="{shade(bgc, 0.18)}"/>'
                f'<stop offset="1" stop-color="{shade(bgc, -0.08)}"/></radialGradient>')
    body_d = g.get("body") or (g["crown"] + g["brim"])
    defs.append(f'<clipPath id="{pid}clip"><path d="{body_d}"/>'
                + (f'<path d="{g["hood"]}"/>' if "hood" in g else "") + "</clipPath>")
    out = [] if transparent else [f'<rect width="{w}" height="{h}" fill="url(#{pid}bg)"/>']
    inner = []
    if shadow:
        inner.append(f'<g filter="url(#{pid}sh)" opacity="{0.35 if not dark else 0.45}"><path d="{body_d}" fill="#3b2f25" '
                     f'transform="translate(10 26)"/></g>')
    G = []
    base_fill = pattern[1] if pattern else color
    if pattern:
        defs.append(pattern[0])
    G.append(f'<path d="{body_d}" fill="{base_fill}"/>')
    if kind == "cap":
        G.append(f'<path d="{g["crown"]}" fill="{base_fill}"/>')
    for i, (d, ang) in enumerate(g["ribs"]):
        defs.append(_rib_pattern(f"{pid}rib{i}", trim, ang))
        G.append(f'<path d="{d}" fill="url(#{pid}rib{i})"/>')
    shade_g = [f'<rect x="0" y="0" width="1000" height="1250" fill="url(#{pid}vert)"/>',
               f'<path d="{body_d}" fill="url(#{pid}cyl)"/>']
    for d, st, sw in g["folds"]:
        shade_g.append(f'<path d="{d}" fill="none" stroke="#000" stroke-opacity="{st * k_f:.2f}" stroke-width="{sw}" '
                       f'stroke-linecap="round" filter="url(#{pid}b8)"/>')
    for d, st, sw in g["lights"]:
        shade_g.append(f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity="{st * k_l:.2f}" stroke-width="{sw}" '
                       f'stroke-linecap="round" filter="url(#{pid}b14)"/>')
    G.append(f'<g clip-path="url(#{pid}clip)">{"".join(shade_g)}</g>')
    if kind == "cap":
        G.append(f'<path d="{g["brim"]}" fill="{shade(color, -0.02)}"/>')
        G.append(f'<path d="{g["brim"]}" fill="url(#{pid}cyl)" opacity=".6"/>')
        G.append(f'<path d="{g["brim_under"]}" fill="{shade(color, -0.4)}"/>')
        G.append(f'<path d="M300 646C390 680 530 684 632 670" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="10" filter="url(#{pid}b8)"/>')
    for d in g["seams"]:
        G.append(f'<path d="{d}" fill="none" stroke="{seam_c}" stroke-opacity=".45" stroke-width="1.6"/>'
                 f'<path d="{d}" fill="none" stroke="#fff" stroke-opacity="{0.10 if not dark else 0.06}" stroke-width="1" transform="translate(0 1.6)"/>')
    for d in g["stitch"]:
        G.append(f'<path d="{d}" fill="none" stroke="{stitch_c}" stroke-opacity=".75" stroke-width="1.4" stroke-dasharray="4 3"/>')
    if "pocket" in g:
        p = g["pocket"]
        k = k_f / .32
        G.append(f'<path d="{p}" fill="none" stroke="{stitch_c}" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="4 3"/>'
                 f'<path d="M396 692L354 884" stroke="#000" stroke-opacity="{0.35 * k:.2f}" stroke-width="7" filter="url(#{pid}b3)"/>'
                 f'<path d="M604 692L646 884" stroke="#000" stroke-opacity="{0.35 * k:.2f}" stroke-width="7" filter="url(#{pid}b3)"/>'
                 f'<path d="M396 692L604 692" stroke="#000" stroke-opacity="{0.2 * k:.2f}" stroke-width="4" filter="url(#{pid}b3)"/>')
    for d in g.get("pockets", []):
        G.append(f'<path d="{d}" stroke="#000" stroke-opacity="{0.5 * k_f / .32:.2f}" stroke-width="5" filter="url(#{pid}b3)"/>'
                 f'<path d="{d}" stroke="{stitch_c}" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="4 3" transform="translate(-5 0)"/>')
    if "crease" in g:
        G.append(f'<path d="{g["crease"]}" fill="none" stroke="#fff" stroke-opacity="{k_l * 1.2:.2f}" stroke-width="2.4" filter="url(#{pid}b3)"/>'
                 f'<path d="{g["crease"]}" fill="none" stroke="#000" stroke-opacity="{k_f * .5:.2f}" stroke-width="1" transform="translate(2 0)"/>')
    if "inside" in g:
        defs.append(f'<clipPath id="{pid}ic"><path d="{g["inside"]}"/></clipPath>')
        G.append(f'<path d="{g["inside"]}" fill="{inside_c}"/>')
        G.append(f'<path d="{g["inside_rib"]}" fill="none" stroke="{shade(trim, -0.12)}" stroke-width="{g["neck_w"] * 1.6}" '
                 f'clip-path="url(#{pid}ic)"/>')
    if "neck" in g:
        defs.append(_rib_pattern(f"{pid}nrib", trim, 90, 3.6))
        G.append(f'<path d="{g["neck"]}" fill="none" stroke="url(#{pid}nrib)" stroke-width="{g["neck_w"] * 2}" clip-path="url(#{pid}clip)"/>')
        G.append(f'<path d="{g["neck"]}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.4" transform="translate(0 {g["neck_w"]})"'
                 f' clip-path="url(#{pid}clip)"/>')
    if "vopen" in g:
        G.append(f'<path d="{g["vopen"]}" fill="{inside_c}"/>')
        G.append(f'<path d="{g["stand"]}" fill="{shade(trim, -0.1)}" stroke="{shade(trim, -0.1)}" stroke-width="10"/>')
        for d in (g["wing"], mirror_path(g["wing"])):
            G.append(f'<path d="{d}" fill="{trim}" filter="url(#{pid}wsh)"/>')
            G.append(f'<path d="{d}" fill="url(#{pid}cyl)" opacity=".5"/>')
            G.append(f'<path d="{d}" fill="none" stroke="{stitch_c}" stroke-opacity=".5" stroke-width="1.1" stroke-dasharray="3 3"/>')
    if "collar" in g:
        cfill = f"url(#{pid}crib)" if g.get("collar_rib") else base_fill
        if g.get("collar_rib"):
            defs.append(_rib_pattern(f"{pid}crib", trim, 90, 3.6))
        G.append(f'<path d="{g["collar"]}" fill="{cfill}"/>')
        G.append(f'<path d="{g["collar"]}" fill="url(#{pid}cyl)" opacity=".7"/>')
        G.append(f'<path d="{g["collar_in"]}" fill="{inside_c}"/>')
    if "hood" in g:
        G.append(f'<path d="{g["hood"]}" fill="{color}"/>')
        G.append(f'<path d="{g["hood"]}" fill="url(#{pid}cyl)" opacity=".8"/>')
        G.append(f'<path d="{g["hood_in"]}" fill="{inside_c}"/>')
        G.append(f'<path d="{g["hood_edge"]}" fill="none" stroke="{shade(color, 0.04)}" stroke-width="16"/>'
                 f'<path d="{g["hood_edge"]}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1.2" transform="translate(0 8)"/>')
        G.append(f'<path d="M452 210C464 236 484 252 500 254C516 252 536 236 548 210" fill="none" stroke="{color}" stroke-width="12"/>')
    if "hood_back" in g:
        G.append(f'<path d="{g["hood_back"]}" fill="{base_fill}" filter="url(#{pid}wsh)"/>')
        G.append(f'<path d="{g["hood_back"]}" fill="url(#{pid}cyl)" opacity=".9"/>')
        G.append(f'<path d="M500 110L500 422" stroke="{seam_c}" stroke-opacity=".45" stroke-width="1.6"/>')
    if kind == "cap":
        for (ex, ey) in g["eyelets"]:
            G.append(f'<circle cx="{ex}" cy="{ey}" r="5" fill="{shade(color, -0.4)}"/><circle cx="{ex}" cy="{ey}" r="5" fill="none" stroke="{stitch_c}" stroke-width="1.4"/>')
        bx, by = g["button"]
        G.append(f'<ellipse cx="{bx}" cy="{by + 3}" rx="16" ry="8" fill="{shade(color, -0.15)}"/><ellipse cx="{bx}" cy="{by}" rx="14" ry="6" fill="{shade(color, 0.1)}"/>')
    if g.get("cord") and cords:
        yy = "170" if kind == "jogger" else "182"
        G.append(f'<path d="M488 {yy}C480 230 470 280 466 330" stroke="{shade(trim, 0.1)}" stroke-width="7" fill="none" stroke-linecap="round"/>'
                 f'<path d="M512 {yy}C520 230 532 280 540 326" stroke="{shade(trim, 0.1)}" stroke-width="7" fill="none" stroke-linecap="round"/>'
                 f'<circle cx="488" cy="{yy}" r="6" fill="{hardware}"/><circle cx="512" cy="{yy}" r="6" fill="{hardware}"/>')
    inner.append(f'<g filter="url(#{pid}fab)">{"".join(G)}</g>')
    # fermeture éclair et cordons (dans le repère de la pièce)
    if "zip" in g:
        y0z, y1z = g["zip"]
        inner.append(f'<rect x="494" y="{y0z}" width="12" height="{y1z - y0z}" fill="{shade(color, -0.35)}"/>'
                     f'<line x1="500" y1="{y0z}" x2="500" y2="{y1z}" stroke="{hardware}" stroke-width="3.4" stroke-dasharray="1.8 1.8"/>'
                     f'<rect x="493" y="{y0z + 4}" width="14" height="26" rx="2" fill="{shade(hardware, -0.12)}"/>')
    if "cords" in g and cords:
        for xa, ya, xb, yb in g["cords"]:
            inner.append(f'<ellipse cx="{xa}" cy="{ya}" rx="5.5" ry="5.5" fill="{hardware}" stroke="{shade(hardware, -0.3)}" stroke-width="1.2"/>'
                         f'<path d="M{xa} {ya}C{xa - 2} {ya + 60} {xb + 4} {yb - 80} {xb} {yb}" stroke="{shade(color, 0.1)}" '
                         f'stroke-width="8" fill="none" stroke-linecap="round" filter="url(#{pid}met)"/>'
                         f'<rect x="{xb - 4.5}" y="{yb - 2}" width="9" height="36" rx="2" fill="{hardware}"/>'
                         f'<rect x="{xb - 4.5}" y="{yb - 2}" width="3" height="36" fill="#fff" opacity=".35"/>')
    out.append(f'<g transform="{T}">{"".join(inner)}</g>')
    # impressions (hors déformation, avec le grain du tissu)
    import artwork as A
    for i, a in enumerate(arts):
        X, Y = M(a["x"], a["y"])
        placed = A.place(a["art"], X, Y, a["w"] * sc, a.get("anchor", "tc"))
        eff = a.get("fx", "print")
        if eff == "print":
            defs.append(fx.print_ink(f"{pid}pr{i}", seed=5 + i, wear=a.get("wear", 0.08)))
            out.append(f'<g opacity="{a.get("opacity", .93)}" filter="url(#{pid}pr{i})">{placed}</g>')
        elif eff == "puff":
            defs.append(fx.tonal_emboss(f"{pid}pr{i}", depth=2.4, light=0.3 if dark else .5, dark=0.6 if dark else .4))
            out.append(f'<g filter="url(#{pid}pr{i})">{placed}</g>')
        elif eff == "emb":
            defs.append(fx.embroidery(f"{pid}pr{i}", height=1.2, seed=7 + i, shadow=.5 if dark else .3))
            out.append(f'<g filter="url(#{pid}pr{i})">{placed}</g>')
        else:
            out.append(placed)
    if label and "label" in g:
        lx, ly = M(*g["label"])
        lw = 60 * sc
        out.append(f'<rect x="{lx - lw / 2:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="{lw * .34:.1f}" fill="{B.NERO}"/>'
                   f'{B.logo_g("wordmark-ricamo", lx, ly + lw * .17, width=lw * .76, fill=B.CREMA, anchor="cc")}')
    for i, lg in enumerate(logos):
        eff = lg.get("fx", "emb")
        if eff == "emb":
            defs.append(fx.embroidery(f"{pid}e{i}", height=lg.get("relief", 1.4), seed=i + 4, shadow=.5 if dark else .35))
        elif eff == "tonal":
            defs.append(fx.tonal_emboss(f"{pid}e{i}", depth=1.2, light=0.18 if dark else 0.45, dark=0.6 if dark else 0.35))
        elif eff == "print":
            defs.append(fx.print_ink(f"{pid}e{i}", seed=i + 3))
        X, Y = M(lg.get("x", 500), lg.get("y", 300))
        el = B.logo_g(lg["lk"], X, Y, width=lg["w"] * sc if lg.get("w") else None,
                      height=lg["h"] * sc if lg.get("h") else None, fill=lg["fill"], anchor=lg.get("anchor", "cc"))
        out.append(f'<g filter="url(#{pid}e{i})">{el}</g>')
    if "zip" in g:
        X, Y = M(500, g["zip"][0] + 30)
        kd, kb = B.key()
        out.append(f'<g transform="translate({X:.1f} {Y:.1f}) rotate(90) scale({0.2 * sc:.4f})" fill="{hardware}" '
                   f'filter="url(#{pid}met)"><path d="{kd}"/></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs>{"".join(defs)}</defs>{"".join(out)}</svg>')
