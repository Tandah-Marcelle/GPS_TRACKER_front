import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { clientsApi } from '../../api/clients';
import { serverFieldErrors, serverMessage } from '../../lib/apiError';
import type { Client } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** When set the modal edits an existing client instead of creating one. */
  client?: Client | null;
  onSaved: () => void;
}

interface FormValues {
  name: string;
  phone: string;
  address: string;
}

const FIELDS = ['name', 'phone', 'address'] as const;

export function ClientFormModal({ opened, onClose, client, onSaved }: Props) {
  const isEdit = Boolean(client);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: { name: '', phone: '', address: '' },
    validate: {
      name: (v) => (v.trim().length >= 2 ? null : 'Name is required (min 2 characters)'),
      phone: (v) => (v.trim().length >= 5 ? null : 'Phone is required (min 5 characters)'),
      address: (v) => (v.trim().length >= 3 ? null : 'Address is required (min 3 characters)'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    setServerError(null);
    form.setValues({
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      address: client?.address ?? '',
    });
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, client]);

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
      };
      if (isEdit && client) {
        await clientsApi.update(client.id, payload);
        notifications.show({ title: 'Client updated', message: payload.name, color: 'teal' });
      } else {
        await clientsApi.create(payload);
        notifications.show({ title: 'Client created', message: payload.name, color: 'teal' });
      }
      onSaved();
      onClose();
    } catch (err) {
      const fieldErrors = serverFieldErrors(err, FIELDS);
      if (Object.keys(fieldErrors).length) form.setErrors(fieldErrors);
      else setServerError(serverMessage(err, 'Could not save the client'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit client' : 'New client'}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {serverError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {serverError}
            </Alert>
          )}

          <TextInput
            label="Name"
            placeholder="Transport Express"
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Phone"
            placeholder="+33 6 12 34 56 78"
            {...form.getInputProps('phone')}
          />
          <TextInput
            label="Address"
            placeholder="12 rue de la Paix, 75002 Paris"
            {...form.getInputProps('address')}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {isEdit ? 'Save changes' : 'Create client'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
