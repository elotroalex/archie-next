---
title: authors
permalink: fr/authors.html
---


*archipelagos*, un journal de pratique numérique, publie des articles scientifiques, des projets numériques et des comptes rendus de projets numériques sur les Caraïbes. Nous publions un numéro par an et acceptons les soumissions tout au long de l\'année. 

*archipelagos* accepte les soumissions en anglais, espagnol et français. Nous publierons les essais acceptés dans leur langue d'origine avec des résumés traduits par notre équipe éditoriale. Nous invitons également les contributeurs à solliciter des services de traduction pour le texte intégral de leur contribution, que nous ferons corriger pour inclusion dans le journal.

Toutes les soumissions doivent être conformes au [Chicago Manual of Style](https://www.chicagomanualofstyle.org/home.html).

**Table des matières**{.toc-label}

[[toc]]

## Directives de soumission d'articles ou de critiques

*archipelagos* est fondé sur les principes de l'informatique minimale. Nous encourageons nos auteurs à nous aider à éviter les redondances et les flux de travail coûteux. Nous comprenons qu\'il peut être difficile de travailler avec des environnements et des formats inconnus, et ces directives sont un travail en cours pour tenter de trouver le juste équilibre entre les besoins de nos auteurs et notre mission. Vos idées sont les bienvenues.

### Notes générales

*archipelagos* utilise une combinaison de courrier électronique, Dropbox et Github pour gérer le flux de travail éditorial. Nous vous demandons de soumettre vos résumés et vos articles à archipelagosjournal@gmail.com. La plupart des échanges avec les auteurs se feront par courrier électronique via ce compte.

- Les soumissions d'articles individuels sont acceptées sur une base continue. Nous accueillons également les propositions de sections thématiques.

- Les articles soumis doivent comprendre une biographie (ou une biographie pour plusieurs auteurs) et un résumé. Veuillez les placer au bas de votre document. Les images peuvent être insérées directement dans votre document (voir [Images](#images) ci-dessous) — vous n'avez plus besoin de les envoyer séparément. La vidéo et le son doivent toujours être envoyés sous forme de liens vers un service de streaming de votre choix (voir [Vidéo, son et médias interactifs](#video-son-et-medias-interactifs) ci-dessous).

- Nous sommes un journal en libre accès. Si votre publication est acceptée, vous recevrez une copie de notre contrat d'auteur (voir la section [Accord d'auteur](#accord-dauteur) ci-dessous).

- Les articles sont examinés à double insu par notre équipe d\'évaluateurs externes. Les critiques de projets numériques sont revues par le comité de rédaction de *archipelagos*. Les auteurs du site sous évaluation reçoivent une notification écrite des éditeurs (accepté, accepté avec des révisions mineures, des révisions de fond requises ou rejeté) dans un délai de deux mois à compter de la soumission.

- La révision commence dès la réussite du processus d\'évaluation par les pairs. Les contributeurs peuvent s'attendre à recevoir un fichier mis à jour avec des suggestions et des requêtes de notre éditeur de copie. Le fichier révisé doit être renvoyé dans les deux semaines suivant sa réception. Ce sera la dernière occasion d\'apporter des modifications de fond au dossier. Les contributeurs recevront un PDF final et un lien vers le site proche du lancement pour les modifications mineures.

- Tout au long du processus d\'édition et de production, les contributeurs sont censés consulter les messages électroniques de toute requête de dernière minute émanant des éditeurs de *archipelagos*. Des réponses rapides aideront à maintenir les délais.

### Types de fichier

#### Les documents

Formats Office (.odt, .doc, .docx) : La plupart du travail de nettoyage que nous faisons à la main se résume à quelques habitudes de mise en forme. Si vous suivez les points ci-dessous, votre fichier se convertira presque automatiquement dans notre format de publication — merci de les lire attentivement.

1. **Utilisez les styles de titre intégrés de Word pour vos titres de section — jamais de texte en gras.** Appliquez « Titre 2 » (Heading 2, depuis le menu Styles) à votre première section, et « Titre 3 » (Heading 3) pour toute sous-section. Un texte en gras, souligné ou agrandi qui ne fait que *ressembler* à un titre est invisible pour notre outil de conversion — il n'a aucun moyen de le distinguer d'un mot en gras au milieu d'une phrase, et vos coupures de section seront perdues.

   ![Comparaison entre un texte en gras confondu avec un titre et un texte avec le style Titre 2 de Word correctement appliqué, afin que les coupures de section se convertissent automatiquement](/public/images/authors-guide/heading-styles-fr.png)

2. **Créez un hyperlien directement sur le texte du lien**, plutôt que d'épeler l'URL dans la phrase. Dans les notes de bas de page, faites les deux — épelez le lien *et* créez un hyperlien, par exemple : [http://example.com](http://example.com/).
3. **Incluez toujours `http://` ou `https://`** au début d'un lien, sinon il ne fonctionnera pas une fois converti.
4. **Désactivez les « guillemets intelligents ».** Utilisez des guillemets droits (`"` et `'`), pas les guillemets courbes que Word insère par défaut.
5. **Utilisez des traits d'union et des tirets simples** : un trait d'union (`-`) pour les mots composés, un tiret demi-cadratin (`--`) pour les plages, un tiret cadratin (`---`) pour une rupture dans la phrase.
6. **Ne mettez pas en page le document vous-même.** Les colonnes, les zones de texte et l'espacement placé manuellement ne survivront pas à la conversion. Si vous avez besoin d'une mise en page particulière, décrivez-la en prose simple, [entre crochets], et nous nous en chargerons.
7. **N'utilisez pas l'outil de tableaux ni les champs de données de Word.** Voir [Tableaux](#tableaux) ci-dessous pour les formats que nous acceptons.
8. **Insérez les images directement là où elles doivent apparaître, puis légendez-les avec une courte rubrique.** Voir [Images](#images) ci-dessous.

Markdown (.md): La publication est à bien des égards un jeu de conversion de fichiers. Notre site Web et nos fichiers PDF sont construits à partir des mêmes fichiers Markdown. Bien que nous acceptions volontiers les articles de format Office, nous encourageons nos auteurs à soumettre des fichiers texte (encodage UTF-8), écrits en utilisant la syntaxe Kramdown, une version de Markdown et enregistrés avec l'extension .md. Cela nous aidera à garder notre flux de travail léger et nos types de fichiers plus proches de la chaîne de production, ce qui contribuera à ce que nous continuons à contrôler tous les aspects de la production du journal. Pour en savoir plus sur nos choix d\'infrastructure et pour commencer à utiliser Markdown, prenez le temps de lire [« L\'auteur durable en texte clair avec Pandoc et Markdown »](https://programminghistorian.org/en/lessons/sustainable-authorship-in-plain-text-using-pandoc-and-markdown), de Dennis Tenen et Grant Whytoff. Nous apprécions sincèrement ceux qui acceptent le défi de changer leurs habitudes de travail et nous sommes offrons volontiers notre assistance pendant le processus. Vous trouverez de nombreux outils d'édition de Markdown disponibles, et la plupart des éditeurs de texte brut sont excellents pour la gestion de Markdown.

#### Images

Chez *archipelagos*, nous valorisons la richesse de notre culture visuelle. Si vous soumettez vos propres photographies, veuillez garder à l'esprit le cadrage, les harmonies de couleurs et d'autres éléments de conception. N'oubliez pas non plus que les fichiers image peuvent contenir des métadonnées intégrées que vous ne souhaitez peut-être pas publier. Les images sont soumises au processus de révision au même titre que votre texte.

Veuillez fournir des images nettes : une résolution minimale de 144ppi et une largeur d'au moins 800 pixels. Le JPG est notre format préféré ; le PNG convient pour les images avec transparence ou couleurs unies simples (par exemple, un logo).

**Insérez chaque image directement dans votre document, à l'endroit où elle doit apparaître** — de la même manière que vous ajouteriez normalement une image dans Word (Insertion > Images). Vous n'avez plus besoin de nous envoyer les images séparément dans un fichier zip ; notre outil de conversion les extrait automatiquement de votre document.

Juste en dessous de chaque image, tapez trois courtes lignes de texte brut — une ligne vide (Entrée) entre chacune, sans puces, et sans saut de ligne manuel au milieu d'une ligne :

~~~ text
caption="insert caption here"
alt="insert alt text here."
url="http://optional-url.com"
~~~

![Schéma d'une photo insérée suivie des champs caption, alt et url (facultatif), avec chaque champ expliqué : caption est affiché à tous les lecteurs, alt est lu par les lecteurs d'écran, url est un lien facultatif](/public/images/authors-guide/image-captioning-fr.png)

- **`caption`** est affiché à tous les lecteurs, imprimé sous l'image sur le site et dans le PDF.
- **`alt`** est lu à voix haute par les lecteurs d'écran. Décrivez ce qui se trouve *dans* l'image — ne répétez pas simplement la légende.
- **`url`** est facultatif. Ne l'incluez que si l'image elle-même doit renvoyer vers un lien, comme sa source originale.

`caption` et `alt` sont obligatoires ; `url` est facultatif. Si l'un ou l'autre doit inclure des guillemets, échappez-les avec une barre oblique inverse, par exemple : `caption="Elle a dit \"bonjour\" à la caméra"`.

*Vous n'avez pas encore inséré votre image ? Vous soumettez en Markdown ?* Si vous travaillez dans Word et n'avez pas encore ajouté la photo, ou si vous soumettez directement en Markdown (où il n'y a pas d'étape « insérer une image »), utilisez un espace réservé à la place : tapez la même rubrique que ci-dessus, mais ajoutez une ligne supplémentaire *au-dessus* des autres avec le nom de fichier de l'image, et envoyez-nous ce fichier séparément, avec votre document :

~~~ text
img="my-image.jpg"
caption="insert caption here"
alt="insert alt text here."
url="http://optional-url.com"
~~~

Si vous utilisez un espace réservé, veuillez nommer le fichier avec un ou deux mots-clés séparés par un trait d'union, sans espaces ni majuscules (par exemple, `harbor-sunset.jpg`) — cela devient une partie de l'adresse permanente du fichier sur notre site.

#### Vidéo, son et médias interactifs

Afin de rendre nos articles et nos critiques disponibles au format PDF, et afin d'accroître la longévité des fichiers Web, nous séparons les médias interactifs des textes et images statiques. Pour la vidéo et le son, nous encourageons nos auteurs à utiliser le service de streaming de leur choix. Tenez compte des questions de confidentialité, de stabilité et de droit d'auteur lors du choix de la vidéo en streaming. Si nécessaire, nous pouvons vous fournir un formulaire d'accord de publication numérique à utiliser avec les titulaires de droits.

Puisque *archipelagos* est né de la nécessité de soutenir les nouvelles formes de recherche numérique, nous sommes également disposés à inclure des médias interactifs (par exemple, des cartes, des visualisations) dans nos articles. Nous vous demandons de nous fournir, dans la mesure du possible, une version plein écran de votre média interactif hébergé ailleurs.

Pour inclure l'un de ces types de médias, prenez une capture d'écran et insérez-la directement dans votre document comme n'importe quelle autre image (voir [Images](#images) ci-dessus), puis utilisez la même rubrique caption/alt/url — avec `url` pointant vers la version plein écran (dans la mesure du possible) de votre média interactif, fichier audio ou vidéo. Lorsque cela est approprié, utilisez une capture d'écran avec le bouton de lecture visible. Par exemple, s'il s'agit d'une vidéo YouTube, prenez une capture d'écran de la version plein écran avec le bouton de lecture rouge et blanc au centre.

### Les hyperliens

Toutes les pages référencées (lorsque cela est possible et autorisé par le fichier robot.txt du site) doivent pointer vers une copie archivée spécifique de l\'[Internet Archive](https://archive.org/index.php), dans la mesure du possible. Si une copie n\'existe pas encore, veuillez en créer une en utilisant la fonction [« Enregistrer la page maintenant »](https://archive.org/web/). Faites-nous savoir si vous avez besoin d'aide avec ce processus.

Assurez-vous que tous les liens externes et internes de votre document fonctionnent avant d'être soumis. De nombreux sites Web et pages Web disparaissent ou se déplacent avec le temps. Afin d'éviter la pourriture des liens, nous effectuons des tests de construction périodiques pour garantir la viabilité de nos liens internes et externes. Malgré ces mesures, des liens seront perdus dans les années à venir. Afin de minimiser l'impact sur votre article, veuillez fournir les citations appropriées lorsque les liens sont essentiels à l'argument et que vous ne pouvez pas fournir une copie archivée sur Internet Archive.

### Documents externes

Lors du partage de documents externes, ne vous connectez pas à des services de stockage dans le cloud (tels que Dropbox, Google Docs) ou des sources à accès fermé. Dans ces cas, citez simplement les documents. Si vous avez la permission de les utiliser, vous pourrez peut-être les soumettre avec vos fichiers. Nous accueillons et encourageons les liens pour ouvrir des dépôts institutionnels.

### Tableaux

Si vous souhaitez qu'un tableau s'affiche au fur et à mesure que vous lisez votre texte, vous pouvez le soumettre sous forme de fichier .csv (valeurs séparées par des virgules) ou directement au format [kramdown/markdown](http://kramdown.gettalong.org/syntax.html#tables), son format final. En général, nous préférons les formats de tableau les plus simples. Veuillez éviter les lignes de rangée, par exemple. Si vous estimez que vous avez besoin d\'une visualisation complexe, envisagez de soumettre une image ou d\'organiser la visualisation ailleurs et de la relier à partir d\'une capture d\'écran.

Si vous souhaitez soumettre un tableau plus complexe, vous pouvez le faire en tant que PDF séparé. Nous créerons ensuite un lien vers le tableau à partir du texte.

**Nous n'acceptons pas les tableaux de format Office.**

## Directives de soumission pour les projets numériques

*archipelagos* accepte les projets de recherche numériques à mi-étape au-delà du format d'article ou de monographie pour une revue en simple insu après la première sélection de notre équipe de rédaction. Une version raffinée de l'évaluation sera proposée à l'équipe du projet ou à son responsable, venant de l\'équipe *archipelagos* et écrite avec le « nous » royal. Nous nous attendons à ce que les auteurs du site prennent l'évaluation au sérieux et apportent les modifications appropriées et réalisables au projet en conséquence.

Tout au long du processus de révision et de publication, notre équipe éditoriale travaillera avec vous, auteurs de site, pour vous fournir des commentaires constructifs sur votre projet. Vous restez bien entendu responsable du développement et du maintien de votre projet avant et après sa présentation sur notre plateforme. Si votre projet est accepté dans la section Projets numériques en vedette, nous publierons également l'échange de révision entre nos réviseurs et votre équipe. Si le processus de révision fonctionne pour toutes les parties, nous vous proposons de lancer ou de mettre en évidence votre projet lors de la publication du numéro de *archipelagos* correspondant.

En plus de la révision directe des projets, nous prenons en charge des «descriptifs de projet» d'une durée de rédaction décrivant le processus, l'infrastructure ou les nouvelles fonctionnalités principales d'un projet numérique. Ces essais suivent la même méthode à simple insu que les projets et seront publiés avec les projets présentés. Si vous avez des questions sur ce qui vous convient, n'hésitez pas à nous contacter.

Nous sommes particulièrement désireux de soutenir des projets qui apportent une importante contribution scientifique à l\'étude des Caraïbes; conscients du processus de conception et des infrastructures sous-jacentes de la technologie numérique; qui reconnaissent la contribution de tous les membres de l'équipe de manière appropriée; et qui ont pris en compte les questions de longévité et d\'éphémère. Pour une idée plus détaillée de nos critères et de notre processus, veuillez consulter [les directives que nous avons préparées pour nos réviseurs](http://archipelagosjournal.org/reviewers.html).

L'évaluation directe du projet se déroule en deux phases:

1. Les auteurs soumettent un énoncé de projet comprenant une description de 500 à 700 mots. Les évaluateurs proposeront un premier retour d\'information dans un délai de quatre à six semaines, en fonction de la description et d\'une exploration du projet. Si le projet est toujours en version bêta et n'est pas disponible publiquement, vous devez partager un lien vers le site de développement. Nous veillerons à ce que le lien ne quitte pas nos cercles éditoriaux.

2. Les auteurs répondent aux commentaires des relecteurs dans un texte de 1 000 à 1 200 mots et fournissent un lien vers un site bêta navigable pour une révision finale.

3. Les évaluations par les pairs et la réponse des auteurs du site seront compilées dans un récit dialogique par l\'équipe éditoriale de *archipelagos*. Les auteurs du site auront la possibilité de relire ce récit avant la publication.

Les essais de description de projet suivront le même processus qu'une revue d'article.

## Accord d'auteur

Lisez [l'accord d'auteur](http://archipelagosjournal.org/public/author-agreement.pdf). Cet accord reflète la position selon laquelle le ou les auteurs doivent conserver le droit d'auteur sur l'article et doivent disposer de droits explicites pour utiliser l'article dans des projets de recherche, d'enseignement ou autres. Les droits d'auteur sont résumés comme suit:

- Les auteurs conservent les droits d'auteur sans restriction;
- les auteurs donnent à *archipelagos* le pouvoir de publier leurs travaux dans le journal avec une [licence internationale Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/);
- les auteurs conservent les droits de publication sans restrictions;
- les auteurs acceptent d'archiver une copie des articles, le cas échéant, sur le référentiel [Academic Commons](https://academiccommons.columbia.edu/) de l'Université Columbia.

