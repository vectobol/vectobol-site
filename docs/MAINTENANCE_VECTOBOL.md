# VECTOBOL — Suivi de maintenance et des mises à niveau

**Document de suivi vivant**  
**Dernière mise à jour : 25 novembre 2026**  
**Dépôt :** `vectobol-site`  
**Branche de travail :** `species-sheet-refactor`

Ce document centralise les composants techniques de VECTOBOL à surveiller, les incidents de maintenance connus, les mises à niveau à évaluer et les vérifications périodiques. Il ne constitue pas une autorisation de mise à jour : toute intervention sur le site de production OVH doit être décidée et validée séparément.

## 1. Principes de maintenance

- Privilégier la stabilité, la reproductibilité et la continuité du service scientifique.
- Ne pas utiliser de dépendances externes dont la version peut changer silencieusement.
- Fixer explicitement les versions des bibliothèques JavaScript et CSS chargées depuis un CDN.
- Tester les mises à jour sur LocalWP avant toute intervention sur OVH.
- Conserver un point de retour arrière : fichiers précédents, commit Git et, pour les changements WordPress, sauvegarde de la base de données lorsque nécessaire.
- Éviter les mises à jour simultanées de plusieurs composants : procéder par étapes afin de pouvoir identifier l'origine d'une régression.
- Vérifier les pages FR, EN et ES après toute modification transversale.

## 2. Incident identifié : Leaflet / MarkerCluster

### Symptôme observé le 25 novembre 2026

La carte des occurrences a cessé de s'initialiser alors qu'elle fonctionnait quelques minutes auparavant. La console affichait notamment :

```text
Uncaught SyntaxError: Cannot use import statement outside a module
TypeError: L.markerClusterGroup is not a function
```

Le test effectué dans le navigateur a montré que l'URL non versionnée :

```text
https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js
```

était résolue vers :

```text
https://unpkg.com/leaflet.markercluster@2.0.0/dist/leaflet.markercluster.js
```

Le fichier reçu commence par un import ES module :

```javascript
import*as e from"leaflet";
```

Or, dans le thème enfant, MarkerCluster est chargé comme un script classique via `wp_enqueue_script()`, et le code de la carte attend la fonction globale `L.markerClusterGroup()`. Le chargement échoue donc avant l'initialisation de la carte.

**Diagnostic :** incompatibilité entre le format du fichier MarkerCluster servi par le CDN et le mode de chargement utilisé par le site. L'URL CDN non versionnée est la cause technique directement mise en évidence. Le moment exact du changement de résolution CDN n'a pas été établi.

### Fichiers concernés

- `wp-content/themes/vectobol-child/functions.php` : déclarations des styles et scripts Leaflet / MarkerCluster.
- `wp-content/themes/vectobol-child/js/occurrences/map.js` : appel à `L.markerClusterGroup()` (en particulier autour de la ligne 183 au moment du diagnostic).

### Correction et validation sur LocalWP — 25 novembre 2026

Les versions CDN ont été fixées dans `wp-content/themes/vectobol-child/functions.php` :

- Leaflet **1.9.4** (CSS et JavaScript).
- Leaflet.markercluster **2.0.0-beta.2**, avec le fichier JavaScript global `leaflet.markercluster-global.js`.
- Feuille CSS `MarkerCluster.Default.css` de la même version.

Deux corrections successives ont été nécessaires :

1. Remplacement des URL non versionnées et du fichier JavaScript ES module par les URL versionnées et le bundle global. Commit Git : `9eb9f89a83deb72f7053b8d49f04f97adfaa1952`.
2. Correction de la dépendance WordPress du CSS MarkerCluster : la feuille de style dépend maintenant du handle CSS `leaflet`, et non du handle JavaScript `leaflet-markercluster`. Commit Git : `22460d657eb9fddec3ad79318cedf13a95c62e10`.

**Résultats vérifiés sur LocalWP :**

- `L.version` retourne `1.9.4`.
- `typeof L.markerClusterGroup` et `typeof L.MarkerClusterGroup` confirment la disponibilité de l'API MarkerCluster.
- La feuille `MarkerCluster.Default.css` est bien présente dans `document.styleSheets`.
- Les cercles de regroupement sont de nouveau visibles.
- La console ne signale plus d'erreur JavaScript liée à Leaflet / MarkerCluster.
- La carte affiche 890 marqueurs en mode cluster.

**État : incident d'affichage résolu et correction validée sur LocalWP.** La version MarkerCluster 2.0.0-beta.2 reste une version bêta : sa stabilité à long terme et sa compatibilité lors de futures mises à jour doivent être surveillées. Les tests détaillés sur mobile, dans les trois langues et sur les interactions de zoom / clic restent à effectuer dans le cadre des tests fonctionnels généraux.

Aucun déploiement sur OVH n'a été effectué.

## 3. Composants à surveiller

| Composant | Situation connue | Surveillance / action |
|---|---|---|
| WordPress | Site WordPress ; environnement LocalWP précédemment observé en 6.9.1 | Suivre les versions stables et vérifier les compatibilités avant mise à jour |
| PHP | LocalWP précédemment observé en PHP 8.3.27 ; version OVH à contrôler | Vérifier la version réellement utilisée en production et la compatibilité thème/extensions |
| Thème OceanWP | Thème utilisé sur le site | Suivre les mises à jour et tester les modèles de pages |
| Thème enfant `vectobol-child` | Contient les adaptations spécifiques VECTOBOL | Versionner toutes les modifications dans Git ; éviter les changements directs non tracés |
| Plugin VECTOBOL | Plugin spécifique, dépôt séparé `vectobol-plugin` | Suivre les évolutions du schéma SQL, des API REST et des interfaces d'administration |
| Leaflet | Version 1.9.4 fixée dans le thème enfant et testée sur LocalWP | Surveiller les évolutions de l'API ; réévaluer Leaflet 2.x uniquement lorsqu'une version stable sera disponible |
| Leaflet.markercluster | Version 2.0.0-beta.2 fixée ; bundle global et CSS testés sur LocalWP | Version bêta : surveiller les régressions et réévaluer une version stable ; tester avant déploiement |
| Polylang | Gestion des versions FR / EN / ES | Vérifier les associations de pages, les slugs et les menus après mise à jour |
| Yoast SEO | Extension SEO utilisée | Surveiller les mises à jour et contrôler les métadonnées / sitemaps |
| Complianz | Gestion du consentement | Vérifier le bandeau, les catégories de cookies et le blocage des scripts concernés |
| Wordfence | Sécurité du site | Suivre les mises à jour, alertes et règles de pare-feu |
| Matomo | Version 5.8.x précédemment signalée | Suivre les mises à jour et contrôler la collecte statistique après changement |
| Forminator | Formulaire de contact | Tester l'envoi, la réception et la protection anti-spam |
| Elementor | Encore présent sur certaines pages pendant la migration vers Gutenberg | Identifier les pages dépendantes avant toute désactivation ou suppression |

Les versions indiquées comme « précédemment observées » sont des repères historiques, pas un relevé garanti de l'état actuel. Faire un inventaire des versions réellement installées sur OVH avant de planifier une mise à niveau.

## 4. Contrôles périodiques

### À chaque mise à jour technique

- [ ] Noter les versions avant et après mise à jour.
- [ ] Lire les notes de version et repérer les changements incompatibles.
- [ ] Vérifier les dépendances directes et indirectes.
- [ ] Tester d'abord sur LocalWP.
- [ ] Contrôler les erreurs JavaScript et PHP.
- [ ] Tester les pages principales et les fonctions interactives.
- [ ] Vérifier les trois langues.
- [ ] Conserver le commit Git et les éléments nécessaires au retour arrière.

### Contrôle trimestriel conseillé

- [ ] Vérifier les mises à jour WordPress, PHP, thème, extensions et plugin VECTOBOL.
- [ ] Vérifier les versions des bibliothèques externes chargées par CDN.
- [ ] Rechercher les URL non versionnées de type `https://unpkg.com/nom-paquet/dist/...` ou équivalent.
- [ ] Vérifier les alertes de sécurité et les extensions abandonnées.
- [ ] Vérifier les sauvegardes du site et de la base de données, ainsi que la possibilité de restauration.
- [ ] Vérifier le fonctionnement du formulaire de contact.
- [ ] Vérifier les cartes, les filtres et les fiches espèces.
- [ ] Vérifier les pages FR / EN / ES et les liens entre langues.

### Contrôle annuel conseillé

- [ ] Réévaluer la stratégie de versions PHP et WordPress.
- [ ] Réévaluer Leaflet et ses extensions, notamment l'opportunité d'une migration vers Leaflet 2.x lorsqu'une version stable et l'écosystème de plugins seront suffisamment mûrs.
- [ ] Examiner les extensions WordPress peu utilisées ou devenues inutiles.
- [ ] Vérifier les performances, l'accessibilité et la compatibilité des navigateurs.
- [ ] Réviser la procédure de sauvegarde, de restauration et de déploiement OVH.

## 5. Tests fonctionnels prioritaires pour VECTOBOL

Après toute mise à jour touchant WordPress, le thème, le plugin ou les bibliothèques cartographiques :

1. **Carte des occurrences**
   - Chargement sans erreur console.
   - Affichage du nombre attendu de points.
   - Regroupement des marqueurs et comportement au zoom.
   - Ouverture correcte des fenêtres d'information.
   - Fonctionnement des filtres géographiques et taxonomiques, seuls et combinés.

2. **Fiches espèces**
   - Recherche et navigation entre espèces.
   - Affichage des médias associés, y compris les cartes historiques dans la galerie.
   - Vérification des liens et des contenus multilingues.

3. **Géographie et données**
   - Cohérence des niveaux administratifs.
   - Fonctionnement des données et des API du plugin VECTOBOL.
   - Absence de modification involontaire des données sources REDCap.

4. **Pages institutionnelles**
   - Contact et formulaire Forminator.
   - Carte de localisation du LEMUMSS.
   - Menus, pied de page et sélecteur de langue.

## 6. Procédure de mise à niveau et de retour arrière

1. Identifier précisément le composant et la version à modifier.
2. Consulter les notes de version et les incompatibilités connues.
3. Vérifier le code concerné et les dépendances.
4. Enregistrer un point de référence Git avant modification.
5. Faire une seule famille de changements à la fois.
6. Tester sur LocalWP avec les scénarios de la section 5.
7. Documenter le résultat : validé, à corriger ou abandonné.
8. Après accord explicite, planifier le déploiement OVH.
9. Vérifier le site en production et conserver la possibilité de revenir à la version précédente.

## 7. Journal des décisions

| Date | Sujet | Décision / état |
|---|---|---|
| 25-11-2026 | Incident MarkerCluster | Cause technique identifiée : le CDN non versionné sert MarkerCluster 2.0.0 au format ES module, alors que le site le charge comme script classique |
| 25-11-2026 | Évolution Leaflet | Pas d'obligation de migrer immédiatement vers Leaflet 2.x ; privilégier une migration seulement après stabilisation de la version et validation de l'écosystème |
| 25-11-2026 | Test MarkerCluster 2 | Validé sur LocalWP avec Leaflet 1.9.4, MarkerCluster 2.0.0-beta.2 global et CSS par défaut ; cercles visibles, pas d'erreur console liée à la carte |
| 25-11-2026 | Dépendance CSS MarkerCluster | Correction du handle de dépendance WordPress : le CSS dépend de `leaflet`, pas du script `leaflet-markercluster` |
| 25-11-2026 | Collections sans coordonnées | 914 collections chargées ; 890 ont des coordonnées valides et sont cartographiées ; 24 ont latitude et longitude nulles et ne sont donc pas affichées. L'utilisateur considère ces absences cohérentes avec ses souvenirs des collectes. Non vérifié directement dans REDCap, faute d'accès au projet au moment du contrôle. Aucune donnée modifiée.

## 8. Informations restant à inventorier

- [ ] Versions exactes de WordPress, PHP et MySQL/MariaDB sur OVH.
- [ ] Versions exactes de toutes les extensions WordPress en production.
- [ ] Version exacte du thème OceanWP et état des mises à jour du thème enfant.
- [ ] Version exacte du plugin VECTOBOL en production et correspondance avec le dépôt Git.
- [ ] Inventaire des bibliothèques JavaScript et CSS chargées depuis des CDN, avec leurs versions.
- [ ] Fréquence, rétention et procédure de restauration des sauvegardes OVH.
- [ ] Procédure actuelle de déploiement LocalWP vers OVH.

---

**Règle de gestion :** cette fiche est un registre de surveillance et de décisions. Elle doit être mise à jour lorsqu'un incident, une mise à niveau ou une modification importante de l'architecture est validé. Elle ne remplace ni les rapports techniques propres au plugin ni les procédures de déploiement.
