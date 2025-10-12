/**
 * Affiche les statistiques de l'utilisateur (nombre de workout complétés, temps total et niveau)
 * @returns Un composant affichant les statistiques de l'utilisateur
 */
export function Stats() {
    return (
        <div className="space-y-4">
            <div
                className="bg-card rounded-lg p-6 border"

            >
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Workouts complétés</h3>
                <p className="text-4xl font-bold" >0</p>
            </div>
            <div
                className="bg-card rounded-lg p-6 border"

            >
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Temps total</h3>
                <p className="text-4xl font-bold" >0h</p>
            </div>
            <div
                className="bg-card rounded-lg p-6 border"

            >
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Niveau</h3>
                <p className="text-4xl font-bold" >Débutant</p>
            </div>
        </div>
    )
}