"""Effets SVG pour les maquettes : textures de tissu, broderie, impression, ombres.

Chaque fonction renvoie des définitions SVG (<filter>, <pattern>) identifiées par `fid`.
"""


def fabric(fid, kind="jersey", seed=2, strength=1.0):
    """Texture de tissu à appliquer en multiplication sur une forme déjà colorée.
    kind : jersey, molleton, pique, twill, maille, daim, nylon, laine."""
    s = strength
    if kind == "jersey":
        turb = '<feTurbulence type="fractalNoise" baseFrequency="1.1 0.55" numOctaves="2" seed="{seed}"/>'
        amp, off = 0.16 * s, 0.92
    elif kind == "molleton":
        turb = '<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="{seed}"/>'
        amp, off = 0.20 * s, 0.9
    elif kind == "pique":
        turb = '<feTurbulence type="turbulence" baseFrequency="0.9 0.9" numOctaves="1" seed="{seed}"/>'
        amp, off = 0.22 * s, 0.88
    elif kind == "twill":
        turb = '<feTurbulence type="fractalNoise" baseFrequency="1.4 0.12" numOctaves="2" seed="{seed}"/>'
        amp, off = 0.2 * s, 0.9
    elif kind == "maille":
        turb = '<feTurbulence type="fractalNoise" baseFrequency="0.35 1.4" numOctaves="2" seed="{seed}"/>'
        amp, off = 0.24 * s, 0.88
    elif kind == "daim":
        turb = '<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" seed="{seed}"/>'
        amp, off = 0.26 * s, 0.86
    elif kind == "nylon":
        turb = '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.6" numOctaves="2" seed="{seed}"/>'
        amp, off = 0.12 * s, 0.94
    else:  # laine
        turb = '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="{seed}"/>'
        amp, off = 0.22 * s, 0.88
    turb = turb.format(seed=seed)
    # bruit gris centré autour de `off`, multiplié sur la couleur, limité à la forme
    return (f'<filter id="{fid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
            f'{turb}<feColorMatrix type="matrix" values="0 0 0 {amp:.3f} {off - amp / 2:.3f}  0 0 0 {amp:.3f} {off - amp / 2:.3f}  '
            f'0 0 0 {amp:.3f} {off - amp / 2:.3f}  0 0 0 0 1" result="n"/>'
            f'<feBlend in="SourceGraphic" in2="n" mode="multiply" result="m"/>'
            f'<feComposite in="m" in2="SourceAlpha" operator="in"/></filter>')


def embroidery(fid, height=2.2, shine=0.55, seed=5, direction="h", shadow=0.45):
    """Broderie au point plat : stries de fil, relief, brillance et ombre portée.
    S'applique à un groupe rempli de la couleur du fil."""
    bf = "0.035 1.6" if direction == "h" else "1.6 0.035"
    return (f'<filter id="{fid}" x="-8%" y="-20%" width="116%" height="140%" color-interpolation-filters="sRGB">'
            f'<feTurbulence type="fractalNoise" baseFrequency="{bf}" numOctaves="2" seed="{seed}" result="t"/>'
            f'<feColorMatrix in="t" type="matrix" values="0 0 0 0.42 0.74  0 0 0 0.42 0.74  0 0 0 0.42 0.74  0 0 0 0 1" result="tg"/>'
            f'<feBlend in="SourceGraphic" in2="tg" mode="multiply" result="thread"/>'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{height * 0.55:.2f}" result="b"/>'
            f'<feSpecularLighting in="b" surfaceScale="{height:.2f}" specularConstant="{shine:.2f}" specularExponent="14" '
            f'lighting-color="#ffffff" result="sp"><feDistantLight azimuth="235" elevation="38"/></feSpecularLighting>'
            f'<feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>'
            f'<feDiffuseLighting in="b" surfaceScale="{height:.2f}" diffuseConstant="1.05" lighting-color="#ffffff" result="df">'
            f'<feDistantLight azimuth="235" elevation="50"/></feDiffuseLighting>'
            f'<feBlend in="thread" in2="df" mode="multiply" result="lit"/>'
            f'<feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/>'
            f'<feComposite in="lit2" in2="spi" operator="arithmetic" k2="1" k3="0.6" result="emb"/>'
            f'<feComposite in="emb" in2="SourceAlpha" operator="in" result="emb2"/>'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{height * 0.45:.2f}" result="sb"/>'
            f'<feOffset in="sb" dx="0.4" dy="{height * 0.5:.2f}" result="so"/>'
            f'<feFlood flood-color="#000" flood-opacity="{shadow}"/><feComposite in2="so" operator="in" result="sh"/>'
            f'<feMerge><feMergeNode in="sh"/><feMergeNode in="emb2"/></feMerge></filter>')


def tonal_emboss(fid, depth=1.4, light=0.35, dark=0.35):
    """Relief ton sur ton (gaufrage, broderie ton sur ton vue de loin, dorure à froid)."""
    return (f'<filter id="{fid}" x="-10%" y="-20%" width="120%" height="140%" color-interpolation-filters="sRGB">'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{depth * 0.6:.2f}" result="b"/>'
            f'<feOffset in="b" dx="-{depth * 0.5:.2f}" dy="-{depth * 0.5:.2f}" result="hi"/>'
            f'<feOffset in="b" dx="{depth * 0.6:.2f}" dy="{depth * 0.7:.2f}" result="lo"/>'
            f'<feFlood flood-color="#fff" flood-opacity="{light}"/><feComposite in2="hi" operator="in" result="h1"/>'
            f'<feComposite in="h1" in2="SourceAlpha" operator="out" result="h2"/>'
            f'<feFlood flood-color="#000" flood-opacity="{dark}"/><feComposite in2="lo" operator="in" result="l1"/>'
            f'<feComposite in="l1" in2="SourceAlpha" operator="out" result="l2"/>'
            f'<feMerge><feMergeNode in="l2"/><feMergeNode in="h2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def print_ink(fid, seed=8, wear=0.12):
    """Sérigraphie : encre légèrement texturée, qui prend le grain du tissu."""
    return (f'<filter id="{fid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
            f'<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="{seed}" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -{wear * 6:.2f} {1 + wear:.2f}" result="mask"/>'
            f'<feComposite in="SourceGraphic" in2="mask" operator="in"/></filter>')


def soft_shadow(fid, blur=18, dy=14, opacity=0.28, color="#2a2118"):
    return (f'<filter id="{fid}" x="-30%" y="-30%" width="160%" height="170%">'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dy="{dy}" result="o"/>'
            f'<feFlood flood-color="{color}" flood-opacity="{opacity}"/><feComposite in2="o" operator="in"/>'
            f'<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def blur(fid, sd=6):
    return f'<filter id="{fid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{sd}"/></filter>'


def grain(fid, opacity=0.08, freq=0.85, seed=11):
    """Grain photographique (à poser sur toute l'image, en multiplication)."""
    return (f'<filter id="{fid}" x="0" y="0" width="100%" height="100%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="2" seed="{seed}"/>'
            f'<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 {opacity * 4:.3f} -{opacity:.3f}"/>'
            f'<feComposite in2="SourceGraphic" operator="in"/></filter>')
