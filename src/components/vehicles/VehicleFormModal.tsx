import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { vehiclesApi } from '../../api/vehicles';
import { serverFieldErrors, serverMessage } from '../../lib/apiError';
import type { Client, Vehicle } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** When set the modal edits an existing vehicle instead of creating one. */
  vehicle?: Vehicle | null;
  /** Needed to populate the owner dropdown. */
  clients: Client[];
  onSaved: () => void;
}

interface FormValues {
  clientId: string | null;
  plate: string;
  brand: string;
  model: string;
}

const FIELDS = ['clientId', 'plate', 'brand', 'model'] as const;

export function VehicleFormModal({ opened, onClose, vehicle, clients, onSaved }: Props) {
  const isEdit = Boolean(vehicle);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { clientId: null, plate: '', brand: '', model: '' },
    validate: {
      clientId: (v) => (v ? null : 'A vehicle must belong to a client'),
      plate: (v) => (v.trim().length >= 2 ? null : 'Plate is required (min 2 characters)'),
      brand: (v) => (v.trim().length >= 2 ? null : 'Brand is required (min 2 characters)'),
      model: (v) => (v.trim().length >= 1 ? null : 'Model is required'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    setServerError(null);
    form.setValues({
      clientId: vehicle?.clientId ?? null,
      plate: vehicle?.plate ?? '',
      brand: vehicle?.brand ?? '',
      model: vehicle?.model ?? '',
    });
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, vehicle]);

  const handleSubmit = async (values: FormValues) => {
    if (!values.clientId) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        clientId: values.clientId,
        plate: values.plate.trim(),
        brand: values.brand.trim(),
        model: values.model.trim(),
      };
      if (isEdit && vehicle) {
        await vehiclesApi.update(vehicle.id, payload);
        notifications.show({ title: 'Vehicle updated', message: payload.plate, color: 'teal' });
      } else {
        await vehiclesApi.create(payload);
        notifications.show({ title: 'Vehicle created', message: payload.plate, color: 'teal' });
      }
      onSaved();
      onClose();
    } catch (err) {
      const fieldErrors = serverFieldErrors(err, FIELDS);
      if (Object.keys(fieldErrors).length) form.setErrors(fieldErrors);
      else setServerError(serverMessage(err, 'Could not save the vehicle'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit vehicle' : 'New vehicle'}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {serverError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {serverError}
            </Alert>
          )}

          <Select
            label="Client"
            placeholder="Select the owner"
            data={clients.map((c) => ({ value: c.id, label: c.name }))}
            searchable
            nothingFoundMessage="No client found"
            {...form.getInputProps('clientId')}
          />
          <TextInput
            label="Plate"
            placeholder="AB-123-CD"
            {...form.getInputProps('plate')}
          />
          <TextInput
            label="Brand"
            placeholder="Renault"
            {...form.getInputProps('brand')}
          />
          <TextInput
            label="Model"
            placeholder="Kangoo"
            {...form.getInputProps('model')}
          />

          {isEdit && vehicle && (vehicle._count?.trackers ?? 0) > 0 && (
            <Text size="xs" c="dimmed">
              This vehicle carries a tracker. The owner cannot be changed until the tracker is
              removed, otherwise the installation would be left inconsistent.
            </Text>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {isEdit ? 'Save changes' : 'Create vehicle'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
