import { Knex } from 'knex'

/** Utilisateur qui consulte le référentiel de workouts. */
export interface WorkoutViewer {
  id: string
  role?: string
}

/**
 * Règle de visibilité d'un workout, à appliquer à toute lecture de la table `workouts` :
 * - partagé : public (ou non renseigné) ET publié ;
 * - ou créé par l'utilisateur, quel que soit son statut ;
 * - un admin voit en plus les brouillons du référentiel partagé (sans auteur, non privés) pour le gérer.
 * Les workouts privés des autres utilisateurs ne sont jamais visibles, même pour un admin.
 */
export function applyVisibility(query: Knex.QueryBuilder, viewer: WorkoutViewer): Knex.QueryBuilder {
  const isShared = (q: Knex.QueryBuilder) =>
    q.where(pub => pub.where('workouts.isPublic', true).orWhereNull('workouts.isPublic'))

  return query.where(visible => {
    visible.where(shared => isShared(shared).andWhere('workouts.status', 'published'))
    visible.orWhere('workouts.created_by_user_id', viewer.id)
    if (viewer.role === 'admin') {
      visible.orWhere(sharedDraft => isShared(sharedDraft).whereNull('workouts.created_by_user_id'))
    }
  })
}
