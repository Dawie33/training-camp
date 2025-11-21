'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getExercise } from '@/lib/api/exercices'
import { Exercise } from '@/lib/types/exercice'
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ExerciseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    getExercise(id)
      .then((data) => {
        setExercise(data)
      })
      .catch(() => {
        toast.error('Failed to load exercise')
        router.push('/exercises')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) return <div className="container mx-auto py-8">Loading...</div>
  if (!exercise) return null

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Link href={`/exercises/${exercise.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{exercise.name}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="capitalize">
                  {exercise.category?.replace(/_/g, ' ')}
                </Badge>
                {exercise.difficulty && (
                  <Badge variant="outline" className="capitalize">
                    {exercise.difficulty}
                  </Badge>
                )}
                {exercise.isActive ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercise.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{exercise.description}</p>
            </div>
          )}

          {exercise.instructions && (
            <div>
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{exercise.instructions}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Measurement Type</h4>
              <p className="capitalize">{exercise.measurement_type}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Bodyweight Only</h4>
              <p>{exercise.bodyweight_only ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {exercise.video_url && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Video Tutorial</h3>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 border">
                {(() => {
                  // YouTube
                  const youtubeMatch = exercise.video_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/)
                  if (youtubeMatch && youtubeMatch[1]) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={exercise.name}
                      />
                    )
                  }

                  // Vimeo
                  const vimeoMatch = exercise.video_url?.match(/(?:vimeo\.com\/)([0-9]+)/)
                  if (vimeoMatch && vimeoMatch[1]) {
                    return (
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={exercise.name}
                      />
                    )
                  }

                  // Direct video file (basic check)
                  if (exercise.video_url?.match(/\.(mp4|webm|ogg)$/i)) {
                    return (
                      <video
                        controls
                        className="w-full h-full"
                        src={exercise.video_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )
                  }

                  // Fallback to link
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 p-6 text-center">
                      <p className="text-muted-foreground mb-4">Video preview not available for this URL format.</p>
                      <Button asChild variant="outline">
                        <a
                          href={exercise.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          Watch on external site
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
