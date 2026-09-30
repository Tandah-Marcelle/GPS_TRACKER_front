import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { interventionsApi } from '../../api/interventions';
import { serverFieldErrors, serverMessage } from '../../lib/apiError';
import type { Client, InterventionPayload, User, Vehicle } from '../../types';

interface Props {
    opened: boolean;
    onClose: () => void;
    clients: Client[];
    vehicles: Vehicle[];
    technicians: User[];
    onSaved: () => void;
}

interface FormValues {
    clientId: string | null;
    vehicleId: string | null;
    technicianId: string | null;
    scheduledAt: string; // Used for datetime-local input
    address: string;
}

const FIELDS = ['clientId', 'vehicleId', 'technicianId', 'scheduledAt', 'address'] as const;

export function InterventionFormModal({ opened, onClose, clients, vehicles, technicians, onSaved }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        initialValues: { clientId: null, vehicleId: null, technicianId: null, scheduledAt: '', address: '' },
        validate: {
            clientId: (v) => (v ? null : 'Client is required'),
            vehicleId: (v) => (v ? null : 'Vehicle is required'),
            technicianId: (v) => (v ? null : 'Technician is required'),
            scheduledAt: (v) => (v ? null : 'Date and time are required'),
            address: (v) => (v.trim().length >= 3 ? null : 'Address is required'),
        },
    });

    useEffect(() => {
        if (!opened) return;
        setServerError(null);
        form.reset();
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened]);

    const handleSubmit = async (values: FormValues) => {
        if (!values.clientId || !values.vehicleId || !values.technicianId) return;
        setSubmitting(true);
        setServerError(null);
        try {
            const payload: InterventionPayload = {
                clientId: values.clientId,
                vehicleId: values.vehicleId,
                technicianId: values.technicianId,
                scheduledAt: new Date(values.scheduledAt).toISOString(),
                address: values.address.trim(),
            };

            await interventionsApi.create(payload);
            notifications.show({ title: 'Intervention planned', message: 'The intervention has been successfully scheduled.', color: 'teal' });
            onSaved();
            onClose();
        } catch (err) {
            const fieldErrors = serverFieldErrors(err, FIELDS);
            if (Object.keys(fieldErrors).length) form.setErrors(fieldErrors);
            else setServerError(serverMessage(err, 'Could not plan the intervention'));
        } finally {
            setSubmitting(false);
        }
    };

    // Vehicles matching the selected client
    const availableVehicles = vehicles.filter(v => v.clientId === form.values.clientId);

    return (
        <Modal opened={opened} onClose={onClose} title="Plan new intervention" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="sm">
                    {serverError && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                            {serverError}
                        </Alert>
                    )}

                    <Select
                        label="Client"
                        placeholder="Select a client"
                        data={clients.map((c) => ({ value: c.id, label: c.name }))}
                        searchable
                        onChange={(val) => {
                            form.setFieldValue('clientId', val);
                            form.setFieldValue('vehicleId', null); // Reset vehicle when client changes
                        }}
                        value={form.values.clientId}
                        error={form.errors.clientId}
                    />
                    <Select
                        label="Vehicle"
                        placeholder={form.values.clientId ? 'Select a vehicle' : 'Select a client first'}
                        data={availableVehicles.map((v) => ({ value: v.id, label: `${v.plate} - ${v.brand} ${v.model}` }))}
                        disabled={!form.values.clientId}
                        {...form.getInputProps('vehicleId')}
                    />
                    <Select
                        label="Technician"
                        placeholder="Assign to a technician"
                        data={technicians.map((t) => ({ value: t.id, label: t.fullName }))}
                        searchable
                        {...form.getInputProps('technicianId')}
                    />

                    {/* Using a native datetime-local for simplicity */}
                    <TextInput
                        type="datetime-local"
                        label="Scheduled Date & Time"
                        {...form.getInputProps('scheduledAt')}
                    />

                    <TextInput
                        label="Address"
                        placeholder="123 Example St"
                        {...form.getInputProps('address')}
                    />

                    <Group justify="flex-end" mt="xs">
                        <Button variant="default" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button type="submit" loading={submitting} disabled={submitting}>Plan Intervention</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
