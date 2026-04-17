import { getPractitioners, createPractitioner } from './store';

interface DefaultPractitioner {
  name: string;
  loginCode: string;
  initialPassword: string;
}

const DEFAULT_PRACTITIONERS: DefaultPractitioner[] = [
  { name: 'Zoe', loginCode: 'PRAC1001', initialPassword: 'password' },
  { name: 'Justin', loginCode: 'PRAC1002', initialPassword: 'password' },
  { name: 'Edrich', loginCode: 'PRAC1003', initialPassword: 'password' },
  { name: 'Luyolo', loginCode: 'PRAC1004', initialPassword: 'password' },
  { name: 'Tayla', loginCode: 'PRAC1005', initialPassword: 'password' },
  { name: 'Tasneem', loginCode: 'PRAC1006', initialPassword: 'password' },
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
