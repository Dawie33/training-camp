Génère un message de commit pour les changements actuels.

1. Lance `git diff --staged` pour voir les fichiers stagés. Si rien n'est stagé, lance `git diff HEAD` pour voir tous les changements.
2. Lance `git status` pour avoir la liste complète des fichiers modifiés.
3. Lance `git log --oneline -5` pour voir le style des commits récents du projet.

Ensuite, propose un message de commit en respectant les **Conventional Commits** :

```
<type>(<scope optionnel>): <description courte en français>

<corps optionnel si besoin d'explication>
```

Types disponibles :
- `feat` — nouvelle fonctionnalité
- `fix` — correction de bug
- `refactor` — refactoring sans changement de comportement
- `style` — changement de style/CSS uniquement
- `chore` — tâche technique (config, deps…)
- `docs` — documentation

Règles :
- Description en minuscules, sans point final, max 72 caractères
- Scope = le module ou la page concernée (ex: `dashboard`, `workout`, `auth`)
- Si plusieurs fichiers très différents sont modifiés, propose un message général ou découpe en plusieurs commits

Affiche le message final dans un bloc de code pour que je puisse le copier facilement. Ne fais pas le commit toi-même, attends ma confirmation.
