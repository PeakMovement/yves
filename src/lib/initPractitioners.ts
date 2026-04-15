import { getPractitioners, createPractitioner } from './store';

interface DefaultPractitioner {
  name: string;
  loginCode: string;
  initialPassword: string;
}

const DEFAULT_PRACTITIONERS: DefaultPractitioner[] = [
  { name: 'Zoe', loginCode: 'ZOE001', initialPassword: 'password' },
  { name: 'Justin', loginCode: 'JUS001', initialPassword: 'password' },
  { name: 'Edrich', loginCode: 'EDR001', initialPassword: 'password' },
  { name: 'Luyolo', loginCode: 'LUY001', initialPassword: 'password' },
  { name: 'Tayla', loginCode: 'TAY001', initialPassword: 'password' },
  { name: 'Tasneem', loginCode: 'TAS001', initialPassword: 'password' },
];

export async function initializePractitioners() {
  try {
    const existing = await getPractitioners();

    // Only create if we have fewer than expected practitioners
    if (existing.length < DEFAULT_PRACTITIONERS.length) {
      const existingNames = new Set(existing.map((p) => p.name));

      for (const practitioner of DEFAULT_PRACTITIONERS) {
        if (!existingNames.has(practitioner.name)) {
          await createPractitioner(
            practitioner.name,
            practitioner.initialPassword,
            practitioner.loginCode,
          );
          console.log(`Created practitioner: ${practitioner.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize practitioners:', error);
  }
}
