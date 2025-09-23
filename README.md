# 🏋️‍♂️ Training Camp

**Training Camp** est une plateforme de sport (cross-training / crossfit) qui utilise l’intelligence artificielle pour générer des séances d’entraînement personnalisées.  
Chaque programme s’adapte à ton profil, ton matériel disponible, tes objectifs et ton niveau de fatigue.

---

## 🚀 Fonctionnalités (MVP)
- Génération de **WOD personnalisés** via IA (force, cardio, skills).
- Prise en compte du **profil utilisateur** (niveau, objectifs, blessures, matériel).
- **Historique d’entraînements** et suivi des performances.
- **Substitutions automatiques** si un exercice ou un matériel n’est pas disponible.
- Interface moderne avec **Next.js + TailwindCSS**.
- Backend modulaire avec **NestJS + PostgreSQL (Knex)**.

---

## 🛠️ Stack technique
- **Frontend** : Next.js (React), TailwindCSS
- **Backend** : NestJS, Knex.js, PostgreSQL
- **IA** : Génération guidée par LLM + règles métier
- **Tests** : Vitest

---

## 📦 Installation (dev)
```bash
# Cloner le projet
git clone https://github.com/<ton-pseudo>/training-camp.git
cd training-camp

# Installer les dépendances
npm install

# Lancer le frontend
cd apps/web && npm run dev

# Lancer le backend
cd apps/api && npm run start:dev
