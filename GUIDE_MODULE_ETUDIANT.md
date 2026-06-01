# Guide complet : Module 5 (Espace Étudiant) — INSATConnect

Ce guide regroupe toute la documentation nécessaire pour comprendre le travail du **Membre 1**, les instructions pour le tester, le guide de démarrage destiné au **Membre 2**, ainsi que des éclaircissements sur la méthodologie de travail collaboratif sous Git.

---

## 📖 Partie 1 : Travail réalisé (Membre 1 - Consultation)

Le **Membre 1** a mis en place toute l'infrastructure permettant aux étudiants de consulter les ressources pédagogiques de manière dynamique et ciblée selon leur promotion (ex: `GL3`, `MPI`, `IIA`).

### 🛠️ Architecture technique
1. **Base de données (SQLite)** : 
   - Ajout de 3 entités TypeORM : `Document` (règlements, circulaires, formulaires), `Timetable` (emplois du temps) et `Grade` (relevés de notes).
   - Modification de l'entité existante `AcademicDate` pour la lier à GraphQL.
   - Système de **seeding automatique** au démarrage du serveur (`calendar-server/src/resources/resources.service.ts`) pour injecter des jeux de données d'exemple réalistes si la base est vide.
2. **Couche API (GraphQL)** :
   - Mise en place d'un serveur Apollo GraphQL de type *Code-First*.
   - Création de résolveurs pour lister les ressources de façon globale (`documents`) ou filtrée par classe (`timetables(targetYear)`, `grades(targetYear)`).
   - Création de résolveurs unitaires (`document(id)`, `timetable(id)`, `grade(id)`) pour le **chargement à la demande**.
3. **Frontend (Next.js)** :
   - Création d'un utilitaire léger de requêtage GraphQL (`frontend/src/utils/graphql.ts`) utilisant `fetch`.
   - Connexion dynamique du tableau de bord étudiant (`frontend/src/app/dashboard/student/page.tsx`).
   - Implémentation du **Lazy-Loading** : au chargement initial du flux d'actualités, seuls les titres et dates sont récupérés. Les détails plus lourds (contenu complet des circulaires, grilles horaires, tableaux de notes) ne sont chargés depuis le serveur que lorsque l'étudiant clique sur **"Voir les détails"** de la publication.

---

## 🧪 Comment tester le travail complet ?

### Étape 1 : Démarrer le Backend
Dans le dossier `calendar-server/` :
1. Installez les dépendances si nécessaire : `npm install`
2. Lancez le serveur de développement : `npm run start:dev`
3. Vérifiez la console : vous devez voir le message `Calendar Server running on port 3001` ainsi que la confirmation du seeding de la base de données.
4. Ouvrez le **Playground GraphQL** dans votre navigateur à l'adresse : `http://localhost:3001/graphql`. Vous pouvez tester les requêtes manuellement, par exemple :
   ```graphql
   query {
     documents {
       id
       title
       publishedAt
     }
   }
   ```

### Étape 2 : Démarrer le Frontend
Dans le dossier `frontend/` :
1. Lancez le serveur Next.js en mode dev : `npm run dev`
2. Ouvrez votre navigateur sur `http://localhost:3000/login` et connectez-vous avec un compte étudiant.
3. **Vérification du filtrage par filière** :
   - Dans la barre latérale gauche, modifiez la promotion dans le sélecteur (passez de `GL3` à `MPI` ou `IIA`).
   - Observez le flux d'actualités se mettre à jour instantanément pour afficher uniquement les notes et emplois du temps associés à la filière choisie.
4. **Vérification du Lazy Loading** :
   - Cliquez sur le bouton **"Voir les détails"** d'une note ou d'un planning.
   - Un indicateur de chargement s'affiche brièvement pendant que la requête GraphQL spécifique récupère les données de détail, puis le tableau des notes ou la grille de l'emploi du temps apparaît à l'écran.
5. **Vérification du Calendrier** :
   - Allez sur l'onglet **"Calendar"**. Les jalons administratifs clés (remise des notes, délibérations) sont récupérés en temps réel depuis la base du serveur calendrier et dessinés sur le calendrier dynamique.

---

## 🤝 Partie 2 : Guide de démarrage pour le Membre 2

Le **Membre 2** doit maintenant enrichir l'espace étudiant en ajoutant les aspects interactifs et le système de notifications du module.

### 🎯 Tâches suggérées pour le Membre 2 :
1. **Système de Dépôt de Devoirs interactif (Rooms)** :
   - Actuellement, l'onglet "Rooms" utilise un formulaire de dépôt de devoirs simulé.
   - Le Membre 2 peut concevoir un système de dépôt réel (ou mocké plus finement côté serveur) en créant une entité `HomeworkSubmission` dans `calendar-server` et des mutations GraphQL pour permettre à l'étudiant d'enregistrer et de valider ses rendus de TP/projets.
2. **Messagerie Instantanée administrative** :
   - Connecter l'onglet de chat de scolarité à un vrai système de persistance (ou simuler un échange bidirectionnel réactif avec le personnel administratif via des WebSockets ou des appels GraphQL).
3. **Hub de Notifications SSE (Server-Sent Events)** :
   - Le Membre 2 doit s'occuper de la réception des rappels de calendrier en temps réel.
   - Dans le backend, créez un contrôleur SSE qui diffuse des événements lorsque le serveur calendrier met à jour une date importante (ex: "La délibération finale a été avancée au 28 Juin").
   - Côté frontend, implémentez un écouteur `EventSource` pour afficher des notifications pop-up *toast* en direct à l'étudiant sans qu'il ait besoin de rafraîchir sa page.

---

## 🛠️ Git & Travail en Équipe : Est-ce normal de travailler sur la branche `Etudiant` alors que les autres n'ont pas fini ?

**Oui, c'est tout à fait normal et c'est même la règle d'or du développement professionnel en équipe !**

Voici pourquoi et comment cela fonctionne :

1. **Isolation et Indépendance (Le principe des Branches)** :
   - Votre branche `Etudiant` agit comme un **bac à sable sécurisé**. Tout ce que vous écrivez et modifiez n'impacte pas le code de vos camarades qui travaillent sur l'authentification ou les espaces Enseignants/Admin.
   - De même, si le code d'un autre groupe comporte temporairement des bugs, cela ne bloquera pas votre propre avancement.
2. **Le flux de travail recommandé (Git Workflow)** :
   - Vous travaillez et commitez sur la branche `Etudiant`.
   - Une fois que votre binôme (Membre 1 & Membre 2) a validé le module 5, vous effectuez un **Push** de cette branche sur le dépôt distant (GitHub/GitLab).
   - Vous créez une **Pull Request (PR)** ou **Merge Request (MR)** de la branche `Etudiant` vers la branche principale (`main`).
   - Vos camarades des autres modules feront de même avec leurs branches respectives (ex: `branch-enseignant`, `branch-auth`).
3. **Comment gérer les intégrations à la fin ?** :
   - Si les autres équipes modifient des fichiers communs (comme `app.module.ts`), Git signalera d'éventuels conflits de fusion lors du merge final.
   - Ces conflits se résolvent très facilement et proprement à la fin en fusionnant la branche `main` mise à jour dans votre branche `Etudiant` avant le merge définitif.

**Conclusion** : Continuez à pousser vos modifications sur la branche `Etudiant`. C'est le moyen le plus sûr de préserver votre travail sans perturber le reste de votre classe !
