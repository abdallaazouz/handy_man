import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleMapsPicker from '@/components/ui/google-maps-picker';

const taskSchema = z.object({
  taskId: z.string().optional(),
  taskNumber: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientPhone: z.string().min(1, 'Client phone is required'),
  location: z.string().min(1, 'Location is required'),
  mapUrl: z.string().url().optional().or(z.literal('')),
  technicianIds: z.array(z.number()).default([]),
  paymentStatus: z.string().default('on_demand'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTimeFrom: z.string().min(1, 'Start time is required'),
  scheduledTimeTo: z.string().min(1, 'End time is required'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialData?: any;
  onSubmit: (data: TaskFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  technicians: any[];
}

export default function TaskForm({ initialData, onSubmit, onCancel, isLoading, technicians }: TaskFormProps) {
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
    mapUrl: string;
  } | null>(null);

  const generateTaskNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `T-${year}${month}${day}-${time}`;
  };

  const generateTaskId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TASK-${timestamp}-${random}`;
  };

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskId: initialData?.taskId || generateTaskId(),
      taskNumber: initialData?.taskNumber || generateTaskNumber(),
      title: initialData?.title || '',
      description: initialData?.description || '',
      clientName: initialData?.clientName || '',
      clientPhone: initialData?.clientPhone || '',
      location: initialData?.location || '',
      mapUrl: initialData?.mapUrl || '',
      technicianIds: initialData?.technicianIds || [],
      paymentStatus: initialData?.paymentStatus || 'on_demand',
      scheduledDate: initialData?.scheduledDate || '',
      scheduledTimeFrom: initialData?.scheduledTimeFrom || '',
      scheduledTimeTo: initialData?.scheduledTimeTo || '',
    },
  });

  const handleSubmit = (data: TaskFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="taskId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task ID</FormLabel>
                <FormControl>
                  <Input placeholder="Auto-generated" {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taskNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Number</FormLabel>
                <FormControl>
                  <Input placeholder="Auto-generated" {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.title')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('task.title_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="technicianIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Technicians (Multiple Selection)</FormLabel>
                <div className="space-y-2">
                  {technicians.map((tech: any) => (
                    <div key={tech.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tech-${tech.id}`}
                        checked={field.value.includes(tech.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, tech.id]);
                          } else {
                            field.onChange(field.value.filter((id: number) => id !== tech.id));
                          }
                        }}
                      />
                      <Label htmlFor={`tech-${tech.id}`} className="text-sm font-normal">
                        {tech.firstName} {tech.lastName}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({tech.serviceProvided})
                        </span>
                      </Label>
                    </div>
                  ))}
                  {technicians.length === 0 && (
                    <p className="text-sm text-muted-foreground">No technicians available</p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.payment_status' as any)}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('task.select_payment_status' as any)} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="on_demand">{t('payment_status.on_demand' as any)}</SelectItem>
                    <SelectItem value="paid">{t('payment_status.paid' as any)}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('task.description' as any)}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('task.description_placeholder' as any)}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.client_name' as any)}</FormLabel>
                <FormControl>
                  <Input placeholder={t('task.client_name_placeholder' as any)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.client_phone' as any)}</FormLabel>
                <FormControl>
                  <Input placeholder={t('task.client_phone_placeholder' as any)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Section with Maps Integration */}
        <div className="space-y-4">
          <FormLabel className="text-base font-medium">Location Information</FormLabel>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="maps">Google Maps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location address..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mapUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://maps.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="maps" className="space-y-4">
              <GoogleMapsPicker
                onLocationSelect={(location) => {
                  setSelectedLocation(location);
                  form.setValue('location', location.address);
                  form.setValue('mapUrl', location.mapUrl);
                }}
                defaultLocation={form.getValues('location')}
                className="w-full"
              />
              {selectedLocation && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  <p><strong>Selected Location:</strong> {selectedLocation.address}</p>
                  <p><strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.scheduled_date' as any)}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledTimeFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.start_time' as any)}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledTimeTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('task.end_time' as any)}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
