import { getPractitioners, createPractitioner } from './store';

interface DefaultPractitioner {
  name: string;
  loginCode: string;
  initialPassword: string;
}

const DEFAULT_PRACTITIONERS: DefaultPractitioner[] = [
  { name: 'Zoe', loginCode: '1001', initialPassword: 'password' },
  { name: 'Justin', loginCode: '1002', initialPassword: 'password' },
  { name: 'Edrich', loginCode: '1003', initialPassword: 'password' },
  { name: 'Luyolo', loginCode: '1004', initialPassword: 'password' },
  { name: 'Tayla', loginCode: '1005', initialPassword: 'password' },
  { name: 'Tasneem', loginCode: '1006', initialPassword: 'password' },
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
