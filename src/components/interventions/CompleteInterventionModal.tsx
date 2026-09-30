import { useEffect, useState } from 'react';
import { Alert, Button, Group, Loader, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { trackersApi } from '../../api/trackers';
import { interventionsApi } from '../../api/interventions';
import { serverMessage } from '../../lib/apiError';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { Intervention, Tracker } from '../../types';

interface Props {
    opened: boolean;
    onClose: () => void;
    intervention: Intervention | null;
    onSaved: () => void;
}

export function CompleteInterventionModal({ opened, onClose, intervention, onSaved }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const [availableTrackers, setAvailableTrackers] = useState<Tracker[]>([]);
    const [loadingTrackers, setLoadingTrackers] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 300);

    const form = useForm({
        initialValues: { trackerId: '' },
        validate: {
            trackerId: (v) => (v ? null : 'You must select a tracker to install'),
        },
    });

    const fetchTrackers = async (q: string) => {
        setLoadingTrackers(true);
        try {
            const data = await trackersApi.available(q);
            setAvailableTrackers(data);
        } catch (err) {
            console.error('Failed to load available trackers', err);
        } finally {
            setLoadingTrackers(false);
        }
    };

    // Fetch trackers when modal opens or search changes
    useEffect(() => {
        if (opened) {
            fetchTrackers(debouncedSearch);
        }
    }, [opened, debouncedSearch]);

    useEffect(() => {
        if (!opened) {
            setServerError(null);
            setSearch('');
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]);

    const handleSubmit = async (values: { trackerId: string }) => {
        if (!intervention) return;
        setSubmitting(true);
        setServerError(null);
        try {
            await interventionsApi.complete(intervention.id, values.trackerId);
            notifications.show({
                title: 'Installation complete',
                message: 'The intervention has been successfully marked as DONE.',
                color: 'teal',
            });
            onSaved();
            onClose();
        } catch (err) {
            // Show explicit 409 message: "This tracker was just taken, choose another"
            setServerError(serverMessage(err, 'Could not complete the intervention. This tracker might have just been taken by someone else.'));
            // re-fetch trackers to update the list if someone took it
            fetchTrackers(debouncedSearch);
            form.setFieldValue('trackerId', '');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Complete installation"
            centered
            size="lg"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {serverError && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                            {serverError}
                        </Alert>
                    )}

                    <Text size="sm" mb="xs">
                        Scan or search for the IMEI of the tracker you are installing in <b>{intervention?.vehicle?.plate}</b>.
                    </Text>

                    <TextInput
                        placeholder="Search by IMEI..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        mb="xs"
                    />

                    {loadingTrackers ? (
                        <Group justify="center" py="xl">
                            <Loader size="sm" />
                            <Text c="dimmed" size="sm">Finding available trackers...</Text>
                        </Group>
                    ) : (
                        <Select
                            label="Select a Tracker from Stock"
                            placeholder={availableTrackers.length === 0 ? "No trackers found" : "Choose a tracker"}
                            data={availableTrackers.map((t) => ({ value: t.id, label: `IMEI: ${t.imei} | Model: ${t.model}` }))}
                            searchable
                            nothingFoundMessage="No trackers available"
                            maxDropdownHeight={200}
                            size="lg"
                            {...form.getInputProps('trackerId')}
                        />
                    )}

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" color="teal" size="md" loading={submitting} disabled={submitting || form.values.trackerId === ''}>
                            Confirm Installation
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
