import { WorkoutCard } from "@/components/workout/WorkoutCard"

export function RecommendedWorkouts() {

    // Données de workouts mockées (à remplacer par des vraies données)
    const recommendedWorkouts = [
        {
            id: 1,
            title: 'HIIT Training #24',
            duration: '30 min',
            image: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&q=80',
            category: 'WORKOUT',
            isNew: false
        },
        {
            id: 2,
            title: 'Core Strength #45',
            duration: '30 min',
            image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
            category: 'WORKOUT',
            isNew: false
        },
        {
            id: 3,
            title: 'Cardio Blast #128',
            duration: '45 min',
            image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
            category: 'NEW',
            isNew: true
        },
        {
            id: 4,
            title: 'Strength & Power',
            duration: '40 min',
            image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
            category: 'WORKOUT',
            isNew: false
        },
    ]

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Recommandé pour toi</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedWorkouts.map((workout) => (
                    <WorkoutCard
                        key={workout.id}
                        title={workout.title}
                        duration={workout.duration}
                        image={workout.image}
                        category={workout.category}
                        isNew={workout.isNew}
                    />
                ))}
            </div>
        </div>
    )
}