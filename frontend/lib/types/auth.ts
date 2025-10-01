export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface SignupDto {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}
