import { Knex } from 'knex'

/** Utilisateur qui consulte ou modifie le référentiel de workouts. */
export interface WorkoutViewer {
  id: string
  role?: string
}

/** Workout partagé : public, ou visibilité non renseignée (anciens workouts). */
const isShared = (q: Knex.QueryBuilder) =>
  q.where(pub => pub.where('workouts.isPublic', true).orWhereNull('workouts.isPublic'))

/** Workout du référentiel commun (seeds, benchmarks) : partagé et sans auteur. */
const isSharedCatalog = (q: Knex.QueryBuilder) => isShared(q).whereNull('workouts.created_by_user_id')

/**
 * Règle de visibilité d'un workout, à appliquer à toute lecture de la table `workouts` :
 * - partagé : public (ou non renseigné) ET publié ;
 * - ou créé par l'utilisateur, quel que soit son statut ;
 * - un admin voit en plus les brouillons du référentiel partagé (sans auteur, non privés) pour le gérer.
 * Les workouts privés des autres utilisateurs ne sont jamais visibles, même pour un admin.
 */
export function applyVisibility(query: Knex.QueryBuilder, viewer: WorkoutViewer): Knex.QueryBuilder {
  return query.where(visible => {
    visible.where(shared => isShared(shared).andWhere('workouts.status', 'published'))
    visible.orWhere('workouts.created_by_user_id', viewer.id)
    if (viewer.role === 'admin') {
      visible.orWhere(sharedDraft => isSharedCatalog(sharedDraft))
    }
  })
}

/**
 * Règle de modification et de suppression d'un workout :
 * - l'auteur, pour ses propres workouts ;
 * - un admin, pour le référentiel partagé (sans auteur, non privé).
 * Personne ne modifie le workout privé d'un autre utilisateur, même un admin.
 */
export function applyEditPermission(query: Knex.QueryBuilder, viewer: WorkoutViewer): Knex.QueryBuilder {
  return query.where(editable => {
    editable.where('workouts.created_by_user_id', viewer.id)
    if (viewer.role === 'admin') {
      editable.orWhere(catalog => isSharedCatalog(catalog))
    }
  })
}
