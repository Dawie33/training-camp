import { IsString, IsNumber, IsEnum, IsOptional, IsArray, Min, Max } from 'class-validator'

export class GenerateWorkoutDto {
  @IsString()
  sport: string

  @IsString()
  workoutType: string

  @IsEnum(['beginner', 'intermediate', 'advanced', 'elite'])
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'

  @IsNumber()
  @Min(10)
  @Max(180)
  duration: number // en minutes

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus?: string[] // Ex: ["upper-body", "cardio"]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[] // Équipement disponible

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[] // Ex: ["no-jump", "low-impact"]

  @IsOptional()
  @IsString()
  additionalInstructions?: string
}
