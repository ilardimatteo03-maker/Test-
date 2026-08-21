#!/bin/bash
# Double-clic sur ce fichier pour lancer ADSPY (macOS) —
# sous Linux : ./adspy/DEMARRER-MAC-LINUX.command depuis un terminal.

cd "$(dirname "$0")/.." || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js n'est pas installé sur cet ordinateur."
  echo ""
  echo "  1. Va sur https://nodejs.org"
  echo "  2. Télécharge la version LTS et installe-la"
  echo "  3. Relance ce fichier"
  echo ""
  read -r -p "  Appuie sur Entrée pour fermer."
  exit 1
fi

echo ""
echo "  Démarrage d'ADSPY… la page s'ouvre toute seule."
echo "  Laisse cette fenêtre ouverte tant que tu utilises l'outil."
echo "  Ctrl+C pour arrêter."
echo ""

# Ouvre le navigateur une fois le serveur prêt.
URL="http://localhost:${ADSPY_PORT:-4177}"
( sleep 2
  open "$URL" 2>/dev/null \
    || xdg-open "$URL" 2>/dev/null \
    || echo "  Ouvre $URL dans ton navigateur." ) &

node adspy/server.js
