import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common'
import { LoginDto, SignupDto } from 'src/auth/dto/auth.dto'
import { UpdateUserDto } from 'src/users/dto/users.dto'

// Mêmes options que le ValidationPipe global de main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  skipMissingProperties: false,
  transformOptions: { enableImplicitConversion: true },
})

const body = (metatype: ArgumentMetadata['metatype']): ArgumentMetadata => ({ type: 'body', metatype })

describe('NormalizeEmail', () => {
  it('met en minuscules et retire les espaces au login', async () => {
    const result: LoginDto = await pipe.transform(
      { email: '  Dawie@Mail.COM ', password: 'secret123' },
      body(LoginDto)
    )
    expect(result.email).toBe('dawie@mail.com')
  })

  it("normalise l'email à l'inscription", async () => {
    const result: SignupDto = await pipe.transform(
      { email: 'Dawie@Mail.com', password: 'secret123', firstName: 'Dawie', lastName: 'S' },
      body(SignupDto)
    )
    expect(result.email).toBe('dawie@mail.com')
  })

  it("normalise l'email à la mise à jour du profil", async () => {
    const result: UpdateUserDto = await pipe.transform({ email: 'Dawie@Mail.com' }, body(UpdateUserDto))
    expect(result.email).toBe('dawie@mail.com')
  })

  it("laisse l'email absent quand il est optionnel", async () => {
    const result: UpdateUserDto = await pipe.transform({ firstName: 'Dawie' }, body(UpdateUserDto))
    expect(result.email).toBeUndefined()
  })

  it('rejette toujours un email invalide', async () => {
    await expect(pipe.transform({ email: 'pas-un-email', password: 'secret123' }, body(LoginDto))).rejects.toThrow(
      BadRequestException
    )
  })
})
