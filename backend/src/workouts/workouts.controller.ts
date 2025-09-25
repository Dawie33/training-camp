import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { WorkoutAiService } from './workout-ai.service'
import { WorkoutService } from './workouts.service'

@Controller('workouts')
export class WorkoutController {
  constructor(
    private readonly workoutAiService: WorkoutAiService,
    private readonly workoutService: WorkoutService
  ) {}
/**
 * Generates a workout based on the user's profile.
 * @param userProfile - User profile data for generating a workout
 * @returns The generated workout
 */
  @Post('generate')
  async generate(@Body() userProfile: any) {
    return await this.workoutAiService.generateWorkout(userProfile);
  }

/** * Creates a new workout entry.
 * @param data - Data for the new workout
 * @returns The created workout
 */
  @Post()
  async create(@Body() data: any) {
    return await this.workoutService.create(data);
  }
/**
 * Retrieves all workouts.
 * @returns All workouts
 */
  @Get()
  async findAll() {
    try {
      return await this.workoutService.findAll();
    } catch (error) {
      throw new HttpException(error.message || 'Failed to create workout', HttpStatus.BAD_REQUEST);
    }
  }
/**
 * Retrieves a specific workout by ID.
 * @param id - Workout ID to retrieve
 * @returns The requested workout
 */
  @Get(':id')
  async findOne(@Param('id') id: number) {
    try {
      return await this.workoutService.findOne(Number(id));
    } catch (error) {
      throw new HttpException(error.message || 'Failed to retrieve workout', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
/**
 * Updates a specific workout by ID.
 * @param id - Workout ID to update
 * @param data - Updated workout data
 * @returns The updated workout
 */
  @Put(':id')
  async update(@Param('id') id: number, @Body() data: any) {
    try {
      return await this.workoutService.update(Number(id), data);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to update workout', error.status || HttpStatus.NOT_FOUND);
    }
  }
/**
 * Deletes a specific workout by ID.
 * @param id - Workout ID to delete
 * @returns The deleted workout
 */
  @Delete(':id')
  async remove(@Param('id') id: number) {
    try {
      return await this.workoutService.remove(Number(id));
    } catch (error) {
      throw new HttpException(error.message || 'Failed to delete workout', error.status || HttpStatus.BAD_REQUEST);
    }
  }

  }


