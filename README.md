
# 🚀 Guide de Mise en Ligne - CMC Oriental

Pour héberger cette application gratuitement sur **GitHub Pages**, suivez ces étapes.

## 1. Préparation Locale
Puisque le navigateur ne sait pas lire les fichiers `.tsx` directement, nous devons créer une version "Production".

1.  **Installez Node.js** sur votre ordinateur (si ce n'est pas déjà fait).
2.  Téléchargez tous les fichiers du projet dans un dossier.
3.  Ouvrez un terminal dans ce dossier et tapez :
    ```bash
    npm install
    ```
4.  Une fois terminé, tapez la commande de création du site :
    ```bash
    npm run build
    ```
5.  Un dossier nommé **`dist`** vient d'être créé. **C'est ce dossier qui contient le code "prêt à l'emploi" (HTML, JS, CSS) pour GitHub.**

## 2. Hébergement sur GitHub
1.  Créez un nouveau dépôt sur GitHub (ex: `cmc-oriental`).
2.  Envoyez tous vos fichiers (y compris le dossier `dist`) sur GitHub.
3.  Allez dans les **Settings** de votre dépôt > **Pages**.
4.  Sous "Build and deployment", choisissez :
    *   Source : **Deploy from a branch**
    *   Branch : **main** / Folder : **(root)**
    *   *Note : Si vous utilisez la commande `npm run deploy` incluse dans le package.json, elle créera automatiquement une branche `gh-pages` dédiée.*

## 3. Connexion à Google Sheets
N'oubliez pas que pour que les données soient réelles :
1.  Suivez le guide "Google Sheets" envoyé précédemment.
2.  Copiez l'URL de votre script Google Apps Script.
3.  Collez cette URL dans `services/api.ts` avant de faire le `npm run build`.

## 4. Structure des fichiers de Production
Si vous regardez dans le dossier `dist` après le build, vous verrez :
*   `index.html` : Le fichier d'entrée.
*   `assets/` : Un dossier contenant des fichiers `.js` et `.css` aux noms bizarres (ex: `index-D4fG2.js`). C'est votre code React compressé et optimisé.

**C'est cette structure que GitHub Pages va servir à vos étudiants.**
