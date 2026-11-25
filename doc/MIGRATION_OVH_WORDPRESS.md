# VECTOBOL — Suivi de migration LocalWP vers OVH

**Document de suivi vivant** — à compléter au fur et à mesure des modifications réalisées sur LocalWP.

- Dépôt : `vectobol/vectobol-site`
- Branche de travail : `species-sheet-refactor`
- Environnement de préparation : LocalWP (`vectobol-local.local`)
- Environnement de production : OVH (`vectobol.ecosciences.fr`)
- Dernière mise à jour : 25 novembre 2026

> **Règle de sécurité :** aucune modification de production sur OVH sans validation explicite. Ne pas remplacer la base de données OVH par celle de LocalWP. La migration doit être sélective et contrôlée.

## 1. Pages WordPress modifiées ou créées sur LocalWP

Cette liste recense les contenus WordPress à transférer ou à reproduire sur OVH. Les pages ne sont pas transférées par Git : leur contenu et leurs blocs sont enregistrés dans la base de données WordPress.

| Page / contenu | Langue | Travail effectué sur LocalWP | État local | À faire sur OVH |
|---|---|---|---|---|
| Contact — nouvelle version | FR | Nouvelle page Gutenberg : introduction, formulaire Forminator, coordonnées du LEMUMSS et carte Leaflet. Classe CSS `vb-contact-form` et groupe `vb-contact-details`. | Testée et fonctionnelle | Transférer/recréer sélectivement, puis vérifier le formulaire, la carte et la mise en page |
| Contact — nouvelle version | EN | Nouvelle page Gutenberg, structure équivalente en anglais et formulaire dédié. | Testée et fonctionnelle | Transférer/recréer sélectivement, puis vérifier le formulaire, la carte et la mise en page |
| Contact — nouvelle version | ES | Nouvelle page Gutenberg, structure équivalente en espagnol et formulaire dédié. | Testée et fonctionnelle | Transférer/recréer sélectivement, puis vérifier le formulaire, la carte et la mise en page |
| Fiche espèce générique | FR | Affectation du modèle WordPress « VECTOBOL – Fiche espèce » ; affichage dynamique selon le paramètre `?species=`. | Testée et fonctionnelle | Vérifier le modèle et les réglages de la page sur OVH |
| Fiche espèce générique | EN | Affectation du modèle WordPress « VECTOBOL – Fiche espèce ». | Testée et fonctionnelle | Vérifier le modèle et les réglages de la page sur OVH |
| Fiche espèce générique | ES | Affectation du modèle WordPress « VECTOBOL – Fiche espèce ». | Testée et fonctionnelle | Vérifier le modèle et les réglages de la page sur OVH |

### Informations à vérifier pour les pages Contact

- Page FR locale : titre « Contact – nouvelle version », ID local connu : `15338`, URL locale : `/fr/contact-fr/`.
- Les pages EN et ES ont également été créées ; leurs identifiants et slugs locaux restent à relever si nécessaire.
- Les trois nouvelles pages ont été reliées entre elles avec Polylang.
- Les trois menus (FR, EN, ES) ont été modifiés pour pointer vers les nouvelles pages.
- Forminator : identifiants locaux utilisés dans les shortcodes :
  - FR : `[forminator_form id="6973"]`
  - EN : `[forminator_form id="7013"]`
  - ES : `[forminator_form id="7018"]`
- **Avant transfert :** vérifier que ces formulaires existent sur OVH et relever leurs identifiants de production. Ne pas supposer que les identifiants sont identiques entre les deux installations.
- Carte Leaflet : conteneur `#map`, coordonnées du laboratoire `-17.39379, -66.14485`, fond OpenStreetMap, marqueur LEMUMSS-VECTOBOL.
- Les trois pages ont été testées localement : formulaires, cartes et changement de langue fonctionnent.

## 2. Pages anciennes remplacées

| Ancienne page | Langue | Action locale | Action prévue sur OVH |
|---|---|---|---|
| Contact construit avec Elementor | FR | Mise à la corbeille (pas de suppression définitive) | Mettre l'ancienne page à la corbeille après validation de la nouvelle |
| Contact construit avec Elementor | EN | Mise à la corbeille (pas de suppression définitive) | Mettre l'ancienne page à la corbeille après validation de la nouvelle |
| Contact construit avec Elementor | ES | Mise à la corbeille (pas de suppression définitive) | Mettre l'ancienne page à la corbeille après validation de la nouvelle |

Conserver les anciennes pages dans la corbeille jusqu'à validation complète de la migration sur OVH. Ne pas vider définitivement la corbeille avant cette validation.

## 3. Modifications WordPress hors contenu des pages

Ces éléments ne sont pas nécessairement contenus dans les fichiers du dépôt Git. Ils doivent être recensés et traités séparément.

| Élément | Modification locale | État / précaution pour OVH |
|---|---|---|
| Polylang | Association des trois nouvelles pages Contact FR/EN/ES | Recréer ou vérifier les associations sur OVH |
| Menus WordPress | Les trois menus (FR, EN, ES) pointent vers les nouvelles pages Contact | Reproduire les changements de liens et vérifier chaque menu |
| Sommaire automatique (Code Snippet) | Exclusion de la nouvelle page Contact FR, ID local `15338`, dans la liste des pages exclues | Adapter la règle à la page source et à ses traductions sur OVH ; **ne pas recopier aveuglément l'ID local** |
| Complianz | Sur LocalWP, désactivation des options « Placeholder » et « État » pour OpenStreetMaps afin de tester l'affichage des cartes | Décision à réexaminer sur OVH ; vérifier les autres services et les obligations de consentement avant toute modification |
| Forminator | Trois formulaires de contact distincts FR/EN/ES utilisés par les pages | Vérifier formulaires, identifiants, notifications et destinataires sur OVH |

## 4. Fichiers du dépôt à déployer séparément

Les fichiers suivis par Git ne sont pas à recréer dans l'éditeur WordPress. Ils devront être déployés depuis la branche validée, après contrôle des différences.

Éléments déjà concernés par les travaux décrits dans le suivi :

- Thème enfant `vectobol-child` :
  - `css/contact.css` — encadrement du formulaire et présentation des coordonnées/carte ;
  - `css/sidebar.css` — styles de la barre latérale et de la fenêtre newsletter ;
  - `css/species-sheet.css` — présentation des fiches espèces et galerie ;
  - `js/species/` — scripts des fiches espèces (chargement, galerie, carte, libellés, etc.) ;
  - `page-templates/template-species-sheet.php` — modèle de fiche espèce ;
  - `functions.php` — chargement conditionnel des CSS et scripts.
- Plugin VECTOBOL : vérifier les éventuelles évolutions de l'API des fiches espèces et les déployer séparément si elles sont présentes dans la branche de travail correspondante.

**Important :** avant déploiement, comparer les fichiers locaux, la branche GitHub et les fichiers présents sur OVH. Ne transférer que les fichiers validés et nécessaires.

## 5. Procédure de migration prévue

1. Terminer et tester les modifications sur LocalWP.
2. Mettre à jour ce document à chaque page, menu, réglage ou fonctionnalité modifié.
3. Vérifier les commits et les fichiers concernés dans GitHub Desktop ; ne pas déployer une modification non validée.
4. Sauvegarder les fichiers et la base de données du site OVH avant intervention.
5. Déployer les fichiers du thème enfant et du plugin de façon sélective.
6. Transférer les contenus WordPress concernés de façon sélective (pages et blocs), ou les reproduire à partir de l'export préparé ; ne pas importer toute la base locale.
7. Reconstituer/vérifier les associations Polylang, les menus, les shortcodes et les réglages de plugins.
8. Tester sur OVH, dans les trois langues et sur ordinateur/mobile.
9. Ne retirer définitivement les anciennes pages et éléments qu'après validation complète.

## 6. Liste de contrôle avant validation de la migration

- [ ] Sauvegarde OVH (base de données et fichiers) réalisée.
- [ ] Fichiers du thème enfant comparés et déployés.
- [ ] Fichiers du plugin comparés et déployés si nécessaire.
- [ ] Pages Contact FR, EN et ES transférées.
- [ ] Associations Polylang des pages Contact vérifiées.
- [ ] Menus FR, EN et ES vérifiés.
- [ ] Formulaires Forminator de production vérifiés (IDs, notifications, destinataires).
- [ ] Carte Leaflet de la page Contact vérifiée dans les trois langues.
- [ ] Sommaire automatique vérifié ; exclusions adaptées aux IDs OVH.
- [ ] Réglages Complianz/OpenStreetMap réexaminés.
- [ ] Fiches espèces FR, EN et ES vérifiées.
- [ ] Affichage ordinateur et mobile vérifié.
- [ ] Anciennes pages Elementor conservées jusqu'à validation, puis mises à la corbeille si approprié.
- [ ] Validation explicite avant toute suppression définitive.

## 7. Journal des prochaines modifications

Ajouter ici chaque nouvelle page ou modification WordPress réalisée sur LocalWP, avec sa langue, son URL/ID local si connu, les éléments associés (Polylang, menu, formulaire, shortcode, plugin) et les vérifications nécessaires sur OVH.

| Date | Page / élément | Langue | Modification locale | Vérification / action requise sur OVH |
|---|---|---|---|---|
| 2026-11-25 | Contact | FR/EN/ES | Trois pages Gutenberg créées et testées ; menus et associations Polylang mis à jour ; anciennes pages Elementor mises à la corbeille | Transfert sélectif et contrôles décrits ci-dessus |
