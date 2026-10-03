import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { GoogleCalendarController } from './google-calendar.controller'
import { GoogleCalendarService } from './google-calendar.service'
import { GoogleOAuthStateService, oauthStateJwtOptions } from './google-oauth-state.service'

@Module({
  imports: [
    // JwtModule propre à ce module : clé dérivée, distincte de celle des jetons de connexion
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => oauthStateJwtOptions(config.getOrThrow<string>('JWT_SECRET')),
    }),
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService, GoogleOAuthStateService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
