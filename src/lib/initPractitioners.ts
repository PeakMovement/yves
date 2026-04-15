import { getPractitioners, createPractitioner } from './store';

interface DefaultPractitioner {
  name: string;
  loginCode: string;
  isAdmin?: boolean;
}

const DEFAULT_PRACTITIONERS: DefaultPractitioner[] = [
  { name: 'Admin', loginCode: '1313', isAdmin: true },
  { name: 'Zoe', loginCode: '1001' },
  { name: 'Justin', loginCode: '1002' },
  { name: 'Edrich', loginCode: '1003' },
  { name: 'Luyolo', loginCode: '1004' },
  { name: 'Tayla', loginCode: '1005' },
  { name: 'Tasneem', loginCode: '1006' },
];

export async function initializePractitioners() {
  try {
    const existing = await getPractitioners();

    console.log(`Found ${existing.length} existing practitioners`);

    // Create any missing practitioners
    for (const practitioner of DEFAULT_PRACTITIONERS) {
      const exists = existing.some((p) => p.name === practitioner.name);
      if (!exists) {
        try {
          await createPractitioner(
            practitioner.name,
            practitioner.loginCode,
          );
          console.log(`Created practitioner: ${practitioner.name} (code: ${practitioner.loginCode})`);
        } catch (error) {
          console.error(`Failed to create practitioner ${practitioner.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize practitioners:', error);
  }
}
