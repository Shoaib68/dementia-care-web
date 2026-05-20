/**
 * Generates secure temporary passwords for new users
 */

export interface PasswordOptions {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
  excludeAmbiguous?: boolean
}

const DEFAULT_OPTIONS: Required<PasswordOptions> = {
  length: 12,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: false, // Keep false for better usability
  excludeAmbiguous: true // Exclude confusing characters like 0, O, l, I
}

export function generatePassword(options: PasswordOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  let chars = ''
  
  if (opts.includeLowercase) {
    chars += opts.excludeAmbiguous ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  }
  
  if (opts.includeUppercase) {
    chars += opts.excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  }
  
  if (opts.includeNumbers) {
    chars += opts.excludeAmbiguous ? '23456789' : '0123456789'
  }
  
  if (opts.includeSymbols) {
    chars += '!@#$%^&*'
  }
  
  if (chars === '') {
    throw new Error('At least one character set must be enabled')
  }
  
  let password = ''
  for (let i = 0; i < opts.length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

/**
 * Generates a temporary password specifically for hospital administrators
 */
export function generateHospitalAdminPassword(): string {
  return generatePassword({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeAmbiguous: true
  })
}

/**
 * Generates a temporary password specifically for doctors
 */
export function generateDoctorPassword(): string {
  return generatePassword({
    length: 10,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeAmbiguous: true
  })
}

/**
 * Generates a temporary password specifically for patients
 */
export function generatePatientCredentials(): string {
  return generatePassword({
    length: 8,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeAmbiguous: true
  })
}

/**
 * Generates a temporary password specifically for caregivers
 */
export function generateCaregiverCredentials(): string {
  return generatePassword({
    length: 8,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeAmbiguous: true
  })
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  score: number // 0-4 scale
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one uppercase letter')
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one lowercase letter')
  }
  
  // Number check
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one number')
  }
  
  // Symbol check (bonus)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score = Math.min(score + 1, 4)
  }
  
  if (score >= 4) {
    feedback.length = 0 // Clear feedback for strong passwords
    feedback.push('Strong password')
  } else if (score >= 3) {
    feedback.push('Good password strength')
  } else if (score >= 2) {
    feedback.push('Fair password strength')
  } else {
    feedback.push('Weak password')
  }
  
  return { score, feedback }
}
