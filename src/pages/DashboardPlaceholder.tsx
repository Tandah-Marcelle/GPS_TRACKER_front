import { Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconHourglass } from '@tabler/icons-react';

interface Props {
  title?: string;
}

/** Placeholder for the screens that are not built yet (phases 3+). */
export default function DashboardPlaceholder({ title = 'Dashboard' }: Props) {
  return (
    <Center py={100}>
      <Stack align="center" gap="sm">
        <ThemeIcon size={54} radius="xl" variant="light">
          <IconHourglass size={26} />
        </ThemeIcon>
        <Text fw={700} size="lg">
          {title}
        </Text>
        <Text c="dimmed" size="sm" ta="center" maw={420}>
          This screen is not implemented yet. The Trackers screen is fully wired to the API.
        </Text>
      </Stack>
    </Center>
  );
}
